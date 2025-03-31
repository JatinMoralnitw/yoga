import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

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

// Show selected file name
document.getElementById("teacherImage").addEventListener("change", (event) => {
    const fileName = event.target.files[0]?.name || "No file chosen";
    document.getElementById("fileName").textContent = fileName;
});

document.getElementById("addTeacherBtn").addEventListener("click", async () => {
    const name = document.getElementById("teacherName").value.trim();
    const password = document.getElementById("teacherPassword").value.trim();
    const contact = document.getElementById("teacherContact").value.trim();
    const experience = document.getElementById("teacherExperience").value.trim();
    const imageFile = document.getElementById("teacherImage").files[0];
    const statusMessage = document.getElementById("statusMessage");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");

    // Validate inputs
    if (!name || !password || !contact || !experience || !imageFile) {
        statusMessage.innerText = "⚠️ All fields are required!";
        return;
    }

    try {
        statusMessage.innerText = "Uploading image...";
        progressContainer.style.display = "block";
        
        // Create a reference to the teachers image folder
        const storageRef = ref(storage, `teacherimages/${Date.now()}_${imageFile.name}`);
        
        // Start upload
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        
        // Listen for upload progress
        uploadTask.on('state_changed', 
            (snapshot) => {
                // Update progress bar
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + "%";
                progressBar.textContent = Math.round(progress) + "%";
            }, 
            (error) => {
                // Handle errors
                console.error("Upload error:", error);
                statusMessage.innerText = "❌ Error uploading image!";
                progressContainer.style.display = "none";
            }, 
            async () => {
                // Upload complete
                // Get the download URL
                const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                statusMessage.innerText = "Image uploaded, adding teacher...";
                
                // Now add teacher data with the image URL to Firestore
                await addDoc(collection(db, "teachers"), {
                    name,
                    password,
                    contact,
                    experience,
                    imageUrl
                });
                
                statusMessage.innerText = "✅ Teacher added successfully!";
                
                // Reset form
                document.getElementById("teacherName").value = "";
                document.getElementById("teacherPassword").value = "";
                document.getElementById("teacherContact").value = "";
                document.getElementById("teacherExperience").value = "";
                document.getElementById("teacherImage").value = "";
                document.getElementById("fileName").textContent = "No file chosen";
                progressBar.style.width = "0%";
                progressBar.textContent = "0%";
                
                // Hide progress bar after a delay
                setTimeout(() => {
                    progressContainer.style.display = "none";
                }, 3000);
            }
        );
    } catch (error) {
        console.error("Error adding teacher:", error);
        statusMessage.innerText = "❌ Error adding teacher!";
        progressContainer.style.display = "none";
    }
});
