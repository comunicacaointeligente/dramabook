/* =========================================================
   app.js — ponto de entrada (ES module)
   Só orquestra: importa os módulos, liga eventos, inicia.
   ========================================================= */
import { $, $$, STATE, toggleList, toast, loadCatalog } from "./js/store.js";
import { LS } from "./js/config.js";
import {
  setMinhaNota, setComentario, criarLista, removerLista, toggleNaLista,
  listasPersonalizadas, getLista, exportar, importar,
} from "./js/user.js";
import {
  renderSidebar, renderQuickfilters, renderMood, renderHome, showHome,
  showSearch, showFacet, showList, updateBadges, refreshListUI, setActiveMenu,
  bindLoadMore, toggleMood, indicarPorHumor, showBiblioteca, showListaPersonalizada,
  showResults, renderSugestoes, fecharSugestoes, filtrarPorStatus,
} from "./js/views.js";
import { openModal, closeModal } from "./components/modal.js";
import { compartilharDorama, compartilharLista, fecharFolha, copiarLink, lerListaDoLink } from "./js/share.js";

/* PWA: arquivos prontos, mas desligada por padrão (ativar quando hospedar). */
const PWA_ENABLED = false;

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  $("#themeToggle").textContent = next === "dark" ? "🌙" : "☀️";
  localStorage.setItem(LS.theme, next);
}
function closeSidebar() { $("#sidebar").classList.remove("open"); $("#sidebarScrim").classList.remove("show"); }

/* Reabre a ficha para refletir mudanças (nota, listas) sem perder o scroll. */
function refreshModal(id) {
  const card = $("#modalCard");
  const scroll = card?.scrollTop || 0;
  openModal(id);
  if (card) card.scrollTop = scroll;
}

function onClick(e) {
  /* --- listas de status (favorito / quero / assisti) --- */
  const qa = e.target.closest("[data-qa]");
  if (qa) {
    e.stopPropagation();
    const added = toggleList(qa.dataset.qa, qa.dataset.id);
    refreshListUI(qa.dataset.id); updateBadges();
    const labels = { favoritos: "Favoritos", assisti: "Já assisti", quero: "Quero assistir" };
    toast(`${added ? "Adicionado a" : "Removido de"} ${labels[qa.dataset.qa]}`);
    // ficha aberta deste dorama → re-renderiza pra atualizar os selos pessoais
    const mc = $("#modalCard");
    if (!$("#modal").hidden && mc?.dataset.doramaId === qa.dataset.id) refreshModal(qa.dataset.id);
    return;
  }

  /* --- minha nota (0–10) --- */
  const nota = e.target.closest("[data-nota]");
  if (nota) {
    e.stopPropagation();
    const v = nota.dataset.nota;
    setMinhaNota(nota.dataset.id, v === "" ? null : Number(v));
    toast(v === "" ? "Nota removida" : `Sua nota: ${v}`);
    refreshModal(nota.dataset.id);
    return;
  }

  /* --- adicionar/remover de lista personalizada (pela ficha) --- */
  const addLista = e.target.closest("[data-addlista]");
  if (addLista) {
    e.stopPropagation();
    const add = toggleNaLista(addLista.dataset.addlista, addLista.dataset.id);
    const l = getLista(addLista.dataset.addlista);
    toast(`${add ? "Adicionado a" : "Removido de"} ${l?.emoji || ""} ${l?.nome || "lista"}`);
    refreshModal(addLista.dataset.id);
    renderSidebar(); updateBadges();
    return;
  }

  /* --- compartilhar dorama / lista --- */
  const share = e.target.closest("[data-share]");
  if (share) { e.stopPropagation(); const d = STATE.byId[share.dataset.share]; if (d) compartilharDorama(d); return; }
  const shareLista = e.target.closest("[data-sharelista]");
  if (shareLista) {
    const l = getLista(shareLista.dataset.sharelista);
    if (l) compartilharLista(l, l.itens.length);
    return;
  }
  if (e.target.closest("[data-sharecopiar]")) { copiarLink($("#shareSheet").dataset.url); return; }
  if (e.target.closest("[data-sharefechar]") || e.target.id === "shareSheet") { fecharFolha(); return; }

  /* --- Minha Biblioteca / listas personalizadas --- */
  if (e.target.closest("[data-biblioteca]")) {
    closeModal(); showBiblioteca(); setActiveMenu(e.target.closest(".menu-item")); closeSidebar(); return;
  }
  const verLista = e.target.closest("[data-verlista]");
  if (verLista) {
    closeModal(); showListaPersonalizada(verLista.dataset.verlista);
    setActiveMenu(verLista.closest(".menu-item") ? verLista : null); closeSidebar(); return;
  }
  const delLista = e.target.closest("[data-dellista]");
  if (delLista) {
    const l = getLista(delLista.dataset.dellista);
    if (l && confirm(`Excluir a lista "${l.nome}"? Os doramas não são apagados.`)) {
      removerLista(l.id); renderSidebar(); showBiblioteca(); toast("Lista excluída");
    }
    return;
  }

  /* --- filtro por status nos resultados --- */
  const st = e.target.closest("[data-status]");
  if (st) { filtrarPorStatus(st.dataset.status); return; }

  /* --- navegação padrão --- */
  const open = e.target.closest("[data-open]");
  if (open) { fecharSugestoes(); openModal(open.dataset.open); return; }

  const mood = e.target.closest("[data-mood]");
  if (mood) { indicarPorHumor(mood.dataset.mood); return; }

  const card = e.target.closest(".card");
  if (card) { openModal(card.dataset.id); return; }

  const facetBtn = e.target.closest("[data-facet]");
  if (facetBtn) {
    closeModal();
    showFacet(facetBtn.dataset.facet, facetBtn.textContent.trim());
    setActiveMenu(facetBtn.classList.contains("menu-item") ? facetBtn : null);
    closeSidebar(); return;
  }
  const listBtn = e.target.closest("[data-list]");
  if (listBtn) { closeModal(); showList(listBtn.dataset.list); setActiveMenu(listBtn); closeSidebar(); return; }

  if (!e.target.closest("#mood") && !e.target.closest("#randomBtn")) toggleMood(false);
}

