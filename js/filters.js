/* =========================================================
   filters.js — busca e filtragem (lógica pura, sem DOM)
   ========================================================= */
import { STATE, getNota, sensacao, streamingList, getFlag, nivelConteudo } from "./store.js";
import { EXPERIENCIAS } from "./config.js";

/* Países: casam por inclusão (dado pode vir "Coreia do Sul", "Coreia", etc.). */
const COUNTRY_FACETS = { "Coreia": ["coreia"], "Japão": ["japão", "japao"], "China": ["china"] };
/* Facetas que também olham medidores numéricos (além da tag). [valor, mínimo] */
const NUM_FACETS = {
  "Green Flag": [(d) => getFlag(d, "green"), 8],
  "Red Flag": [(d) => getFlag(d, "red"), 7],
  "Química Inesquecível": [(d) => sensacao(d, "quimica"), 9],
};
/* Facetas que casam por conjunto de tags/tropos. Ação, por exemplo, não
   é uma categoria oficial nas fichas — deduz por tropos + tags. */
const FACET_SINONIMOS = {
  "Ação": ["ação", "acao", "máfia", "mafia", "vingança", "vinganca", "justiceiro",
           "ex-militar", "guarda-costas", "assassino", "boxeador", "conspiração",
           "conspiracao", "serial killer", "sobrevivência", "sobrevivencia", "zumbis"],
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
  if (FACET_SINONIMOS[facet]) {
    const tags = tagsOf(d).map(norm);
    return FACET_SINONIMOS[facet].some(s => tags.some(t => t === norm(s)));
  }
  const f = norm(facet);
  return tagsOf(d).some(x => norm(x) === f);
}

export function byFacet(facet) {
  if (facet?.startsWith("conteudo:")) {
    const nv = facet.slice(9);
    return STATE.all.filter(d => nivelConteudo(d) === nv).sort((a, b) => (getNota(b) || 0) - (getNota(a) || 0));
  }
  if (facet?.startsWith("plat:")) {
    const p = norm(facet.slice(5));
    return STATE.all.filter(d => streamingList(d).some(x => norm(x) === p))
      .sort((a, b) => (getNota(b) || 0) - (getNota(a) || 0));
  }
  if (facet === "dublado")   return STATE.all.filter(d => d.dublado === true).sort((a, b) => (getNota(b) || 0) - (getNota(a) || 0));
  if (facet === "legendado") return STATE.all.filter(d => d.dublado === false).sort((a, b) => (getNota(b) || 0) - (getNota(a) || 0));
  return STATE.all.filter(d => matchFacet(d, facet));
}

/* Conta doramas por STREAMING BR — usado pelo rodapé.
   Canais coreanos (tvN, JTBC, MBC, SBS, KBS2, OCN, ENA, wavve, Kakao TV) ficam de fora. */
