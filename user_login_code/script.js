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

// Obrada prijave
document
  .querySelector(".sign-up-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const response = await fetch("register_user.php", {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    alert(text);
  });
