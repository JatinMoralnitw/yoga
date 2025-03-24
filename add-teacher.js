import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

document.getElementById("addTeacherBtn").addEventListener("click", async () => {
    const name = document.getElementById("teacherName").value.trim();
    const password = document.getElementById("teacherPassword").value.trim();
    const contact = document.getElementById("teacherContact").value.trim();
    const experience = document.getElementById("teacherExperience").value.trim();
    const imageUrl = document.getElementById("teacherImageUrl").value.trim();
    const statusMessage = document.getElementById("statusMessage");

    if (!name || !password || !contact || !experience || !imageUrl) {
        statusMessage.innerText = "⚠️ All fields are required!";
        return;
    }

    try {
        await addDoc(collection(db, "teachers"), {
            name,
            password,
            contact,
            experience,
            imageUrl
        });
        statusMessage.innerText = "✅ Teacher added successfully!";
    } catch (error) {
        console.error("Error adding teacher:", error);
        statusMessage.innerText = "❌ Error adding teacher!";
    }
});
