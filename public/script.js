  document.addEventListener("DOMContentLoaded", () => {
    const texts = [
      "AI chatbot powered by an Ollama model for instant code generation. Built for students who want to master programming.",
      "Learn programming concepts with real explanations, not just copied snippets.",
      "Practice, experiment and build projects directly in your browser with Nexora.",
    ];

    const typewriterElement = document.getElementById("typewriter-text");
    if (!typewriterElement) return;

    // 🔹 rezerviraj visinu na temelju najduljeg teksta
    const longest = texts.reduce((a, b) => (a.length > b.length ? a : b), "");
    const tmp = document.createElement("p");
    tmp.style.position = "absolute";
    tmp.style.visibility = "hidden";
    tmp.style.pointerEvents = "none";
    tmp.style.whiteSpace = "normal";
    tmp.style.maxWidth = getComputedStyle(typewriterElement).maxWidth || "36rem";
    tmp.textContent = longest;
    document.body.appendChild(tmp);

    const h = tmp.offsetHeight;
    typewriterElement.style.minHeight = h + "px";

    document.body.removeChild(tmp);

    // cursor + typewriter logika ide iza ovoga...
    const cursor = document.createElement("span");
    cursor.id = "cursor";
    cursor.textContent = "▋";
    typewriterElement.after(cursor);

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeLoop() {
      const current = texts[textIndex];

      if (!isDeleting) {
        typewriterElement.textContent = current.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
          setTimeout(() => (isDeleting = true), 1900);
        }
      } else {
        typewriterElement.textContent = current.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          textIndex = (textIndex + 1) % texts.length;
        }
      }

      typewriterElement.appendChild(cursor);
      const speed = isDeleting ? 40 : 55;
      setTimeout(typeLoop, speed);
    }

    typeLoop();

  // Scroll reveal za .reveal elemente
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    revealEls.forEach(el => observer.observe(el));
  }
});
