import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Postavljanje putanje do tvoje 'dist' mape
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../user_login_code")));

// 🔹 Kad otvoriš http://localhost:3001, posluži index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../user_login_code/index.html"));
});

// 🔌 Povezivanje na bazu (koristiš Veleri server)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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

  const sql =
    "INSERT INTO chatbot_users (username, password, email) VALUES (?, ?, ?)";
  db.query(sql, [username, password, email], (err, results) => {
    if (err) {
      console.error("❌ Database error:", err.message);
      res.status(500).send("❌ Registration failed");
    } else {
      console.log("✅ New user registered:", { username, password, email });
      res.send(`✅ User ${username} registered successfully!`);
    }
  });
});

// Login korisnika
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM chatbot_users WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Database error:", err.message);
      return res.status(500).send("❌ Login failed");
    }

    if (results.length > 0) {
      console.log(
        "✅ Successful login: username = %s, password = %s",
        username,
        password
      );
      res.send(`✅ Welcome back, ${username}!`);
    } else {
      console.log("⚠️ Failed login attempt:", username);
      res.status(401).send("❌ Invalid username or password");
    }

    res.send("✅ Login successful!");
  });
});

// 🚀 Pokretanje servera
app.listen(3001, () =>
  console.log("🌐 Server running on http://localhost:3001")
);
