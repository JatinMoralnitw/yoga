import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc, getDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

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
const storage = getStorage(app);

// Populate days dropdown
const daySelect = document.getElementById("daySelect");
for (let i = 1; i <= 30; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Day ${i}`;
    daySelect.appendChild(option);
}

// Show selected file name
document.getElementById("videoFile").addEventListener("change", (event) => {
    const fileName = event.target.files[0]?.name || "No file chosen";
    document.getElementById("fileName").textContent = fileName;
});

let currentTeacherId = null;
let currentTeacherData = null;

document.getElementById("loginBtn").addEventListener("click", async () => {
    const name = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const loginStatus = document.getElementById("loginStatus");

    const q = query(collection(db, "teachers"), where("name", "==", name), where("password", "==", password));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        currentTeacherId = querySnapshot.docs[0].id;
        currentTeacherData = querySnapshot.docs[0].data();
        loginStatus.innerText = "✅ Login successful!";
        document.getElementById("uploadSection").style.display = "block";
    } else {
        loginStatus.innerText = "❌ Invalid name or password!";
    }
});

document.getElementById("uploadVideoBtn").addEventListener("click", async () => {
    if (!currentTeacherId) {
        document.getElementById("uploadStatus").innerText = "❌ Please login first!";
        return;
    }
    
    const day = document.getElementById("daySelect").value;
    const videoFile = document.getElementById("videoFile").files[0];
    const description = document.getElementById("videoDescription").value.trim();
    const restrictions = document.getElementById("restrictions").value.trim();
    const uploadStatus = document.getElementById("uploadStatus");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");

    if (!videoFile) {
        uploadStatus.innerText = "❌ Please select a video file!";
        return;
    }

    try {
        uploadStatus.innerText = "Uploading video...";
        progressContainer.style.display = "block";
        
        // Create a reference to the videos folder
        const storageRef = ref(storage, `coursevideos/${currentTeacherId}/day${day}_${Date.now()}_${videoFile.name}`);
        
        // Start upload
        const uploadTask = uploadBytesResumable(storageRef, videoFile);
        
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
                uploadStatus.innerText = "❌ Error uploading video!";
                progressContainer.style.display = "none";
            }, 
            async () => {
                // Upload complete
                // Get the download URL
                const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                uploadStatus.innerText = "Video uploaded, saving course data...";
                
                // Create a video object
                const videoData = {
                    day: parseInt(day),
                    videoUrl: videoUrl,
                    description: description,
                    restrictions: restrictions,
                    uploadDate: new Date().toISOString()
                };
                
                // Update the teacher document to add this video
                const teacherRef = doc(db, "teachers", currentTeacherId);
                
                // First check if the teacher already has a videos array
                const teacherDoc = await getDoc(teacherRef);
                if (teacherDoc.exists()) {
                    const teacherData = teacherDoc.data();
                    
                    // Check if videos array exists
                    if (teacherData.videos) {
                        // If there's already a video for this day, replace it
                        let videos = teacherData.videos;
                        const existingVideoIndex = videos.findIndex(v => v.day === parseInt(day));
                        
                        if (existingVideoIndex >= 0) {
                            // Replace existing video
                            videos[existingVideoIndex] = videoData;
                            await updateDoc(teacherRef, { videos });
                        } else {
                            // Add new video using arrayUnion
                            await updateDoc(teacherRef, {
                                videos: arrayUnion(videoData)
                            });
                        }
                    } else {
                        // Create videos array with this video
                        await updateDoc(teacherRef, {
                            videos: [videoData]
                        });
                    }
                    
                    uploadStatus.innerText = `✅ Day ${day} video uploaded successfully!`;
                } else {
                    uploadStatus.innerText = "❌ Teacher document not found!";
                }
                
                // Clear inputs
                document.getElementById("videoFile").value = "";
                document.getElementById("fileName").textContent = "No file chosen";
                document.getElementById("videoDescription").value = "";
                document.getElementById("restrictions").value = "";
                progressBar.style.width = "0%";
                progressBar.textContent = "0%";
                
                // Hide progress bar after a delay
                setTimeout(() => {
                    progressContainer.style.display = "none";
                }, 3000);
            }
        );
    } catch (error) {
        console.error("Error uploading video:", error);
        uploadStatus.innerText = "❌ Error: " + error.message;
        progressContainer.style.display = "none";
    }
});
