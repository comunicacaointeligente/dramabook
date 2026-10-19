/* =========================================================
   filtro.js — 🎛️ Filtro avançado (combina vários critérios)
   Ex.: Netflix + Dublado + Romance. Entre grupos vale "E";
   dentro de um grupo vale "OU" (Netflix ou Viki), exceto nos
   grupos marcados `todos: true` (Romance E Comédia = rom-com).
   ========================================================= */
import { $, STATE, getNota, streamingList, nivelConteudo, toast } from "./store.js";
import { CATEGORY_MENU, EXPERIENCIAS, CONTEUDO, PAGE_SIZE } from "./config.js";
import { matchFacet, temExperiencia } from "./filters.js";
import { ehStreaming, infoPlataforma } from "./plataformas.js";
import { inList } from "./user.js";
import { renderCards, hydrateImages } from "../components/card.js";
import { logoStreaming } from "./logos.js";

/* Nome único da plataforma ("Prime" e "Prime Video" viram o mesmo botão). */
const nomePlat = (p) => infoPlataforma(p)?.nome || String(p).trim();

const EXP_FILTRO = ["maratona", "lencinhos", "comfort", "leves", "quimica", "borboletas",
  "saudaveis", "viciante", "primeiro", "joias"];

/* Cada grupo: opções { v, label, teste(d) }. */
function montarGrupos() {
  const contPlat = {};
  STATE.all.forEach(d => new Set(streamingList(d).filter(ehStreaming).map(nomePlat)).forEach(p => (contPlat[p] = (contPlat[p] || 0) + 1)));
  const plats = Object.keys(contPlat).sort((a, b) => contPlat[b] - contPlat[a]);
  return [
    { k: "plat", titulo: "📺 Onde assistir", opcoes: plats.map(p => ({
        v: p, label: p, teste: d => streamingList(d).some(x => ehStreaming(x) && nomePlat(x) === p) })) },
    { k: "audio", titulo: "🎧 Áudio", opcoes: [
        { v: "dublado", label: "🎤 Dublado", teste: d => d.dublado === true },
        { v: "legendado", label: "📝 Só legendado", teste: d => d.dublado !== true } ] },
    { k: "gen", titulo: "🎭 Gênero e tropos", todos: true, dica: "precisa ter todos os marcados",
      opcoes: CATEGORY_MENU.filter(m => m.facet !== "all" && m.facet !== "obra_prima").map(m => ({
        v: m.facet, label: `${m.icon} ${m.label}`, teste: d => matchFacet(d, m.facet) })) },
    { k: "clima", titulo: "✨ Clima", todos: true, dica: "precisa ter todos os marcados",
      opcoes: EXP_FILTRO.map(k => EXPERIENCIAS.find(e => e.key === k)).filter(Boolean).map(e => ({
        v: e.key, label: `${e.icon} ${e.label}`, teste: d => temExperiencia(d, e.key, e.selo) })) },
    { k: "final", titulo: "🏁 Final", opcoes: [
        { v: "Feliz", label: "😊 Feliz", teste: d => d.final === "Feliz" },
        { v: "Agridoce", label: "🥲 Agridoce", teste: d => d.final === "Agridoce" },
        { v: "Triste", label: "😢 Triste", teste: d => d.final === "Triste" || d.final === "Amargo" },
        { v: "Aberto", label: "❓ Aberto", teste: d => d.final === "Aberto" } ] },
    { k: "eps", titulo: "⏱️ Tamanho", opcoes: [
        { v: "curto", label: "Até 12 episódios", teste: d => d.episodios > 0 && d.episodios <= 12 },
        { v: "medio", label: "13 a 20", teste: d => d.episodios > 12 && d.episodios <= 20 },
        { v: "longo", label: "Mais de 20", teste: d => d.episodios > 20 } ] },
    { k: "ano", titulo: "📅 Lançamento", opcoes: [
        { v: "2024", label: "2024 em diante", teste: d => d.ano >= 2024 },
        { v: "2020", label: "2020 a 2023", teste: d => d.ano >= 2020 && d.ano <= 2023 },
        { v: "2015", label: "2015 a 2019", teste: d => d.ano >= 2015 && d.ano <= 2019 },
        { v: "antigos", label: "Antes de 2015", teste: d => d.ano > 0 && d.ano < 2015 } ] },
    { k: "nota", titulo: "⭐ Nota mínima", unico: true, opcoes: [8, 8.5, 9, 9.5].map(n => ({
        v: String(n), label: `${String(n).replace(".", ",")}+`, teste: d => (getNota(d) ?? 0) >= n })) },
    { k: "cont", titulo: "🚦 Conteúdo", opcoes: Object.entries(CONTEUDO).map(([k, c]) => ({
        v: k, label: `${c.cor} ${c.label}`, teste: d => nivelConteudo(d) === k })) },
    { k: "eu", titulo: "👀 Pra mim", todos: true, opcoes: [
        { v: "nao-vi", label: "Esconder os que já assisti", teste: d => !inList("assisti", d.id) },
        { v: "quero", label: "🔖 Só da minha lista", teste: d => inList("quero", d.id) } ] },
  ];
}

