/* =========================================================
   views.js — telas e renderização (home, resultados, menu)
   ========================================================= */
import { $, $$, STATE, itemsInList, itemsDaLista, toast, resolvePoster, flag } from "./store.js";
import { LIST_MENU, CATEGORY_MENU, QUICK_FILTERS, MOODS, PAGE_SIZE, EXPERIENCIAS } from "./config.js";
import { inList, listaIds, listasPersonalizadas, getLista } from "./user.js";
import { renderBiblioteca } from "../components/biblioteca.js";
import { byFacet, search, topRated, latest, masterpieces, pickRandom, byExperiencia } from "./filters.js";
import { renderCards, hydrateImages, statusHTML } from "../components/card.js";
import { renderRail } from "../components/rail.js";
import { renderHero } from "../components/hero.js";
import { openModal } from "../components/modal.js";

/* ---------- menu lateral (data-driven) ---------- */
export function renderSidebar() {
  const listHtml = LIST_MENU.map(m =>
    `<button class="menu-item" data-list="${m.list}">${m.icon} ${m.label} <span class="badge" id="${m.badge}">0</span></button>`).join("");
  const catHtml = CATEGORY_MENU.map(m =>
    `<button class="menu-item" data-facet="${m.facet}">${m.icon} ${m.label}</button>`).join("");
  const minhas = listasPersonalizadas();
  const minhasHtml = minhas.length
    ? `<p class="menu-label">Listas personalizadas</p>` + minhas.map(l =>
        `<button class="menu-item" data-verlista="${l.id}">${l.emoji} ${l.nome} <span class="badge">${l.itens.length}</span></button>`).join("")
    : "";
  const expHtml = EXPERIENCIAS.map(e =>
    `<button class="menu-item" data-exp="${e.key}">${e.icon} ${e.label}</button>`).join("");
  $("#menu").innerHTML = `
    <button class="menu-item destaque" data-biblioteca="1">📚 Minha Biblioteca</button>
    <p class="menu-label">Minhas listas</p>${listHtml}
    ${minhasHtml}
    <p class="menu-label">✨ Descubra por experiência</p>${expHtml}
    <p class="menu-label">Categorias</p>${catHtml}`;
}

export function showExperiencia(key) {
  const e = EXPERIENCIAS.find(x => x.key === key);
  if (!e) return;
  showResults(`${e.icon} ${e.label}`, byExperiencia(key));
}

/* ---------- chips + humor ---------- */
export function renderQuickfilters() {
  $("#quickfilters").innerHTML = QUICK_FILTERS.map(f => `<button class="qf" data-facet="${f}">${f}</button>`).join("");
}
export function renderMood() {
  $("#mood").innerHTML = `
    <p class="mood-title">Me indique um dorama…</p>
    <div class="mood-opts">${MOODS.map(m => `<button class="mood-opt" data-mood="${m.key}">${m.emoji} ${m.label}</button>`).join("")}</div>`;
}
export function indicarPorHumor(key) {
  const mood = MOODS.find(m => m.key === key);
  const pool = !mood || !mood.facets.length ? STATE.all : STATE.all.filter(d => mood.facets.some(f => byFacet(f).includes(d)));
  const pick = pickRandom(pool.length ? pool : STATE.all);
  if (pick) { toggleMood(false); openModal(pick.id); }
}

/* ---------- home ---------- */
export function renderHome() {
  const empty = !STATE.all.length;
  $("#resultsView").hidden = true;
  $("#bibliotecaView").hidden = true;
  $("#homeView").hidden = false;
  $("#emptyState").hidden = !empty;
  $("#hero").hidden = empty;
  $("#quickfilters").hidden = empty;
  $$("#homeView .rail").forEach(r => (r.hidden = empty));
  if (empty) return;

  renderRail($('[data-rail="ultimos"]'), { title: "🆕 Últimos adicionados", sub: "recém-chegados ao acervo", items: latest(14) });
  renderRail($('[data-rail="melhores"]'), { title: "🏆 Mais bem avaliados", sub: "as maiores notas da curadoria", items: topRated(14) });
  renderRail($('[data-rail="obras"]'), { title: "⭐ Obras-primas", sub: "os imperdíveis", items: masterpieces() });
  renderRail($('[data-rail="top100"]'), { title: "🔥 Top 100", sub: "ranking geral", items: topRated(100) });
  renderHero(pickRandom(topRated(5)));
  hydrateImages(document);
}

/* ---------- sugestões instantâneas da busca ---------- */
export function renderSugestoes(q) {
  const el = $("#suggest");
  const termo = q.trim();
  if (!termo) { el.hidden = true; el.innerHTML = ""; return; }
  const achados = search(termo).slice(0, 7);
  if (!achados.length) { el.hidden = true; el.innerHTML = ""; return; }
  el.innerHTML = achados.map(d => {
    const poster = resolvePoster(d);
    return `<button class="sg" data-open="${d.id}">
      <span class="sg-poster">${poster ? `<img src="${poster}" alt="" loading="lazy">` : ""}</span>
      <span class="sg-txt">
        <b>${d.titulo}${d.titulo_br && d.titulo_br !== d.titulo ? ` <i class="sg-br">(${d.titulo_br})</i>` : ""}</b>
        <i>${flag(d.pais)} ${d.ano || ""}${d.titulo_original ? " · " + d.titulo_original : ""}</i>
      </span>
      <span class="sg-status">${statusHTML(d.id)}</span>
    </button>`;
  }).join("");
  el.hidden = false;
}
export function fecharSugestoes() { const el = $("#suggest"); if (el) { el.hidden = true; el.innerHTML = ""; } }

