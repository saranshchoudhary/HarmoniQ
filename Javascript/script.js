console.log("Let's write JavaScript");

let currentSong = new Audio();
let songs = [];
let isLoggedIn = false; // Keep track of whether the user is logged in
let currFolder = 'songs';
let username = "";
let currentArtistIndex = 0; // Keeps track of the current artist playlist index
let artistPlaylists = []; // Holds all artist playlists

// Function to convert seconds to minutes:seconds format
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to get songs from a given folder
async function getSongs(folder, artistName) {
  currFolder = folder;
  let a = await fetch(`/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  // Show all the songs in the playlist
  let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
  songUL.innerHTML = "";
  if (songs.length === 0) {
    songUL.innerHTML = "<li>No songs available in this folder.</li>";
  } else {
    for (const song of songs) {
      songUL.innerHTML += `
        <li>
          <img class="invert" src="/svgs/music.svg" alt="">
          <div class="info">
            <div>${song.replaceAll("%20", " ")}</div>
            <div>${artistName}</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="/svgs/play.svg" alt="">
          </div>
        </li>`;
    }
  }

  // Attach an event listener to each song
  Array.from(document.querySelector(".songList").getElementsByTagName("li"))
    .forEach(e => {
      e.addEventListener("click", element => {
        playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
      });
    });

  return songs;
}

// Function to play music
const playMusic = (track, pause = false) => {
  if (!isLoggedIn) {
    return;
  }

  // Reset the seekbar and song time
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
  document.querySelector(".circle").style.left = "0%"; // Reset seekbar

  currentSong.src = `/${currFolder}/` + track;
  currentSong.load();  // Make sure the song is loaded before playing
  currentSong.play();  // Start playing the song immediately
  play.src = "/svgs/pause.svg";  // Update play/pause icon to 'pause'
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
};

// Function to display albums (artist playlists)
async function displayAlbums(searchTerm = "") {
  console.log("Displaying albums");
  let a = await fetch(`/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  artistPlaylists = Array.from(anchors).filter(e => e.href.includes("/songs"));

  // Filter albums by search term
  if (searchTerm) {
    artistPlaylists = artistPlaylists.filter(e =>
      e.href.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Render all artist playlists
  cardContainer.innerHTML = '';
  artistPlaylists.forEach((e, index) => {
    let folder = e.href.split("/").slice(-1)[0];
    try {
      fetch(`/songs/${folder}/info.json`)
        .then(res => res.json())
        .then(response => {
          cardContainer.innerHTML += `
            <div data-folder="${folder}" class="card">
              <div class="play">
                <svg xmlns="http://www.w3.org/2000/svg" data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 24 24" class="Svg-sc-ytk21e-0 bneLcE">
                  <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
                </svg>
              </div>
              <img src="/songs/${folder}/cover.jpg" alt="" />
              <h2>${response.title}</h2>
              <p>${response.description}</p>
            </div>`;
        });
    } catch (error) {
      console.error(`Error loading album metadata for ${folder}:`, error);
    }
  });
}

// Function to load and play the first song from a given artist's playlist
async function loadAndPlayArtistPlaylist(index) {
  if (artistPlaylists.length === 0) return;

  // Remove 'active' class from all cards
  Array.from(document.querySelectorAll(".card")).forEach(card => {
    card.classList.remove("active");
  });

  currentArtistIndex = index;
  const folder = artistPlaylists[currentArtistIndex].href.split("/").slice(-1)[0];

  // Add 'active' class to the selected artist's card
  const selectedCard = Array.from(document.querySelectorAll(".card")).find(card => card.dataset.folder === folder);
  if (selectedCard) selectedCard.classList.add("active");
    // Fetch the artist name dynamically from the selected card
    const artistName = selectedCard.querySelector("h2").textContent || "Unknown Artist"; // Ensure artist name is fetched properly


  await getSongs(`songs/${folder}`,artistName);
  playMusic(songs[0], true); // Auto play the first song in the playlist
}

// Event listener for previous artist playlist (navbar)
document.getElementById('previousNav').addEventListener('click', () => {
  if (artistPlaylists.length > 1) {
    currentArtistIndex = (currentArtistIndex - 1 + artistPlaylists.length) % artistPlaylists.length;
    loadAndPlayArtistPlaylist(currentArtistIndex);
  }
});

// Event listener for next artist playlist (navbar)
document.getElementById('nextNav').addEventListener('click', () => {
  if (artistPlaylists.length > 1) {
    currentArtistIndex = (currentArtistIndex + 1) % artistPlaylists.length;
    loadAndPlayArtistPlaylist(currentArtistIndex);
  }
});

// Event listener for clicking an artist (card click to load playlist)
document.querySelector(".cardContainer").addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (card) {
    const folder = card.dataset.folder;
    currentArtistIndex = artistPlaylists.findIndex(e => e.href.includes(folder));
    loadAndPlayArtistPlaylist(currentArtistIndex);
  }
});

// Event listener for search input to filter artists
document.getElementById('searchInput').addEventListener('input', (event) => {
  const searchTerm = event.target.value.trim();
  displayAlbums(searchTerm); // Call displayAlbums with the search term
});

// Open modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}
document.addEventListener('DOMContentLoaded', () => {
// Login form submission
document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  // Simulate login (replace with real authentication logic)
  if (email === "user@example.com" && password === "password") {
    alert("Login successful!");
    isLoggedIn = true;
    closeModal("loginModal");
  } else {
    alert("Invalid credentials. Please try again.");
  }
});

// Sign-up form submission
document.getElementById("signupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  // Simulate sign-up (replace with real registration logic)
  alert(`Sign-up successful for ${email}! Please log in.`);
  closeModal("signupModal");
});
// Close modal when clicking the "X" button in the login modal
const closeLoginButton = document.querySelector(".close-login");
if (closeLoginButton) {
  closeLoginButton.addEventListener("click", () => closeModal("loginModal"));
}

