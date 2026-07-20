/* =========================================================
   config.js — configuração central do DRAMABOOK
   Fonte única de constantes. Nada de valores mágicos espalhados.
   ========================================================= */

/* Imagens (TMDb). Trocar o tamanho aqui muda em todo o site. */
export const IMG_BASE = "https://image.tmdb.org/t/p";
export const POSTER_SIZE = "w500";     // cartão / pôster vertical (>=500px, regra da curadoria)
export const BACKDROP_SIZE = "w1280";  // banner horizontal do hero/modal
export const LOCAL_POSTERS = "assets/posters/";
export const LOCAL_BANNERS = "assets/banners/";

/* Quantos cartões renderizar por vez numa grade grande (escala p/ 500+). */
export const PAGE_SIZE = 60;

/* Bandeira por país. */
export const FLAGS = {
  "Coreia do Sul": "🇰🇷", "Coreia": "🇰🇷", "China": "🇨🇳", "Japão": "🇯🇵",
  "Tailândia": "🇹🇭", "Taiwan": "🇹🇼",
};

/* Menu lateral — dirigido por dados (adicionar item = 1 linha aqui). */
export const LIST_MENU = [
  { list: "favoritos", icon: "❤️", label: "Favoritos", badge: "badgeFav" },
  { list: "assisti",   icon: "✅", label: "Já assisti", badge: "badgeAssisti" },
  { list: "quero",     icon: "🔖", label: "Quero assistir", badge: "badgeQuero" },
];

/* Filtros do site — EXATAMENTE a lista definida pela curadoria (não inventar). */
export const CATEGORY_MENU = [
  { facet: "all", icon: "🏠", label: "Início" },
  { facet: "Romance", icon: "❤️", label: "Romance" },
  { facet: "Casamento por contrato", icon: "💍", label: "Casamento por contrato" },
  { facet: "Namoro de mentira", icon: "💕", label: "Namoro de mentira" },
  { facet: "Rivais que se apaixonam", icon: "😤", label: "Rivais que se apaixonam" },
  { facet: "CEO", icon: "👔", label: "CEO" },
  { facet: "Slow Burn", icon: "☕", label: "Slow Burn" },
  { facet: "Química Inesquecível", icon: "🔥", label: "Química Inesquecível" },
  { facet: "Green Flag", icon: "💚", label: "Green Flags" },
  { facet: "Red Flag", icon: "🚩", label: "Red Flags" },
  { facet: "Comédia", icon: "😂", label: "Comédia" },
  { facet: "Emocionantes", icon: "😭", label: "Emocionantes" },
  { facet: "Médicos", icon: "🩺", label: "Médicos" },
  { facet: "Advogados", icon: "⚖️", label: "Advogados" },
  { facet: "Históricos", icon: "👑", label: "Históricos" },
  { facet: "Fantasia", icon: "✨", label: "Fantasia" },
  { facet: "Sobrenatural", icon: "👻", label: "Sobrenatural" },
  { facet: "Investigação", icon: "🕵️", label: "Investigação" },
  { facet: "Coreia", icon: "🇰🇷", label: "Coreia" },
  { facet: "Japão", icon: "🇯🇵", label: "Japão" },
  { facet: "China", icon: "🇨🇳", label: "China" },
  { facet: "obra_prima", icon: "⭐", label: "Obras-primas" },
];

/* Chips de filtro rápido no topo da home. */
export const QUICK_FILTERS = ["Romance", "Fantasia", "Históricos", "Médicos", "Comédia", "Emocionantes", "Slow Burn", "CEO"];

/* Recomendações por humor — botão "Me indique um dorama". */
export const MOODS = [
  { key: "rir", emoji: "😂", label: "Quero rir", facets: ["Comédia"] },
  { key: "chorar", emoji: "😭", label: "Quero chorar", facets: ["Emocionantes"] },
  { key: "romance", emoji: "❤️", label: "Quero romance", facets: ["Romance"] },
  { key: "medico", emoji: "🩺", label: "Quero médico", facets: ["Médicos"] },
  { key: "historico", emoji: "👑", label: "Quero histórico", facets: ["Históricos"] },
  { key: "ceo", emoji: "👔", label: "Quero CEO", facets: ["CEO"] },
  { key: "contrato", emoji: "💍", label: "Casamento por contrato", facets: ["Casamento por contrato"] },
  { key: "fantasia", emoji: "✨", label: "Quero fantasia", facets: ["Fantasia"] },
  { key: "tantofaz", emoji: "🤷", label: "Tanto faz", facets: [] },
];

/* localStorage keys. */
export const LS = {
  favoritos: "db_favoritos",
  assisti: "db_assisti",
  quero: "db_quero",
  theme: "db_theme",
};
