/* =========================================================
   diagnostico.js — perfil de dorameira (Minha Biblioteca)
   Cruza listas + notas + tags + país + humor da usuária
   e devolve um arquétipo + selos + estatísticas divertidas.
   Puro cliente, sem custo. Baseado nos dados que já existem.
   ========================================================= */
import { STATE, getNota, sensacao, getFlag, nivelConteudo } from "./store.js";
import { listaIds, minhaNota } from "./user.js";
import { tagsOf } from "./filters.js";

const normDg = s => String(s || "").toLowerCase().trim();

/* Conta ocorrências de tags/países entre uma lista de doramas. */
function contarDg(items, campo) {
  const c = {};
  for (const d of items) {
    const vals = campo === "tags" ? tagsOf(d)
      : campo === "pais" ? [d.pais]
      : campo === "nivel" ? [nivelConteudo(d)]
      : campo === "cat" ? (d.categorias || [])
      : [];
    for (const v of vals) if (v) c[v] = (c[v] || 0) + 1;
  }
  return c;
}
function topDe(cont, n = 3) {
  return Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, n);
}

/* Regras de arquétipo — testadas em ordem, primeira que bate vence.
   Cada uma retorna: { key, emoji, titulo, subtitulo, cor } */
const ARQUETIPOS = [
  { key: "vingadora", test: (s) => s.n.intenso >= 5,
    emoji: "⚔️", titulo: "Vingadora Servida Gelada",
    subtitulo: "Você respira Kim Eun-sook em vingança silenciosa. The Glory te deu conforto — não medo.",
    cor: "#8B1E1E" },
  { key: "detetive", test: (s) => (s.cat["Investigação"] ?? 0) >= 4,
    emoji: "🔍", titulo: "Detetive de Sofá Profissional",
    subtitulo: "Você resolve o caso no episódio 3 e ainda finge surpresa quando aparece o twist. Signal te olha com respeito.",
    cor: "#2E4057" },
  { key: "lencinhos", test: (s) => s.emocaoMedia >= 8.5,
    emoji: "😭", titulo: "Colecionadora Oficial de Lencinhos",
    subtitulo: "Sua caixa de lenços tem CNPJ. Você chora antes mesmo do OST começar — e adora essa dor.",
    cor: "#5C4E8A" },
  { key: "slowburn", test: (s) => (s.tags["slow burn"] ?? 0) >= 3,
    emoji: "☕", titulo: "Slow Burn Certified",
    subtitulo: "Beijo no episódio 12? Cedo demais. Você sabe apreciar um roçar de dedos como ninguém.",
    cor: "#8B6F47" },
  { key: "healing", test: (s) => (s.n.leve + (s.cat["Comédia"] ?? 0)) >= 6 && s.n.intenso === 0,
    emoji: "☕", titulo: "Guardiã do Comfort Drama",
    subtitulo: "Você reassiste Hometown Cha-Cha-Cha quando o mundo aperta. Rejeita sofrimento gratuito com elegância.",
    cor: "#4A7C59" },
  { key: "romantica", test: (s) => (s.cat["Romance"] ?? 0) >= 5,
    emoji: "💕", titulo: "Romântica Incurável",
    subtitulo: "Você acredita em amor de outra vida, casamento de contrato que vira de verdade e mãos que se tocam sem querer.",
    cor: "#C4507C" },
  { key: "epoca", test: (s) => (s.cat["Históricos"] ?? 0) >= 3,
    emoji: "👑", titulo: "Rainha de Joseon",
    subtitulo: "Você conhece a dinastia melhor que o próprio rei. Hanbok é seu vestido de festa mental.",
    cor: "#8B4513" },
  { key: "fantasia", test: (s) => (s.cat["Fantasia"] ?? 0) + (s.cat["Sobrenatural"] ?? 0) >= 4,
    emoji: "✨", titulo: "Team Goblin, Team Deusa, Team TUDO",
    subtitulo: "Se tem viagem no tempo, deus disfarçado ou memória de vida passada, você já está dentro.",
    cor: "#6A5ACD" },
  { key: "maratonista", test: (s) => s.total >= 15,
    emoji: "🍿", titulo: "Maratonista Profissional",
    subtitulo: "Você já perdeu horas de sono, dia de trabalho e reunião de família por 'só mais um episódio'.",
    cor: "#D4A017" },
  { key: "aspirante", test: (s) => s.quero >= s.assisti * 2 && s.quero >= 5,
    emoji: "🔖", titulo: "Aspirante em Formação",
    subtitulo: "Sua lista de 'quero assistir' cresce mais rápido que sua semana. Nunca vai dar conta — e tudo bem.",
    cor: "#4682B4" },
  { key: "iniciante", test: (s) => s.total >= 1,
    emoji: "🌱", titulo: "Nova na Vibe",
    subtitulo: "Você acabou de entrar. Prepare o coração — não tem volta.",
    cor: "#68A063" },
];

