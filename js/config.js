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

/* Foco Brasil: o site só exibe doramas com streaming disponível no Brasil.
   Registros sem streaming BR ficam no banco (invisíveis) e reaparecem
   automaticamente quando a disponibilidade for atualizada. */
export const SOMENTE_BRASIL = true;

/* Bandeira por país. */
export const FLAGS = {
  "Coreia do Sul": "🇰🇷", "Coreia": "🇰🇷", "China": "🇨🇳", "Japão": "🇯🇵",
  "Tailândia": "🇹🇭", "Taiwan": "🇹🇼",
};

/* Menu lateral — dirigido por dados (adicionar item = 1 linha aqui). */
export const LIST_MENU = [
  { list: "favoritos",  icon: "❤️", label: "Favoritos", badge: "badgeFav" },
  { list: "assistindo", icon: "▶️", label: "Assistindo", badge: "badgeAssistindo" },
  { list: "assisti",    icon: "✅", label: "Já assisti", badge: "badgeAssisti" },
  { list: "quero",      icon: "🔖", label: "Quero assistir", badge: "badgeQuero" },
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
  { facet: "Ação", icon: "🥊", label: "Ação" },
  { facet: "Médicos", icon: "🩺", label: "Médicos" },
  { facet: "Advogados", icon: "⚖️", label: "Advogados" },
  { facet: "Históricos", icon: "👑", label: "Históricos" },
  { facet: "Fantasia", icon: "✨", label: "Fantasia" },
  { facet: "Sobrenatural", icon: "👻", label: "Sobrenatural" },
  { facet: "Investigação", icon: "🕵️", label: "Investigação" },
  // Japão e China escondidos até o acervo crescer nessas frentes. Foco: Coreia.
  // { facet: "Coreia", icon: "🇰🇷", label: "Coreia" },   // óbvio no acervo hoje
  // { facet: "Japão", icon: "🇯🇵", label: "Japão" },
  // { facet: "China", icon: "🇨🇳", label: "China" },
  { facet: "obra_prima", icon: "⭐", label: "Obras-primas" },
];

/* ✨ Descubra por experiência — prateleiras emocionais DERIVADAS dos dados
   das fichas (sensações, flags, episódios, perfil, tags). Nada novo no schema. */
export const EXPERIENCIAS = [
  { key: "maratona",   icon: "🍿", label: "Para maratonar no fim de semana", selo: "🍿 Maratona de fim de semana" },
  { key: "lencinhos",  icon: "😭", label: "Prepare os lencinhos",            selo: "😭 Prepare os lencinhos" },
  { key: "comfort",    icon: "☕", label: "Comfort Drama",                   selo: "☕ Comfort Drama" },
  { key: "healing",    icon: "🌧️", label: "Cura emocional",                  selo: "🌧️ Cura emocional" },
  { key: "viciante",   icon: "⚡", label: "Não dá pra parar de assistir",    selo: "⚡ Viciante" },
  { key: "quimica",    icon: "🔥", label: "Melhor química",                  selo: "🔥 Química absurda" },
  { key: "beijos",     icon: "💋", label: "Beijos memoráveis",               selo: "💋 Beijos memoráveis" },
  { key: "saudaveis",  icon: "💚", label: "Casais saudáveis",                selo: "💚 Casal saudável" },
  { key: "problematicos", icon: "🚩", label: "Casais problemáticos",         selo: "🚩 Casal problemático" },
  { key: "borboletas", icon: "🦋", label: "Borboletas no estômago",          selo: "🦋 Borboletas no estômago" },
  { key: "segunda",    icon: "🥹", label: "Segunda chance",                  selo: "🥹 Segunda chance" },
  { key: "leves",      icon: "🎉", label: "Leves e divertidos",              selo: "🎉 Leve e divertido" },
  { key: "refletir",   icon: "🧠", label: "Para refletir",                   selo: "🧠 Faz pensar" },
  { key: "curtinhos",  icon: "🎬", label: "Curtinhos",                       selo: "🎬 Curtinho" },
  { key: "noite",      icon: "🌙", label: "Para antes de dormir",            selo: "🌙 Pra antes de dormir" },
  { key: "primeiro",   icon: "👶", label: "Meu primeiro dorama",             selo: "👶 Ótimo pra começar" },
  { key: "nota95",     icon: "🏆", label: "Nota acima de 9,5",               selo: "🏆 Imperdível" },
  { key: "joias",      icon: "💎", label: "Joias escondidas",                selo: "💎 Joia escondida" },
  { key: "lancamentos",icon: "🆕", label: "Lançamentos 2026",                selo: "🆕 Lançamento 2026" },
];

/* 🚦 Semáforo de conteúdo — avisa antes, em vez de excluir o título.
   Vem de `conteudo: { nivel, aviso }` na ficha; sem isso, é deduzido
   da classificação etária e das red flags. Ordem = intensidade crescente. */
export const CONTEUDO = {
  leve:      { cor: "🟢", label: "Conteúdo leve",        desc: "sem violência relevante" },
  violencia: { cor: "🟡", label: "Contém violência",      desc: "luta, crime ou ação, sem cenas gráficas" },
  sensivel:  { cor: "🟠", label: "Temas sensíveis",       desc: "assuntos duros tratados com peso" },
  intenso:   { cor: "🔴", label: "Conteúdo intenso",      desc: "violência gráfica e/ou temas explícitos" },
};

/* Chips de filtro rápido no topo da home. */
export const QUICK_FILTERS = ["Romance", "Fantasia", "Históricos", "Médicos", "Comédia", "Emocionantes", "Slow Burn", "CEO"];

/* 💜 Escolha pelo seu humor — "Hoje eu quero…".
   `exp` puxa de EXPERIENCIAS (sentimento); `facets`, das categorias. */
export const MOODS = [
  { key: "apaixonar", emoji: "😍", label: "Me apaixonar", facets: ["Romance"] },
  { key: "rir", emoji: "😂", label: "Dar risada", exp: "leves" },
  { key: "chorar", emoji: "😭", label: "Chorar", exp: "lencinhos" },
  { key: "tensa", emoji: "😱", label: "Ficar tensa", facets: ["Investigação", "Sobrenatural"] },
  { key: "emocionar", emoji: "🥹", label: "Me emocionar", facets: ["Emocionantes"] },
  { key: "relaxar", emoji: "🧘", label: "Relaxar", exp: "comfort" },
  { key: "maratonar", emoji: "🔥", label: "Maratonar", exp: "maratona" },
  { key: "borboletas", emoji: "💕", label: "Sentir borboletas", exp: "borboletas" },
  { key: "pensar", emoji: "🧠", label: "Pensar na vida", exp: "refletir" },
  { key: "tantofaz", emoji: "🤷", label: "Tanto faz", facets: [] },
];

/* localStorage keys. */
export const LS = {
  favoritos: "db_favoritos",
  assistindo: "db_assistindo",
  assisti: "db_assisti",
  quero: "db_quero",
  theme: "db_theme",
};