/* ---------- resultados (com paginação p/ escala) ---------- */
let _pending = [];
let _todos = [];        // resultado completo, antes do filtro de status
let _titulo = "";
let _statusFiltro = "todos";

const STATUS_CHIPS = [
  { k: "todos", label: "Todos" },
  { k: "nao-assisti", label: "👀 Não assisti" },
  { k: "assisti", label: "✅ Já assisti" },
  { k: "favoritos", label: "❤️ Favoritos" },
  { k: "quero", label: "🔖 Quero assistir" },
];

function aplicaStatus(items) {
  if (_statusFiltro === "todos") return items;
  if (_statusFiltro === "nao-assisti") return items.filter(d => !inList("assisti", d.id));
  return items.filter(d => inList(_statusFiltro, d.id));
}

function renderStatusChips() {
  const el = $("#statusFiltros");
  if (!el) return;
  el.innerHTML = STATUS_CHIPS.map(c => {
    const n = c.k === "todos" ? _todos.length
      : c.k === "nao-assisti" ? _todos.filter(d => !inList("assisti", d.id)).length
      : _todos.filter(d => inList(c.k, d.id)).length;
    return `<button class="qf ${_statusFiltro === c.k ? "active" : ""}" data-status="${c.k}">${c.label} <b>${n}</b></button>`;
  }).join("");
}

/* Reaplica o filtro de status sobre o último resultado (sem refazer a busca). */
export function filtrarPorStatus(k) {
  _statusFiltro = k;
  renderStatusChips();
  pintarResultados(aplicaStatus(_todos));
}

export function showResults(title, items) {
  $("#homeView").hidden = true;
  $("#hero").hidden = true;
  $("#quickfilters").hidden = true;
  $("#emptyState").hidden = true;
  $("#bibliotecaView").hidden = true;
  $("#resultsView").hidden = false;
  $("#backHome").hidden = false;
  _todos = items.slice();
  _titulo = title;
  _statusFiltro = "todos";
  $("#resultsTitle").textContent = title;
  renderStatusChips();
  pintarResultados(items);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Desenha a grade a partir de uma lista já filtrada. */
function pintarResultados(items) {
  $("#resultsCount").textContent = items.length ? `${items.length} título(s)` : "";
  const grid = $("#resultsGrid");
  grid.innerHTML = "";
  _pending = items.slice();
  $("#resultsEmpty").hidden = items.length > 0;
  appendPage();
}
function appendPage() {
  const grid = $("#resultsGrid");
  const chunk = _pending.splice(0, PAGE_SIZE);
  grid.insertAdjacentHTML("beforeend", renderCards(chunk));
  hydrateImages(grid);
  const more = $("#loadMore");
  more.hidden = _pending.length === 0;
  if (!more.hidden) more.textContent = `Carregar mais (${_pending.length})`;
}
export function bindLoadMore() { $("#loadMore").addEventListener("click", appendPage); }

export function showHome() {
  const si = $("#searchInput"); if (si) si.value = "";
  $("#searchClear").hidden = true;
  setActiveMenu(null);
  renderHome();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showSearch(q) {
  if (!q.trim()) { showHome(); return; }
  showResults(`Resultados para “${q.trim()}”`, search(q));
}
export function showFacet(facet, label) {
  if (facet === "all") { showHome(); return; }
  showResults(label || facet, byFacet(facet));
}
export function showList(list) {
  const labels = { favoritos: "❤️ Favoritos", assisti: "✅ Já assisti", quero: "🔖 Quero assistir" };
  showResults(labels[list], itemsInList(list));
}

/* ---------- estado de UI ---------- */
export function updateBadges() {
  LIST_MENU.forEach(m => { const el = $("#" + m.badge); if (el) el.textContent = listaIds(m.list).length; });
}
export function refreshListUI(id) {
  $$(`.qa[data-id="${id}"]`).forEach(b => b.classList.toggle("on", inList(b.dataset.qa, id)));
  $$(`.mbtn[data-qa][data-id="${id}"]`).forEach(b => b.classList.toggle("on", inList(b.dataset.qa, id)));
  // selos de status no card, nas sugestões e no hero — o "✅ Assistido" nunca some
  $$(`.card[data-id="${id}"] .card-status`).forEach(el => (el.innerHTML = statusHTML(id)));
  $$(`.sg[data-open="${id}"] .sg-status`).forEach(el => (el.innerHTML = statusHTML(id)));
  $$(`.hero-status[data-id="${id}"]`).forEach(el => (el.innerHTML = statusHTML(id)));
  renderStatusChips();
}

/* ---------- Minha Biblioteca ---------- */
export function showBiblioteca() {
  $("#homeView").hidden = true;
  $("#resultsView").hidden = true;
  $("#hero").hidden = true;
  $("#quickfilters").hidden = true;
  $("#emptyState").hidden = true;
  $("#bibliotecaView").hidden = false;
  renderBiblioteca();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
export function showListaPersonalizada(listaId) {
  const l = getLista(listaId);
  if (!l) { toast("Lista não encontrada"); return; }
  showResults(`${l.emoji} ${l.nome}`, itemsDaLista(listaId));
}
export function setActiveMenu(el) {
  $$(".menu-item").forEach(m => m.classList.remove("active"));
  if (el) el.classList.add("active");
}

/* ---------- popover de humor ---------- */
export function toggleMood(force) {
  const m = $("#mood");
  const open = force === undefined ? m.hidden : force;
  m.hidden = !open;
}
