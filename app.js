const $ = (s) => document.querySelector(s);
const N = (n) => "₦" + Math.round(+n || 0).toLocaleString("en-NG");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const WA = "2348156235962";
const STAGES = ["Received", "Cutting", "Sewing", "Finishing", "Ready", "Delivered"];
const stars = (n) => "★★★★★".slice(0, Math.round(+n || 0)) + "☆☆☆☆☆".slice(Math.round(+n || 0));
const BANDS = { u20: [0, 20000, "Under ₦20k"], m50: [20000, 50000, "₦20–50k"], m100: [50000, 100000, "₦50–100k"], over: [100000, 1e12, "₦100k+"] };

let products = [];
let config = { payMode: "demo", delivery: { pickup: { label: "Pickup at the Ibadan studio", fee: 0 }, ibadan: { label: "Delivery within Ibadan", fee: 2500 }, nigeria: { label: "Delivery across Nigeria", fee: 5500 } }, splits: { 1: [1], 2: [0.5, 0.5], 3: [0.4, 0.3, 0.3], 4: [0.4, 0.2, 0.2, 0.2] } };
let cart = [];
let wish = [];
let pick = {};
let promoQuote = { off: 0, label: "", code: "" };
const reviewCache = {};
const reviewLoading = {};
try { cart = JSON.parse(localStorage.getItem("jtc-bag") || "[]"); } catch (e) {}
try { wish = JSON.parse(localStorage.getItem("jtc-wish") || "[]"); } catch (e) {}

const saveBag = () => localStorage.setItem("jtc-bag", JSON.stringify(cart));
const saveWish = () => localStorage.setItem("jtc-wish", JSON.stringify(wish));
const byId = (id) => products.find((p) => p.id === +id);
const moneyLines = (total, plan) => {
  const sp = (config.splits || { 1: [1], 2: [0.5, 0.5], 3: [0.4, 0.3, 0.3], 4: [0.4, 0.2, 0.2, 0.2] })[plan] || [1];
  let left = total;
  return sp.map((f, i) => {
    const amount = i === sp.length - 1 ? left : Math.round(total * f);
    left -= amount;
    const due = new Date();
    due.setDate(due.getDate() + i * 14);
    return { n: i + 1, amount, label: i ? `Payment ${i + 1} · ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Deposit today" };
  });
};
const goodsTotal = () => cart.reduce((s, i) => s + (byId(i.id)?.price || 0) * i.q, 0);

function art(p) {
  const c = /^#[0-9a-fA-F]{3,8}$/.test(p.c) ? p.c : "#1a1612";
  const robes = {
    Agbada: "M40 28h120l22 190H28L40 28zm18 18 8 168h68l8-168H58z",
    Senator: "M58 36h84l10 150H48L58 36zm22 16v40h40V52H80z",
    Kaftan: "M48 30h104l8 188H40L48 30zm30 16v52h44V46H78z",
    Ankara: "M54 34h92l12 160H42L54 34zm20 18h52v28H74V52z",
    Corporate: "M50 40l50-16 50 16-8 150H58L50 40zm28 18 22 8 22-8v36H78V58z",
    Casual: "M62 48h76l8 140H54L62 48zm18 8v22h40V56H80z",
    Accessories: "M70 70h60v70H70zM78 88h44v8H78z",
  };
  const d = robes[p.cat] || robes.Senator;
  return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="g${p.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#120f0c"/></linearGradient></defs>
    <rect width="200" height="260" fill="url(#g${p.id})"/>
    <path d="${d}" fill="none" stroke="#f6f1e8" stroke-width="2.2" opacity=".9"/>
    <path d="M30 220h140" stroke="#c6a15b" stroke-width="1"/>
  </svg>`;
}
function swatch(p, cls = "") {
  return `<div class="sw ${cls}">${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}${art(p)}<img src="${esc(p.img)}" alt="" onerror="this.remove()"></div>`;
}

function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("on"), 1800);
}
function paintBag() {
  $("#cc").textContent = cart.reduce((s, i) => s + i.q, 0);
  $("#wc").textContent = wish.length;
  const lines = cart.map((i, k) => {
    const p = byId(i.id);
    if (!p) return "";
    return `<div class="ci">${swatch(p)}<div><b>${esc(p.name)}</b><div class="mut tiny">${esc(i.c || "")} · Size ${esc(i.z)} · ${N(p.price)}</div>
      <div class="q"><button data-act="minus" data-k="${k}" aria-label="Less">−</button><span>${i.q}</span><button data-act="plus" data-k="${k}" aria-label="More">+</button></div></div>
      <button class="ib" data-act="drop" data-k="${k}">Remove</button></div>`;
  }).join("");
  $("#ci").innerHTML = lines || `<p class="empty">Your bag is empty. The senator and the agbada are waiting in the shop.</p>`;
  $("#co").hidden = !cart.length;
  $("#tt").textContent = N(goodsTotal());
  saveBag();
}
function openBag(on) {
  $("#drawer").classList.toggle("open", on);
  $("#ov").classList.toggle("on", on);
}
function addCart(id, size, qty = 1, color) {
  const p = byId(id);
  if (!p) return;
  if (p.stock === 0) return toast("Sold out");
  const z = size || p.sizes[0];
  const c = color || p.colors?.[0]?.name || "";
  const f = cart.find((i) => i.id === p.id && i.z === z && (i.c || "") === c);
  const next = Math.min(10, (f ? f.q : 0) + qty);
  if (p.stock != null && next > p.stock) return toast(`Only ${p.stock} left`);
  if (f) f.q = next;
  else cart.push({ id: p.id, z, q: Math.min(10, qty), c });
  paintBag();
  toast("Added to bag");
}
function remember(id) {
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem("jtc-recent") || "[]"); } catch (e) {}
  recent = [+id, ...recent.filter((x) => x !== +id)].slice(0, 8);
  localStorage.setItem("jtc-recent", JSON.stringify(recent));
}
function rememberOrder(id, phone) {
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem("jtc-orders") || "[]"); } catch (e) {}
  hist = [{ id, phone, at: Date.now() }, ...hist.filter((x) => x.id !== id)].slice(0, 12);
  localStorage.setItem("jtc-orders", JSON.stringify(hist));
}
function toggleWish(id) {
  id = +id;
  wish = wish.includes(id) ? wish.filter((x) => x !== id) : [...wish, id];
  saveWish();
  paintBag();
  toast(wish.includes(id) ? "Saved" : "Removed from saved");
  render();
}

