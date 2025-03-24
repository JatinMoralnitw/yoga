import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

document.getElementById("loginBtn").addEventListener("click", async () => {
    const name = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const loginStatus = document.getElementById("loginStatus");

    const q = query(collection(db, "teachers"), where("name", "==", name), where("password", "==", password));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        loginStatus.innerText = "✅ Login successful!";
        document.getElementById("uploadSection").style.display = "block";
    } else {
        loginStatus.innerText = "❌ Invalid name or password!";
    }
});

document.getElementById("uploadVideoBtn").addEventListener("click", async () => {
    const name = document.getElementById("loginName").value.trim();
    const videoUrl = document.getElementById("videoUrl").value.trim();
    const uploadStatus = document.getElementById("uploadStatus");

    const q = query(collection(db, "teachers"), where("name", "==", name));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const teacherDoc = querySnapshot.docs[0].ref;
        await updateDoc(teacherDoc, { videoUrl });

        uploadStatus.innerText = "✅ Video uploaded successfully!";
    } else {
        uploadStatus.innerText = "❌ Error uploading video!";
    }
});
