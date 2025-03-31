import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBfIElG6SXE_JXaJrgmGNgkt1Ta5jjbO4w",
    authDomain: "yogadt-ed173.firebaseapp.com",
    projectId: "yogadt-ed173",
    storageBucket: "yogadt-ed173.firebasestorage.app",
    messagingSenderId: "877729470017",
    appId: "1:877729470017:web:d6d4f90eb0b553d09a58c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const courseList = document.getElementById("courseList");

// Fetch available teachers (courses)
async function fetchCourses() {
    try {
        const teachersRef = collection(db, "teachers");
        const teachersSnapshot = await getDocs(teachersRef);
        let courses = [];

        teachersSnapshot.forEach(doc => {
            const data = doc.data();
            
            // Check if the teacher has uploaded any videos
            const hasVideos = data.videos && data.videos.length > 0;
            
            // Create a default description if none exists
            const description = data.description || `Yoga course taught by ${data.name}. Experience: ${data.experience || 'Professional'} years.`;
            
            courses.push({ 
                id: doc.id, 
                name: data.name || "Yoga Course", 
                description: description,
                imageUrl: data.imageUrl,
                experience: data.experience,
                hasVideos: hasVideos,
                videoCount: hasVideos ? data.videos.length : 0
            });
        });

        return courses;
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
}

// Display courses for the logged-in user
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    let userData = { enrolledCourses: [] };
    
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            userData = userDoc.data();
        } else {
            console.warn("User document not found, creating default state");
            // Create user document if it doesn't exist
            await setDoc(userDocRef, { enrolledCourses: [] });
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }

    const enrolledCourses = userData.enrolledCourses || [];
    const courses = await fetchCourses();
    
    courseList.innerHTML = "";

    if (courses.length === 0) {
        courseList.innerHTML = "<li class='course-loading'>No courses available at the moment.</li>";
        return;
    }

    courses.forEach(course => {
        const li = document.createElement("li");
        
        // Course name and description
        const courseInfo = document.createElement("div");
        courseInfo.innerHTML = `
            <div class="course-name">${course.name}</div>
            <div class="course-description">${course.description}</div>
            ${course.hasVideos ? `<div class="course-videos-count">Available videos: ${course.videoCount}</div>` : ''}
        `;
        
        // Course action buttons
        const courseActions = document.createElement("div");
        courseActions.className = "course-actions";
        
        if (enrolledCourses.includes(course.id)) {
            courseActions.innerHTML = `
                <button class="access-btn" data-course-id="${course.id}">Access</button> 
                <button class="remove-btn" data-course-id="${course.id}">Remove</button>
            `;
        } else {
            courseActions.innerHTML = `
                <button class="add-btn" data-course-id="${course.id}">Enroll Now</button>
            `;
        }
        
        li.appendChild(courseInfo);
        li.appendChild(courseActions);
        courseList.appendChild(li);
    });
    
    // Add event listeners for buttons
    setupButtonListeners();
});

// Setup button event listeners
function setupButtonListeners() {
    // Add Course buttons
    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', () => {
            const courseId = button.getAttribute('data-course-id');
            addCourse(courseId);
        });
    });
    
    // Access Course buttons
    document.querySelectorAll('.access-btn').forEach(button => {
        button.addEventListener('click', () => {
            const courseId = button.getAttribute('data-course-id');
            accessCourse(courseId);
        });
    });
    
    // Remove Course buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const courseId = button.getAttribute('data-course-id');
            removeCourse(courseId);
        });
    });
}

// Add Course
async function addCourse(courseId) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to enroll in a course.");
        return window.location.href = "login.html";
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            enrolledCourses: arrayUnion(courseId)
        });

        alert("Successfully enrolled in the course!");
        window.location.reload();
    } catch (error) {
        console.error("Error enrolling in course:", error);
        alert("There was an error enrolling in the course. Please try again.");
    }
}

// Access Course
async function accessCourse(courseId) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to access your courses.");
        return window.location.href = "login.html";
    }

    try {
        // Store the active course ID in user's document
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            activeCourse: courseId
        });
        
        // Save the course ID in localStorage for easy access
        localStorage.setItem("activeCourseId", courseId);
        
        // Redirect to the course content page with the course ID
        window.location.href = `course-content.html?course=${courseId}`;
    } catch (error) {
        console.error("Error accessing course:", error);
        alert("There was an error accessing the course. Please try again.");
    }
}

// Remove Course
async function removeCourse(courseId) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to manage your courses.");
        return window.location.href = "login.html";
    }

    if (confirm("Are you sure you want to remove this course from your list?")) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                enrolledCourses: arrayRemove(courseId)
            });

            alert("Course successfully removed from your list.");
            window.location.reload();
        } catch (error) {
            console.error("Error removing course:", error);
            alert("There was an error removing the course. Please try again.");
        }
    }
}

// Make functions available to window for onclick handlers
window.addCourse = addCourse;
window.accessCourse = accessCourse;
window.removeCourse = removeCourse;