let keepSearch = false;
function parseHash() {
  const raw = (location.hash || "#/home").slice(1);
  const [pathPart, query = ""] = raw.split("?");
  const path = pathPart.replace(/^\//, "") || "home";
  const [name, id] = path.split("/");
  return { name, id, q: new URLSearchParams(query) };
}
function setActive() {
  const { name } = parseHash();
  document.querySelectorAll(".links a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#/" + name));
}

const reviews = [
  ["The shoulder sat exactly where we marked it. I wore the senator the next Friday.", "Tunde A.", "Bodija"],
  ["Four groomsmen, one aso-ebi, and every jacket still looked personal.", "Segun O.", "Wedding, Ring Road"],
  ["I paid the deposit on a Tuesday and collected a finished suit before the board meeting.", "Ibrahim K.", "Secretariat"],
];

function home() {
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const cats = [...new Set(products.map((p) => p.cat))];
  return `<section class="hero">
    <div class="hero-copy">
      <div class="kicker">Style · Fit · Confidence</div>
      <h1>Clothes cut to the man, not the rail.</h1>
      <p class="lede">Senator, agbada, kaftan and suiting from the Jimson Tailoring Co. bench in Ibadan. Made to your measure, finished by hand, released when the last payment clears.</p>
      <div class="hero-actions"><a class="btn" href="#/shop">Shop the house</a><a class="btn ghost" href="#/studio">Book a fitting</a></div>
      <a href="#/pay" style="color:#c6a15b">Or spread an order across four payments</a>
    </div>
    <div class="hero-photo" role="img" aria-label="JTC studio with mannequins in native wear"></div>
  </section>
  <div class="trust wrap">${[
    ["Ibadan", "Cut and finished in the studio"],
    ["7–30 days", "Lead time by cloth and embroidery"],
    ["40% down", "Work starts on the deposit"],
    ["Nigeria", "Pickup, city rider, or interstate"],
  ].map(([a, b]) => `<div><strong>${a}</strong><span>${b}</span></div>`).join("")}</div>
  <section class="section wrap">
    <div class="spread"><div><div class="kicker">Collections</div><h2>What the bench is making</h2></div><a href="#/shop">All styles</a></div>
    <div class="mosaic">${cats.slice(0, 5).map((c, i) => {
      const p = products.find((x) => x.cat === c);
      return `<a class="tile ${i === 0 ? "wide" : ""}" href="#/shop?cat=${encodeURIComponent(c)}" style="background:linear-gradient(160deg,${p?.c || "#222"},#120f0c)"><b>${esc(c)}</b><span>${products.filter((x) => x.cat === c).length} styles</span></a>`;
    }).join("")}</div>
  </section>
  <section class="section wrap" style="padding-top:0">
    <div class="spread"><div><div class="kicker">In the window</div><h2>Pieces clients book first</h2></div></div>
    <div class="grid g4">${featured.map(card).join("")}</div>
  </section>
  <section class="section" style="background:var(--bg2)">
    <div class="wrap split">
      <div>
        <div class="kicker">The house</div>
        <h2>A fitting room, not a catalogue with a logo.</h2>
        <p class="sub">Every agbada, senator and suit is cut to a body. Come to the Outfit Check Studio, or send measurements and a photo of the cloth. Group aso-ebi is cut as a set so the party matches and each person still looks fitted.</p>
      </div>
      <div class="steps">
        <article><div><b>Choose or describe</b><p class="mut">Shop a style, or tell the atelier the ceremony, the cloth and the date.</p></div></article>
        <article><div><b>Pay the deposit</b><p class="mut">Full payment, or 40% to put the cloth on the table.</p></div></article>
        <article><div><b>We cut, you track</b><p class="mut">Received, cutting, sewing, finishing, ready, delivered.</p></div></article>
        <article><div><b>Collect when it is paid</b><p class="mut">The outfit leaves after the final installment is confirmed.</p></div></article>
      </div>
    </div>
  </section>
  <section class="editorial">
    <div>
      <div class="kicker">The edit</div>
      <h2>Ceremony cloth, cut like a suit.</h2>
      <p class="lede">Agbada for the groom, senator for the party, and a navy suit that still looks like it came from the same bench.</p>
      <div class="hero-actions"><a class="btn" href="#/shop?cat=Agbada">Agbada</a><a class="btn ghost" href="#/lookbook">Lookbook</a></div>
    </div>
    <a class="plate" href="#/product/12" style="background-image:url(assets/products/ivory-wedding-agbada.svg)" aria-label="Ivory wedding agbada"></a>
  </section>
  <section class="section wrap">
    <div class="kicker">From the studio book</div>
    <h2>Clients, in their own words</h2>
    <div class="grid g3" style="margin-top:18px">${reviews.map(([q, n, w]) => `<article class="card"><p class="quote">“${esc(q)}”</p><b>${esc(n)}</b><div class="mut tiny">${esc(w)}</div></article>`).join("")}</div>
  </section>
  ${recentBlock()}`;
}
function recentBlock() {
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem("jtc-recent") || "[]"); } catch (e) {}
  const list = ids.map(byId).filter(Boolean);
  if (!list.length) return "";
  return `<section class="section wrap" style="padding-top:0"><div class="kicker">Recently viewed</div><h2>Still on the table</h2><div class="grid g4">${list.slice(0, 4).map(card).join("")}</div></section>`;
}

function card(p) {
  const low = p.stock != null && p.stock <= 3;
  return `<article class="card product">
    <a href="#/product/${p.id}">${swatch(p)}</a>
    <button class="heart" data-act="wish" data-id="${p.id}" aria-label="Save">${wish.includes(p.id) ? "♥" : "♡"}</button>
    <div class="pinfo">
      <div class="meta"><span>${esc(p.cat)}</span><span class="stars">${p.rating ? stars(p.rating) : esc(p.lead)}</span></div>
      <h3><a href="#/product/${p.id}">${esc(p.name)}</a></h3>
      <div class="dots">${(p.colors || []).slice(0, 4).map((c) => `<i style="background:${esc(c.hex)}" title="${esc(c.name)}"></i>`).join("")}</div>
      <div class="row"><span class="price">${N(p.price)}</span><span class="tiny ${p.stock === 0 || low ? "low" : "mut"}">${p.stock === 0 ? "Sold out" : low ? "Only " + p.stock + " left" : esc(p.lead)}</span></div>
      <div class="row">
        <button class="btn sm" data-act="quick" data-id="${p.id}" ${p.stock === 0 ? "disabled" : ""}>Add</button>
        <button class="btn sm ghost" data-act="qv" data-id="${p.id}">Quick look</button>
      </div>
    </div>
  </article>`;
}

function shop(r) {
  const cat = r.q.get("cat") || "All";
  const q = (r.q.get("q") || "").toLowerCase();
  const sort = r.q.get("sort") || "";
  const saved = r.q.get("saved") === "1";
  const band = r.q.get("band") || "";
  const layout = r.q.get("view") === "list" ? "list" : "g3";
  let list = products.filter((p) => (cat === "All" || p.cat === cat) && (!saved || wish.includes(p.id)) && (p.name + p.cat + p.fabric + (p.season || "")).toLowerCase().includes(q));
  if (BANDS[band]) list = list.filter((p) => p.price >= BANDS[band][0] && p.price < BANDS[band][1]);
  if (sort === "a") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "d") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "n") list = [...list].sort((a, b) => b.id - a.id);
  const cats = ["All", ...new Set(products.map((p) => p.cat))];
  return `<div class="wrap shop-layout">
    <aside class="filters">
      <div class="kicker">Cloth</div>
      ${cats.map((c) => `<button class="chip ${c === cat && !saved ? "on" : ""}" data-act="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
      <button class="chip ${saved ? "on" : ""}" data-act="saved">Saved (${wish.length})</button>
      <div class="kicker" style="margin-top:12px">Price</div>
      <button class="chip ${!band ? "on" : ""}" data-act="band" data-band="">Any price</button>
      ${Object.entries(BANDS).map(([k, v]) => `<button class="chip ${band === k ? "on" : ""}" data-act="band" data-band="${k}">${v[2]}</button>`).join("")}
    </aside>
    <div>
      <div class="page-intro" style="padding-top:8px"><div class="kicker">${saved ? "Saved" : esc(cat)} · ${list.length}</div><h1>${saved ? "Styles you kept" : cat === "All" ? "The shop" : esc(cat)}</h1></div>
      <div class="tools">
        <input id="q" value="${esc(r.q.get("q") || "")}" placeholder="Search senator, linen, wedding…" aria-label="Search">
        <select id="so" aria-label="Sort">
          <option value="">Featured</option>
          <option value="n" ${sort === "n" ? "selected" : ""}>Newest</option>
          <option value="a" ${sort === "a" ? "selected" : ""}>Price · low</option>
          <option value="d" ${sort === "d" ? "selected" : ""}>Price · high</option>
        </select>
        <button class="ib" data-act="layout" data-view="${layout === "list" ? "grid" : "list"}">${layout === "list" ? "Grid" : "List"}</button>
      </div>
      <div class="grid ${layout}">${list.map(card).join("") || `<p class="empty">Nothing in this cut. Try another cloth, or <a href="#/atelier">brief the atelier</a>.</p>`}</div>
    </div>
  </div>`;
}

function loadReviews(id) {
  if (reviewCache[id] || reviewLoading[id]) return;
  reviewLoading[id] = true;
  fetch("/api/products/" + id + "/reviews")
    .then((r) => r.json())
    .then((list) => {
      reviewCache[id] = Array.isArray(list) ? list : [];
      reviewLoading[id] = false;
      const here = parseHash();
      if (here.name === "product" && +here.id === +id) render();
    })
    .catch(() => { reviewLoading[id] = false; reviewCache[id] = []; });
}
function reviewBlock(p) {
  const list = reviewCache[p.id];
  if (!list) {
    loadReviews(p.id);
    return `<p class="mut">Opening the studio book…</p>`;
  }
  const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : (p.rating || "—");
  return `<h2 style="margin-top:8px">${avg} · ${list.length} notes</h2>
    ${list.map((r) => `<article class="rev"><div class="stars">${stars(r.rating)}</div><b>${esc(r.name)}</b> <span class="mut tiny">${esc(r.city || "")}</span><p>${esc(r.text)}</p></article>`).join("") || `<p class="mut">No notes yet. If you have worn it, leave one.</p>`}
    <form id="review" data-id="${p.id}" class="card" style="margin-top:14px">
      <div class="form-grid">
        <div class="field"><label>Name</label><input name="name" required></div>
        <div class="field"><label>City</label><input name="city" placeholder="Ibadan"></div>
      </div>
      <div class="field"><label>Rating</label><select name="rating"><option value="5">5</option><option value="4">4</option><option value="3">3</option></select></div>
      <div class="field"><label>Note</label><textarea name="text" required minlength="8" rows="3" placeholder="How did the fit sit?"></textarea></div>
      <button class="btn" type="submit">Leave a note</button>
    </form>`;
}
function product(r) {
  const p = byId(r.id);
  if (!p) return `<div class="wrap page-intro"><h1>That style has left the rail.</h1><a href="#/shop">Back to the shop</a></div>`;
  remember(p.id);
  const size = pick[p.id] || p.sizes[Math.min(2, p.sizes.length - 1)];
  const color = pick[p.id + "c"] || p.colors?.[0]?.name || "";
  const qty = pick[p.id + "q"] || 1;
  const plan = pick.plan || 3;
  const lines = moneyLines(p.price * qty, plan);
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 3);
  const sold = p.stock === 0;
  return `<div class="wrap product-page">
    <div class="stage">${swatch(p)}</div>
    <div>
      <div class="crumbs"><a href="#/home">Home</a> / <a href="#/shop?cat=${encodeURIComponent(p.cat)}">${esc(p.cat)}</a> / <span>${esc(p.sku || "")}</span></div>
      <div class="kicker">${esc(p.fabric)} · ${esc(p.season || "House")}</div>
      <h1>${esc(p.name)}</h1>
      <p class="price" style="font-size:1.4rem">${N(p.price)} <span class="stars">${p.rating ? stars(p.rating) : ""}</span></p>
      <p>${esc(p.desc)}</p>
      <div class="facts">
        <div><span class="tiny mut">Lead time</span><b>${esc(p.lead)}</b></div>
        <div><span class="tiny mut">On the bench</span><b class="${sold || (p.stock != null && p.stock <= 3) ? "low" : ""}">${sold ? "Sold out" : (p.stock ?? "—") + " available"}</b></div>
      </div>
      ${p.colors?.length ? `<h3>Cloth</h3><div class="swatch-pick">${p.colors.map((c) => `<button class="chip ${c.name === color ? "on" : ""}" data-act="color" data-id="${p.id}" data-color="${esc(c.name)}"><i style="background:${esc(c.hex)}"></i>${esc(c.name)}</button>`).join("")}</div>` : ""}
      <div class="row"><h3 style="margin:0">Size</h3><button class="ib" data-act="guide" type="button">Size guide</button></div>
      <div class="sizes">${p.sizes.map((s) => `<button class="chip ${s === size ? "on" : ""}" data-act="size" data-id="${p.id}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <div class="row">
        <div class="q"><button data-act="pqty" data-id="${p.id}" data-dir="-1" aria-label="Less">−</button><span>${qty}</span><button data-act="pqty" data-id="${p.id}" data-dir="1" aria-label="More">+</button></div>
        <button class="btn" data-act="add" data-id="${p.id}" data-size="${esc(size)}" data-color="${esc(color)}" data-qty="${qty}" ${sold ? "disabled" : ""}>${sold ? "Sold out" : "Add to bag"}</button>
        <button class="btn ghost" data-act="wish" data-id="${p.id}">${wish.includes(p.id) ? "Saved" : "Save"}</button>
      </div>
      <h3 style="margin-top:22px">Pay this piece in installments</h3>
      <select data-act="plan" data-id="${p.id}" id="plan">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${+plan === n ? "selected" : ""}>${n === 1 ? "Pay in full" : n + " payments"}</option>`).join("")}</select>
      <div class="sch">${lines.map((l) => `<div><span>${l.label}</span><b>${N(l.amount)}</b></div>`).join("")}</div>
      <p class="tiny mut">Balance every 14 days. The outfit leaves after the last payment. Code ATELIER10 takes 10% off at checkout.</p>
      <details class="acc"><summary>Cut and finish</summary><ul>${(p.details || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul></details>
      <details class="acc"><summary>Care</summary><p>${esc(p.care || "Ask the studio.")}</p></details>
      <p><a href="https://wa.me/${WA}?text=${encodeURIComponent("Hello JTC, I have a question about " + p.name + (color ? " in " + color : ""))}" target="_blank" rel="noopener">Ask the studio about this cloth</a></p>
    </div>
  </div>
  <div class="wrap" style="padding-bottom:28px">${reviewBlock(p)}</div>
  ${related.length ? `<div class="wrap" style="padding-bottom:64px"><h2>Same bench</h2><div class="grid g3">${related.map(card).join("")}</div></div>` : ""}`;
}

