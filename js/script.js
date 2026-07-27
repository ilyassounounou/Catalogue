/* ==========================================================
   L'AMI DORÉ — Catalogue logic
   Edit data/products.json to add / remove / change products.
   ========================================================== */

const state = {
  products: [],
  activeCategory: "Tous",
  searchTerm: "",
  sortBy: "default"
};

const els = {
  grid: document.getElementById("productGrid"),
  chips: document.getElementById("categoryChips"),
  search: document.getElementById("searchInput"),
  sort: document.getElementById("sortSelect"),
  resultCount: document.getElementById("resultCount"),
  emptyState: document.getElementById("emptyState"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalClose: document.getElementById("modalClose"),
  modalMedia: document.getElementById("modalMedia"),
  modalCategory: document.getElementById("modalCategory"),
  modalTitle: document.getElementById("modalTitle"),
  modalDesc: document.getElementById("modalDesc"),
  modalPrice: document.getElementById("modalPrice"),
};

/* ---------- small swirl icon reused on every card ---------- */
const SWIRL_SVG = `
<svg class="card-swirl" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M4 30 C 12 14, 22 14, 28 30 S 44 46, 52 30" fill="none"
        stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>
</svg>`;

/* ---------- load data ---------- */
async function loadProducts() {
  try {
    const res = await fetch("data/products.json");
    if (!res.ok) throw new Error("network response not ok");
    state.products = await res.json();
  } catch (err) {
    els.grid.innerHTML = `<p class="empty-state">Impossible de charger le catalogue. Si vous testez en local, lancez un petit serveur (ex: <code>python3 -m http.server</code>) plutôt que d'ouvrir le fichier directement.</p>`;
    console.error(err);
    return;
  }
  buildCategoryChips();
  render();
}

/* ---------- category chips (built dynamically from data) ---------- */
function buildCategoryChips() {
  const categories = ["Tous", ...new Set(state.products.map(p => p.category))];
  els.chips.innerHTML = categories.map(cat => `
    <button class="chip ${cat === "Tous" ? "is-active" : ""}" data-category="${cat}">${cat}</button>
  `).join("");

  els.chips.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeCategory = btn.dataset.category;
      els.chips.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      render();
    });
  });
}

/* ---------- filtering + sorting ---------- */
function getVisibleProducts() {
  let list = [...state.products];

  if (state.activeCategory !== "Tous") {
    list = list.filter(p => p.category === state.activeCategory);
  }

  if (state.searchTerm.trim() !== "") {
    const q = state.searchTerm.trim().toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  switch (state.sortBy) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      break;
  }

  return list;
}

/* ---------- render grid ---------- */
function render() {
  const list = getVisibleProducts();

  els.resultCount.textContent =
    list.length + (list.length > 1 ? " gourmandises" : " gourmandise");

  els.emptyState.hidden = list.length !== 0;
  els.grid.hidden = list.length === 0;

  els.grid.innerHTML = list.map(cardTemplate).join("");

  els.grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });
}

function mediaContent(product) {
  if (product.image && product.image.trim() !== "") {
    return `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
  }
  return `<span class="monogram">${product.name.charAt(0)}</span>${SWIRL_SVG}`;
}

function cardTemplate(product) {
  return `
    <article class="card" data-id="${product.id}" data-category="${product.category}" tabindex="0">
      <div class="card-media">${mediaContent(product)}</div>
      <div class="card-body">
        <span class="card-cat">${product.category}</span>
        <h3 class="card-name">${product.name}</h3>
        <p class="card-desc">${product.description}</p>
        <div class="card-footer">
          <span class="card-price">${product.price} <sup>MAD</sup></span>
        </div>
      </div>
    </article>
  `;
}

/* ---------- modal ---------- */
function openModal(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  document.querySelector(".modal").dataset.category = product.category;
  els.modalMedia.innerHTML = mediaContent(product);
  els.modalCategory.textContent = product.category;
  els.modalTitle.textContent = product.name;
  els.modalDesc.textContent = product.description;
  els.modalPrice.textContent = `${product.price} MAD`;

  els.modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  els.modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

els.modalClose.addEventListener("click", closeModal);
els.modalOverlay.addEventListener("click", (e) => {
  if (e.target === els.modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ---------- search & sort listeners ---------- */
let searchTimeout;
els.search.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchTerm = e.target.value;
    render();
  }, 120);
});

els.sort.addEventListener("change", (e) => {
  state.sortBy = e.target.value;
  render();
});

/* ---------- init ---------- */
loadProducts();
