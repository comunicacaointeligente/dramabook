/* =========================================================
   store.js — estado, dados e persistência
   Camada de dados: não toca em layout (só o toast, que é utilitário).
   ========================================================= */
import { IMG_BASE, POSTER_SIZE, BACKDROP_SIZE, LOCAL_POSTERS, LOCAL_BANNERS, FLAGS, SOMENTE_BRASIL } from "./config.js";
import { listaIds, getLista } from "./user.js";
import { ehStreaming } from "./plataformas.js";

/* ---------- helpers DOM ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- estado ---------- */
export const STATE = {
  all: [],
  byId: {},
  categories: [],
};

/* ---------- utilidades ---------- */
export function hashHue(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
export function posterColors(id) {
  const h = hashHue(id);
  return [`hsl(${h} 45% 26%)`, `hsl(${(h + 40) % 360} 55% 14%)`];
}
export function flag(pais) { return FLAGS[pais] || "🌏"; }
export function fmtNota(n) { return (n != null && n !== "") ? Number(n).toFixed(1) : "—"; }

/* Resolve imagem: TMDb path (/xxx.jpg), URL completa, ou nome de arquivo local. */
function resolveImg(value, tmdbSize, localDir) {
  if (!value || !String(value).trim()) return null;
  const v = String(value).trim();
  if (v.startsWith("/")) return `${IMG_BASE}/${tmdbSize}${v}`;   // caminho TMDb
  if (/^(https?:\/\/|data:)/.test(v)) return v;                 // URL/data pronta
  if (v.includes("/")) return v;                                // caminho relativo
  return localDir + v;                                          // só o nome do arquivo
}
export const resolvePoster = (d) => resolveImg(d.poster ?? d.tmdb_poster, POSTER_SIZE, LOCAL_POSTERS);
export const resolveBackdrop = (d) => resolveImg(d.banner ?? d.backdrop ?? d.tmdb_backdrop, BACKDROP_SIZE, LOCAL_BANNERS);

/* Nota principal: avaliacao.chatgpt → avaliacao.mdl → campos legados. */
export function getNota(d) {
  const a = d.avaliacao || {};
  const n = a.chatgpt ?? a.mdl ?? d.nota_chatgpt ?? d.nota_mdl ?? d.nota;
  return n ?? null;
}
/* Sensação (0–10) com nome padronizado, aceitando aninhado (v4) ou legado. */
export function sensacao(d, key) {
  const legado = { humor: "comedia" };
  const s = d.sensacoes || {};
  return s[key] ?? d[key] ?? d[legado[key]] ?? null;
}
/* Onde assistir: aceita streaming{} (v4), array ou string (legado). */
const STREAM_NAMES = {
  netflix: "Netflix", viki: "Viki", prime: "Prime Video", disney: "Disney+", max: "Max",
  crunchyroll: "Crunchyroll", iqiyi: "iQIYI", wetv: "WeTV", kocowa: "Kocowa", globoplay: "Globoplay",
};
export function streamingList(d) {
  if (Array.isArray(d.plataformas)) return d.plataformas;         // v4 (congelado)
  if (Array.isArray(d.plataforma)) return d.plataforma;          // legado
  if (typeof d.plataforma === "string" && d.plataforma) return [d.plataforma];
  const s = d.streaming; if (!s) return [];                       // legado (objeto)
  const out = Object.keys(STREAM_NAMES).filter(k => s[k]).map(k => STREAM_NAMES[k]);
  if (Array.isArray(s.outros)) out.push(...s.outros);
  return out;
}
/* Medidor de flags (green/red) — objeto flags{} (v4) com fallback legado. */
export function getFlag(d, key) { return d.flags?.[key] ?? d[`${key}_flag`] ?? null; }
export function platformText(d) { return streamingList(d).join(" · "); }
/* Resolve recomendação por id OU por título (o ChatGPT pode mandar qualquer um). */
export function resolveRef(key) {
  if (STATE.byId[key]) return STATE.byId[key];
  const k = String(key).toLowerCase();
  return STATE.all.find(d => d.titulo?.toLowerCase() === k) || null;
}

/* ---------- carregamento do catálogo ---------- */
export async function loadCatalog() {
  // Modo empacotado (arquivo único / offline): dados já injetados.
  if (window.DRAMABOOK_DB) { ingestBundle(window.DRAMABOOK_DB); return true; }

  // Modo servido: lê o manifesto (lista de arquivos) e carrega em paralelo.
  let files = ["doramas.json"];
  try {
    const m = await fetch("database/manifest.json").then(r => r.json());
    if (Array.isArray(m.files) && m.files.length) files = m.files;
  } catch { /* usa o padrão doramas.json */ }

  const results = await Promise.allSettled(
    files.map(f => fetch(`database/${f}`).then(r => { if (!r.ok) throw new Error(`${f}: ${r.status}`); return r.json(); }))
  );
  let ok = 0;
  results.forEach((res, i) => {
    if (res.status === "fulfilled" && Array.isArray(res.value)) { ok++; addMany(res.value); }
    else console.warn("Falha ao carregar", files[i], res.reason);
  });
  return ok > 0; // true mesmo se o catálogo estiver vazio (arquivo carregou)
}
function ingestBundle(bundle) {
  // Aceita array direto (doramas.json) ou objeto {arquivo:[...]} (legado).
  if (Array.isArray(bundle)) { addMany(bundle); return; }
  Object.keys(bundle).forEach(name => { if (Array.isArray(bundle[name])) addMany(bundle[name]); });
}
function addMany(arr) {
  for (const d of arr) {
    if (!d || !d.id || STATE.byId[d.id]) continue;  // dedupe por id, nunca sobrescreve
    // Foco Brasil: sem streaming BR → fica no banco, mas não entra no site.
    if (SOMENTE_BRASIL && !streamingList(d).some(ehStreaming)) continue;
    STATE.byId[d.id] = d;
    STATE.all.push(d);
  }
}

/* ---------- listas do usuário (delegado p/ user.js — Minha Biblioteca) ---------- */
export { inList, toggleList, listaIds, recentes } from "./user.js";
export function itemsInList(list) { return listaIds(list).map(id => STATE.byId[id]).filter(Boolean); }
/* Doramas de uma lista personalizada, na ordem em que foram adicionados. */
export function itemsDaLista(listaId) {
  return (getLista(listaId)?.itens || []).map(id => STATE.byId[id]).filter(Boolean);
}

/* ---------- toast ---------- */
export function toast(msg) {
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 1800);
}