function checkout() {
  if (!cart.length) return `<div class="wrap page-intro"><h1>Your bag is empty.</h1><a class="btn" href="#/shop">Shop the house</a></div>`;
  const goods = goodsTotal();
  const lines = cart.map((i) => {
    const p = byId(i.id);
    return p ? `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(p.name)} · ${esc(i.c || "")} ${esc(i.z)} × ${i.q}</span><b>${N(p.price * i.q)}</b></div>` : "";
  }).join("");
  const opts = Object.entries(config.delivery).map(([k, v]) => `<option value="${k}">${esc(v.label)} · ${v.fee ? N(v.fee) : "Free"}</option>`).join("");
  const demo = config.payMode !== "paystack";
  return `<div class="wrap page-intro"><div class="kicker">Checkout</div><h1>How should we make it?</h1></div>
  <form id="checkout" method="post" action="#/checkout" class="wrap split" style="padding-bottom:70px" onsubmit="event.preventDefault()">
    <div class="card">
      <div class="field"><label>Full name</label><input name="name" required autocomplete="name"></div>
      <div class="form-grid">
        <div class="field"><label>Phone</label><input name="phone" required inputmode="tel" autocomplete="tel"></div>
        <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div>
      </div>
      <div class="field"><label>Delivery</label><select name="delivery" id="ship">${opts}</select></div>
      <div class="field"><label>Address, if we are sending it</label><input name="address" id="addr" placeholder="Street, area, city"></div>
      <div class="field"><label>Note for the cutter</label><textarea name="note" rows="3" placeholder="Occasion, colour of fila, date needed"></textarea></div>
      <div class="field"><label>Courtesy code</label><input name="promo" placeholder="ATELIER10" autocomplete="off" value="${esc(promoQuote.code || "")}"></div>
      <p class="tiny mut" id="promomsg">${esc(promoQuote.error || promoQuote.label || "ATELIER10 is 10% off. GROOM15 from ₦100,000. IBADAN from ₦40,000.")}</p>
      <div class="kicker">Payment</div>
      <div class="check">
        <label><input type="radio" name="plan" value="1" checked> Pay in full</label>
        <label><input type="radio" name="plan" value="2"> 2 payments</label>
        <label><input type="radio" name="plan" value="3"> 3 payments</label>
        <label><input type="radio" name="plan" value="4"> 4 payments</label>
      </div>
      <div class="sch" id="paysch"></div>
      <label class="check" style="margin:8px 0 14px"><input type="checkbox" name="agree" required> I agree the outfit is released after the final payment, and that cutting makes a deposit non-refundable.</label>
      <button class="btn" type="submit">${demo ? "Continue to studio cashier" : "Pay with Paystack"}</button>
      <p class="tiny mut">${demo ? "Demo mode is on: the next page records the payment without charging a card. Add a Paystack secret key to take real payments." : "You will complete the deposit on Paystack."}</p>
    </div>
    <aside class="card">
      <h3>Order</h3>
      ${lines}
      <div class="row" style="margin-top:10px"><span>Clothes</span><b id="goods">${N(goods)}</b></div>
      <div class="row"><span>Courtesy</span><b id="disc">${N(0)}</b></div>
      <div class="row"><span>Delivery</span><b id="fee">${N(0)}</b></div>
      <div class="tot"><span>To start</span><span id="due"></span></div>
    </aside>
  </form>`;
}

