import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

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
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const activeCourseId = userDoc.data().activeCourse;
            if (activeCourseId) {
                loadCourseContent(activeCourseId);
            } else {
                alert("No active course found! Redirecting...");
                window.location.href = "courses.html";
            }
        }
    } else {
        alert("User not logged in! Redirecting...");
        window.location.href = "login.html";
    }
});

async function loadCourseContent(courseId) {
    const teacherDocRef = doc(db, "teachers", courseId);
    const teacherDoc = await getDoc(teacherDocRef);

    if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        document.getElementById("teacherImage").src = teacherData.imageUrl;
        document.getElementById("teacherName").innerText = teacherData.name;
        document.getElementById("teacherContact").innerText = teacherData.contact;
        document.getElementById("teacherExperience").innerText = teacherData.experience;
        
        if (teacherData.videoUrl) {
            document.getElementById("courseVideo").src = teacherData.videoUrl;
        } else {
            document.getElementById("courseVideo").outerHTML = "<p>No video uploaded yet.</p>";
        }
    } else {
        alert("Error: Course not found!");
        window.location.href = "courses.html";
    }
}
