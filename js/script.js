/* ==========================================================
   L'AMI DORÉ — Catalogue logic
   Edit data/products.json to add / remove / change products.
   ========================================================== */

let products = [];
let currentCategory = "Tous";
let currentSearch = "";
let currentSort = "default";
let filteredProducts = [];

const CARD_IMAGE_HEIGHT = 240; // px — hauteur fixe des vignettes (mêmes pour toutes les cartes)

// ---------- DOM refs ----------
const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const chipsContainer = document.getElementById("categoryChips");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");

const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalMedia = document.getElementById("modalMedia");
const modalCategory = document.getElementById("modalCategory");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");

// ---------- Chargement des données ----------
async function loadProducts() {
  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error("Impossible de charger data/products.json");
    products = await response.json();
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<p class="empty-state">Impossible de charger le catalogue. Vérifiez que le fichier <code>data/products.json</code> existe, et lancez un serveur local (ex: <code>python3 -m http.server</code>) plutôt que d'ouvrir le fichier directement.</p>`;
    return;
  }
  renderChips();
  filterAndSort();
}

// ---------- Chips catégories ----------
function getCategories() {
  const cats = products.map(p => p.category);
  return ["Tous", ...new Set(cats)];
}

function renderChips() {
  const categories = getCategories();
  chipsContainer.innerHTML = categories.map(cat => `
    <button class="chip ${cat === currentCategory ? "is-active" : ""}" data-category="${cat}">${cat}</button>
  `).join("");
}

// ---------- Filtrage + tri ----------
function filterAndSort() {
  const searchLower = currentSearch.trim().toLowerCase();

  let result = products.filter(p => {
    const matchCategory = currentCategory === "Tous" || p.category === currentCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower)) ||
      p.category.toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  });

  if (currentSort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (currentSort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (currentSort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name, "fr"));

  filteredProducts = result;
  renderGrid();
}

// ---------- Affichage grille ----------
function renderGrid() {
  if (filteredProducts.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    resultCount.textContent = "0 produit";
    return;
  }

  emptyState.hidden = true;
  resultCount.textContent = `${filteredProducts.length} produit${filteredProducts.length > 1 ? "s" : ""}`;

  // col-12 / col-sm-6 / col-lg-4 => 1 carte mobile, 2 tablette, 3 desktop
  // h-100 => toutes les cartes d'une ligne ont la même hauteur
  // image en hauteur fixe + object-fit-cover => toutes les images ont la même taille
  grid.innerHTML = filteredProducts.map(p => `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="card h-100" data-id="${p.id}" style="cursor:pointer;">
        <img
          src="${p.image}"
          class="card-img-top object-fit-cover"
          style="height:${CARD_IMAGE_HEIGHT}px"
          alt="${p.name}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=Image+non+disponible';">
        <div class="card-body d-flex flex-column">
          <span class="card-cat badge text-bg-secondary align-self-start mb-2">${p.category}</span>
          <h3 class="card-title h5">${p.name}</h3>
          <p class="card-text flex-grow-1">${p.description || "Description non disponible"}</p>
          <p class="fw-bold mb-0">${p.price} MAD</p>
        </div>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("#productGrid .card").forEach(card => {
    card.addEventListener("click", function () {
      const id = this.dataset.id;
      const product = products.find(p => String(p.id) === String(id));
      if (product) openModal(product);
    });
  });
}

// ---------- Modal ----------
function openModal(product) {
  modalMedia.innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=Image+non+disponible';">`;
  modalCategory.textContent = product.category;
  modalTitle.textContent = product.name;
  modalDesc.textContent = product.description || "Description non disponible";
  modalPrice.textContent = `${product.price} MAD`;
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

// ---------- Événements ----------
chipsContainer.addEventListener("click", function (e) {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  currentCategory = chip.dataset.category;
  filterAndSort();
});

let searchTimeout;
searchInput.addEventListener("input", function () {
  clearTimeout(searchTimeout);
  const value = this.value;
  searchTimeout = setTimeout(() => {
    currentSearch = value;
    filterAndSort();
  }, 120);
});

sortSelect.addEventListener("change", function () {
  currentSort = this.value;
  filterAndSort();
});

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", function (e) {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeModal();
});

// ---------- Init ----------
loadProducts();