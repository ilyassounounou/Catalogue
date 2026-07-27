/* ==========================================================
   L'AMI DORÉ — Admin logic
   Reads & writes data/products.json (and images/) directly on
   GitHub via the Contents API, using a personal access token
   typed in by the user. Nothing is stored except in this
   browser tab's sessionStorage (cleared when the tab closes).
   ========================================================== */

const GH_API = "https://api.github.com";

const admin = {
  owner: "",
  repo: "",
  branch: "main",
  token: "",
  products: [],
  sha: null,          // sha of data/products.json, needed to update it
  editingId: null,
};

const el = (id) => document.getElementById(id);
const els = {
  connectScreen: el("connectScreen"),
  dashboard: el("dashboard"),
  connectError: el("connectError"),
  connectBtn: el("connectBtn"),
  disconnectBtn: el("disconnectBtn"),
  syncStatus: el("syncStatus"),

  form: el("productForm"),
  fId: el("fId"),
  fName: el("fName"),
  fPrice: el("fPrice"),
  fCategory: el("fCategory"),
  fDescription: el("fDescription"),
  fImage: el("fImage"),
  imagePreview: el("imagePreview"),
  categoryList: el("categoryList"),
  formTitle: el("formTitle"),
  submitBtn: el("submitBtn"),
  cancelEditBtn: el("cancelEditBtn"),
  formNote: el("formNote"),

  productCount: el("productCount"),
  productTableBody: el("productTableBody"),
  adminSearch: el("adminSearch"),

  confirmOverlay: el("confirmOverlay"),
  confirmText: el("confirmText"),
  confirmDeleteBtn: el("confirmDeleteBtn"),
  cancelDeleteBtn: el("cancelDeleteBtn"),
};

/* ---------------------------------------------------------
   base64 helpers (unicode-safe, needed for French accents)
   --------------------------------------------------------- */
function b64Encode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    (_, p1) => String.fromCharCode("0x" + p1)));
}
function b64Decode(str) {
  return decodeURIComponent(atob(str).split("").map(c =>
    "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
}

/* ---------------------------------------------------------
   GitHub API wrapper
   --------------------------------------------------------- */
async function ghFetch(path, options = {}) {
  const res = await fetch(`${GH_API}/repos/${admin.owner}/${admin.repo}/${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${admin.token}`,
      "Accept": "application/vnd.github+json",
      ...(options.headers || {}),
    },
  });
  return res;
}

/* ---------------------------------------------------------
   connect
   --------------------------------------------------------- */
els.connectBtn.addEventListener("click", async () => {
  admin.owner = el("fOwner").value.trim();
  admin.repo = el("fRepo").value.trim();
  admin.branch = el("fBranch").value.trim() || "main";
  admin.token = el("fToken").value.trim();

  els.connectError.textContent = "";

  if (!admin.owner || !admin.repo || !admin.token) {
    els.connectError.textContent = "Merci de remplir tous les champs.";
    return;
  }

  els.connectBtn.textContent = "Connexion…";
  els.connectBtn.disabled = true;

  try {
    const res = await ghFetch(`contents/data/products.json?ref=${admin.branch}`);
    if (res.status === 401) throw new Error("Jeton invalide ou expiré.");
    if (res.status === 404) throw new Error("data/products.json introuvable — vérifiez le nom du dépôt et la branche.");
    if (!res.ok) throw new Error(`Erreur GitHub (${res.status}).`);

    const data = await res.json();
    admin.sha = data.sha;
    admin.products = JSON.parse(b64Decode(data.content));

    sessionStorage.setItem("adoreAdmin", JSON.stringify({
      owner: admin.owner, repo: admin.repo, branch: admin.branch, token: admin.token
    }));

    showDashboard();
  } catch (err) {
    els.connectError.textContent = err.message || "Connexion impossible.";
  } finally {
    els.connectBtn.textContent = "Se connecter";
    els.connectBtn.disabled = false;
  }
});

els.disconnectBtn.addEventListener("click", () => {
  sessionStorage.removeItem("adoreAdmin");
  location.reload();
});

/* try auto-reconnect from this tab's session */
(function tryAutoConnect() {
  const saved = sessionStorage.getItem("adoreAdmin");
  if (!saved) return;
  const s = JSON.parse(saved);
  el("fOwner").value = s.owner;
  el("fRepo").value = s.repo;
  el("fBranch").value = s.branch;
  el("fToken").value = s.token;
  els.connectBtn.click();
})();

/* ---------------------------------------------------------
   dashboard
   --------------------------------------------------------- */
function showDashboard() {
  els.connectScreen.hidden = true;
  els.dashboard.hidden = false;
  renderCategoryList();
  renderTable();
}

function setStatus(msg, type = "") {
  els.syncStatus.textContent = msg;
  els.syncStatus.className = "sync-status " + type;
}

function renderCategoryList() {
  const cats = [...new Set(admin.products.map(p => p.category))];
  els.categoryList.innerHTML = cats.map(c => `<option value="${c}">`).join("");
}

function renderTable() {
  const q = els.adminSearch.value.trim().toLowerCase();
  const list = admin.products.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));

  els.productCount.textContent = admin.products.length;

  if (list.length === 0) {
    els.productTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:24px;">Aucun produit</td></tr>`;
    return;
  }

  els.productTableBody.innerHTML = list.map(p => `
    <tr>
      <td>${
        p.image
          ? `<img class="row-thumb" src="${p.image}" alt="">`
          : `<span class="row-thumb-fallback">${p.name.charAt(0)}</span>`
      }</td>
      <td class="row-name">${p.name}</td>
      <td class="row-cat">${p.category}</td>
      <td class="row-price">${p.price} MAD</td>
      <td class="row-actions">
        <button class="btn-small" data-edit="${p.id}">Modifier</button>
        <button class="btn-small danger" data-delete="${p.id}">Supprimer</button>
      </td>
    </tr>
  `).join("");

  els.productTableBody.querySelectorAll("[data-edit]").forEach(btn =>
    btn.addEventListener("click", () => startEdit(btn.dataset.edit)));
  els.productTableBody.querySelectorAll("[data-delete]").forEach(btn =>
    btn.addEventListener("click", () => confirmDelete(btn.dataset.delete)));
}

