/* =========================================================
   user.js — MINHA BIBLIOTECA: camada de dados PESSOAIS
   100% local (localStorage), separada do banco editorial (doramas.json).
   Estrutura versionada e exportável — pronta para login/nuvem/multi-device.
   Nenhuma importação de lote toca nestes dados (chave própria + ids permanentes).
   ========================================================= */

const KEY = "dramabook_user_v1";
const LEGADO = { favoritos: "db_favoritos", assisti: "db_assisti", quero: "db_quero" };
export const LISTAS = ["favoritos", "assisti", "quero"];
export const ROTULOS = { favoritos: "Favoritos", assisti: "Já assisti", quero: "Quero assistir" };

const vazio = () => ({
  version: 1,
  listas: { favoritos: [], assisti: [], quero: [] },
  marcadoEm: { favoritos: {}, assisti: {}, quero: {} },
  notas: {},          // { [doramaId]: 0..10 }
  comentarios: {},    // { [doramaId]: "texto" }
  personalizadas: [], // [{ id, nome, emoji, itens: [doramaId], criadaEm }]
});

let DATA = carregar();

function carregar() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch { /* corrompido */ }
  if (!d || typeof d !== "object") d = migrarLegado();
  return normalizar(d);
}
function normalizar(d) {
  const base = vazio();
  return {
    ...base, ...d,
    version: 1,
    listas: { ...base.listas, ...(d.listas || {}) },
    marcadoEm: { ...base.marcadoEm, ...(d.marcadoEm || {}) },
    notas: d.notas && typeof d.notas === "object" ? d.notas : {},
    comentarios: d.comentarios && typeof d.comentarios === "object" ? d.comentarios : {},
    personalizadas: Array.isArray(d.personalizadas) ? d.personalizadas : [],
  };
}
/* Migra favoritos/assisti/quero das chaves antigas (uma única vez). */
function migrarLegado() {
  const d = vazio();
  for (const l of LISTAS) {
    try {
      const arr = JSON.parse(localStorage.getItem(LEGADO[l]) || "[]");
      if (Array.isArray(arr) && arr.length) d.listas[l] = arr;
    } catch { /* ignora */ }
  }
  return d;
}
function salvar() { try { localStorage.setItem(KEY, JSON.stringify(DATA)); } catch { /* cota */ } }

export function dados() { return DATA; }

/* ---------- listas de status ---------- */
export function inList(lista, id) { return (DATA.listas[lista] || []).includes(id); }
export function listaIds(lista) { return DATA.listas[lista] || []; }
export function toggleList(lista, id) {
  const arr = DATA.listas[lista] || (DATA.listas[lista] = []);
  const i = arr.indexOf(id);
  const add = i === -1;
  if (add) { arr.push(id); DATA.marcadoEm[lista][id] = Date.now(); }
  else { arr.splice(i, 1); delete DATA.marcadoEm[lista][id]; }
  salvar();
  return add;
}
/* Ids de uma lista ordenados do mais recente para o mais antigo. */
export function recentes(lista, limite = Infinity) {
  const stamps = DATA.marcadoEm[lista] || {};
  return [...listaIds(lista)].sort((a, b) => (stamps[b] || 0) - (stamps[a] || 0)).slice(0, limite);
}

/* ---------- nota pessoal (0–10) ---------- */
export function minhaNota(id) { const n = DATA.notas[id]; return typeof n === "number" ? n : null; }
export function setMinhaNota(id, n) {
  if (n === null || n === "" || n === undefined) delete DATA.notas[id];
  else DATA.notas[id] = Math.max(0, Math.min(10, Number(n)));
  salvar();
}

/* ---------- comentário pessoal ---------- */
export function getComentario(id) { return DATA.comentarios[id] || ""; }
export function setComentario(id, txt) {
  const t = String(txt || "").trim();
  if (!t) delete DATA.comentarios[id]; else DATA.comentarios[id] = t;
  salvar();
}

/* ---------- listas personalizadas ---------- */
export function listasPersonalizadas() { return DATA.personalizadas; }
export function getLista(listaId) { return DATA.personalizadas.find(l => l.id === listaId) || null; }
export function criarLista(nome, emoji = "📁") {
  const id = "l" + Date.now().toString(36);
  DATA.personalizadas.push({ id, nome: String(nome).trim() || "Nova lista", emoji, itens: [], criadaEm: Date.now() });
  salvar();
  return id;
}
export function removerLista(listaId) {
  DATA.personalizadas = DATA.personalizadas.filter(l => l.id !== listaId);
  salvar();
}
export function naLista(listaId, doramaId) { return (getLista(listaId)?.itens || []).includes(doramaId); }
export function toggleNaLista(listaId, doramaId) {
  const l = getLista(listaId); if (!l) return false;
  const i = l.itens.indexOf(doramaId);
  const add = i === -1;
  add ? l.itens.push(doramaId) : l.itens.splice(i, 1);
  salvar();
  return add;
}

/* ---------- exportar / importar (base p/ nuvem e multi-device) ---------- */
export function exportar() { return JSON.stringify(DATA, null, 2); }
export function importar(json) {
  const d = typeof json === "string" ? JSON.parse(json) : json;
  if (!d || typeof d !== "object") throw new Error("Arquivo inválido");
  DATA = normalizar(d);
  salvar();
  return true;
}

/* ---------- estatísticas ---------- */
const minutosDe = (dur) => { const m = String(dur || "").match(/(\d+)/); return m ? Number(m[1]) : 0; };
const contar = (arr) => {
  const m = {}; arr.forEach(k => { if (k) m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};

export function estatisticas(byId) {
  const assistidos = listaIds("assisti").map(id => byId[id]).filter(Boolean);
  const notas = Object.values(DATA.notas).filter(n => typeof n === "number");
  const episodios = assistidos.reduce((s, d) => s + (Number(d.episodios) || 0), 0);
  const minutos = assistidos.reduce((s, d) => s + (Number(d.episodios) || 0) * minutosDe(d.duracao), 0);
  return {
    assistidos: assistidos.length,
    favoritos: listaIds("favoritos").length,
    quero: listaIds("quero").length,
    comentarios: Object.keys(DATA.comentarios).length,
    mediaNota: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
    totalNotas: notas.length,
    paises: contar(assistidos.map(d => d.pais)),
    categorias: contar(assistidos.flatMap(d => d.categorias || [])),
    tropos: contar(assistidos.flatMap(d => d.tropos || [])),
    episodios,
    horas: Math.round(minutos / 60),
    semDuracao: assistidos.filter(d => !minutosDe(d.duracao)).length,
  };
}
