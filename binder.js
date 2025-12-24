const spreads = document.querySelectorAll(".spread");
let current = 0;

function update() {
  spreads.forEach((spread, i) => {
    spread.classList.toggle("active", i === current);
  });
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


document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});
