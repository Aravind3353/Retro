const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    // 🛠 This is the fix
    rejectUnauthorized: false
  }
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to Railway MySQL database.');
});

module.exports = connection;

// Register User & Initialize Progress
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, password], 
        (err, result) => {
            if (err) {
                console.error("Error registering user:", err);
                return res.status(500).json({ error: err.message });
            }
            const user_id = result.insertId;
            db.query("INSERT INTO progress (user_id, total_calories_burnt) VALUES (?, 0)", [user_id], 
                (err) => {
                    if (err) {
                        console.error("Error initializing progress:", err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "User Registered & Progress Initialized!" });
                });
        });
});

// Login User
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT id FROM users WHERE email = ? AND password = ?", [email, password], 
        (err, results) => {
            if (err) {
                console.error("Error logging in:", err);
                return res.status(500).json({ error: err.message });
            }
            if (results.length > 0) {
                res.json({ userId: results[0].id });
            } else {
                res.status(401).json({ error: "Invalid email or password." });
            }
        });
});

// Log Workout (Enhanced error handling)
app.post("/add-workout", (req, res) => {
    const { user_id, exercise, sets, reps } = req.body;
    if (!user_id || !exercise || !sets || !reps) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const caloriesBurnt = sets * reps * 0.5; // Backend calculation

    db.query("INSERT INTO workouts (user_id, exercise, sets, reps, calories_burnt) VALUES (?, ?, ?, ?, ?)", 
        [user_id, exercise, sets, reps, caloriesBurnt], 
        (err) => {
            if (err) {
                console.error("Error inserting workout:", err);
                return res.status(500).json({ error: err.message });
            }

            // Update progress table
            db.query("UPDATE progress SET total_calories_burnt = total_calories_burnt + ? WHERE user_id = ?", 
                [caloriesBurnt, user_id], 
                (err) => {
                    if (err) {
                        console.error("Error updating progress:", err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "Workout Logged and Progress Updated!" });
                });
        });
});

// Log Meal
app.post("/add-meal", (req, res) => {
    const { user_id, meal_type, meal_name, calories } = req.body;
    db.query("INSERT INTO meals (user_id, meal_type, meal_name, calories) VALUES (?, ?, ?, ?)", 
        [user_id, meal_type, meal_name, calories], 
        (err) => {
            if (err) {
                console.error("Error logging meal:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Meal Logged!" });
        });
});

// Fetch Meals
app.get("/get-meals", (req, res) => {
    const user_id = req.query.user_id;
    db.query("SELECT meal_type, meal_name, calories FROM meals WHERE user_id = ?", [user_id], 
        (err, results) => {
            if (err) {
                console.error("Error fetching meals:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
});

// Fetch User Progress
app.get("/get-progress", (req, res) => {
    const user_id = req.query.user_id;

    // First, fetch total calories burnt from progress table
    db.query("SELECT total_calories_burnt FROM progress WHERE user_id = ?", [user_id], 
        (err, progressResult) => {
            if (err) return res.status(500).json({ error: err.message });

            const totalCalories = progressResult.length > 0 ? progressResult[0].total_calories_burnt : 0;

            // Then, fetch workout history from workouts table
            db.query("SELECT exercise, sets, reps, (sets * reps * 5) AS calories_burnt FROM workouts WHERE user_id = ?", 
                [user_id], 
                (err, historyResult) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.json({
                        totalCalories: totalCalories,
                        history: historyResult || []
                    });
                });
        });
});


// Update Progress
app.post("/update-progress", (req, res) => {
    const { user_id, calories_burnt } = req.body;
    if (!user_id || !calories_burnt) {
        return res.status(400).json({ error: "Missing user_id or calories_burnt" });
    }
    db.query("SELECT total_calories_burnt FROM progress WHERE user_id = ?", [user_id], 
        (err, result) => {
            if (err) {
                console.error("Error checking progress:", err);
                return res.status(500).json({ error: err.message });
            }
            if (result.length > 0) {
                db.query("UPDATE progress SET total_calories_burnt = total_calories_burnt + ? WHERE user_id = ?", 
                    [calories_burnt, user_id], 
                    (err) => {
                        if (err) {
                            console.error("Error updating progress:", err);
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ message: "Calories updated successfully!" });
                    });
            } else {
                db.query("INSERT INTO progress (user_id, total_calories_burnt) VALUES (?, ?)", [user_id, calories_burnt], 
                    (err) => {
                        if (err) {
                            console.error("Error inserting progress:", err);
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ message: "Progress recorded successfully!" });
                    });
            }
        });
});

// Fetch Workouts
app.get("/get-workouts", (req, res) => {
    const user_id = req.query.user_id;
    db.query("SELECT exercise, sets, reps, calories_burnt FROM workouts WHERE user_id = ?", [user_id], 
        (err, results) => {
            if (err) {
                console.error("Error fetching workouts:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
});

// Start Server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});