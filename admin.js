// Demo credentials (fine for a college project; real sites check on a server)
const OWNER_USER = "owner";
const OWNER_PASS = "admin123";

const FLOW = ["Pending", "Confirmed", "Preparing", "Ready", "Completed"];
const NEXT_LABEL = {
  Pending: "Confirm order",
  Confirmed: "Start preparing",
  Preparing: "Mark ready",
  Ready: "Mark completed"
};
const TABS = ["All", ...FLOW, "Rejected"];

const $ = (id) => document.getElementById(id);
const rupee = (n) => "₹" + Number(n).toFixed(2).replace(/\.00$/, "");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let activeTab = "All";

/* ---------- Storage ---------- */
function getOrders() {
  try { return JSON.parse(localStorage.getItem("orders")) || []; }
  catch { return []; }
}
function saveOrders(list) {
  try { localStorage.setItem("orders", JSON.stringify(list)); } catch {}
}
function setStatus(id, status) {
  const list = getOrders();
  const o = list.find((x) => x.id === id);
  if (o) { o.status = status; saveOrders(list); }
  render();
}

/* ---------- Login ---------- */
function showDash(loggedIn) {
  $("loginView").hidden = loggedIn;
  $("dashView").hidden = !loggedIn;
  if (loggedIn) render();
}
$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if ($("user").value.trim() === OWNER_USER && $("pass").value === OWNER_PASS) {
    sessionStorage.setItem("ownerIn", "1");
    $("loginError").textContent = "";
    showDash(true);
  } else {
    $("loginError").textContent = "Wrong username or password.";
  }
});
$("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("ownerIn");
  $("loginForm").reset();
  showDash(false);
});

/* ---------- Render ---------- */
// Old orders saved as {id: qty} are shown by dish id instead of crashing
function itemLines(o) {
  if (Array.isArray(o.items)) return o.items.map((i) => `<li>${i.qty} × ${esc(i.name)}</li>`).join("");
  return Object.entries(o.items || {}).map(([id, q]) => `<li>${q} × Dish #${esc(id)}</li>`).join("");
}

function renderStats(list) {
  const today = new Date().toDateString();
  const todays = list.filter((o) => new Date(o.createdAt || 0).toDateString() === today && o.status !== "Rejected");
  const revenue = todays.reduce((s, o) => s + o.total, 0);
  const pending = list.filter((o) => o.status === "Pending").length;
  const active = list.filter((o) => ["Confirmed", "Preparing", "Ready"].includes(o.status)).length;
  $("stats").innerHTML = `
    <div class="stat"><b>${pending}</b><span>Waiting for you</span></div>
    <div class="stat"><b>${active}</b><span>In progress</span></div>
    <div class="stat"><b>${todays.length}</b><span>Orders today</span></div>
    <div class="stat"><b>${rupee(revenue)}</b><span>Sales today</span></div>`;
}

function render() {
  if ($("dashView").hidden) return;
  const all = getOrders().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  renderStats(all);

  $("statusTabs").innerHTML = TABS.map((t) => {
    const n = t === "All" ? all.length : all.filter((o) => o.status === t).length;
    return `<button class="chip ${t === activeTab ? "active" : ""}" data-tab="${t}">${t} (${n})</button>`;
  }).join("");

  const q = $("orderSearch").value.trim().toLowerCase();
  const shown = all.filter((o) =>
    (activeTab === "All" || o.status === activeTab) &&
    (`${o.name} ${o.phone} ${o.id}`.toLowerCase().includes(q))
  );

  if (!shown.length) {
    $("orders").innerHTML = `<p class="empty">${all.length ? "No orders match this filter." : "No orders yet. New orders from the customer site appear here automatically."}</p>`;
    return;
  }

  $("orders").innerHTML = shown.map((o) => {
    const canAct = FLOW.includes(o.status) && o.status !== "Completed";
    return `
    <article class="order ${o.status === "Pending" ? "new" : ""}">
      <div class="order-top">
        <div>
          <h3>${esc(o.id)} · ${esc(o.name)}</h3>
          <p class="meta">${esc(o.phone)} · ${esc(o.time)}</p>
          <p class="meta">${o.type === "Dine-in" ? "Dine-in, table " + esc(o.table) : "Pickup"}</p>
        </div>
        <span class="badge ${o.status}">${o.status}</span>
      </div>
      <ul>${itemLines(o)}</ul>
      ${o.notes ? `<p class="note">Note: ${esc(o.notes)}</p>` : ""}
      <div class="order-foot"><span>Total (incl. GST)</span><span>${rupee(o.total)}</span></div>
      ${canAct ? `<div class="actions">
        <button class="next" data-next="${esc(o.id)}">${NEXT_LABEL[o.status]}</button>
        ${o.status === "Pending" ? `<button class="reject" data-reject="${esc(o.id)}">Reject</button>` : ""}
      </div>` : ""}
    </article>`;
  }).join("");
}

/* ---------- Events ---------- */
$("statusTabs").addEventListener("click", (e) => {
  if (e.target.dataset.tab) { activeTab = e.target.dataset.tab; render(); }
});
$("orderSearch").addEventListener("input", render);
$("orders").addEventListener("click", (e) => {
  const next = e.target.dataset.next, rej = e.target.dataset.reject;
  if (next) {
    const o = getOrders().find((x) => x.id === next);
    setStatus(next, FLOW[FLOW.indexOf(o.status) + 1]);
  }
  if (rej && confirm("Reject this order?")) setStatus(rej, "Rejected");
});

// New orders placed in another tab show up instantly
window.addEventListener("storage", (e) => { if (e.key === "orders") render(); });

showDash(sessionStorage.getItem("ownerIn") === "1");
