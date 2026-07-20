
const defaultRecipes = window.FMK_RECIPES || {};
const app = document.querySelector("#app");
const dialog = document.querySelector("#addRecipeDialog");
const addForm = document.querySelector("#addRecipeForm");

const state = {
  recipes: loadCustomRecipes(),
  favorites: JSON.parse(localStorage.getItem("fmk-favorites") || "[]"),
  shopping: JSON.parse(localStorage.getItem("fmk-shopping") || "[]"),
  search: "",
  activeCategory: "All Recipes",
  currentRecipe: null,
  cookStep: 0
};

function loadCustomRecipes() {
  const saved = JSON.parse(localStorage.getItem("fmk-custom-recipes") || "{}");
  return { ...defaultRecipes, ...saved };
}
function recipeEntries() { return Object.entries(state.recipes); }
function saveFavorites() { localStorage.setItem("fmk-favorites", JSON.stringify(state.favorites)); }
function saveShopping() { localStorage.setItem("fmk-shopping", JSON.stringify(state.shopping)); }
function saveCustomRecipes() {
  const custom = Object.fromEntries(recipeEntries().filter(([id]) => id.startsWith("custom-")));
  localStorage.setItem("fmk-custom-recipes", JSON.stringify(custom));
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function toast(message) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}
function categoryIcon(category="") {
  const c = category.toLowerCase();
  if (c.includes("pasta")) return "🍝";
  if (c.includes("chicken")) return "🍗";
  if (c.includes("bread") || c.includes("baked")) return "🥖";
  if (c.includes("dessert")) return "🍪";
  if (c.includes("beef")) return "🥘";
  if (c.includes("soup")) return "🍲";
  return "🍽️";
}
function getFilteredRecipes() {
  return recipeEntries().filter(([id,r]) => {
    const q = state.search.trim().toLowerCase();
    const matchesSearch = !q || `${r.title} ${r.category} ${r.description}`.toLowerCase().includes(q);
    const matchesCategory = state.activeCategory === "All Recipes" || r.category === state.activeCategory;
    return matchesSearch && matchesCategory;
  });
}
function cardMarkup(id, r) {
  const favorite = state.favorites.includes(id);
  return `<article class="recipe-card">
    <button class="recipe-card-main" data-recipe="${id}">
      <img class="recipe-image" src="${escapeHTML(r.image || 'images/decor/approved-homepage-reference.png')}" alt="${escapeHTML(r.title)}">
      <div class="recipe-card-body">
        <span class="category-label">${escapeHTML(r.category || "My Recipes")}</span>
        <h3>${escapeHTML(r.title)}</h3>
        <p>${escapeHTML(r.description || "")}</p>
      </div>
    </button>
    <button class="favorite-btn" data-favorite="${id}" aria-label="Favorite ${escapeHTML(r.title)}">${favorite ? "♥" : "♡"}</button>
  </article>`;
}
function renderHome() {
  state.currentRecipe = null;
  const categories = ["All Recipes", ...new Set(recipeEntries().map(([,r]) => r.category).filter(Boolean))];
  const filtered = getFilteredRecipes();
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Welcome to</p>
        <h1>From My Kitchen ♡</h1>
        <p>Grab a cup of something warm, find something delicious, and let's cook together.</p>
        <label class="search-wrap"><span>⌕</span><input class="search-input" id="recipeSearch" value="${escapeHTML(state.search)}" placeholder="Search recipes or ingredients..."></label>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="steam">~</div><div class="pitcher"></div></div>
    </section>

    <section class="note-grid">
      <article class="note-card"><h3>Kitchen Notes</h3><p>Taste as you go. The best recipes leave room for a little instinct.</p></article>
      <article class="note-card"><h3>Today's Plan</h3><p>Choose one recipe, turn on some music, and make the kitchen smell wonderful.</p></article>
    </section>

    <div class="section-head"><h2>Recipe Categories</h2><button data-action="clear-filter">View all</button></div>
    <section class="category-row">
      ${categories.map(cat => `<button class="category-chip" data-category="${escapeHTML(cat)}"><span>${categoryIcon(cat)}</span>${escapeHTML(cat)}</button>`).join("")}
    </section>

    <div class="section-head"><h2>${state.activeCategory === "All Recipes" ? "Recently Added" : escapeHTML(state.activeCategory)}</h2><span>${filtered.length} recipe${filtered.length===1?"":"s"}</span></div>
    <section class="recipe-grid">
      ${filtered.length ? filtered.map(([id,r]) => cardMarkup(id,r)).join("") : `<div class="empty-state">No recipes matched your search.</div>`}
    </section>`;
  bindHome();
  window.scrollTo({top:0});
}
function bindHome() {
  document.querySelector("#recipeSearch")?.addEventListener("input", e => {
    state.search = e.target.value;
    const filtered = getFilteredRecipes();
    document.querySelector(".recipe-grid").innerHTML = filtered.length ? filtered.map(([id,r]) => cardMarkup(id,r)).join("") : `<div class="empty-state">No recipes matched your search.</div>`;
    bindCards();
  });
  bindCards();
}
function bindCards() {
  document.querySelectorAll("[data-recipe]").forEach(b => b.onclick = () => renderRecipe(b.dataset.recipe));
  document.querySelectorAll("[data-favorite]").forEach(b => b.onclick = e => {
    e.stopPropagation(); toggleFavorite(b.dataset.favorite); renderHome();
  });
}
function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(x => x !== id) : [...state.favorites, id];
  saveFavorites();
  toast(state.favorites.includes(id) ? "Saved to favorites ♡" : "Removed from favorites");
}
function renderRecipe(id) {
  const r = state.recipes[id];
  if (!r) return renderHome();
  state.currentRecipe = id;
  const ids = recipeEntries().map(([key]) => key);
  const index = ids.indexOf(id);
  const prev = ids[(index - 1 + ids.length) % ids.length];
  const next = ids[(index + 1) % ids.length];
  app.innerHTML = `<article class="recipe-page">
    <button class="back-btn" data-view="home">← Back to recipes</button>
    <section class="recipe-banner">
      <img src="${escapeHTML(r.image || 'images/decor/approved-homepage-reference.png')}" alt="${escapeHTML(r.title)}">
      <div class="recipe-intro">
        <p class="eyebrow">from my kitchen</p>
        <h1>${escapeHTML(r.title)}</h1>
        <span class="category-label">${escapeHTML(r.category || "My Recipes")}</span>
        <p class="description">${escapeHTML(r.description || "")}</p>
        <div class="meta-row">
          <span class="meta-pill">Prep: ${escapeHTML(r.prep || "—")}</span>
          <span class="meta-pill">Cook: ${escapeHTML(r.cook || "—")}</span>
          <span class="meta-pill">Serves: ${escapeHTML(r.serves || "—")}</span>
        </div>
        <div class="action-row">
          <button class="primary-btn" data-action="cook">Cook With Me</button>
          <button class="secondary-btn" data-favorite="${id}">${state.favorites.includes(id) ? "♥ Saved" : "♡ Favorite"}</button>
          <button class="secondary-btn" data-action="add-shopping">Add to List</button>
        </div>
      </div>
    </section>

    <section class="recipe-paper">
      <div class="recipe-columns">
        <div>
          <h2>Ingredients ♡</h2>
          <ul class="ingredients">${(r.ingredients || []).map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ul>
        </div>
        <div>
          <h2>Directions ♡</h2>
          ${(r.steps || []).map((s,i) => `<div class="step"><span class="step-number">${i+1}</span><div><p>${escapeHTML(s.text || s)}</p>${s.tip ? `<p class="tip">Teaching tip: ${escapeHTML(s.tip)}</p>` : ""}</div></div>`).join("")}
        </div>
      </div>
      <aside class="kitchen-note"><h2>From My Kitchen ♡</h2><p>${escapeHTML(r.note || "Made with love.")}</p></aside>
    </section>
    <div class="recipe-pager"><button class="secondary-btn" data-recipe="${prev}">← Previous recipe</button><button class="secondary-btn" data-recipe="${next}">Next recipe →</button></div>
  </article>`;
  app.querySelector("[data-action='cook']").onclick = () => { state.cookStep=0; renderCook(); };
  app.querySelector("[data-action='add-shopping']").onclick = () => {
    for (const item of r.ingredients || []) if (!state.shopping.some(x => x.text === item)) state.shopping.push({text:item, checked:false});
    saveShopping(); toast("Ingredients added to your shopping list");
  };
  app.querySelector("[data-favorite]").onclick = () => { toggleFavorite(id); renderRecipe(id); };
  app.querySelectorAll("[data-recipe]").forEach(b => b.onclick = () => renderRecipe(b.dataset.recipe));
  app.querySelector("[data-view='home']").onclick = renderHome;
  window.scrollTo({top:0});
}
function renderCook() {
  const id = state.currentRecipe;
  const r = state.recipes[id];
  const steps = r.steps || [];
  const step = steps[state.cookStep] || {};
  const ingredients = step.ingredients || [];
  const pct = ((state.cookStep + 1) / Math.max(steps.length,1)) * 100;
  app.innerHTML = `<section class="cook-shell">
    <div class="cook-top"><div><p class="eyebrow">${escapeHTML(r.title)}</p><strong>Step ${state.cookStep+1} of ${steps.length}</strong></div><button class="secondary-btn" data-action="exit-cook">Exit</button></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <article class="cook-card">
      <div>
        <h2>${escapeHTML(step.text || step)}</h2>
        <section class="step-ingredients">
          <h3>You need for this step</h3>
          ${ingredients.length ? `<ul>${ingredients.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>` : `<p>No new ingredients for this step.</p>`}
          ${step.tip ? `<p class="tip"><strong>Kitchen tip:</strong> ${escapeHTML(step.tip)}</p>` : ""}
        </section>
      </div>
    </article>
    <div class="cook-controls">
      <button class="secondary-btn" data-action="previous-step" ${state.cookStep===0?"disabled":""}>← Previous</button>
      <button class="primary-btn" data-action="next-step">${state.cookStep===steps.length-1?"Finish ♡":"Next step →"}</button>
    </div>
  </section>`;
  app.querySelector("[data-action='exit-cook']").onclick = () => renderRecipe(id);
  app.querySelector("[data-action='previous-step']").onclick = () => { state.cookStep=Math.max(0,state.cookStep-1); renderCook(); };
  app.querySelector("[data-action='next-step']").onclick = () => {
    if (state.cookStep >= steps.length-1) { toast("Recipe complete ♡"); renderRecipe(id); }
    else { state.cookStep++; renderCook(); }
  };
  window.scrollTo({top:0});
}
function renderFavorites() {
  const items = recipeEntries().filter(([id]) => state.favorites.includes(id));
  app.innerHTML = `<section><button class="back-btn" data-view="home">← Home</button><div class="section-head"><h1 class="page-title">Favorites ♡</h1><span>${items.length}</span></div><div class="recipe-grid">${items.length ? items.map(([id,r])=>cardMarkup(id,r)).join("") : `<div class="empty-state">Tap the heart on a recipe to save it here.</div>`}</div></section>`;
  bindCards(); app.querySelector("[data-view='home']").onclick=renderHome; window.scrollTo({top:0});
}
function renderShopping() {
  app.innerHTML = `<section class="list-panel"><button class="back-btn" data-view="home">← Home</button><div class="section-head"><h1 class="page-title">Shopping List</h1><button data-action="clear-shopping">Clear all</button></div>
  <div>${state.shopping.length ? state.shopping.map((x,i)=>`<div class="list-item ${x.checked?"checked":""}"><input type="checkbox" data-check="${i}" ${x.checked?"checked":""}><span>${escapeHTML(x.text)}</span><button data-remove="${i}">×</button></div>`).join("") : `<div class="empty-state">Add ingredients from any recipe page.</div>`}</div></section>`;
  app.querySelector("[data-view='home']").onclick=renderHome;
  app.querySelector("[data-action='clear-shopping']").onclick=()=>{state.shopping=[];saveShopping();renderShopping();};
  app.querySelectorAll("[data-check]").forEach(el=>el.onchange=()=>{state.shopping[+el.dataset.check].checked=el.checked;saveShopping();renderShopping();});
  app.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{state.shopping.splice(+el.dataset.remove,1);saveShopping();renderShopping();});
  window.scrollTo({top:0});
}
document.addEventListener("click", e => {
  const view = e.target.closest("[data-view]")?.dataset.view;
  if (view === "home") renderHome();
  if (view === "favorites") renderFavorites();
  if (view === "shopping") renderShopping();
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (action === "open-add") dialog.showModal();
  if (action === "close-add") dialog.close();
  if (action === "clear-filter") { state.activeCategory="All Recipes"; renderHome(); }
  const category = e.target.closest("[data-category]")?.dataset.category;
  if (category) { state.activeCategory=category; renderHome(); }
});
addForm.addEventListener("submit", e => {
  e.preventDefault();
  const fd = new FormData(addForm);
  const id = `custom-${Date.now()}`;
  state.recipes[id] = {
    title: fd.get("title").trim(),
    category: fd.get("category").trim() || "My Recipes",
    description: fd.get("description").trim(),
    prep: "—", cook: "—", serves: "—",
    image: "images/decor/approved-homepage-reference.png",
    ingredients: fd.get("ingredients").split("\n").map(x=>x.trim()).filter(Boolean),
    steps: fd.get("steps").split("\n").map(x=>x.trim()).filter(Boolean).map(text=>({text,ingredients:[],tip:""})),
    note: "Added to From My Kitchen with love."
  };
  saveCustomRecipes(); addForm.reset(); dialog.close(); toast("Recipe saved ♡"); renderRecipe(id);
});
renderHome();