function refreshCheckout() {
  const form = $("#checkout");
  if (!form) return;
  const goods = goodsTotal();
  const ship = config.delivery[form.delivery.value] || { fee: 0 };
  const plan = +form.plan.value;
  const code = (form.promo?.value || "").trim().toUpperCase();
  const discount = promoQuote.code === code ? promoQuote.off || 0 : 0;
  const total = Math.max(0, goods - discount + ship.fee);
  const lines = moneyLines(total, plan);
  $("#fee").textContent = N(ship.fee);
  if ($("#disc")) $("#disc").textContent = discount ? "−" + N(discount) : N(0);
  const msg = $("#promomsg");
  if (msg) msg.textContent = promoQuote.error && code ? promoQuote.error : promoQuote.label && code ? promoQuote.label : "ATELIER10 is 10% off. GROOM15 from ₦100,000. IBADAN from ₦40,000.";
  $("#paysch").innerHTML = lines.map((l) => `<div><span>${l.label}</span><b>${N(l.amount)}</b></div>`).join("") + `<div><span>Order total</span><b>${N(total)}</b></div>`;
  $("#due").textContent = N(lines[0].amount);
}

function track() {
  const preset = new URLSearchParams(location.search);
  const id = preset.get("order") || "";
  const phone = preset.get("phone") || "";
  return `<div class="wrap page-intro"><div class="kicker">Your order</div><h1>Where is the cloth?</h1>
    <p class="sub">Use the order ID from your receipt and the phone number on the order.</p></div>
    <form id="track" method="post" action="#/track" class="wrap card" style="margin-bottom:48px" onsubmit="event.preventDefault()">
      <div class="form-grid">
        <div class="field"><label>Order ID</label><input name="id" value="${esc(id)}" required></div>
        <div class="field"><label>Phone</label><input name="phone" value="${esc(phone)}" required></div>
      </div>
      <button class="btn" type="submit">Check status</button>
      <div id="trackout"></div>
    </form>`;
}