const ORDENS = [
  { k: "nota", label: "Maior nota", fn: (a, b) => (getNota(b) || 0) - (getNota(a) || 0) },
  { k: "ano", label: "Mais recentes", fn: (a, b) => (b.ano || 0) - (a.ano || 0) || (getNota(b) || 0) - (getNota(a) || 0) },
  { k: "az", label: "A–Z", fn: (a, b) => String(a.titulo).localeCompare(String(b.titulo)) },
];

/* ---------- estado ---------- */
let gruposFiltro = [];
let selecao = {};          // { plat: Set, audio: Set, ... }
let ordemFiltro = "nota";
let filaFiltro = [];       // resultados ainda não desenhados (paginação)

function passaGrupo(d, g, sel) {
  if (!sel || !sel.size) return true;
  const ops = g.opcoes.filter(o => sel.has(o.v));
  return g.todos ? ops.every(o => o.teste(d)) : ops.some(o => o.teste(d));
}
function aplicaFiltro(sel) {
  return STATE.all.filter(d => gruposFiltro.every(g => passaGrupo(d, g, sel[g.k])));
}
/* Quantos resultados viriam se esta opção fosse marcada. */
function contaOpcao(g, o) {
  const atual = selecao[g.k] || new Set();
  const nova = g.todos ? new Set([...atual, o.v]) : new Set([o.v]);
  return aplicaFiltro({ ...selecao, [g.k]: nova }).length;
}

/* ---------- link compartilhável: #filtro=plat:Netflix;audio:dublado ---------- */
export function filtroParaHash() {
  const partes = Object.entries(selecao).filter(([, s]) => s.size)
    .map(([k, s]) => `${k}:${[...s].map(encodeURIComponent).join(",")}`);
  if (ordemFiltro !== "nota") partes.push(`ordem:${ordemFiltro}`);
  return partes.join(";");
}
function lerHashFiltro(txt) {
  selecao = {}; ordemFiltro = "nota";
  for (const parte of String(txt || "").split(";")) {
    const [k, v] = parte.split(":");
    if (!k || !v) continue;
    if (k === "ordem") { ordemFiltro = v; continue; }
    selecao[k] = new Set(v.split(",").map(decodeURIComponent));
  }
}

