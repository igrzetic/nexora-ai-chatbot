const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

if (localStorage.getItem("theme") === "light") {
  body.classList.add("light");
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light");

  if (body.classList.contains("light")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});

const logoImgs = document.querySelectorAll("#ollama-logo");

function updateLogo() {
  const src = document.body.classList.contains("light")
    ? "./images/ollama-light-mode-logo.png"
    : "./images/ollama-dark-mode-logo.png";
  logoImgs.forEach((img) => (img.src = src));
}

// Postavi ispravnu sliku odmah po učitavanju
updateLogo();

// Ažuriraj logo kad se promijeni tema
themeToggle.addEventListener("click", () => {
  setTimeout(updateLogo, 100);
});

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://nexora-backend.onrender.com"; // kad deployaš backend

// Obrada prijave
document
  .querySelector(".sign-up-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    console.log("📤 Sending register data:", {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const response = await fetch("http://localhost:3001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
        email: formData.get("email"),
      }),
    });

    const text = await response.text();
    alert(text);
  });

// Obrada prijave
document
  .querySelector(".sign-in-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    console.log("📤 Sending login data:", {
      username: formData.get("username"),
      password: formData.get("password"),
    });

    const response = await fetch("http://localhost:3001/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    const text = await response.text();
    alert(text);
  });
