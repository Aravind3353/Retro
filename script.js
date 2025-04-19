const API_BASE = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    if (window.location.pathname.includes("progress.html")) {
        updateProgress();
    }
    if (window.location.pathname.includes("nutrition.html")) {
        updateNutrition();
    }
    if (window.location.pathname.includes("workouts.html")) {
        fetchWorkouts();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("progress.html")) {
        updateProgress();
    }
});


// Register User
function registerUser() {
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Register Response:", data);
        alert(data.message || data.error || "Registration failed");
    })
    .catch(error => console.error("Error registering user:", error));
}

// Login User
function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Login Response:", data);
        if (data.userId) {
            localStorage.setItem("userId", data.userId);
            window.location.href = "home.html";
        } else {
            alert(data.error || "Invalid login credentials.");
        }
    })
    .catch(error => console.error("Login Error:", error));
}

// Logout Function
function logout() {
    localStorage.removeItem("userId");
    window.location.href = "login.html";
}

// Add Workout
function addWorkout() {
    const user_id = localStorage.getItem("userId");
    const exercise = document.getElementById("exercise").value;
    const sets = document.getElementById("sets").value;
    const reps = document.getElementById("reps").value;

    if (!exercise || !sets || !reps) {
        alert("Please enter exercise details.");
        return;
    }

    fetch(`${API_BASE}/add-workout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, exercise, sets, reps })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log("Add Workout Response:", data);
        alert(data.message || data.error || "Failed to log workout");
        updateProgress();
    })
    .catch(error => {
        console.error("Error adding workout:", error);
        alert("Error adding workout: " + error.message);
    });
}

// Fetch Workout History
function fetchWorkouts() {
    const user_id = localStorage.getItem("userId");

    fetch(`${API_BASE}/get-workouts?user_id=${user_id}`)
    .then(response => response.json())
    .then(data => {
        console.log("Workout History Data:", data);
        const workoutList = document.getElementById("workoutList");
        if (workoutList) {
            workoutList.innerHTML = "";
            data.forEach(workout => {
                const li = document.createElement("li");
                li.textContent = `${workout.exercise} - ${workout.sets} sets, ${workout.reps} reps, ${workout.calories_burnt} kcal`;
                workoutList.appendChild(li);
            });
        }
    })
    .catch(error => console.error("Error fetching workouts:", error));
}

// Add Meal
function addMeal(mealType) {
    const mealInput = document.getElementById(mealType).value;
    const caloriesInput = document.getElementById(`${mealType}-calories`).value;
    const user_id = localStorage.getItem("userId");

    if (!mealInput || !caloriesInput) {
        alert("Please enter both meal name and calories.");
        return;
    }

    fetch(`${API_BASE}/add-meal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            user_id, 
            meal_type: mealType, 
            meal_name: mealInput, 
            calories: parseInt(caloriesInput, 10) 
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Add Meal Response:", data);
        alert(data.message || data.error || "Failed to log meal");
        updateNutrition();
    })
    .catch(error => console.error("Error adding meal:", error));
}

function updateProgress() {
    const user_id = localStorage.getItem("userId");

    fetch(`${API_BASE}/get-progress?user_id=${user_id}`)
    .then(response => response.json())
    .then(data => {
        console.log("Fetched Progress Data:", data);

        // Update total calories burnt
        const totalBurntElement = document.getElementById("total-burnt");
        if (totalBurntElement) {
            totalBurntElement.textContent = data.totalCalories || 0;
        } else {
            console.warn("Element #total-burnt not found.");
        }

        // Update Workout History
        const historyList = document.getElementById("workoutHistory"); // Ensure ID exists in HTML
        if (historyList) {
            historyList.innerHTML = ""; // Clear previous entries

            if (data.history && data.history.length > 0) {
                data.history.forEach(entry => {
                    const li = document.createElement("li");
                    li.textContent = `${entry.exercise} - ${entry.sets} sets, ${entry.reps} reps, ${entry.calories_burnt} kcal`;
                    historyList.appendChild(li);
                });
            } else {
                historyList.innerHTML = "<li>No workouts recorded yet.</li>";
            }
        } else {
            console.warn("Element #workoutHistory not found.");
        }
    })
    .catch(error => console.error("Error fetching progress:", error));
}

// Send Calories Burnt to MySQL (Ensure It Gets Stored)
function updateCaloriesBurnt(caloriesBurnt) {
    const user_id = localStorage.getItem("userId");

    fetch("http://localhost:5000/update-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, calories_burnt: caloriesBurnt })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        updateProgress(); // Refresh progress data
    })
    .catch(error => console.error("Error:", error));
}


// Select Workout
function selectWorkout(workoutName) {
    localStorage.setItem("selectedWorkout", workoutName);
    console.log("Selected Workout:", workoutName);
    window.location.href = "./workout-entry.html";
}

// Save Workout
function saveWorkout() {
    const user_id = localStorage.getItem("userId");
    const workout = localStorage.getItem("selectedWorkout");
    const sets = document.getElementById("sets").value;
    const reps = document.getElementById("reps").value;

    if (!sets || !reps || !workout) {
        alert("Please enter sets and repetitions.");
        return;
    }

    fetch(`${API_BASE}/add-workout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, exercise: workout, sets, reps })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log("Save Workout Response:", data);
        alert(data.message || data.error || "Failed to save workout");
        updateProgress(); // Refresh progress page
        window.location.href = "workouts.html";
    })
    .catch(error => {
        console.error("Error saving workout:", error);
        alert("Error saving workout: " + error.message);
    });
}

// Update Nutrition
function updateNutrition() {
    const user_id = localStorage.getItem("userId");

    fetch(`${API_BASE}/get-meals?user_id=${user_id}`)
    .then(response => response.json())
    .then(data => {
        console.log("Fetched Meal Data:", data);

        if (!Array.isArray(data)) {
            console.error("Invalid meal data format:", data);
            return;
        }

        const totalCalories = data.reduce((sum, meal) => sum + parseInt(meal.calories || 0, 10), 0);
        console.log("Total Calories Calculated:", totalCalories);

        const totalCaloriesElement = document.getElementById("total-calories");
        if (totalCaloriesElement) {
            totalCaloriesElement.textContent = totalCalories;
        } else {
            console.warn("Element #total-calories not found on this page.");
        }
    })
    .catch(error => console.error("Error fetching meals:", error));
}