/* ---------- tela ---------- */
export function abrirFiltro(hashTxt) {
  if (!gruposFiltro.length) gruposFiltro = montarGrupos();
  if (hashTxt !== undefined) lerHashFiltro(hashTxt);
  for (const id of ["#homeView", "#hero", "#quickfilters", "#emptyState", "#bibliotecaView", "#resultsView"]) {
    const el = $(id); if (el) el.hidden = true;
  }
  $("#filtroView").hidden = false;
  desenharFiltro();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Gênero e Clima viram tabela: cada coluna junta opções do mesmo tipo. */
const COLUNAS = {
  gen: [
    { tit: "Gênero", itens: ["Romance", "Comédia", "Emocionantes", "Ação", "Investigação", "Fantasia", "Sobrenatural", "Históricos", "Psicologia"] },
    { tit: "Romance e tropos", itens: ["Slow Burn", "Química Inesquecível", "Casamento por contrato", "Namoro de mentira", "Rivais que se apaixonam", "Green Flag", "Red Flag"] },
    { tit: "Profissões", itens: ["CEO", "Médicos", "Advogados"] },
  ],
  clima: [
    { tit: "Sentimento", itens: ["lencinhos", "comfort", "leves", "quimica", "borboletas", "saudaveis"] },
    { tit: "Ritmo e descoberta", itens: ["maratona", "viciante", "primeiro", "joias"] },
  ],
};

/* Grupos que ficam sempre à vista; o resto vai para "Mais filtros". */
const GRUPOS_TOPO = ["plat", "audio", "gen", "clima"];
let maisAberto = false;

function chipsDoGrupo(g) {
  const sel = selecao[g.k] || new Set();
  return g.opcoes.map(o => {
    const on = sel.has(o.v);
    const n = on ? null : contaOpcao(g, o);
    const vazio = !on && n === 0;
    if (g.k === "plat") {
      const info = infoPlataforma(o.v);
      return `<button class="fplat ${on ? "on" : ""}" style="--marca:${info?.cor || "#555"}" data-fgrupo="plat" data-fval="${o.v}" ${vazio ? "disabled" : ""}>
        ${logoStreaming(o.v, info?.cor)}<span class="fplat-nome">${o.label}</span>${n != null ? `<span class="fplat-n">${n}</span>` : `<span class="fplat-ok">✓</span>`}</button>`;
    }
    if (g.k === "audio") {
      return `<button class="fseg ${on ? "on" : ""}" data-fgrupo="audio" data-fval="${o.v}" ${vazio ? "disabled" : ""}>
        ${o.label}${n != null ? ` <b>${n}</b>` : ""}</button>`;
    }
    return `<button class="qf fchip ${on ? "active" : ""}" data-fgrupo="${g.k}" data-fval="${o.v}" ${vazio ? "disabled" : ""}>
      ${o.label}${n != null ? ` <b>${n}</b>` : ""}</button>`;
  }).join("");
}
/* Linha da tabela: caixinha + nome + contagem alinhada à direita. */
function linhaTabela(g, o) {
  const on = selecao[g.k]?.has(o.v);
  const n = on ? null : contaOpcao(g, o);
  const vazio = !on && n === 0;
  const nome = o.label.replace(/^\S+\s/, "");   // tira o emoji: a tabela fica limpa
  return `<button class="flinha ${on ? "on" : ""}" role="checkbox" aria-checked="${!!on}" data-fgrupo="${g.k}" data-fval="${o.v}" ${vazio ? "disabled" : ""}>
    <span class="fcaixa">${on ? "✓" : ""}</span><span class="flinha-nome">${nome}</span><span class="flinha-n">${n ?? ""}</span></button>`;
}
function tabelaGrupo(g) {
  const usados = new Set();
  const cols = COLUNAS[g.k].map(c => {
    const ops = c.itens.map(v => g.opcoes.find(o => o.v === v)).filter(Boolean);
    ops.forEach(o => usados.add(o.v));
    return { tit: c.tit, ops };
  });
  const sobra = g.opcoes.filter(o => !usados.has(o.v));   // opção nova cai na 1ª coluna
  if (sobra.length) cols[0].ops.push(...sobra);
  return `<div class="ftabela" style="--cols:${cols.length}">${cols.map(c => `
    <div class="fcol"><p class="fcol-tit">${c.tit}</p>${c.ops.map(o => linhaTabela(g, o)).join("")}</div>`).join("")}</div>`;
}

function blocoGrupo(g, extra = "") {
  const ativos = selecao[g.k]?.size || 0;
  return `<section class="fbloco fb-${g.k} ${extra}">
    <header class="fbloco-tit"><h3>${g.titulo}</h3>${g.dica ? `<span>${g.dica}</span>` : ""}${ativos ? `<em>${ativos}</em>` : ""}</header>
    ${COLUNAS[g.k] ? tabelaGrupo(g)
      : `<div class="${g.k === "plat" ? "fplats" : g.k === "audio" ? "fsegs" : "fgrupo-chips"}">${chipsDoGrupo(g)}</div>`}
  </section>`;
}

function desenharFiltro() {
  const topo = gruposFiltro.filter(g => GRUPOS_TOPO.includes(g.k));
  const resto = gruposFiltro.filter(g => !GRUPOS_TOPO.includes(g.k));
  const ativosResto = resto.reduce((n, g) => n + (selecao[g.k]?.size || 0), 0);

  const resultado = aplicaFiltro(selecao).sort(ORDENS.find(o => o.k === ordemFiltro)?.fn || ORDENS[0].fn);
  const ativos = gruposFiltro.flatMap(g => g.opcoes.filter(o => selecao[g.k]?.has(o.v)).map(o => ({ g: g.k, o })));
  const pilulas = ativos.map(({ g, o }) =>
    `<button class="fpilula" data-fgrupo="${g}" data-fval="${o.v}" title="Tirar este filtro">${o.label} <i>✕</i></button>`).join("");

  $("#filtroView").innerHTML = `
    <div class="fcabeca">
      <div>
        <p class="fcabeca-sup">Encontre o próximo dorama</p>
        <h2>🎛️ Filtro avançado</h2>
        <p class="fcabeca-sub">Combine onde assistir, áudio, gênero e clima. Cada botão mostra quantos doramas viriam.</p>
      </div>
      <button class="chip-btn ghost" data-fvoltar="1">← Início</button>
    </div>

    <div class="fgrade-topo">
      ${blocoGrupo(topo.find(g => g.k === "plat"), "fb-largo")}
      ${blocoGrupo(topo.find(g => g.k === "audio"))}
      ${blocoGrupo(topo.find(g => g.k === "gen"), "fb-largo")}
      ${blocoGrupo(topo.find(g => g.k === "clima"), "fb-largo")}
    </div>

    <button class="fmais ${maisAberto ? "aberto" : ""}" data-fmais="1">
      <span>⚙️ Mais filtros</span><small>final, tamanho, lançamento, nota, conteúdo${ativosResto ? ` · <b>${ativosResto} ativo(s)</b>` : ""}</small><i>${maisAberto ? "▲" : "▼"}</i>
    </button>
    <div class="fgrade-mais" ${maisAberto ? "" : "hidden"}>${resto.map(g => blocoGrupo(g)).join("")}</div>

    <div class="fbarra">
      <div class="fbarra-num"><b>${resultado.length}</b> <span>de ${STATE.all.length} doramas</span></div>
      <div class="fpilulas">${pilulas || `<span class="fdica">Nenhum filtro marcado: mostrando o acervo todo.</span>`}</div>
      <div class="facoes">
        <label class="fordem">Ordenar
          <select data-fordem="1">${ORDENS.map(o => `<option value="${o.k}" ${o.k === ordemFiltro ? "selected" : ""}>${o.label}</option>`).join("")}</select>
        </label>
        ${ativos.length ? `<button class="chip-btn ghost" data-flink="1">🔗 Link</button>
        <button class="chip-btn ghost" data-flimpar="1">Limpar</button>` : ""}
      </div>
    </div>
    <button class="chip-btn fver" data-fver="1">Ver ${resultado.length} doramas ↓</button>
    <div class="grid" id="filtroGrid"></div>
    <p class="empty" ${resultado.length ? "hidden" : ""}>Nenhum dorama com essa combinação. Tire algum filtro na barra acima. 🥲</p>
    <div class="load-more-wrap"><button class="chip-btn ghost" id="filtroMais" hidden>Carregar mais</button></div>`;

  filaFiltro = resultado.slice();
  maisFiltro();
}

function maisFiltro() {
  const grid = $("#filtroGrid"); if (!grid) return;
  grid.insertAdjacentHTML("beforeend", renderCards(filaFiltro.splice(0, PAGE_SIZE)));
  hydrateImages(grid);
  const b = $("#filtroMais");
  b.hidden = !filaFiltro.length;
  if (filaFiltro.length) b.textContent = `Carregar mais (${filaFiltro.length})`;
}

/* Cliques/trocas dentro da tela. Devolve true se tratou o evento. */
export function eventoFiltro(e) {
  const chip = e.target.closest("[data-fgrupo]");
  if (chip) {
    const g = gruposFiltro.find(x => x.k === chip.dataset.fgrupo);
    const v = chip.dataset.fval;
    const sel = selecao[g.k] || new Set();
    if (sel.has(v)) sel.delete(v);
    else { if (g.unico) sel.clear(); sel.add(v); }
    selecao[g.k] = sel;
    desenharFiltro();
    return true;
  }
  if (e.target.closest("[data-fmais]")) { maisAberto = !maisAberto; desenharFiltro(); return true; }
  if (e.target.closest("[data-flimpar]")) { selecao = {}; desenharFiltro(); return true; }
  if (e.target.closest("#filtroMais")) { maisFiltro(); return true; }
  if (e.target.closest("[data-fver]")) { $("#filtroGrid")?.scrollIntoView({ behavior: "smooth" }); return true; }
  if (e.target.closest("[data-flink]")) {
    const url = `${location.href.split("#")[0]}#filtro=${filtroParaHash()}`;
    navigator.clipboard?.writeText(url).then(
      () => toast("Link do filtro copiado ✓"),
      () => prompt("Copie o link:", url));
    return true;
  }
  return false;
}
export function trocaOrdemFiltro(e) {
  const s = e.target.closest("[data-fordem]");
  if (!s) return false;
  ordemFiltro = s.value;
  desenharFiltro();
  return true;
}
