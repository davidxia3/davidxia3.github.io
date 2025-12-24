const spreads = document.querySelectorAll(".spread");
const prevBtn = document.querySelector(".controls button:nth-child(1)");
const nextBtn = document.querySelector(".controls button:nth-child(2)");

let current = 0;

function update() {
  spreads.forEach((spread, i) => {
    spread.classList.toggle("active", i === current);
  });

  // Hide / disable buttons at bounds
  prevBtn.classList.toggle("hidden", current === 0);
  nextBtn.classList.toggle("hidden", current === spreads.length - 1);
}

function next() {
  if (current < spreads.length - 1) {
    current++;
    update();
  }
}

function prev() {
  if (current > 0) {
    current--;
    update();
  }
}

/* Keyboard navigation */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

/* Initialize correct button state */
update();
