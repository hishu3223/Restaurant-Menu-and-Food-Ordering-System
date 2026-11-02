const GST_RATE = 0.05;
const $ = (id) => document.getElementById(id);
const rupee = (n) => "₹" + n.toFixed(2).replace(/\.00$/, "");

let activeCategory = "All";
let cart = loadCart(); // { dishId: quantity }

function loadCart() {
  try { return JSON.parse(localStorage.getItem("cart")) || {}; }
  catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem("cart", JSON.stringify(cart)); } catch {}
}

/* ---------- Menu ---------- */
function renderCategories() {
  const cats = ["All", ...new Set(MENU.map((d) => d.category))];
  $("categories").innerHTML = cats
    .map((c) => `<button role="tab" class="chip ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
}

function renderMenu() {
  const q = $("search").value.trim().toLowerCase();
  const vegOnly = $("vegOnly").checked;
  const items = MENU.filter((d) =>
    (activeCategory === "All" || d.category === activeCategory) &&
    (!vegOnly || d.veg) &&
    (d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q))
  );
  if (!items.length) {
    $("menu").innerHTML = `<p class="empty">No dishes match. Try a different search or turn off the veg filter.</p>`;
    return;
  }
  $("menu").innerHTML = items.map((d) => `
    <article class="dish">
      <div class="dish-head">
        <span class="mark ${d.veg ? "veg" : "nonveg"}" title="${d.veg ? "Vegetarian" : "Non-vegetarian"}"></span>
        <h3>${d.name}</h3>
      </div>
      <p>${d.desc}</p>
      <div class="dish-foot">
        <strong>${rupee(d.price)}</strong>
        <button class="add" data-add="${d.id}">Add</button>
      </div>
    </article>`).join("");
}

/* ---------- Cart ---------- */
function totals() {
  const subtotal = Object.entries(cart).reduce((s, [id, q]) => s + MENU.find((d) => d.id == id).price * q, 0);
  const gst = subtotal * GST_RATE;
  return { subtotal, gst, total: subtotal + gst };
}

function renderCart() {
  const ids = Object.keys(cart);
  $("cartItems").innerHTML = ids.length
    ? ids.map((id) => {
        const d = MENU.find((x) => x.id == id);
        return `<div class="line">
          <span class="name">${d.name}</span>
          <span class="qty">
            <button data-dec="${id}" aria-label="Remove one ${d.name}">−</button>
            <b>${cart[id]}</b>
            <button data-inc="${id}" aria-label="Add one ${d.name}">+</button>
          </span>
          <span class="amt">${rupee(d.price * cart[id])}</span>
        </div>`;
      }).join("")
    : `<p class="empty">Your order is empty. Add dishes from the menu.</p>`;
  const t = totals();
  $("subtotal").textContent = rupee(t.subtotal);
  $("gst").textContent = rupee(t.gst);
  $("total").textContent = rupee(t.total);
  $("checkoutBtn").disabled = !ids.length;
  saveCart();
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  renderCart();
}

/* ---------- Events ---------- */
$("categories").addEventListener("click", (e) => {
  const cat = e.target.dataset.cat;
  if (!cat) return;
  activeCategory = cat;
  renderCategories();
  renderMenu();
});
$("search").addEventListener("input", renderMenu);
$("vegOnly").addEventListener("change", renderMenu);
$("menu").addEventListener("click", (e) => {
  if (e.target.dataset.add) changeQty(e.target.dataset.add, 1);
});
$("cartItems").addEventListener("click", (e) => {
  if (e.target.dataset.inc) changeQty(e.target.dataset.inc, 1);
  if (e.target.dataset.dec) changeQty(e.target.dataset.dec, -1);
});
$("clearBtn").addEventListener("click", () => { cart = {}; renderCart(); });

$("checkoutBtn").addEventListener("click", () => $("checkoutDialog").showModal());
$("cancelBtn").addEventListener("click", () => $("checkoutDialog").close());
$("orderType").addEventListener("change", () => {
  const dine = $("orderType").value === "Dine-in";
  $("tableRow").style.display = dine ? "" : "none";
  $("tableNo").required = dine;
});

$("checkoutForm").addEventListener("submit", () => {
  const t = totals();
  const orderId = "ORD" + Date.now().toString().slice(-6);
  const order = {
    id: orderId,
    name: $("custName").value.trim(),
    phone: $("custPhone").value,
    type: $("orderType").value,
    table: $("tableNo").value,
    notes: $("notes").value.trim(),
    items: Object.entries(cart).map(([id, qty]) => {
      const d = MENU.find((x) => x.id == id);
      return { name: d.name, qty, price: d.price };
    }),
    total: t.total,
    status: "Pending",          // Pending -> Confirmed -> Preparing -> Ready -> Completed
    createdAt: Date.now(),
    time: new Date().toLocaleString()
  };
  // Save order history (acts as our simple "database")
  try {
    const all = JSON.parse(localStorage.getItem("orders") || "[]");
    all.push(order);
    localStorage.setItem("orders", JSON.stringify(all));
  } catch {}
  $("doneText").textContent =
    `Thanks, ${order.name}. Your order ${orderId} of ${rupee(t.total)} is being prepared` +
    (order.type === "Dine-in" ? ` for table ${order.table}.` : " for pickup.");
  cart = {};
  renderCart();
  $("checkoutForm").reset();
  $("orderType").dispatchEvent(new Event("change"));
  $("doneDialog").showModal();
});
$("doneBtn").addEventListener("click", () => $("doneDialog").close());

/* ---------- Init ---------- */
$("orderType").dispatchEvent(new Event("change"));
renderCategories();
renderMenu();
renderCart();
