import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

const videoContainer = document.getElementById("video-container");
const overlay = document.getElementById("overlay");
const videoPlayer = document.getElementById("video-player");
const videoTitle = document.getElementById("video-title");
const videoDate = document.getElementById("video-date");
const videoDescription = document.getElementById("video-description");
const closeBtn = document.getElementById("close-btn");
const searchInput = document.getElementById("searchInput");

let allVideos = [];

// Fetch videos from Firestore
const fetchVideos = async () => {
    const querySnapshot = await getDocs(collection(db, "videos"));
    allVideos = [];
    videoContainer.innerHTML = ""; // Clear existing videos

    querySnapshot.forEach(doc => {
        allVideos.push({ id: doc.id, ...doc.data() });
    });

    displayVideos(allVideos);
};

// Display videos in the grid
const displayVideos = (videos) => {
    videoContainer.innerHTML = ""; // Clear existing videos

    videos.forEach(videoData => {
        let videoDiv = document.createElement("div");
        videoDiv.classList.add("video-item");
        videoDiv.innerHTML = `
            <video class="video-thumbnail" src="${videoData.url}" preload="metadata"></video>
            <div class="video-details">
                <p><strong>${videoData.name}</strong></p>
                <p>${videoData.date}</p>
                <p>${videoData.description}</p>
            </div>
        `;
        videoDiv.addEventListener("click", () => {
            videoPlayer.src = videoData.url;
            videoTitle.innerText = videoData.name;
            videoDate.innerText = `Uploaded on: ${videoData.date}`;
            videoDescription.innerText = videoData.description;
            overlay.classList.add("active");
            videoPlayer.play();
        });
        videoContainer.appendChild(videoDiv);
    });
};

// Search functionality
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredVideos = allVideos.filter(video => 
        video.name.toLowerCase().includes(searchTerm)
    );
    displayVideos(filteredVideos);
});

// Close overlay
closeBtn.addEventListener("click", () => {
    overlay.classList.remove("active");
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
});

// Close overlay when clicking outside the video
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
        overlay.classList.remove("active");
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    }
});

// Initial fetch
fetchVideos();