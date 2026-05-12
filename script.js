const PRODUCTS = [
  {
    id: "p1",
    name: "Zavod çörəyi (Binə)",
    category: "qida",
    emoji: "🍞",
    image:
      ".zavod coreyi.png",
    price: 0.55,
    stock: 999,
    desc: "Təzə zavod çörəyi.",
  },
  {
    id: "p2",
    name: "Coca‑Cola 0.5L",
    category: "içki",
    emoji: "🥤",
    image:
      "https://static.vecteezy.com/system/resources/previews/037/751/381/non_2x/coca-cola-plastic-bottle-isolated-on-transparent-background-free-png.png",
    price: 1.0,
    stock: 999,
    desc: "0.5 litr qazlı içki.",
  },
  {
    id: "p3",
    name: "Fanta 0.5L",
    category: "içki",
    emoji: "🍊",
    image:
      "https://www.pngall.com/wp-content/uploads/15/Fanta-PNG-Image-HD.png",
    price: 1.0,
    stock: 999,
    desc: "0.5 litr qazlı içki.",
  },
  {
    id: "p4",
    name: "Sprite 0.5L",
    category: "içki",
    emoji: "🍋",
    image:
      "https://www.bbassets.com/media/uploads/p/xl/251006_13-sprite-soft-drink-lime-flavoured.jpg",
    price: 1.0,
    stock: 999,
    desc: "0.5 litr qazlı içki.",
  },
  {
    id: "p5",
    name: "Milla Ayran",
    category: "içki",
    emoji: "🥛",
    image:
      ".milla.png",
    price: 0.4,
    stock: 2,
    desc: "Sərin ayran.",
  },
  {
    id: "p6",
    name: "Milla Ayran",
    category: "içki",
    emoji: "🥛",
    image:
      "./sekiller/milla.png",
    price: 0.4,
    stock: 3,
    desc: "Sərin ayran.",
  },
];

const CART_KEY = "mehelle_market_cart_v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function money(n) {
  return new Intl.NumberFormat("az-AZ", { style: "currency", currency: "AZN" }).format(n);
}

function clampInt(n, min, max) {
  const x = Number.parseInt(String(n), 10);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartCount(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function cartSubtotal(cart) {
  let total = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) continue;
    total += p.price * qty;
  }
  return round2(total);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function toast(msg, opts = {}) {
  const el = $("#toast");
  const text = $("#toastText");
  const actionBtn = $("#toastAction");
  if (!el || !text || !actionBtn) return;
  text.textContent = msg;

  if (opts.actionText) {
    actionBtn.textContent = opts.actionText;
    actionBtn.hidden = false;
    toast._onAction = typeof opts.onAction === "function" ? opts.onAction : null;
  } else {
    actionBtn.hidden = true;
    toast._onAction = null;
  }

  el.hidden = false;
  el.animate(
    [
      { opacity: 0, transform: "translateX(-50%) translateY(10px)" },
      { opacity: 1, transform: "translateX(-50%) translateY(0px)" },
    ],
    { duration: 160, fill: "forwards", easing: "ease-out" }
  );
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" });
    window.setTimeout(() => {
      el.hidden = true;
    }, 200);
  }, 1400);
}

function stateFromUI() {
  const q = $("#searchInput")?.value?.trim() ?? "";
  const sort = $("#sortSelect")?.value ?? "featured";
  return { q, sort };
}

function filterProducts(products, { q }) {
  const qq = q.toLowerCase();
  return products.filter((p) => {
    const matchesQ =
      !qq ||
      p.name.toLowerCase().includes(qq) ||
      p.desc.toLowerCase().includes(qq) ||
      p.category.toLowerCase().includes(qq);
    return matchesQ;
  });
}

function sortProducts(products, sort) {
  const arr = [...products];
  switch (sort) {
    case "price_asc":
      arr.sort((a, b) => a.price - b.price);
      return arr;
    case "price_desc":
      arr.sort((a, b) => b.price - a.price);
      return arr;
    case "name_asc":
      arr.sort((a, b) => a.name.localeCompare(b.name));
      return arr;
    case "featured":
    default:
      arr.sort((a, b) => (b.rating * 10 + b.stock) - (a.rating * 10 + a.stock));
      return arr;
  }
}