async function showTrack(id, phone) {
  const out = $("#trackout");
  if (!out || !id || !phone) return;
  out.innerHTML = `<p class="mut">Checking…</p>`;
  const r = await fetch(`/api/orders/${encodeURIComponent(String(id).trim())}?phone=${encodeURIComponent(String(phone).trim())}`);
  if (!r.ok) { out.innerHTML = `<p>No order for that ID and phone.</p>`; return; }
  const o = await r.json();
  out.innerHTML = trackView(o);
  const next = $("#paynext");
  if (next) next.onclick = async () => {
    const pr = await fetch(`/api/orders/${encodeURIComponent(o.id)}/pay-next`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: String(phone).trim() }) });
    const j = await pr.json();
    if (!pr.ok) return toast(j.error || "Could not start payment");
    location.href = j.authorization_url;
  };
}
function trackView(o) {
  const idx = STAGES.indexOf(o.stage);
  return `<div class="timeline">${STAGES.map((s, i) => `<span class="${i < idx ? "done" : ""} ${i === idx ? "on" : ""}">${esc(s)}</span>`).join("")}</div>
    <p><b>${esc(o.status)}</b> · ${esc(o.deliveryLabel || "")} · ${N(o.total)}${o.discount ? ` · courtesy −${N(o.discount)}` : ""}</p>
    ${(o.items || []).map((i) => `<div class="row"><span>${esc(i.name)} · ${esc(i.color || "")} ${esc(i.size)} × ${i.qty}</span><span>${N(i.price * i.qty)}</span></div>`).join("")}
    <div class="sch">${o.schedule.map((i) => `<div><span>Payment ${i.n} · due ${esc(i.due)}</span><b class="${i.paid ? "ok" : ""}">${N(i.amount)} ${i.paid ? "paid" : "open"}</b></div>`).join("")}</div>
    ${o.status === "Fully Paid" ? `<p class="ok">Fully paid. We will move it to delivery when the stage says Ready.</p>` : `<button class="btn" type="button" id="paynext">Pay the next installment</button>`}`;
}