// Close modal when clicking the "X" button in the sign-up modal
const closeSignupButton = document.querySelector(".close-signup");
if (closeSignupButton) {
  closeSignupButton.addEventListener("click", () => closeModal("signupModal"));
}

// Update the UI based on login state
function updateUI() {
  const authButtons = document.querySelector("#authButtons");
  const userMenu = document.getElementById("userMenu");

  if (isLoggedIn) {
    // Hide login and signup buttons
    authButtons.style.display = "none";
    
    // Show user icon and menu
    userMenu.style.display = "block";
    document.getElementById("userDropdown").style.display = "none";
    
    // Set username
    document.getElementById("username").innerText = username;
  } else {
    // Show login and signup buttons
    authButtons.style.display = "flex";
    
    // Hide user icon and menu
    userMenu.style.display = "none";
  }
}

// Toggle user menu when user icon is clicked
document.getElementById("userIcon").addEventListener("click", () => {
  const dropdown = document.getElementById("userDropdown");
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";  // Toggle visibility
});

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (email === "user@example.com" && password === "password") {
    isLoggedIn = true;
    username = " ";  // Store the username
    updateUI();  // Update the UI to reflect the logged-in state
    closeModal("loginModal");  // Close the login modal
  } else { 
  }
});

// Handle signup form submission
document.getElementById("signupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  closeModal("signupModal");
});
// Handle logout
document.getElementById("logoutButton").addEventListener("click", () => {
  isLoggedIn = false;
  username = "";  // Clear username
  // Stop playing the song
  if (!currentSong.paused) {
    currentSong.pause(); // Pause the song
    currentSong.currentTime = 0; // Reset the song time to the start
  }
    // Reset any song information displayed on the UI
    document.querySelector(".songinfo").innerHTML = " ";
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    document.querySelector(".circle").style.left = "0%";
  updateUI();  // Update the UI to reflect the logged-out state
 
});

// Add event listeners to buttons
document.getElementById("loginButton").addEventListener("click", () => openModal("loginModal"));
document.getElementById("signupButton").addEventListener("click", () => openModal("signupModal"));


});


// Main function to initialize everything
async function main() {
  try {
    // Get the list of all the songs
    await getSongs("songs");
    playMusic(songs[0], true);  // Auto play the first song

    // Display all the albums (artist playlists)
    await displayAlbums();

    // Event listener to play/pause the song
    play.addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play();
        play.src = "/svgs/pause.svg";
      } else {
        currentSong.pause();
        play.src = "/svgs/play.svg";
      }
    });
    
    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
      document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
        currentSong.currentTime
      )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
      document.querySelector(".circle").style.left =
        (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
      let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
      document.querySelector(".circle").style.left = percent + "%";
      currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Add event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
      document.querySelector(".left").style.left = "0";
    });

    // Add event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
      document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener for repeat song
    currentSong.addEventListener("ended", () => {
      let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
      if (index + 1 < songs.length) {
        setTimeout(() => {
          playMusic(songs[index + 1]);
        }, 3000); // 3-second delay
      }
    });

       // Add an event listener to previous
       previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
          playMusic(songs[index - 1]);
        }
      });
  
      // Add an event listener to next
      next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
          playMusic(songs[index + 1]);
        }
      });
      // Add event to volume
  document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
    currentSong.volume = parseInt(e.target.value) / 100;
    if (currentSong.volume > 0) {
    document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
    }
    });
    
    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
    if (e.target.src.includes("volume.svg")) {
    e.target.src = e.target.src.replace("volume.svg", "mute.svg");
    currentSong.volume = 0;
    document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    } else {
    e.target.src = e.target.src.replace("mute.svg", "volume.svg");
    currentSong.volume = 0.10;
    document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
    }
    });

  } catch (error) {
    console.error("Error initializing the application:", error);
  }
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize the application
main();