function renderProducts() {
  const grid = $("#productGrid");
  if (!grid) return;

  const st = stateFromUI();
  const filtered = filterProducts(PRODUCTS, st);
  const sorted = sortProducts(filtered, st.sort);

  const hint = $("#resultsHint");
  if (hint) {
    hint.textContent = st.q
      ? `${sorted.length} nəticə: “${st.q}”`
      : `Bütün məhsullar göstərilir`;
  }

  const cart = readCart();

  grid.innerHTML = sorted
    .map((p) => {
      const inCart = cart[p.id] ?? 0;
      const badgeClass = "badge--ok";
      const badgeText = "Mövcuddur";
      const media = productMedia(p, "card");

      return `
        <article class="card" data-product-id="${p.id}">
          <div class="card__media">
            ${media}
          </div>
          <div class="card__body">
            <div class="card__top">
              <div class="card__titleRow">
                <h3 class="card__title">${escapeHtml(p.name)}</h3>
                <span class="badge ${badgeClass}">${badgeText}</span>
              </div>
              <p class="card__desc">${escapeHtml(p.desc)}</p>
            </div>
            <div class="card__bottom">
              <div class="priceRow">
                <div class="price">
                  <span class="price__now">${money(p.price)}</span>
                </div>
                <div class="rating" aria-label="Kateqoriya">${escapeHtml(p.category)}</div>
              </div>
              <div class="card__actions">
                <button class="btn btn--primary addBtn" type="button" data-action="add" data-id="${p.id}" ${
                  p.stock <= 0 ? "disabled" : ""
                }>
                  Səbətə at
                </button>
                <div class="qtyPill" aria-label="Quantity in cart">
                  <button class="qtyPill__btn" type="button" data-action="dec" data-id="${p.id}" ${
                    inCart <= 0 ? "disabled" : ""
                  } aria-label="Azalt">−</button>
                  <span class="qtyPill__value" aria-label="Səbətdə">${inCart}</span>
                  <button class="qtyPill__btn" type="button" data-action="inc" data-id="${p.id}" ${
                    inCart >= p.stock ? "disabled" : ""
                  } aria-label="Artır">+</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function productMedia(p, variant) {
  const safeName = escapeHtml(p.name);
  if (p.image) {
    const cls = variant === "cart" ? "cartItem__img" : "card__img";
    const src = encodeURI(p.image);
    const img = `<img class="${cls}" src="${src}" alt="${safeName}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'card__emoji',textContent:'${escapeHtml(p.emoji || "🛒")}' }))">`;
    if (variant === "card") {
      return `<div class="mediaFrame" aria-hidden="true">${img}</div>`;
    }
    return img;
  }
  return `<div class="card__emoji" aria-hidden="true">${escapeHtml(p.emoji ?? "🛒")}</div>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateCartBadge() {
  const cart = readCart();
  const count = cartCount(cart);
  const badge = $("#cartCount");
  if (badge) badge.textContent = String(count);
  const subtitle = $("#cartSubtitle");
  if (subtitle) subtitle.textContent = `${count} məhsul`;
}

function openDrawer() {
  const drawer = $("#cartDrawer");
  const overlay = $("#drawerOverlay");
  if (!drawer || !overlay) return;
  overlay.classList.add("is-open");
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderCart();
}

function closeDrawer() {
  const drawer = $("#cartDrawer");
  const overlay = $("#drawerOverlay");
  if (!drawer || !overlay) return;
  overlay.classList.remove("is-open");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderCart() {
  const cart = readCart();
  const list = $("#cartList");
  const empty = $("#cartEmpty");
  if (!list || !empty) return;

  const entries = Object.entries(cart)
    .map(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return null;
      return { p, qty };
    })
    .filter(Boolean);

  const count = cartCount(cart);
  empty.hidden = count !== 0;

  list.innerHTML = entries
    .map(({ p, qty }) => {
      const media = productMedia(p, "cart");
      return `
        <li class="cartItem" data-cart-id="${p.id}">
          <div class="cartItem__emoji" aria-hidden="true">${media}</div>
          <div>
            <div class="cartItem__top">
              <div>
                <p class="cartItem__name">${escapeHtml(p.name)}</p>
                <p class="cartItem__meta">${money(p.price)} • ${escapeHtml(p.category)}</p>
              </div>
              <strong>${qty} ədəd</strong>
            </div>
            <div class="cartItem__bottom">
              <div class="qtyPill">
                <button class="qtyPill__btn" type="button" data-action="cart_dec" data-id="${p.id}" ${
                  qty <= 1 ? "" : ""
                } aria-label="Azalt">−</button>
                <span class="qtyPill__value">${qty}</span>
                <button class="qtyPill__btn" type="button" data-action="cart_inc" data-id="${p.id}" ${
                  qty >= p.stock ? "disabled" : ""
                } aria-label="Artır">+</button>
              </div>
              <button class="linkDanger" type="button" data-action="remove" data-id="${p.id}">
                Sil
              </button>
            </div>
          </div>
        </li>
      `;
    })
    .join("");
  updateCartBadge();

  const totalEl = $("#cartTotal");
  if (totalEl) {
    totalEl.textContent = money(cartSubtotal(cart));
  }
}

function setQty(cart, productId, qty) {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return cart;
  const q = clampInt(qty, 0, p.stock);
  const next = { ...cart };
  if (q <= 0) delete next[productId];
  else next[productId] = q;
  return next;
}

function inc(cart, productId, delta) {
  const q = (cart[productId] ?? 0) + delta;
  return setQty(cart, productId, q);
}

function handleAction(action, id) {
  let cart = readCart();
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;

  const before = cart[id] ?? 0;
  let next = cart;

  switch (action) {
    case "add":
    case "inc":
    case "cart_inc":
      next = inc(cart, id, 1);
      break;
    case "dec":
    case "cart_dec":
      next = inc(cart, id, -1);
      break;
    case "remove":
      next = setQty(cart, id, 0);
      break;
    default:
      return;
  }

  writeCart(next);
  updateCartBadge();
  renderProducts();
  const drawerOpen = $("#cartDrawer")?.classList?.contains("is-open");
  if (drawerOpen) renderCart();

  const after = next[id] ?? 0;
  if (after > before) {
    toast(`Səbətə əlavə olundu: ${p.name}`, { actionText: "Səbətə bax", onAction: openDrawer });
  } else if (after < before) {
    toast(`Yeniləndi: ${p.name}`, { actionText: "Səbətə bax", onAction: openDrawer });
  }
}

function clearCart() {
  writeCart({});
  updateCartBadge();
  renderProducts();
  renderCart();
  toast("Səbət təmizləndi");
}

function wireEvents() {
  $("#openCartBtn")?.addEventListener("click", openDrawer);
  $("#closeCartBtn")?.addEventListener("click", closeDrawer);
  $("#closeCartBtn2")?.addEventListener("click", closeDrawer);
  $("#drawerOverlay")?.addEventListener("click", closeDrawer);
  $("#startShoppingBtn")?.addEventListener("click", closeDrawer);
  $("#toastAction")?.addEventListener("click", () => {
    if (typeof toast._onAction === "function") toast._onAction();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  $("#clearCartBtn")?.addEventListener("click", clearCart);
  $("#productGrid")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;
    handleAction(action, id);
  });

  $("#cartList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;
    handleAction(action, id);
  });

  $("#searchForm")?.addEventListener("submit", (e) => e.preventDefault());
  $("#searchInput")?.addEventListener("input", () => renderProducts());
  $("#sortSelect")?.addEventListener("change", () => renderProducts());
}

function init() {
  updateCartBadge();
  closeDrawer(); // qəti şəkildə bağlı başlasın
  wireEvents();
  renderProducts();
}

document.addEventListener("DOMContentLoaded", init);
