document.addEventListener("DOMContentLoaded", async function () {

        try {
        // Check authentication status
        const authResponse = await fetch('/applicant/auth-status');
        const authData = await authResponse.json();
           const userId = localStorage.getItem("userId");

              if (!userId) {
                showAlert('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/frontend/Applicant/Login/login.html';
                }, 2000);
                return;
            }
     
        if (!authData.authenticated) {
            window.location.href = '../Login/login.html';
            return;
        }
        
        // If authenticated, use the user data from auth response
        if (authData.user) {
            console.log("User data from auth:", authData.user);
            setupEventListeners();
        } else {
            showNotification("No user data found. Please log in again.");
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification("Failed to load profile data. Please try again.");
    }


    async function logoutUser() {
    try {
        const response = await fetch('/applicant/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            // Clear frontend storage
            sessionStorage.clear();
            localStorage.clear();
            
            // Redirect to login page
            window.location.href = "../Login/login.html";
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showErrorMessage("Failed to logout. Please try again.");
    }
}

function setupEventListeners() {
    const logoutButton = document.querySelector("#logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            logoutUser();
        });
    }

    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
        toggle.addEventListener("click", function (event) {
            event.preventDefault();
            const parentDropdown = toggle.parentElement;
            parentDropdown.classList.toggle("active");

            // Close other dropdowns
            document.querySelectorAll(".dropdown").forEach((dropdown) => {
                if (dropdown !== parentDropdown) {
                    dropdown.classList.remove("active");
                }
            });
        });
    });

    // Close dropdowns if clicked outside
    document.addEventListener("click", function (event) {
        if (!event.target.closest(".dropdown")) {
            document.querySelectorAll(".dropdown").forEach((dropdown) => {
                dropdown.classList.remove("active");
            });
        }
    });

    document.querySelectorAll(".top-section").forEach(section => {
        section.addEventListener("click", function () {
            document.querySelectorAll(".dropdown-section").forEach(otherSection => {
                if (otherSection !== this.closest(".dropdown-section")) {
                    otherSection.classList.remove("expanded");
                    otherSection.querySelector(".arrow").classList.remove("rotated");
                    otherSection.querySelector(".file-table").classList.add("hidden");
                    otherSection.querySelector(".upload-btn").classList.add("hidden");
                }
            });

            const parent = this.closest(".dropdown-section");
            parent.classList.toggle("expanded"); // Toggle expand class to control height
            parent.querySelector(".arrow").classList.toggle("rotated"); // Rotate arrow
            parent.querySelector(".file-table").classList.toggle("hidden");
            parent.querySelector(".upload-btn").classList.toggle("hidden");
        });
    });

    document.querySelectorAll(".upload-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            this.closest(".dropdown-section").querySelector(".file-input").click();
        });
    });

    document.querySelectorAll(".file-input").forEach(input => {
        input.addEventListener("change", function () {
            const parent = this.closest(".dropdown-section");
            const fileTableBody = parent.querySelector(".file-table tbody");
            const fileCountSpan = parent.querySelector(".file-count");
            
            Array.from(this.files).forEach(file => {
                const documentId = Math.floor(Math.random() * 10000);
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td title="${file.name}">${file.name}</td>
                    <td>Uploaded</td>
                    <td>${new Date().toLocaleDateString()}</td>
                    <td>${documentId}</td>
                    <td>
                        <button class="view-btn" data-file-url="${URL.createObjectURL(file)}">View</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                `;
                fileTableBody.appendChild(row);
            });
            fileCountSpan.textContent = fileTableBody.children.length;
            this.value = "";
        });
    });

    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const row = event.target.closest("tr");
            const parent = row.closest(".dropdown-section");
            row.remove();
            parent.querySelector(".file-count").textContent = parent.querySelector(".file-table tbody").children.length;
        }

        if (event.target.classList.contains("view-btn")) {
            const fileUrl = event.target.getAttribute("data-file-url");
            window.open(fileUrl, "_blank");
        }
    });

    const searchBar = document.querySelector(".search-bar");
    const clearSearchBtn = document.querySelector(".clear-search");

    // Show/hide the X icon based on input value
    searchBar.addEventListener("input", function () {
        const searchText = searchBar.value.toLowerCase();
        if (searchText.length > 0) {
            clearSearchBtn.style.display = "block"; // Show X icon
        } else {
            clearSearchBtn.style.display = "none"; // Hide X icon when the input is empty
        }

        document.querySelectorAll(".dropdown-section").forEach(section => {
            const fileRows = section.querySelectorAll("tbody tr");
            let fileMatch = false;

            fileRows.forEach(row => {
                const fileName = row.querySelector("td").textContent.toLowerCase();
                if (fileName.includes(searchText)) {
                    row.style.display = "table-row";
                    fileMatch = true;
                } else {
                    row.style.display = "none";
                }
            });

            if (fileMatch) {
                section.classList.add("expanded");
                section.querySelector(".arrow").classList.add("rotated");
                section.querySelector(".file-table").classList.remove("hidden");
                section.querySelector(".upload-btn").classList.remove("hidden");
            } else {
                section.classList.remove("expanded");
                section.querySelector(".arrow").classList.remove("rotated");
                section.querySelector(".file-table").classList.add("hidden");
                section.querySelector(".upload-btn").classList.add("hidden");
            }
        });
    });

    // Clear the search bar when the X icon is clicked
    clearSearchBtn.addEventListener("click", function () {
        searchBar.value = ""; // Clear the input
        clearSearchBtn.style.display = "none"; // Hide the X icon
        searchBar.dispatchEvent(new Event("input")); // Trigger input event to update file display
    });
}

    function showNotification(message, type = "info") {
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach(notification => notification.remove());

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}
});