function atelier() {
  return `<div class="wrap page-intro"><div class="kicker">Made to measure</div><h1>Brief the atelier.</h1>
    <p class="sub">Send measurements in inches. We confirm the cloth, the date and the deposit on WhatsApp, and the request is also saved on the studio desk.</p></div>
    <form id="atelier" class="wrap card form-grid" style="margin-bottom:64px">
      <div class="field"><label>Full name</label><input name="name" required></div>
      <div class="field"><label>Phone</label><input name="phone" required></div>
      <div class="field"><label>Email</label><input name="email" type="email"></div>
      <div class="field"><label>Style</label><select name="style"><option>Senator</option><option>Agbada</option><option>Kaftan</option><option>Suit</option><option>Ankara</option><option>Alteration</option></select></div>
      <div class="field"><label>Fabric / colour</label><input name="fabric" placeholder="Navy guinea, cream polish…"></div>
      <div class="field"><label>Needed by</label><input name="needed" type="date"></div>
      ${["Chest", "Waist", "Shoulder", "Sleeve", "Top length", "Trouser length"].map((m) => `<div class="field"><label>${m} (in)</label><input name="${m}" inputmode="decimal"></div>`).join("")}
      <div class="field"><label>Payment</label><select name="payment"><option>Pay in full</option><option>2 installments</option><option>3 installments</option><option>4 installments</option></select></div>
      <div class="field full"><label>Notes</label><textarea name="notes" rows="3" placeholder="Ceremony, reference photo, group size"></textarea></div>
      <div class="full"><button class="btn" type="submit">Send to the studio</button></div>
    </form>`;
}

function studio() {
  return `<div class="wrap split" style="padding:36px 0 70px">
    <div>
      <div class="kicker">Outfit Check Studio</div>
      <h1>Book a fitting in Ibadan.</h1>
      <p class="sub">Bring the cloth if you already bought it. First fittings run about forty minutes. Alterations are shorter.</p>
      <div class="card">
        <a href="tel:+2348156235962">0815 623 5962</a><br>
        <a href="https://wa.me/${WA}" target="_blank" rel="noopener">WhatsApp</a><br>
        <a href="mailto:toheebjimoh1619@gmail.com">toheebjimoh1619@gmail.com</a>
        <p class="mut">Ibadan, Oyo State. Ask for the current studio address when you book.</p>
      </div>
    </div>
    <form id="studio" class="card">
      <div class="field"><label>Name</label><input name="name" required></div>
      <div class="field"><label>Phone</label><input name="phone" required></div>
      <div class="form-grid">
        <div class="field"><label>Date</label><input name="date" type="date" required></div>
        <div class="field"><label>Time</label><input name="time" type="time" required></div>
      </div>
      <div class="field"><label>Service</label><select name="service"><option>Custom outfit</option><option>Native wear</option><option>Corporate wear</option><option>Wedding / aso-ebi</option><option>Alteration</option></select></div>
      <div class="field"><label>Note</label><textarea name="note" rows="3"></textarea></div>
      <button class="btn" type="submit">Request this time</button>
    </form>
  </div>`;
}

function lookbook() {
  const groups = [...new Set(products.map((p) => p.cat))];
  const stories = [
    ["The groom edit", "Ivory agbada, gold thread, and a fila cut from the same cloth. Book the fitting before the aso-ebi is locked.", "Agbada"],
    ["Friday uniform", "Senator and kaftan for the week that ends in a party. Quiet cloth, sharp shoulder.", "Senator"],
    ["The office cut", "Wool-blend suiting with a light shoulder. The same bench that sews the agbada.", "Corporate"],
  ];
  return `<div class="wrap page-intro"><div class="kicker">Lookbook</div><h1>Finished work, by cloth.</h1>
    <p class="sub">Three ways the house is being worn this season. Your own photographs can replace the plates in assets/products.</p></div>
    ${stories.map(([t, d, cat]) => {
      const p = products.find((x) => x.cat === cat);
      return `<section class="editorial" style="margin-bottom:12px"><div><div class="kicker">${esc(cat)}</div><h2>${esc(t)}</h2><p>${esc(d)}</p><a class="btn" href="#/shop?cat=${encodeURIComponent(cat)}">Shop ${esc(cat)}</a></div><a class="plate" href="#/product/${p?.id ?? 0}" style="background-image:url(${esc(p?.img || "")})"></a></section>`;
    }).join("")}
    <div class="wrap look" style="padding:28px 0">${groups.map((c) => {
      const p = products.find((x) => x.cat === c);
      return `<a class="tile" href="#/shop?cat=${encodeURIComponent(c)}" style="background:linear-gradient(165deg,${p.c},#120f0c 70%);min-height:220px"><b>${esc(c)}</b><span>${esc(p.fabric)}</span></a>`;
    }).join("")}</div>`;
}
function ordersPage() {
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem("jtc-orders") || "[]"); } catch (e) {}
  return `<div class="wrap page-intro"><div class="kicker">This browser</div><h1>Orders you started here.</h1>
    <p class="sub">Each one still needs the phone number from checkout. The studio desk keeps the full book.</p></div>
    <div class="wrap" style="padding-bottom:64px">${hist.map((o) => `<article class="card" style="margin-bottom:10px"><b>#${esc(o.id)}</b><div class="mut tiny">${new Date(o.at).toLocaleString("en-NG")}</div><a class="btn sm" href="/?order=${encodeURIComponent(o.id)}&phone=${encodeURIComponent(o.phone)}#/track">Track</a></article>`).join("") || `<p class="empty">No orders on this browser yet.</p>`}</div>`;
}

function payPage() {
  return `<div class="wrap page-intro"><div class="kicker">Flexible payment</div><h1>Start on a deposit. Collect when it is finished and paid.</h1>
    <p class="sub">Two, three or four payments, fourteen days apart. The first slice is at least 40%. Late by more than a week and we pause the order and call you.</p></div>
    <div class="wrap split" style="padding-bottom:70px">
      <div class="card">
        <h3>Calculator</h3>
        <div class="field"><label>Order amount (₦)</label><input id="ca" type="number" min="1000" value="80000"></div>
        <div class="field"><label>Payments</label><select id="cn"><option value="2">2 · half and half</option><option value="3" selected>3 · 40 / 30 / 30</option><option value="4">4 · 40 / 20 / 20 / 20</option></select></div>
        <div class="sch" id="cs"></div>
        <div class="band" style="margin-top:12px">${(config.promos || [{ code: "ATELIER10", label: "10% atelier courtesy" }]).map((p) => `<span class="chip">${esc(p.code)} · ${esc(p.label)}</span>`).join("")}</div>
      </div>
      <div class="steps">
        <article><div><b>Before cutting</b><p class="mut">Cancel and we refund what you paid, minus the payment processor’s fee.</p></div></article>
        <article><div><b>After cutting</b><p class="mut">The cloth is already yours. The deposit stays with the studio.</p></div></article>
        <article><div><b>Fit</b><p class="mut">Tell us within 7 days of delivery and we correct the fit without a new charge.</p></div></article>
        <article><div><b>Release</b><p class="mut">Ready is not the same as collected. Delivery waits for “Fully paid”.</p></div></article>
      </div>
    </div>`;
}

