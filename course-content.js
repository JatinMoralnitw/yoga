import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBfIElG6SXE_JXaJrgmGNgkt1Ta5jjbO4w",
    authDomain: "yogadt-ed173.firebaseapp.com",
    projectId: "yogadt-ed173",
    storageBucket: "yogadt-ed173.firebasestorage.app",
    messagingSenderId: "877729470017",
    appId: "1:877729470017:web:d6d4f90eb0b553d09a58c0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Redirect to login if not logged in
            window.location.href = "login.html";
            return;
        }

        try {
            // Get course ID (teacher ID) from URL parameters or localStorage
            const urlParams = new URLSearchParams(window.location.search);
            let courseId = urlParams.get('course');
            
            // If no course ID in URL, try localStorage
            if (!courseId) {
                courseId = localStorage.getItem("activeCourseId");
            }
            
            // If still no course ID, check user's active course in Firestore
            if (!courseId) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().activeCourse) {
                    courseId = userDoc.data().activeCourse;
                } else {
                    // No course ID found, redirect to courses page
                    alert("No course selected. Please select a course.");
                    window.location.href = "courses.html";
                    return;
                }
            }

            // Store course ID in localStorage for convenience
            localStorage.setItem("activeCourseId", courseId);
            
            // Get teacher data (course data)
            const teacherDoc = await getDoc(doc(db, "teachers", courseId));
            
            if (!teacherDoc.exists()) {
                document.getElementById('teacherProfile').innerHTML = '<div class="loading">Teacher not found. Please select a different course.</div>';
                document.getElementById('courseVideos').innerHTML = '';
                return;
            }
            
            const teacherData = teacherDoc.data();
            
            // Display teacher profile
            displayTeacherProfile(teacherData);
            
            // Check if teacher has videos
            if (!teacherData.videos || teacherData.videos.length === 0) {
                document.getElementById('courseVideos').innerHTML = '<div class="loading">No videos available yet for this course.</div>';
                document.getElementById('daysNav').innerHTML = '<div style="padding: 8px 15px; color: white;">No content available</div>';
                return;
            }
            
            // Sort videos by day
            const videos = [...teacherData.videos].sort((a, b) => a.day - b.day);
            
            // Process the videos into a full content array with all 30 days
            const fullContent = buildFullContentArray(videos);
            
            // Generate day navigation
            generateDayNavigation(fullContent);
            
            // Display course videos
            displayCourseVideos(fullContent);
            
            // Add scroll behavior for navigation
            setupScrollBehavior();
            
            // Add video click behavior for enlarging
            setupVideoClickBehavior();
            
        } catch (error) {
            console.error("Error loading course content:", error);
            document.getElementById('courseVideos').innerHTML = `<div class="loading">Error loading content: ${error.message}</div>`;
        }
    });
});

function buildFullContentArray(videos) {
    const fullContent = [];
    
    // Create entries for all 30 days
    for (let i = 1; i <= 30; i++) {
        // Find if we have content for this day
        const dayVideo = videos.find(video => video.day === i);
        
        if (dayVideo) {
            fullContent.push(dayVideo);
        } else {
            // Add placeholder for missing days
            fullContent.push({
                day: i,
                videoUrl: "",
                description: "",
                restrictions: "",
                uploadDate: ""
            });
        }
    }
    
    return fullContent;
}

function displayTeacherProfile(teacherData) {
    const teacherProfile = document.getElementById('teacherProfile');
    
    teacherProfile.innerHTML = `
        <img src="${teacherData.imageUrl || 'profile.avif'}" alt="${teacherData.name}" class="profile-img">
        <div class="profile-details">
            <h2>${teacherData.name || 'Course Instructor'}</h2>
            <p><strong>Experience:</strong> ${teacherData.experience || 'Professional'} years</p>
            <p><strong>Contact:</strong> ${teacherData.contact || 'Not provided'}</p>
            <p><strong>Content:</strong> 30 Day Yoga Course</p>
        </div>
    `;
}

function generateDayNavigation(courseContent) {
    const daysNav = document.getElementById('daysNav');
    daysNav.innerHTML = "";
    
    for (let i = 1; i <= 30; i++) {
        const dayButton = document.createElement('button');
        dayButton.textContent = `Day ${i}`;
        dayButton.dataset.day = i;
        
        // Check if content exists for this day
        const dayContent = courseContent.find(content => content.day === i);
        if (!dayContent || !dayContent.videoUrl) {
            dayButton.disabled = true;
            dayButton.style.opacity = "0.5";
        }
        
        dayButton.addEventListener('click', () => {
            const dayElement = document.getElementById(`day-${i}`);
            if (dayElement) {
                // Remove active class from all buttons
                document.querySelectorAll('.nav-days button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                dayButton.classList.add('active');
                
                // Scroll to the day section
                dayElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        daysNav.appendChild(dayButton);
    }
}

function displayCourseVideos(courseContent) {
    const courseVideos = document.getElementById('courseVideos');
    courseVideos.innerHTML = "";
    
    let hasContent = false;
    
    courseContent.forEach(content => {
        if (content.videoUrl) {
            hasContent = true;
            const videoElement = document.createElement('div');
            videoElement.className = 'video-day';
            videoElement.id = `day-${content.day}`;
            
            // Create a video element for the stored video
            videoElement.innerHTML = `
                <div class="video-container">
                    <video class="video-iframe" controls>
                        <source src="${content.videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-info">
                        <div class="day-label">Day ${content.day}</div>
                        <h3>Daily Exercise - ${content.uploadDate ? new Date(content.uploadDate).toLocaleDateString() : 'No date'}</h3>
                        <div class="description">
                            <h4>Description:</h4>
                            <p>${content.description || "No description available."}</p>
                        </div>
                        <div class="restrictions">
                            <h4>Not Recommended For:</h4>
                            <p>${content.restrictions ? content.restrictions.replace(/\n/g, '<br>') : "No restrictions specified."}</p>
                        </div>
                    </div>
                </div>
            `;
            
            courseVideos.appendChild(videoElement);
        }
    });
    
    if (!hasContent) {
        courseVideos.innerHTML = '<div class="loading">No videos have been uploaded yet for this course.</div>';
    }
}

function setupScrollBehavior() {
    // Highlight the day in navigation when scrolling to its section
    window.addEventListener('scroll', () => {
        const videoSections = document.querySelectorAll('.video-day');
        const navButtons = document.querySelectorAll('.nav-days button');
        
        videoSections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const sectionId = section.id;
            const day = sectionId.split('-')[1];
            
            if (sectionTop < 100) {
                navButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.day === day) {
                        btn.classList.add('active');
                    }
                });
            }
        });
    });
}

function setupVideoClickBehavior() {
    // Add click event to enlarge videos
    document.addEventListener('click', (e) => {
        const videoElement = e.target.closest('.video-iframe');
        if (videoElement) {
            videoElement.classList.toggle('enlarged');
        }
    });
}
