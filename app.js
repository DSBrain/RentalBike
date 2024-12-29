const API_URL = "http://localhost:3000";

// DOM Elements
const loginForm = document.getElementById("login-form");
const adminPanel = document.getElementById("admin-panel");
const userPanel = document.getElementById("user-panel");
const bikeTable = document.getElementById("bike-table").querySelector("tbody");
const userBikeTable = document.getElementById("user-bike-table").querySelector("tbody");
const logoutBtn = document.createElement("button"); // Logout button

logoutBtn.textContent = "Logout";
logoutBtn.classList.add("button");
logoutBtn.addEventListener("click", logout);

// State
let currentUser = null;

// Check for Saved Session
function checkSession() {
  const sessionUser = JSON.parse(localStorage.getItem("currentUser"));
  if (sessionUser) {
    currentUser = sessionUser;
    if (currentUser.role === "admin") {
      showAdminPanel();
    } else if (currentUser.role === "user") {
      showUserPanel();
    }
  }
}

// Save Session
function saveSession(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
  currentUser = user;
}

// Clear Session
function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  adminPanel.classList.add("hidden");
  userPanel.classList.add("hidden");
  loginForm.classList.remove("hidden");
}

// Fix login handler first
document.getElementById("login-btn").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch(`${API_URL}/users`)
    .then((res) => res.json())
    .then((users) => {
      const user = users.find((u) => u.username === username);

      if (user) {
        if (user.password === password) {
          saveSession(user); // Save full user object
          if (user.role === "admin") {
            showAdminPanel();
          } else if (user.role === "user") {
            showUserPanel();
          }
        } else {
          alert("Invalid password.");
        }
      } else {
        // User doesn't exist, sign up as a new user
        const newUser = {
          username,
          password,
          role: "user",
        };

        fetch(`${API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        })
          .then((res) => res.json())
          .then((createdUser) => {
            alert("Signup successful! Logging you in.");
            saveSession(createdUser);
            showUserPanel();
          })
          .catch((err) => console.error("Error signing up:", err));
      }
    });
});
// Show Admin Panel
function showAdminPanel() {
  loginForm.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  adminPanel.appendChild(logoutBtn); // Add logout button
  fetchBikes();
}

// Show User Panel
function showUserPanel() {
  loginForm.classList.add("hidden");
  userPanel.classList.remove("hidden");
  userPanel.appendChild(logoutBtn); // Add logout button
  fetchBikesForUser();
}

// Fetch Bikes for Admin
function fetchBikes() {
  fetch(`${API_URL}/bikes`)
    .then((res) => res.json())
    .then((data) => {
      bikeTable.innerHTML = data
        .map(
          (bike) => `
          <tr>
            <td>${bike.id}</td>
            <td>${bike.name}</td>
            <td>${bike.price}</td>
            <td>${bike.available ? "Yes" : "No"}</td>
            <td>
              <button onclick="editBike('${bike.id}')">Edit</button>
              <button onclick="deleteBike('${bike.id}')">Delete</button>
            </td>
          </tr>
        `
        )
        .join("");
    });
}

// Add Bike
document.getElementById("add-bike").addEventListener("click", (e) => {
  e.preventDefault();
  const name = document.getElementById("bike-name").value;
  const price = +document.getElementById("bike-price").value;
  const available = document.getElementById("bike-available").checked;

  fetch(`${API_URL}/bikes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, available }),
  })
    .then((res) => res.json())
    .then((newBike) => {
      // Create corresponding favorites entry
      return fetch(`${API_URL}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bike_id: newBike.id,
          user_ids: [],
          id: Math.random().toString(36).substr(2, 4), // Generate 4 character random ID
        }),
      });
    })
    .then(() => fetchBikes())
    .catch((error) => {
      console.error("Error adding bike:", error);
      alert("Failed to add bike");
    });
});

// Edit Bike
// Edit Bike
function editBike(id) {
  const newName = prompt("Enter new name:");
  const newPrice = prompt("Enter new price:");
  const newAvailable = confirm("Available? OK for Yes, Cancel for No");

  fetch(`${API_URL}/bikes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName, price: +newPrice, available: newAvailable }),
  }).then(fetchBikes);
}

// Delete Bike
function deleteBike(id) {
  fetch(`${API_URL}/bikes/${id}`, { method: "DELETE" }).then(fetchBikes);
}
// Fix fetchBikesForUser function
function fetchBikesForUser() {
    fetch(`${API_URL}/bikes`)
      .then((res) => res.json())
      .then((bikes) => {
        fetch(`${API_URL}/favorites`)
          .then((res) => res.json())
          .then((favorites) => {
            userBikeTable.innerHTML = bikes
              .map((bike) => {
                const bikeId = parseInt(bike.id);
                const userId = parseInt(currentUser.id);
  
                const favorite = favorites.find((f) => parseInt(f.bike_id) === bikeId);
                const isFavorite = favorite && favorite.user_ids.includes(userId.toString());
  
                return `
                  <tr>
                    <td>${bike.id}</td>
                    <td>${bike.name}</td>
                    <td>${bike.price}</td>
                    <td>${bike.available ? "Yes" : "No"}</td>
                    <td>
                      <span 
                        class="favorite" 
                        onclick="toggleFavorite('${bike.id}', '${isFavorite}')"
                        style="cursor: pointer; color: ${isFavorite ? "red" : "gray"}"
                      >
                        ${isFavorite ? "❤️" : "♡"}
                      </span>
                    </td>
                  </tr>
                `;
              })
              .join("");
          });
      });
  }
// Toggle Favorite for Logged-In User
function toggleFavorite(bikeId, isFavorite) {
    if (!currentUser || !currentUser.id) {
      alert("Please log in first");
      return;
    }
  
    // Convert string 'true'/'false' to boolean
    isFavorite = isFavorite === 'true';
  
    fetch(`${API_URL}/favorites`)
      .then((res) => res.json())
      .then((favorites) => {
        const numericBikeId = parseInt(bikeId);
        const favorite = favorites.find((f) => parseInt(f.bike_id) === numericBikeId);
        const userId = currentUser.id.toString();
  
        if (isFavorite && favorite) {
          favorite.user_ids = favorite.user_ids.filter((id) => id !== userId);
          return fetch(`${API_URL}/favorites/${favorite.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(favorite),
          });
        } else if (!isFavorite) {
          if (favorite) {
            if (!favorite.user_ids.includes(userId)) {
              favorite.user_ids.push(userId);
            }
            return fetch(`${API_URL}/favorites/${favorite.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(favorite),
            });
          } else {
            return fetch(`${API_URL}/favorites`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bike_id: numericBikeId,
                user_ids: [userId],
                id: Math.random().toString(36).substr(2, 4)
              }),
            });
          }
        }
      })
      .then(() => fetchBikesForUser())
      .catch((error) => {
        console.error("Error toggling favorite:", error);
        alert("Failed to update favorite");
      });
  }

// Check session on load
checkSession();