const views = { home, shop, product, checkout, track, atelier, studio, lookbook, orders: ordersPage, pay: payPage };

function render() {
  const r = parseHash();
  const view = views[r.name] || home;
  $("#app").innerHTML = products.length || r.name === "home" ? view(r) : `<div class="wrap page-intro"><h1>Opening the studio…</h1></div>`;
  if (!products.length && r.name === "home") $("#app").innerHTML = `<div class="wrap page-intro"><h1>Opening the studio…</h1><p class="mut">If this stays here, start the server from the backend folder.</p></div>`;
  setActive();
  if (keepSearch && $("#q")) { $("#q").focus(); const n = $("#q").value.length; $("#q").setSelectionRange(n, n); keepSearch = false; }
  if (r.name === "checkout") refreshCheckout();
  if (r.name === "pay") paintCalc();
  if (r.name === "track") {
    const preset = new URLSearchParams(location.search);
    if (preset.get("order") && preset.get("phone")) showTrack(preset.get("order"), preset.get("phone"));
  }
  const solid = r.name !== "home";
  $("#hd").classList.toggle("s", solid || scrollY > 8);
}

function paintCalc() {
  const box = $("#cs");
  if (!box) return;
  const lines = moneyLines(Math.max(+$("#ca").value || 0, 0), +$("#cn").value);
  box.innerHTML = lines.map((l) => `<div><span>${l.label}</span><b>${N(l.amount)}</b></div>`).join("");
}

function shopQuery(patch) {
  const r = parseHash();
  const q = new URLSearchParams(r.name === "shop" ? r.q : "");
  Object.entries(patch).forEach(([k, v]) => { if (v) q.set(k, v); else q.delete(k); });
  location.hash = "#/shop" + (q.toString() ? "?" + q.toString() : "");
}

document.body.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (act === "wish") { toggleWish(el.dataset.id); return; }
  if (act === "quick") { const p = byId(el.dataset.id); addCart(p.id, p.sizes[Math.min(2, p.sizes.length - 1)], 1, p.colors?.[0]?.name); openBag(true); return; }
  if (act === "add") { addCart(+el.dataset.id, el.dataset.size, +el.dataset.qty || 1, el.dataset.color); openBag(true); return; }
  if (act === "size") { pick[el.dataset.id] = el.dataset.size; render(); return; }
  if (act === "color") { pick[el.dataset.id + "c"] = el.dataset.color; render(); return; }
  if (act === "pqty") { const id = el.dataset.id; const p = byId(id); const cur = pick[id + "q"] || 1; const cap = p && p.stock != null ? p.stock : 10; pick[id + "q"] = Math.max(1, Math.min(cap || 1, 10, cur + (+el.dataset.dir || 1))); render(); return; }
  if (act === "guide") { $("#guide")?.showModal(); return; }
  if (act === "qv") { openQuick(el.dataset.id); return; }
  if (act === "cat") { shopQuery({ cat: el.dataset.cat === "All" ? "" : el.dataset.cat, saved: "" }); return; }
  if (act === "band") { shopQuery({ band: el.dataset.band }); return; }
  if (act === "layout") { shopQuery({ view: el.dataset.view === "list" ? "list" : "" }); return; }
  if (act === "saved") { shopQuery({ saved: "1", cat: "" }); return; }
  if (act === "plus") { cart[+el.dataset.k].q = Math.min(10, cart[+el.dataset.k].q + 1); paintBag(); return; }
  if (act === "minus") { const i = cart[+el.dataset.k]; if (--i.q < 1) cart.splice(+el.dataset.k, 1); paintBag(); if (!cart.length && parseHash().name === "checkout") render(); return; }
  if (act === "drop") { cart.splice(+el.dataset.k, 1); paintBag(); if (!cart.length && parseHash().name === "checkout") render(); return; }
});