/* Comentário pessoal — salva enquanto digita (com debounce). */
let tComent;
function onInput(e) {
  const ta = e.target.closest("[data-coment]");
  if (!ta) return;
  clearTimeout(tComent);
  tComent = setTimeout(() => { setComentario(ta.dataset.coment, ta.value); }, 400);
}

/* Criar lista + backup (elementos existem só na tela Minha Biblioteca). */
function onBibliotecaAction(e) {
  if (e.target.id === "criarLista") {
    const nome = $("#novaListaNome")?.value.trim();
    const emoji = $("#novaListaEmoji")?.value.trim() || "💜";
    if (!nome) { toast("Dê um nome para a lista"); return; }
    criarLista(nome, emoji);
    renderSidebar(); showBiblioteca(); toast("Lista criada ✓");
  }
  if (e.target.id === "exportarBib") {
    const blob = new Blob([exportar()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "minha-biblioteca-dramabook.json";
    a.click(); URL.revokeObjectURL(a.href);
    toast("Biblioteca exportada ✓");
  }
}
function onFile(e) {
  if (e.target.id !== "importarBib") return;
  const file = e.target.files?.[0]; if (!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    try { importar(fr.result); renderSidebar(); updateBadges(); showBiblioteca(); toast("Biblioteca importada ✓"); }
    catch { toast("Arquivo inválido"); }
  };
  fr.readAsText(file);
}

/* Deep link: #d=<id> abre a ficha; #lista=<b64> abre uma lista compartilhada. */
function aplicarHash() {
  const h = location.hash.slice(1);
  if (h.startsWith("d=")) {
    const id = decodeURIComponent(h.slice(2));
    if (STATE.byId[id]) openModal(id);
  } else if (h.startsWith("lista=")) {
    const l = lerListaDoLink(h.slice(6));
    if (!l) return;
    const itens = (l.i || []).map((id) => STATE.byId[id]).filter(Boolean);
    showResults(`${l.e || "💜"} ${l.n || "Lista compartilhada"}`, itens);
    toast(`Lista compartilhada: ${itens.length} dorama(s)`);
  }
}

function wireEvents() {
  const si = $("#searchInput");
  si.addEventListener("input", () => {
    $("#searchClear").hidden = !si.value;
    renderSugestoes(si.value);
    showSearch(si.value);
  });
  si.addEventListener("focus", () => renderSugestoes(si.value));
  $("#searchClear").addEventListener("click", () => { si.value = ""; fecharSugestoes(); showHome(); si.focus(); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".search-wrap")) fecharSugestoes(); });

  document.addEventListener("click", onClick);
  document.addEventListener("click", onBibliotecaAction);
  document.addEventListener("input", onInput);
  document.addEventListener("change", onFile);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); toggleMood(false); fecharFolha(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("card")) {
      e.preventDefault(); openModal(e.target.dataset.id);
    }
  });

  $("#logoHome").addEventListener("click", e => { e.preventDefault(); showHome(); });
  $("#backHome").addEventListener("click", showHome);
  $("#randomBtn").addEventListener("click", e => { e.stopPropagation(); toggleMood(); });
  $("#modalScrim").addEventListener("click", closeModal);
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#menuToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open"); $("#sidebarScrim").classList.toggle("show");
  });
  $("#sidebarScrim").addEventListener("click", closeSidebar);
  window.addEventListener("hashchange", aplicarHash);
  bindLoadMore();
}

function showLoadError() {
  $("#homeView").hidden = true;
  $("#resultsView").hidden = false;
  $("#backHome").hidden = true;
  $("#resultsTitle").textContent = "Não foi possível carregar o acervo";
  $("#resultsGrid").innerHTML = `<p class="empty" style="grid-column:1/-1">
    Rode um servidor na pasta: <code>python3 -m http.server 8080</code> e abra <code>http://localhost:8080</code>.</p>`;
}

async function init() {
  const theme = localStorage.getItem(LS.theme) || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  $("#themeToggle").textContent = theme === "dark" ? "🌙" : "☀️";

  renderSidebar(); renderQuickfilters(); renderMood();
  wireEvents(); updateBadges();

  const ok = await loadCatalog();
  ok ? renderHome() : showLoadError();
  if (ok) aplicarHash();

  if (PWA_ENABLED && "serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

init();
