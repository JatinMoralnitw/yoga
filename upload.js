import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

// Firebase Configuration
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
const db = getFirestore(app);
const storage = getStorage(app);

document.getElementById("upload-btn").addEventListener("click", async () => {
    const videoName = document.getElementById("video-name").value.trim();
    const videoDescription = document.getElementById("video-description").value.trim();
    const videoFile = document.getElementById("video-file").files[0];
    const statusMessage = document.getElementById("status-message");
    const progressBar = document.getElementById("progress");
    const progressIndicator = document.getElementById("progress-bar");

    if (!videoName || !videoDescription || !videoFile) {
        statusMessage.innerText = "⚠️ All fields are required!";
        return;
    }

    const storageRef = ref(storage, `videos/${videoFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, videoFile);

    progressBar.style.display = "block";

    uploadTask.on("state_changed",
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressIndicator.style.width = progress + "%";
        },
        (error) => {
            console.error("Upload error:", error);
            statusMessage.innerText = "❌ Error uploading video!";
        },
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            await addDoc(collection(db, "videos"), {
                name: videoName,
                description: videoDescription,
                url: downloadURL,
                date: new Date().toISOString().split('T')[0]
            });

            statusMessage.innerText = "✅ Video uploaded successfully!";
            progressBar.style.display = "none";
        }
    );
});
