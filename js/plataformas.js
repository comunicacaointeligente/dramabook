/* =========================================================
   plataformas.js — "Onde assistir": link + identidade visual
   Streamings viram botões clicáveis (busca já preenchida com o título);
   canais de TV (tvN, JTBC…) aparecem como exibição original, sem link.
   Se um dia a curadoria trouxer links exatos, `linkExato` os usa.
   ========================================================= */

const normPlat = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/* Streamings: busca oficial + cor da marca. */
export const STREAMINGS = {
  "netflix":       { nome: "Netflix",     cor: "#E50914", busca: (t) => `https://www.netflix.com/search?q=${t}` },
  "viki":          { nome: "Viki",        cor: "#1BB786", busca: (t) => `https://www.viki.com/search?q=${t}` },
  "rakuten viki":  { nome: "Viki",        cor: "#1BB786", busca: (t) => `https://www.viki.com/search?q=${t}` },
  "prime video":   { nome: "Prime Video", cor: "#00A8E1", busca: (t) => `https://www.primevideo.com/search?phrase=${t}` },
  "prime":         { nome: "Prime Video", cor: "#00A8E1", busca: (t) => `https://www.primevideo.com/search?phrase=${t}` },
  "disney+":       { nome: "Disney+",     cor: "#113CCF", busca: (t) => `https://www.disneyplus.com/search?q=${t}` },
  "disney plus":   { nome: "Disney+",     cor: "#113CCF", busca: (t) => `https://www.disneyplus.com/search?q=${t}` },
  "max":           { nome: "Max",         cor: "#0B24E8", busca: (t) => `https://play.max.com/search?q=${t}` },
  "hbo max":       { nome: "Max",         cor: "#0B24E8", busca: (t) => `https://play.max.com/search?q=${t}` },
  "hbo":           { nome: "Max",         cor: "#0B24E8", busca: (t) => `https://play.max.com/search?q=${t}` },
  "apple tv":      { nome: "Apple TV+",   cor: "#C9CDD3", busca: (t) => `https://tv.apple.com/search?term=${t}` },
  "apple tv+":     { nome: "Apple TV+",   cor: "#C9CDD3", busca: (t) => `https://tv.apple.com/search?term=${t}` },
  "apple tv plus": { nome: "Apple TV+",   cor: "#C9CDD3", busca: (t) => `https://tv.apple.com/search?term=${t}` },
  "paramount+":    { nome: "Paramount+",  cor: "#0064FF", busca: (t) => `https://www.paramountplus.com/br/search/?q=${t}` },
  "paramount":     { nome: "Paramount+",  cor: "#0064FF", busca: (t) => `https://www.paramountplus.com/br/search/?q=${t}` },
  "paramount plus": { nome: "Paramount+", cor: "#0064FF", busca: (t) => `https://www.paramountplus.com/br/search/?q=${t}` },
  "star+":         { nome: "Disney+",     cor: "#113CCF", busca: (t) => `https://www.disneyplus.com/search?q=${t}` },
  "crunchyroll":   { nome: "Crunchyroll", cor: "#F47521", busca: (t) => `https://www.crunchyroll.com/search?q=${t}` },
  "iqiyi":         { nome: "iQIYI",       cor: "#00BE06", busca: (t) => `https://www.iq.com/search?query=${t}` },
  "wetv":          { nome: "WeTV",        cor: "#FF5C00", busca: (t) => `https://wetv.vip/search?keyword=${t}` },
  "kocowa":        { nome: "Kocowa",      cor: "#6C2BD9", busca: (t) => `https://www.kocowa.com/search?query=${t}` },
  "globoplay":     { nome: "Globoplay",   cor: "#FF4D4D", busca: (t) => `https://globoplay.globo.com/busca/?q=${t}` },
  "youtube":       { nome: "YouTube",     cor: "#FF0000", busca: (t) => `https://www.youtube.com/results?search_query=${t}` },
};

/* Canais de TV: onde foi exibido originalmente (não é lugar de assistir). */
const CANAIS = new Set(["tvn", "jtbc", "sbs", "mbc", "kbs", "kbs2", "kbs1", "ocn", "ena", "channel a", "tv chosun", "mbn", "tving", "wavve"]);

export const ehStreaming = (p) => !!STREAMINGS[normPlat(p)];
export const ehCanal = (p) => CANAIS.has(normPlat(p));

/* Link para assistir. Usa link exato se a ficha tiver (`links: {netflix: "..."}`),
   senão cai na busca da plataforma com o título — sempre funciona. */
export function linkPlataforma(d, plataforma) {
  const chave = normPlat(plataforma);
  const exato = d?.links?.[chave];
  if (exato) return exato;
  const s = STREAMINGS[chave];
  if (!s) return null;
  const termo = encodeURIComponent(d?.titulo_original && chave === "viki" ? d.titulo : (d?.titulo || ""));
  return s.busca(termo);
}
export const infoPlataforma = (p) => STREAMINGS[normPlat(p)] || null;
