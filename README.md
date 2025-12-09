# Nexora AI Chatbot

**Project Overview:**  
Nexora is an AI-powered chatbot designed to generate programming code in a terminal-like interface.
It is intended to help students learn programming by providing instant code examples and explanations.
The chatbot leverages the Ollama model for code generation

## Technologies Used

- **Node.js** – JavaScript runtime environment for the backend.
- **Express** – Web framework to handle HTTP requests and serve the chatbot API.
- **npm** – Package manager to install project dependencies.
- **MySQL2** – Node.js driver to connect to MySQL database.
- **bcrypt** – Library to hash and compare passwords securely.
- **dotenv** – Load environment variables from `.env` file.
- **cors** – Middleware to handle Cross-Origin Resource Sharing.
- **Ollama AI Model** – AI model used for code generation.
- **Render.com** – Hosting platform for the backend.
- **Netlify** – Hosting platform for the frontend.

---

## Installation (Local Development)

1. Make sure Node.js and npm are installed:
   ```bash
   node -v
   npm -v
   ```
2. Clone the repository:
   git clone https://github.com/igrzetic/nexora-ai-chatbot.git
   cd nexora-ai-chatbot/backend
3. Install backend dependencies::
   npm install
4. Create a .env file in the backend folder with your database credentials: - SKIP THIS STEP CURRENTLY - my own .env file is currently uploaded on guthub for testing purposes only, connected to my personal database!
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
5. Start the server:
   npm start
6. Open your browser and navigate to:
   http://localhost:3001

## Running the project (Live / Render Backend)

- The backend is hosted on Render.com:
  https://nexora-ai-chatbot-backend.onrender.com
- Frontend (Netlify) automatically uses the live backend URL if not running locally.
- If running frontend locally, you can configure script.js API_BASE to point to Render backend:
  const API_BASE = "https://nexora-ai-chatbot-backend.onrender.com";

## Usage

- Register a new user account.
- Log in with your credentials.
- Interact with the AI chatbot in the terminal-like interface or through the frontend.
- Ask for code snippets, programming explanations, or example exercises.

## Check it online

Project is uploaded using Netlify service available on this link: https://nexora-ai-chatbot.netlify.app/

## Authors:

Ivan Gržetić,
Armin Lišić
