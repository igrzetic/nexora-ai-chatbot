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

// Typewriter efekt za prvi paragraf
document.addEventListener("DOMContentLoaded", () => {
  const typewriterText =
    "AI chatbot powered by Ollama model for instant code generation. Built for students who want to master programming.";
  const typewriterElement = document.getElementById("typewriter-text");
  const rotatingElement = document.getElementById("rotating-text");
  let i = 0;

  const rotatingTexts = [
    "Learn programming concepts with instant examples and explanations.",
    "Practice your coding skills and build projects directly in your browser.",
  ];
  let currentIndex = 0;

  function typeWriter() {
    if (i < typewriterText.length) {
      typewriterElement.innerHTML += typewriterText.charAt(i);
      i++;
      setTimeout(typeWriter, 50);
    } else {
      rotateTexts();
    }
  }

  function rotateTexts() {
    rotatingElement.innerHTML = rotatingTexts[currentIndex];
    rotatingElement.classList.add("opacity-1");
    rotatingElement.classList.remove("opacity-0");

    setTimeout(() => {
      rotatingElement.classList.add("opacity-0");
      rotatingElement.classList.remove("opacity-1");

      currentIndex = (currentIndex + 1) % rotatingTexts.length;
      setTimeout(rotateTexts, 1000);
    }, 4000);
  }

  typeWriter();
});
