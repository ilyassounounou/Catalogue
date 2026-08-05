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

/* Hauteur fixe des images/vignettes, identique pour toutes les cartes */
const CARD_IMAGE_HEIGHT = 240; // px — change cette valeur si besoin

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

/* Média utilisé DANS la carte (vignette de taille fixe) */
function mediaContent(product) {
  if (product.image && product.image.trim() !== "") {
    return `<img src="${product.image}" alt="${product.name}" loading="lazy" class="w-100 h-100 object-fit-cover">`;
  }
  return `
    <div class="w-100 h-100 d-flex align-items-center justify-content-center position-relative bg-secondary-subtle">
      <span class="monogram display-4">${product.name.charAt(0)}</span>${SWIRL_SVG}
    </div>`;
}

/* Média utilisé dans la MODALE (peut être plus grand, pas de contrainte de hauteur) */
function modalMediaContent(product) {
  if (product.image && product.image.trim() !== "") {
    return `<img src="${product.image}" alt="${product.name}" class="w-100 h-100 object-fit-cover">`;
  }
  return `
    <div class="w-100 h-100 d-flex align-items-center justify-content-center position-relative bg-secondary-subtle">
      <span class="monogram display-1">${product.name.charAt(0)}</span>${SWIRL_SVG}
    </div>`;
}

/* Carte Bootstrap : col-12 (mobile) / col-sm-6 (tablette) / col-lg-4 (desktop)
   => 3 cartes par ligne sur grand écran, responsive.
   h-100 sur .card => toutes les cartes d'une même ligne ont la même hauteur. */
function cardTemplate(product) {
  return `
    <div class="col-12 col-sm-6 col-lg-4">
      <article class="card h-100" data-id="${product.id}" data-category="${product.category}" tabindex="0">
        <div class="overflow-hidden" style="height:${CARD_IMAGE_HEIGHT}px;">
          ${mediaContent(product)}
        </div>
        <div class="card-body d-flex flex-column">
          <span class="card-cat badge text-bg-secondary align-self-start mb-2">${product.category}</span>
          <h3 class="card-name h5">${product.name}</h3>
          <p class="card-desc flex-grow-1">${product.description}</p>
          <div class="card-footer bg-transparent border-0 px-0 pb-0 d-flex justify-content-between align-items-center">
            <span class="card-price fw-bold">${product.price} <sup>MAD</sup></span>
          </div>
        </div>
      </article>
    </div>
  `;
}

/* ---------- modal ---------- */
function openModal(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  document.querySelector(".modal").dataset.category = product.category;
  els.modalMedia.innerHTML = modalMediaContent(product);
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