const CANAIS_KR = new Set(["tvn","jtbc","mbc","sbs","kbs2","ocn","ena","wavve","kakao tv","tving"]);
export function contarPlataformas() {
  const c = {};
  for (const d of STATE.all) {
    for (const p of streamingList(d)) {
      const key = String(p).trim();
      if (!key) continue;
      if (CANAIS_KR.has(key.toLowerCase())) continue;   // pula canais coreanos
      c[key] = (c[key] || 0) + 1;
    }
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

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
    const tituloBr = semAcento(d.titulo_br);
    const original = semAcento(d.titulo_original);
    const outros = semAcento([d.pais, d.tipo, d.diretor, d.roteirista, d.universo,
      ...streamingList(d), ...tagsOf(d), ...(d.elenco || [])].join(" "));
    const tudo = `${titulo} ${tituloBr} ${original} ${outros} ${d.ano || ""}`;

    if (!termos.every(t => tudo.includes(t))) continue; // todas as palavras precisam existir

    let score = 0;
    if (titulo === frase || tituloBr === frase) score += 100;
    else if (titulo.startsWith(frase) || tituloBr.startsWith(frase)) score += 60;
    else if (titulo.includes(frase) || tituloBr.includes(frase)) score += 40;
    if (termos.every(t => titulo.includes(t) || tituloBr.includes(t))) score += 20;
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

/* ✨ Experiências / selos editoriais.
   Cada regra é DERIVADA dos dados da ficha. O campo opcional `editor_tags`
   (curadoria manual) SEMPRE vence: entra na prateleira mesmo sem bater a regra. */
const tem = (d, tag) => tagsOf(d).some(t => norm(t) === norm(tag));
const REGRAS_EXP = {
  maratona:      d => d.episodios > 0 && d.episodios <= 12,
  lencinhos:     d => (sensacao(d, "emocao") ?? 0) >= 9,
  comfort:       d => tem(d, "Healing") || tem(d, "Comfort") || ((getFlag(d, "green") ?? 0) >= 8 && (sensacao(d, "emocao") ?? 10) <= 7),
  healing:       d => tem(d, "Healing") || tem(d, "Cura Emocional"),
  viciante:      d => (getNota(d) ?? 0) >= 9 && (sensacao(d, "emocao") ?? 0) >= 8,
  quimica:       d => (sensacao(d, "quimica") ?? 0) >= 9,
  beijos:        d => (sensacao(d, "beijos") ?? 0) >= 8,
  saudaveis:     d => (getFlag(d, "green") ?? 0) >= 9,
  problematicos: d => (getFlag(d, "red") ?? 0) >= 5,
  borboletas:    d => (sensacao(d, "romance") ?? 0) >= 9 && (sensacao(d, "quimica") ?? 0) >= 9,
  segunda:       d => tem(d, "Second Chance"),
  leves:         d => (sensacao(d, "humor") ?? 0) >= 8,
  refletir:      d => (sensacao(d, "emocao") ?? 0) >= 9 && (sensacao(d, "romance") ?? 10) <= 5,
  curtinhos:     d => d.episodios > 0 && d.episodios <= 10,
  noite:         d => d.episodios > 0 && (sensacao(d, "emocao") ?? 10) <= 7 && (getFlag(d, "green") ?? 0) >= 7,
  primeiro:      d => d.perfil?.iniciante === true,
  nota95:        d => (getNota(d) ?? 0) >= 9.5,
  /* joia escondida: nota alta que o público de massa não descobriu (sem Netflix). */
  joias:         d => (getNota(d) ?? 0) >= 9 && !streamingList(d).some(p => /netflix/i.test(p)),
  lancamentos:   d => (d.ano ?? 0) >= 2026,   // vira 2027 no fim do ano
};

/* O dorama tem esta experiência? (regra derivada OU curadoria manual) */
export function temExperiencia(d, key, selo) {
  if (selo && (d.editor_tags || []).some(t => norm(t) === norm(selo))) return true;
  return REGRAS_EXP[key] ? REGRAS_EXP[key](d) : false;
}

export function byExperiencia(key, selo) {
  return STATE.all.filter(d => temExperiencia(d, key, selo))
    .sort((a, b) => (getNota(b) || 0) - (getNota(a) || 0));
}

/* 🏷️ Destaques da ficha: até 5 selos, os mais distintivos primeiro. */
const PESO_SELO = ["nota95", "joias", "lencinhos", "quimica", "borboletas", "viciante",
  "beijos", "saudaveis", "problematicos", "healing", "comfort", "maratona", "curtinhos",
  "refletir", "segunda", "leves", "noite", "lancamentos", "primeiro"];
export function selosDe(d, limite = 5) {
  return PESO_SELO
    .map(k => EXPERIENCIAS.find(e => e.key === k))
    .filter(e => e && temExperiencia(d, e.key, e.selo))
    .slice(0, limite);
}

/* Sorteio (dorama aleatório / recomendação por humor). */
export function pickRandom(pool = STATE.all) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