/* Selos secundários — todos os que baterem entram (até 4). */
const SELOS = [
  { test: s => s.notaMedia >= 9, emoji: "🎯", label: "Curadora exigente" },
  { test: s => s.notaMedia > 0 && s.notaMedia < 8, emoji: "❤️‍🔥", label: "Ama sem julgar" },
  { test: s => (s.pais["Coreia do Sul"] ?? 0) === s.total && s.total >= 3, emoji: "🇰🇷", label: "Só Coreia, sem desvios" },
  { test: s => (s.pais["Japão"] ?? 0) >= 2, emoji: "🇯🇵", label: "Fã de J-drama também" },
  { test: s => (s.pais["China"] ?? 0) >= 2, emoji: "🇨🇳", label: "Ponta pé no C-drama" },
  { test: s => s.redMedia >= 5 && s.greenMedia < s.redMedia, emoji: "🚩", label: "Time Coração Rebelde" },
  { test: s => s.greenMedia >= 8, emoji: "💚", label: "Só ships saudáveis" },
  { test: s => s.n.intenso === 0 && s.total >= 5, emoji: "🧘", label: "Zero sofrimento gratuito" },
  { test: s => s.n.intenso >= 3 && s.n.leve === 0, emoji: "⚡", label: "Estômago de aço" },
  { test: s => (s.cat["Médicos"] ?? 0) >= 2, emoji: "🩺", label: "Fã de jaleco" },
  { test: s => (s.cat["Advogados"] ?? 0) >= 2, emoji: "⚖️", label: "Team Tribunal" },
  { test: s => (s.cat["CEO"] ?? 0) + (s.cat["Casamento por contrato"] ?? 0) >= 2, emoji: "💍", label: "Fã da fórmula CEO+contrato" },
  { test: s => s.notaAlta && s.notaAlta.length > 0, emoji: "⭐", label: "Deu 10 pra alguém" },
  { test: s => s.assisti >= 10 && s.favoritos === 0, emoji: "🕵️", label: "Assiste muito, favorita pouco" },
];

/* Gera as estatísticas a partir das listas do usuário. */
export function analisar() {
  const byId = STATE.byId;
  const assistidos = listaIds("assisti").map(id => byId[id]).filter(Boolean);
  const favoritos  = listaIds("favoritos").map(id => byId[id]).filter(Boolean);
  const querem     = listaIds("quero").map(id => byId[id]).filter(Boolean);
  const universo   = [...new Set([...assistidos, ...favoritos, ...querem])];
  if (universo.length === 0) return null;

  const notasDadas = assistidos.map(d => minhaNota(d.id)).filter(n => n != null);
  const notaMedia = notasDadas.length ? +(notasDadas.reduce((a, b) => a + b, 0) / notasDadas.length).toFixed(1) : 0;
  const notaAlta = notasDadas.filter(n => n === 10);

  const emo = universo.map(d => sensacao(d, "emocao")).filter(n => n != null);
  const emocaoMedia = emo.length ? emo.reduce((a, b) => a + b, 0) / emo.length : 0;
  const green = universo.map(d => getFlag(d, "green")).filter(n => n != null);
  const red = universo.map(d => getFlag(d, "red")).filter(n => n != null);
  const greenMedia = green.length ? green.reduce((a, b) => a + b, 0) / green.length : 0;
  const redMedia   = red.length   ? red.reduce((a, b) => a + b, 0) / red.length     : 0;

  const cont = contarDg(universo, "cat");
  const tags = {}; for (const [k, v] of Object.entries(contarDg(universo, "tags"))) tags[normDg(k)] = v;
  const pais = contarDg(universo, "pais");
  const nivel = contarDg(universo, "nivel");
  const n = { leve: nivel.leve ?? 0, violencia: nivel.violencia ?? 0, sensivel: nivel.sensivel ?? 0, intenso: nivel.intenso ?? 0 };

  const stats = {
    total: universo.length, assisti: assistidos.length, favoritos: favoritos.length, quero: querem.length,
    notaMedia, notaAlta, emocaoMedia, greenMedia, redMedia,
    cat: cont, tags, pais, n,
    topCat: topDe(cont, 3), topPais: topDe(pais, 1)[0]?.[0] || "Coreia do Sul",
  };

  const arquetipo = ARQUETIPOS.find(a => a.test(stats)) || ARQUETIPOS[ARQUETIPOS.length - 1];
  const selos = SELOS.filter(s => s.test(stats)).slice(0, 4);

  return { arquetipo, selos, stats };
}

/* HTML do cartão do diagnóstico. */
export function diagnosticoHTML() {
  const r = analisar();
  if (!r) return `<div class="diagnostico vazio">
    <p>🔮 Assine, marque como assistido ou favorito pelo menos 1 dorama e a gente te lê a sorte.</p>
  </div>`;
  const { arquetipo: a, selos, stats: s } = r;
  const cat = s.topCat[0]?.[0] || "Romance";
  return `<div class="diagnostico" style="--dg-cor: ${a.cor}">
    <p class="dg-titulinho">🔮 SEU DIAGNÓSTICO DE DORAMEIRA</p>
    <div class="dg-hero">
      <span class="dg-emoji">${a.emoji}</span>
      <h2 class="dg-titulo">${a.titulo}</h2>
    </div>
    <p class="dg-sub">${a.subtitulo}</p>
    ${selos.length ? `<div class="dg-selos">${selos.map(x =>
      `<span class="dg-selo">${x.emoji} ${x.label}</span>`).join("")}</div>` : ""}
    <div class="dg-stats">
      <div class="dg-stat"><b>${s.total}</b><i>doramas na sua vida</i></div>
      <div class="dg-stat"><b>${s.assisti}</b><i>assistidos</i></div>
      <div class="dg-stat"><b>${s.favoritos}</b><i>favoritos</i></div>
      <div class="dg-stat"><b>${s.quero}</b><i>na fila</i></div>
      ${s.notaMedia > 0 ? `<div class="dg-stat"><b>${s.notaMedia}</b><i>sua nota média</i></div>` : ""}
      <div class="dg-stat"><b>${cat}</b><i>categoria favorita</i></div>
    </div>
  </div>`;
}
