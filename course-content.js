import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBfIElG6SXE_JXaJrgmGNgkt1Ta5jjbO4w",
    authDomain: "yogadt-ed173.firebaseapp.com",
    projectId: "yogadt-ed173",
    storageBucket: "yogadt-ed173.firebasestorage.app",
    messagingSenderId: "877729470017",
    appId: "1:877729470017:web:d6d4f90eb0b553d09a58c0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load course content
        const courseContent = await loadCourseContent();
        
        if (courseContent.length > 0) {
            // Get the teacher info from the first course content with data
            const firstContentWithData = courseContent.find(content => content.videoUrl);
            if (firstContentWithData) {
                // Display teacher profile
                await displayTeacherProfile(firstContentWithData.teacherId);
            }
            
            // Generate day navigation
            generateDayNavigation(courseContent);
            
            // Display course videos
            displayCourseVideos(courseContent);
            
            // Add scroll behavior for navigation
            setupScrollBehavior();
            
            // Add video click behavior for enlarging
            setupVideoClickBehavior();
        } else {
            document.getElementById('courseVideos').innerHTML = '<div class="loading">No course content available yet.</div>';
        }
    } catch (error) {
        console.error("Error loading course content:", error);
        document.getElementById('courseVideos').innerHTML = `<div class="loading">Error loading content: ${error.message}</div>`;
    }
});

async function loadCourseContent() {
    try {
        const contentCollection = collection(db, "courseContent");
        const contentQuery = query(contentCollection, orderBy("day"));
        const querySnapshot = await getDocs(contentQuery);
        
        const content = [];
        querySnapshot.forEach((doc) => {
            content.push(doc.data());
        });
        
        // If there's no content in Firebase yet, return an empty array
        if (content.length === 0) {
            return [];
        }
        
        // Fill any missing days up to 30
        const fullContent = [];
        for (let i = 1; i <= 30; i++) {
            const dayContent = content.find(item => item.day === i);
            if (dayContent) {
                fullContent.push(dayContent);
            } else {
                // Add placeholder for missing days
                fullContent.push({
                    day: i,
                    videoUrl: "",
                    description: "",
                    restrictions: "",
                    teacherId: "",
                    teacherName: "",
                    uploadDate: ""
                });
            }
        }
        
        return fullContent;
    } catch (error) {
        console.error("Error fetching course content:", error);
        throw error;
    }
}

async function displayTeacherProfile(teacherId) {
    try {
        const teacherRef = doc(db, "teachers", teacherId);
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
            const teacherData = teacherSnap.data();
            const teacherProfile = document.getElementById('teacherProfile');
            
            teacherProfile.innerHTML = `
                <img src="${teacherData.imageUrl}" alt="${teacherData.name}" class="profile-img">
                <div class="profile-details">
                    <h2>${teacherData.name}</h2>
                    <p><strong>Experience:</strong> ${teacherData.experience} years</p>
                    <p><strong>Contact:</strong> ${teacherData.contact}</p>
                    <p><strong>Content:</strong> 30 Day Fitness Course</p>
                </div>
            `;
        } else {
            document.getElementById('teacherProfile').innerHTML = '<div class="loading">Teacher profile not found.</div>';
        }
    } catch (error) {
        console.error("Error loading teacher profile:", error);
        document.getElementById('teacherProfile').innerHTML = `<div class="loading">Error loading teacher profile: ${error.message}</div>`;
    }
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
                        <h3>Daily Exercise - ${new Date(content.uploadDate).toLocaleDateString()}</h3>
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
        courseVideos.innerHTML = '<div class="loading">No videos have been uploaded yet.</div>';
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
