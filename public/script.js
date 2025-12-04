// const themeToggle = document.getElementById("theme-toggle");
// const body = document.body;

// if (localStorage.getItem("theme") === "light") {
//   body.classList.add("light");
// }

// themeToggle.addEventListener("click", () => {
//   body.classList.toggle("light");

//   if (body.classList.contains("light")) {
//     localStorage.setItem("theme", "light");
//   } else {
//     localStorage.setItem("theme", "dark");
//   }
// });

// Typewriter rotacija tekstova
document.addEventListener("DOMContentLoaded", () => {
  const texts = [
    "AI chatbot powered by Ollama model for instant code generation. Built for students who want to master programming.",
    "Learn programming concepts with instant examples and explanations.",
    "Practice your coding skills and build projects directly in your browser."
  ];

  const typewriterElement = document.getElementById("typewriter-text");

  // Blinking cursor
  const cursor = document.createElement("span");
  cursor.id = "cursor";
  cursor.textContent = "|";
  cursor.style.display = "inline-block";
  cursor.style.marginLeft = "4px";
  cursor.style.animation = "blink 0.8s infinite";
  typewriterElement.after(cursor);

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeLoop() {
    const current = texts[textIndex];

    // Typing forward
    if (!isDeleting) {
      typewriterElement.innerHTML = current.substring(0, charIndex + 1);
      typewriterElement.appendChild(cursor);
      charIndex++;

      // Kada završi tekst → čekaj 2 sekunde
      if (charIndex === current.length) {
        setTimeout(() => (isDeleting = true), 2000);
      }
    }
    // Deleting backward
    else {
      typewriterElement.innerHTML = current.substring(0, charIndex - 1);
      typewriterElement.appendChild(cursor);
      charIndex--;

      // Kada obriše cijeli tekst → ide na sljedeći
      if (charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length; // next text
      }
    }

    const speed = isDeleting ? 40 : 55;
    setTimeout(typeLoop, speed);
  }

  typeLoop();
});