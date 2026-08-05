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
// تحميل البيانات
// ============================================================
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) {
      throw new Error('فشل تحميل المنتجات');
    }
    products = await response.json();
    console.log('تم تحميل المنتجات:', products.length);
    renderChips();
    filterAndSort();
  } catch (error) {
    console.error('خطأ في تحميل المنتجات:', error);
    // بيانات افتراضية في حالة الخطأ
    products = [
      { id: "1", name: "مثال", category: "مثال", price: 10, description: "منتج افتراضي", image: "" }
    ];
    renderChips();
    filterAndSort();
  }
}

// ============================================================
// وظائف العرض
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
  let result = products.filter(p => {
    const matchCategory = currentCategory === "Tous" || p.category === currentCategory;
    const searchLower = currentSearch.trim().toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(searchLower) ||
                        (p.description && p.description.toLowerCase().includes(searchLower)) ||
                        p.category.toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  });

  // Trier
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

  grid.innerHTML = filteredProducts.map(p => `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="card h-100" data-id="${p.id}">
        <img src="${p.image}" class="card-img-top object-fit-cover" style="height:240px" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400?text=Image+non+disponible'">
        <div class="card-body d-flex flex-column">
          <h3 class="card-title">${p.name}</h3>
          <p class="card-text flex-grow-1">${p.description || 'Description non disponible'}</p>
          <p class="fw-bold mb-0">${p.price} MAD</p>
        </div>
      </div>
    </div>
  `).join("");

  // Attacher l'événement "click" sur chaque carte pour ouvrir le modal
  document.querySelectorAll("#productGrid .card").forEach(card => {
    card.addEventListener("click", function(e) {
      const id = this.dataset.id;
      const product = products.find(p => p.id === id);
      if (product) openModal(product);
    });
  });
}

// ============================================================
// وظائف المودال
// ============================================================
function openModal(product) {
  modalMedia.innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x400?text=Image+non+disponible'">`;
  modalCategory.textContent = product.category;
  modalTitle.textContent = product.name;
  modalDesc.textContent = product.description || 'Description non disponible';
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
// بدء التطبيق
// ============================================================
loadProducts();