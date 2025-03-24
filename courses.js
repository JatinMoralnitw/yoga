import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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
const logoutBtn = document.getElementById("logoutBtn");

// Sample course descriptions (in case Firebase doesn't have them)
const courseDescriptions = {
    "beginner": "Perfect for newcomers to yoga practice. Learn fundamental poses and breathing techniques.",
    "intermediate": "Build on your foundation with more challenging poses and sequences.",
    "advanced": "Deepen your practice with complex postures and extended meditation.",
    "prenatal": "Safe, gentle yoga designed specifically for expectant mothers.",
    "therapeutic": "Healing-focused yoga to address physical discomfort and promote recovery.",
    "meditation": "Focus on mindfulness and mental clarity through guided meditation sessions."
};

// Fetch available teachers (courses)
async function fetchCourses() {
    try {
        const teachersRef = collection(db, "teachers");
        const teachersSnapshot = await getDocs(teachersRef);
        let courses = [];

        teachersSnapshot.forEach(doc => {
            // Add a description if not present
            const data = doc.data();
            if (!data.description && courseDescriptions[doc.id.toLowerCase()]) {
                data.description = courseDescriptions[doc.id.toLowerCase()];
            } else if (!data.description) {
                data.description = "Explore this specialized yoga course tailored to your needs.";
            }
            
            courses.push({ id: doc.id, ...data });
        });

        return courses;
    } catch (error) {
        console.error("Error fetching courses:", error);
        // Return some sample courses if Firebase fetch fails
        return [
            { id: "beginner", name: "Beginner Yoga", description: courseDescriptions.beginner },
            { id: "intermediate", name: "Intermediate Flows", description: courseDescriptions.intermediate },
            { id: "advanced", name: "Advanced Practice", description: courseDescriptions.advanced },
            { id: "meditation", name: "Meditation & Mindfulness", description: courseDescriptions.meditation }
        ];
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
            <div class="course-name">${course.name || course.id}</div>
            <div class="course-description">${course.description || ""}</div>
        `;
        
        // Course action buttons
        const courseActions = document.createElement("div");
        courseActions.className = "course-actions";
        
        if (enrolledCourses.includes(course.id)) {
            courseActions.innerHTML = `
                <button class="access-btn" onclick="accessCourse('${course.id}')">Access</button> 
                <button class="remove-btn" onclick="removeCourse('${course.id}')">Remove</button>
            `;
        } else {
            courseActions.innerHTML = `
                <button class="add-btn" onclick="addCourse('${course.id}')">Enroll Now</button>
            `;
        }
        
        li.appendChild(courseInfo);
        li.appendChild(courseActions);
        courseList.appendChild(li);
    });
});

// Add Course
window.addCourse = async (courseId) => {
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
};

// Access Course
window.accessCourse = async (courseId) => {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to access your courses.");
        return window.location.href = "login.html";
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            activeCourse: courseId
        });

        alert("Loading your course content...");
        window.location.href = "course-content.html";
    } catch (error) {
        console.error("Error accessing course:", error);
        alert("There was an error accessing the course. Please try again.");
    }
};

// Remove Course
window.removeCourse = async (courseId) => {
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
};

// Logout Function
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            alert("Logged out successfully.");
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout Error:", error);
            alert("Failed to log out. Please try again.");
        }
    });
}