document.body.addEventListener("change", (e) => {
  if (e.target.id === "so") shopQuery({ sort: e.target.value });
  if (e.target.dataset.act === "plan") { pick.plan = e.target.value; render(); }
  if (e.target.form && e.target.form.id === "checkout") refreshCheckout();
});
document.body.addEventListener("input", (e) => {
  if (e.target.id === "q") {
    clearTimeout(inputQ);
    inputQ = setTimeout(() => { keepSearch = true; shopQuery({ q: e.target.value }); }, 250);
  }
  if (e.target.id === "ca" || e.target.id === "cn") paintCalc();
  if (e.target.id === "sq") paintSearch(e.target.value);
  if (e.target.name === "promo" && e.target.form?.id === "checkout") {
    clearTimeout(promoTimer);
    promoTimer = setTimeout(async () => {
      const code = e.target.value.trim();
      if (!code) { promoQuote = { off: 0, label: "", code: "" }; refreshCheckout(); return; }
      try {
        const r = await fetch("/api/promo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, goods: goodsTotal() }) });
        const j = await r.json();
        promoQuote = r.ok ? j : { off: 0, label: "", code: "", error: j.error };
      } catch (err) { promoQuote = { off: 0, code: "", error: "Could not check that code" }; }
      refreshCheckout();
    }, 280);
  }
});
let promoTimer;
let inputQ;

document.body.addEventListener("submit", async (e) => {
  const form = e.target;
  if (form.id === "review") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const id = form.dataset.id;
    try {
      const r = await fetch("/api/products/" + id + "/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save the note");
      delete reviewCache[id];
      reviewLoading[id] = false;
      toast("Note saved");
      loadReviews(id);
    } catch (err) { toast(err.message); }
    return;
  }
  if (form.id === "news") {
    e.preventDefault();
    try {
      const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: $("#ne").value }) });
      toast(r.ok ? "You are on the list." : "Could not subscribe");
      if (r.ok) form.reset();
    } catch (err) { toast("Could not subscribe"); }
    return;
  }
  if (form.id === "checkout") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const btn = form.querySelector("button");
    btn.disabled = true;
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, phone: data.phone, email: data.email, address: data.address, note: data.note,
          delivery: data.delivery, plan: +data.plan, promo: data.promo,
          items: cart.map((i) => ({ id: i.id, qty: i.q, size: i.z, color: i.c })),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not start checkout");
      rememberOrder(j.orderId, data.phone);
      cart = []; saveBag(); paintBag(); promoQuote = { off: 0, label: "", code: "" };
      location.href = j.authorization_url;
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
    }
    return;
  }
  if (form.id === "track") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    showTrack(data.id, data.phone);
    return;
  }
  if (form.id === "atelier") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const measures = {};
    ["Chest", "Waist", "Shoulder", "Sleeve", "Top length", "Trouser length"].forEach((k) => { if (data[k]) measures[k] = data[k]; });
    const payload = { name: data.name, phone: data.phone, email: data.email, style: data.style, fabric: data.fabric, needed: data.needed, payment: data.payment, notes: data.notes, measures };
    try { await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch (err) {}
    const msg = `JTC atelier request\nName: ${data.name}\nPhone: ${data.phone}\nStyle: ${data.style}\nFabric: ${data.fabric || "-"}\nNeeded: ${data.needed || "-"}\nPayment: ${data.payment}\n` + Object.entries(measures).map(([k, v]) => `${k}: ${v}`).join("\n") + `\nNotes: ${data.notes || "-"}`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
    toast("Saved, and WhatsApp is opening");
    form.reset();
    return;
  }
  if (form.id === "studio") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not book");
      const msg = `JTC fitting\nName: ${data.name}\nPhone: ${data.phone}\nWhen: ${data.date} ${data.time}\nService: ${data.service}\n${data.note || ""}`;
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
      toast("Fitting requested · " + j.id);
      form.reset();
    } catch (err) { toast(err.message); }
  }
});

function openQuick(id) {
  const p = byId(id);
  const dlg = $("#qv");
  if (!p || !dlg) return;
  const size = p.sizes[Math.min(2, p.sizes.length - 1)];
  dlg.innerHTML = `<form method="dialog" class="dlg-head"><b>${esc(p.name)}</b><button value="cancel">Close</button></form>
    <div class="split"><div class="stage">${swatch(p)}</div><div>
      <div class="kicker">${esc(p.cat)} · ${esc(p.fabric)}</div>
      <p class="price">${N(p.price)}</p>
      <p>${esc(p.desc)}</p>
      <p class="mut tiny">${(p.colors || []).map((c) => esc(c.name)).join(" · ")} · sizes ${p.sizes.map(esc).join(" ")}</p>
      <div class="row" style="margin-top:12px">
        <button class="btn" type="button" data-act="add" data-id="${p.id}" data-size="${esc(size)}" data-color="${esc(p.colors?.[0]?.name || "")}" ${p.stock === 0 ? "disabled" : ""}>Add ${esc(size)}</button>
        <a class="btn ghost" href="#/product/${p.id}">Full page</a>
      </div>
    </div></div>`;
  dlg.showModal();
}
function paintSearch(q) {
  const box = $("#sres");
  if (!box) return;
  const s = (q || "").trim().toLowerCase();
  const list = (!s ? products.filter((p) => p.featured) : products.filter((p) => (p.name + p.cat + p.fabric + (p.season || "")).toLowerCase().includes(s))).slice(0, 8);
  box.innerHTML = list.map((p) => `<a href="#/product/${p.id}"><b>${esc(p.name)}</b><span>${esc(p.cat)} · ${N(p.price)}</span></a>`).join("") || `<p class="mut">Nothing under that name.</p>`;
}
$("#searchb").onclick = () => { const d = $("#searchd"); d.showModal(); paintSearch($("#sq").value); $("#sq").focus(); };
$("#searchd").addEventListener("click", (e) => { if (e.target.tagName === "A") $("#searchd").close(); });
$("#qv").addEventListener("click", (e) => { if (e.target.closest("[data-act='add']")) $("#qv").close(); });
addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
    e.preventDefault();
    $("#searchb").click();
  }
});
$("#cb").onclick = () => openBag(true);
$("#cx").onclick = $("#ov").onclick = () => openBag(false);
$("#gocheck")?.addEventListener("click", () => openBag(false));
$("#wishb").onclick = () => { location.hash = "#/shop?saved=1"; };
$("#burger").onclick = () => $("#lk").classList.toggle("show");
$("#lk").onclick = () => $("#lk").classList.remove("show");
$("#th").onclick = () => {
  const d = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = d ? "light" : "dark";
  localStorage.setItem("jtc-theme", d ? "light" : "dark");
};
if (localStorage.getItem("jtc-theme")) document.documentElement.dataset.theme = localStorage.getItem("jtc-theme");
addEventListener("hashchange", render);
addEventListener("scroll", () => $("#hd").classList.toggle("s", scrollY > 8 || parseHash().name !== "home"), { passive: true });

paintBag();
Promise.all([
  fetch("/api/products").then((r) => r.json()),
  fetch("/api/config").then((r) => r.json()),
]).then(([list, cfg]) => {
  products = list;
  config = cfg;
  render();
}).catch(() => {
  $("#app").innerHTML = `<div class="wrap page-intro"><h1>The studio server is not running.</h1><p>From the backend folder run <b>npm start</b>, then open this site at the address it prints.</p></div>`;
});