els.adminSearch.addEventListener("input", renderTable);

/* ---------------------------------------------------------
   form: add / edit
   --------------------------------------------------------- */
let pendingImageFile = null;

els.fImage.addEventListener("change", () => {
  pendingImageFile = els.fImage.files[0] || null;
  if (pendingImageFile) {
    els.imagePreview.innerHTML = `<img src="${URL.createObjectURL(pendingImageFile)}" alt="">`;
  }
});

function startEdit(id) {
  const p = admin.products.find(p => p.id === id);
  if (!p) return;
  admin.editingId = id;
  pendingImageFile = null;

  els.fId.value = p.id;
  els.fName.value = p.name;
  els.fPrice.value = p.price;
  els.fCategory.value = p.category;
  els.fDescription.value = p.description || "";
  els.fImage.value = "";
  els.imagePreview.innerHTML = p.image
    ? `<img src="${p.image}" alt="">`
    : `<span>Aucune photo — badge doré automatique</span>`;

  els.formTitle.textContent = "Modifier le produit";
  els.submitBtn.textContent = "Enregistrer les modifications";
  els.cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

els.cancelEditBtn.addEventListener("click", resetForm);

function resetForm() {
  admin.editingId = null;
  pendingImageFile = null;
  els.form.reset();
  els.fId.value = "";
  els.imagePreview.innerHTML = "";
  els.formTitle.textContent = "Ajouter un produit";
  els.submitBtn.textContent = "Ajouter au catalogue";
  els.cancelEditBtn.hidden = true;
}

function slugify(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function nextId() {
  const nums = admin.products
    .map(p => parseInt((p.id.match(/\d+/) || [0])[0], 10))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return "p" + String(max + 1).padStart(2, "0");
}

async function uploadImage(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `images/${slugify(file.name.replace(/\.[^.]+$/, ""))}-${Date.now()}.${ext}`;

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await ghFetch(`contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Ajout image ${path}`,
      content: base64,
      branch: admin.branch,
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || "Échec de l'envoi de l'image.");
  }
  return path;
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.formNote.textContent = "";
  els.formNote.className = "form-note";
  els.submitBtn.disabled = true;

  try {
    let imagePath = admin.editingId
      ? (admin.products.find(p => p.id === admin.editingId)?.image || "")
      : "";

    if (pendingImageFile) {
      setStatus("Envoi de l'image…");
      imagePath = await uploadImage(pendingImageFile);
    }

    const productData = {
      id: admin.editingId || nextId(),
      name: els.fName.value.trim(),
      category: els.fCategory.value.trim(),
      price: parseFloat(els.fPrice.value),
      description: els.fDescription.value.trim(),
      image: imagePath,
    };

    if (admin.editingId) {
      const idx = admin.products.findIndex(p => p.id === admin.editingId);
      admin.products[idx] = productData;
    } else {
      admin.products.push(productData);
    }

    setStatus("Enregistrement…");
    await saveProducts(admin.editingId ? `Modifie ${productData.name}` : `Ajoute ${productData.name}`);

    els.formNote.textContent = "✓ Enregistré. Le site sera à jour dans une minute.";
    els.formNote.className = "form-note ok";
    resetForm();
    renderCategoryList();
    renderTable();
  } catch (err) {
    els.formNote.textContent = err.message || "Une erreur est survenue.";
    els.formNote.className = "form-note error";
    setStatus("Échec de la synchronisation", "error");
  } finally {
    els.submitBtn.disabled = false;
  }
});

/* ---------------------------------------------------------
   delete
   --------------------------------------------------------- */
let idPendingDelete = null;

function confirmDelete(id) {
  const p = admin.products.find(p => p.id === id);
  if (!p) return;
  idPendingDelete = id;
  els.confirmText.textContent = `Supprimer « ${p.name} » du catalogue ?`;
  els.confirmOverlay.hidden = false;
}

els.cancelDeleteBtn.addEventListener("click", () => {
  idPendingDelete = null;
  els.confirmOverlay.hidden = true;
});

els.confirmDeleteBtn.addEventListener("click", async () => {
  if (!idPendingDelete) return;
  const p = admin.products.find(p => p.id === idPendingDelete);
  els.confirmDeleteBtn.disabled = true;
  try {
    setStatus("Suppression…");
    admin.products = admin.products.filter(p => p.id !== idPendingDelete);
    await saveProducts(`Supprime ${p ? p.name : idPendingDelete}`);
    els.confirmOverlay.hidden = true;
    renderCategoryList();
    renderTable();
  } catch (err) {
    els.confirmText.textContent = "Erreur : " + (err.message || "échec de la suppression.");
    setStatus("Échec de la synchronisation", "error");
  } finally {
    els.confirmDeleteBtn.disabled = false;
    idPendingDelete = null;
  }
});

/* ---------------------------------------------------------
   save products.json back to GitHub
   --------------------------------------------------------- */
async function saveProducts(message) {
  const res = await ghFetch(`contents/data/products.json`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: b64Encode(JSON.stringify(admin.products, null, 2)),
      sha: admin.sha,
      branch: admin.branch,
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || "Échec de l'enregistrement sur GitHub.");
  }
  const data = await res.json();
  admin.sha = data.content.sha;
  setStatus("✓ Synchronisé avec GitHub", "ok");
}
