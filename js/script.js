// ============================================================
// تحميل المنتجات من ملف JSON
// ============================================================
let products = [];
let currentCategory = "Tous";
let currentSearch = "";
let currentSort = "default";
let filteredProducts = [];

// ============================================================
// DOM REFS
// ============================================================
const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const chipsContainer = document.getElementById("categoryChips");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");

// Modal refs
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalMedia = document.getElementById("modalMedia");
const modalCategory = document.getElementById("modalCategory");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");

// ============================================================
// MODE SOMBRE / CLAIR
// ============================================================
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem("adoreTheme", theme); } catch (e) { /* stockage indisponible */ }
}

(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("adoreTheme"); } catch (e) { /* ignore */ }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

// ============================================================
// تحميل البيانات من JSON
// ============================================================
async function loadProducts() {
  try {
    const response = await fetch('data/products.json');
    if (!response.ok) {
      throw new Error('فشل تحميل المنتجات');
    }
    const raw = await response.json();

    // نظف كل منتج: أي حقل ناقص (category, price, description, name)
    // كيولّي قيمة افتراضية بدل ما يكسر الصفحة كاملة.
    products = raw.map(p => ({
      id: p.id ?? String(Math.random()),
      name: p.name || "Produit sans nom",
      category: p.category || "Autre",
      price: typeof p.price === "number" ? p.price : 0,
      description: p.description || "",
      image: p.image || ""
    }));

    console.log('✅ تم تحميل المنتجات من JSON:', products.length);
    renderChips();
    filterAndSort();
  } catch (error) {
    console.error('❌ خطأ في تحميل المنتجات:', error);
    // بيانات افتراضية في حالة الخطأ
    products = [
      { id: "1", name: "Produit exemple", category: "Exemple", price: 10, description: "Description", image: "" }
    ];
    renderChips();
    filterAndSort();
  }
}

// ============================================================
// الوظائف
// ============================================================
function getCategories() {
  const cats = products.map(p => p.category);
  return ["Tous", ...new Set(cats)];
}

function renderChips() {
  const categories = getCategories();
  chipsContainer.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === currentCategory ? " is-active" : "");
    btn.dataset.category = cat;
    btn.textContent = cat;
    chipsContainer.appendChild(btn);
  });
}

function filterAndSort() {
  const searchLower = currentSearch.trim().toLowerCase();

  let result = products.filter(p => {
    const matchCategory = currentCategory === "Tous" || p.category === currentCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  });

  if (currentSort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (currentSort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (currentSort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));

  filteredProducts = result;
  renderGrid();
}

function renderGrid() {
  if (filteredProducts.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    resultCount.textContent = "0 produits";
    return;
  }
  emptyState.hidden = true;
  resultCount.textContent = `${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''}`;

  // 2 cartes par ligne en mobile (col-6), 3 en tablette, 4 en desktop
  grid.innerHTML = filteredProducts.map(p => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card h-100" data-id="${p.id}">
        <div class="card-img-wrap">
          <img src="${p.image}" class="card-img-top object-fit-cover" style="height:180px;width:100%" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400?text=Image+non+disponible'">
        </div>
        <div class="card-body d-flex flex-column">
          <h3 class="card-title">${p.name}</h3>
          <p class="card-text flex-grow-1">${p.description || 'Description non disponible'}</p>
          <p class="fw-bold mb-0">${p.price} MAD</p>
        </div>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("#productGrid .card").forEach(card => {
    card.addEventListener("click", function(e) {
      const id = this.dataset.id;
      const product = products.find(p => String(p.id) === id);
      if (product) openModal(product);
    });
  });
}

// ============================================================
// المودال — صورة كاملة + وصف المنتج
// ============================================================
function openModal(product) {
  modalMedia.innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x400?text=Image+non+disponible'">`;
  modalCategory.textContent = product.category;
  modalTitle.textContent = product.name;
  modalDesc.textContent = product.description || 'Description non disponible pour le moment.';
  modalPrice.textContent = `${product.price} MAD`;
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

// ============================================================
// الأحداث
// ============================================================
chipsContainer.addEventListener("click", function(e) {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  currentCategory = chip.dataset.category;
  filterAndSort();
});

searchInput.addEventListener("input", function() {
  currentSearch = this.value;
  filterAndSort();
});

sortSelect.addEventListener("change", function() {
  currentSort = this.value;
  filterAndSort();
});

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", function(e) {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closeModal();
});

// ============================================================
// بدء التطبيق - تحميل البيانات من JSON
// ============================================================
loadProducts();
