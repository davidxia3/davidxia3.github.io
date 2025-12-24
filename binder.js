const pages = document.querySelectorAll(".page");
let currentPage = 0;

function updatePages() {
  pages.forEach((page, index) => {
    page.classList.toggle("active", index === currentPage);
  });
}

function nextPage() {
  if (currentPage < pages.length - 1) {
    currentPage++;
    updatePages();
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    updatePages();
  }
}
