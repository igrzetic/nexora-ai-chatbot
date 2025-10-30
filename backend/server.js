import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Povezivanje na bazu (koristiš Veleri server)
const db = mysql.createConnection({
  host: "student.veleri.hr",
  user: "igrzetic",
  password: "11",
  database: "chatbot_users",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to database!");
  }
});

// Registracija korisnika
app.post("/register", (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).send("All fields are required");
  }

  const sql = `
    INSERT INTO chatbot_users (username, password, email)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [username, password, email], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error inserting user");
    }
    res.send("✅ User registered successfully");
  });
});

// Login korisnika
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT * FROM chatbot_users WHERE username = ? AND password = ?
  `;
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.status(401).send("Invalid credentials");
    res.send("✅ Login successful!");
  });
});

// 🚀 Pokretanje servera
app.listen(3001, () => console.log("🌐 Server running on http://localhost:3001"));