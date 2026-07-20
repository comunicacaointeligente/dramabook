/* =========================================================
   filters.js — busca e filtragem (lógica pura, sem DOM)
   ========================================================= */
import { STATE, getNota, sensacao, streamingList, getFlag } from "./store.js";

/* Países: casam por inclusão (dado pode vir "Coreia do Sul", "Coreia", etc.). */
const COUNTRY_FACETS = { "Coreia": ["coreia"], "Japão": ["japão", "japao"], "China": ["china"] };
/* Facetas que também olham medidores numéricos (além da tag). [valor, mínimo] */
const NUM_FACETS = {
  "Green Flag": [(d) => getFlag(d, "green"), 8],
  "Red Flag": [(d) => getFlag(d, "red"), 7],
  "Química Inesquecível": [(d) => sensacao(d, "quimica"), 9],
};
/* Normaliza p/ casar plural/singular e maiúsculas ("Green Flags" ≈ "green flag"). */
const norm = (s) => String(s || "").toLowerCase().trim().replace(/s$/, "");

/* Todas as tags classificatórias de um dorama (categorias, tropos, temas, profissões, gêneros legado). */
export function tagsOf(d) {
  return [...(d.categorias || []), ...(d.tropos || []), ...(d.temas || []), ...(d.profissoes || []), ...(d.generos || [])];
}

/* Um dorama casa com a faceta? (país, medidor, obra-prima, ou tag) */
export function matchFacet(d, facet) {
  if (!facet || facet === "all") return true;
  if (facet === "obra_prima") return d.obra_prima === true || (getNota(d) ?? 0) >= 9;
  if (COUNTRY_FACETS[facet]) {
    const p = String(d.pais || "").toLowerCase();
    return COUNTRY_FACETS[facet].some(k => p.includes(k));
  }
  if (NUM_FACETS[facet] && (NUM_FACETS[facet][0](d) ?? 0) >= NUM_FACETS[facet][1]) return true;
  const f = norm(facet);
  return tagsOf(d).some(x => norm(x) === f);
}

export function byFacet(facet) { return STATE.all.filter(d => matchFacet(d, facet)); }

/* Busca textual em título, título original, país, plataforma, categorias e tropos. */
/* Tira acentos e caixa: "comedia" acha "Comédia", "coreia" acha "Coreia do Sul". */
export const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Busca por relevância: título > título original > elenco/tags/equipe.
   Aceita várias palavras (todas precisam casar) e ignora acentos. */
export function search(q) {
  const termos = semAcento(q).trim().split(/\s+/).filter(Boolean);
  if (!termos.length) return [];
  const frase = termos.join(" ");
  const achados = [];

  for (const d of STATE.all) {
    const titulo = semAcento(d.titulo);
    const original = semAcento(d.titulo_original);
    const outros = semAcento([d.pais, d.tipo, d.diretor, d.roteirista, d.universo,
      ...streamingList(d), ...tagsOf(d), ...(d.elenco || [])].join(" "));
    const tudo = `${titulo} ${original} ${outros} ${d.ano || ""}`;

    if (!termos.every(t => tudo.includes(t))) continue; // todas as palavras precisam existir

    let score = 0;
    if (titulo === frase) score += 100;
    else if (titulo.startsWith(frase)) score += 60;
    else if (titulo.includes(frase)) score += 40;
    if (termos.every(t => titulo.includes(t))) score += 20;
    if (original.includes(frase)) score += 15;
    score += (getNota(d) || 0); // desempate: melhor avaliado primeiro
    achados.push({ d, score });
  }
  return achados.sort((a, b) => b.score - a.score).map(x => x.d);
}

export function topRated(limit = Infinity) {
  return [...STATE.all].sort((a, b) => (getNota(b) || 0) - (getNota(a) || 0)).slice(0, limit);
}
export function latest(limit = Infinity) { return [...STATE.all].reverse().slice(0, limit); }
export function masterpieces() { return STATE.all.filter(d => matchFacet(d, "obra_prima")); }

/* Sorteio (dorama aleatório / recomendação por humor). */
export function pickRandom(pool = STATE.all) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
