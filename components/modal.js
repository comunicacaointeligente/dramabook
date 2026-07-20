/* =========================================================
   components/modal.js — ficha completa (schema v2 da curadoria)
   Exibe só o que existe: todo campo é opcional e defensivo.
   ========================================================= */
import {
  STATE, resolvePoster, resolveBackdrop, posterColors, flag, fmtNota,
  inList, getNota, platformText, resolveRef, sensacao, getFlag,
  nivelConteudo, avisoConteudo,
} from "../js/store.js";
import { CONTEUDO } from "../js/config.js";

const FINAL_ICON = { feliz: "💚", agridoce: "🎭", triste: "😢", aberto: "🔓" };
import { renderCard, hydrateImages } from "./card.js";
import { minhaNota, getComentario, listasPersonalizadas, naLista } from "../js/user.js";
import { streamingList } from "../js/store.js";
import { ehStreaming, ehCanal, linkPlataforma, infoPlataforma } from "../js/plataformas.js";
import { selosDe } from "../js/filters.js";

/* "Onde assistir": só streamings VERIFICADOS NO BRASIL viram botão (a verificação
   acontece na importação de cada lote e fica gravada no nosso banco).
   Canais de TV aparecem como exibição original. Sem streaming no BR → aviso. */
function blocoOndeAssistir(d) {
  const lista = streamingList(d);
  const streams = lista.filter(ehStreaming);
  const canais = lista.filter((p) => !ehStreaming(p));

  const botoes = streams.map((p) => {
    const info = infoPlataforma(p);
    const url = linkPlataforma(d, p);
    return `<a class="plat-btn" href="${url}" target="_blank" rel="noopener"
       style="--plat:${info.cor}" title="Assistir ${d.titulo} na ${info.nome}">
       <span class="plat-dot"></span>${info.nome} <span class="plat-go">↗</span></a>`;
  }).join("");

  const chips = canais.map((c) =>
    `<span class="plat-canal" title="${ehCanal(c) ? "Exibição original" : "Plataforma"}">${c}</span>`).join("");

  return `
    <div class="plat-wrap">
      ${botoes ? `<div class="plat-btns">${botoes}</div>`
               : `<p class="plat-vazio">😔 Sem streaming no Brasil no momento.</p>`}
      ${chips ? `<div class="plat-canais"><span class="plat-label">Exibição original:</span> ${chips}</div>` : ""}
      ${botoes ? `<p class="plat-hint">Disponibilidade verificada no Brasil. O botão abre a plataforma com o título já buscado.</p>` : ""}
    </div>`;
}

/* Bloco "Minha Biblioteca" dentro da ficha: nota pessoal, comentário e listas. */
function blocoPessoal(d) {
  const nota = minhaNota(d.id);
  const escala = Array.from({ length: 11 }, (_, n) =>
    `<button class="nota-op ${nota === n ? "on" : ""}" data-nota="${n}" data-id="${d.id}">${n}</button>`).join("");
  const listas = listasPersonalizadas();
  const chipsListas = listas.length
    ? listas.map((l) => `<button class="lista-chip ${naLista(l.id, d.id) ? "on" : ""}" data-addlista="${l.id}" data-id="${d.id}">${l.emoji} ${l.nome}</button>`).join("")
    : `<span class="dim-hint">Crie listas em 📚 Minha Biblioteca</span>`;

  return `
    <div class="pessoal">
      <div class="pessoal-linha">
        <h4>⭐ Minha nota ${nota != null ? `<b class="minha-nota-val">${nota}</b>` : ""}</h4>
        <div class="nota-escala">${escala}${nota != null ? `<button class="nota-limpar" data-nota="" data-id="${d.id}" title="Limpar nota">✕</button>` : ""}</div>
      </div>
      <div class="pessoal-linha">
        <h4>📝 Meu comentário</h4>
        <textarea class="comentario" data-coment="${d.id}" rows="2"
          placeholder="Suas anotações pessoais…">${getComentario(d.id)}</textarea>
      </div>
      <div class="pessoal-linha">
        <h4>📚 Minhas listas</h4>
        <div class="listas-chips">${chipsListas}</div>
      </div>
    </div>`;
}

const has = (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
const mchip = (t, cls = "") => `<span class="mchip ${cls}">${t}</span>`;
/* Chip clicável que vira filtro (categoria, gênero, tropo). */
const fchip = (t, cls = "") => `<button class="mchip filterable ${cls}" data-facet="${t}">${t}</button>`;
const mbtn = (id, list, label) => `<button class="mbtn ${inList(list, id) ? "on" : ""}" data-qa="${list}" data-id="${id}">${label}</button>`;
const cell = (label, val) => `<div class="data-cell"><span>${label}</span><b>${val}</b></div>`;
const section = (title, inner) => inner ? `<div class="modal-section"><h3>${title}</h3>${inner}</div>` : "";

/* Medidor 0–10 (romance, química, emoção…) */
function meter(label, val) {
  if (!has(val)) return "";
  const pct = Math.max(0, Math.min(100, (Number(val) / 10) * 100));
  return `<div class="meter"><span class="meter-l">${label}</span>
    <span class="meter-bar"><i style="width:${pct}%"></i></span>
    <span class="meter-v">${Number(val).toFixed(1).replace(/\.0$/, "")}</span></div>`;
}

/* Extrai o id do YouTube de várias formas de URL. */
function ytEmbed(url) {
  const m = String(url || "").match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export function openModal(id) {
  const d = STATE.byId[id]; if (!d) return;
  const [c1, c2] = posterColors(d.id);
  const back = resolveBackdrop(d);
  const poster = resolvePoster(d);

  const seen = new Set();
  const chips = [
    ...(d.categorias || []).map((t) => [t, "hi"]),
    ...(d.profissoes || []).map((t) => [t, "hi"]),
    ...(d.tropos || []).map((t) => [t, ""]),
    ...(d.temas || []).map((t) => [t, ""]),
    ...(d.generos || []).map((t) => [t, "hi"]), // legado
  ].filter(([t]) => { const k = String(t).toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; })
   .map(([t, c]) => fchip(t, c)).join("");

  const av = d.avaliacao || {};
  const notaMdl = av.mdl ?? d.nota_mdl;
  const perfil = d.perfil || {};
  const finalTxt = has(d.final) ? d.final : (d.final_feliz === true ? "Feliz" : d.final_feliz === false ? "Agridoce" : "");
  const flags = [
    d.triangulo_amoroso === true ? mchip("💔 Triângulo amoroso") : "",
    finalTxt ? mchip(`${FINAL_ICON[finalTxt.toLowerCase()] || "🎭"} Final ${finalTxt.toLowerCase()}`) : "",
    perfil.iniciante ? mchip("👶 Bom pra começar") : "",
    (perfil.dorameiro_veterano || perfil.veterano) ? mchip("🎓 Pra veteranos") : "",
  ].join("");

  const meters = [
    meter("❤️ Romance", sensacao(d, "romance")), meter("⚡ Química", sensacao(d, "quimica")),
    meter("😭 Emoção", sensacao(d, "emocao")), meter("😂 Humor", sensacao(d, "humor")),
    meter("💋 Beijos", sensacao(d, "beijos")), meter("🟢 Green flag", getFlag(d, "green")),
    meter("🔴 Red flag", getFlag(d, "red")),
  ].join("");

  const yt = ytEmbed(d.trailer);
  /* Trailer: embed verificado → player + link; URL de busca → só botão; vazio → seção some. */
  const trailer = has(d.trailer)
    ? (yt ? `<div class="trailer-embed"><iframe src="${yt}" title="Trailer" loading="lazy" allowfullscreen></iframe></div>
             <a class="trailer-yt" href="${d.trailer}" target="_blank" rel="noopener">Se o vídeo não carregar, assista no YouTube ↗</a>`
          : `<a class="mbtn" href="${d.trailer}" target="_blank" rel="noopener">▶ Assistir trailer no YouTube</a>`)
    : "";

  const elenco = has(d.elenco) ? `<div class="elenco-list">${d.elenco.map((n) => `<span>${n}</span>`).join("")}</div>` : "";
  const curios = has(d.curiosidades) ? `<ul class="curio-list">${d.curiosidades.map((c) => `<li>${c}</li>`).join("")}</ul>` : "";
  const recs = (d.recomendacoes || []).map(resolveRef).filter(Boolean);

  document.getElementById("modalCard").innerHTML = `
    <div class="modal-banner" style="--pc1:${c1};--pc2:${c2}">
      ${back ? `<div class="modal-bannerimg" style="background-image:url('${back}')"></div><div class="modal-bannerscrim"></div>` : ""}
      <button class="modal-close" id="modalClose" aria-label="Fechar">✕</button>
    </div>
    <div class="modal-inner">
      <div class="modal-head">
        ${poster ? `<div class="modal-poster"><img src="${poster}" alt="Pôster de ${d.titulo}" loading="lazy"></div>` : ""}
        <div class="modal-headmain">
          <div class="modal-badges">
            ${getNota(d) > 0 ? mchip("★ " + fmtNota(getNota(d)), "note") : ""}
            ${notaMdl > 0 ? mchip("MDL " + fmtNota(notaMdl)) : ""}
            ${av.imdb > 0 ? mchip("IMDb " + fmtNota(av.imdb)) : ""}
            ${d.status ? mchip(d.status) : ""}
          </div>
          ${(() => { /* status pessoal — visível de cara ao abrir a ficha */
            const meu = [
              inList("assisti", d.id) ? mchip("✅ Você já assistiu", "user") : "",
              inList("favoritos", d.id) ? mchip("❤️ Seu favorito", "user") : "",
              inList("quero", d.id) ? mchip("🔖 Na sua lista", "user") : "",
              minhaNota(d.id) != null ? mchip("⭐ Sua nota: " + minhaNota(d.id), "user") : "",
            ].join("");
            return meu ? `<div class="modal-badges meus">${meu}</div>` : "";
          })()}
          <h2 class="modal-title">${d.titulo}</h2>
          <p class="modal-orig">${d.titulo_original || ""}${has(d.titulo_br) && d.titulo_br !== d.titulo ? ` · <span class="modal-brname">🇧🇷 ${d.titulo_br}</span>` : ""}</p>
          <div class="modal-chips">${chips}</div>
          ${flags ? `<div class="flag-chips">${flags}</div>` : ""}
        </div>
      </div>

      <div class="modal-actions">
        ${mbtn(d.id, "favoritos", "❤️ Favorito")}
        ${mbtn(d.id, "quero", "🔖 Quero assistir")}
        ${mbtn(d.id, "assisti", "✅ Já assisti")}
        <button class="mbtn share" data-share="${d.id}">📤 Compartilhar</button>
      </div>

      ${blocoPessoal(d)}

      <div class="modal-datagrid">
        ${has(d.tipo) ? cell("Tipo", d.tipo) : ""}
        ${cell("País", flag(d.pais) + " " + (d.pais || "—"))}
        ${cell("Ano", d.ano || "—")}
        ${has(d.episodios) ? cell("Episódios", d.episodios) : ""}
        ${has(d.temporadas) ? cell("Temporadas", d.temporadas) : ""}
        ${has(d.duracao) ? cell("Duração", d.duracao) : ""}
        ${has(d.classificacao) ? cell("Classificação", d.classificacao + " anos") : ""}
        ${cell("Dublagem", d.dublado ? "Dublado" : "Legendado")}
        ${has(d.diretor) ? cell("Direção", d.diretor) : ""}
        ${has(d.roteirista) ? cell("Roteiro", d.roteirista) : ""}
        ${has(d.adaptacao) ? cell("Adaptação", d.adaptacao) : ""}
        ${has(d.universo) ? cell("Universo", d.universo) : ""}
      </div>

      ${section("▶️ Onde assistir", blocoOndeAssistir(d))}
      ${trailer ? section("Trailer", trailer) : ""}
      ${(() => {
        const nv = nivelConteudo(d), c = CONTEUDO[nv];
        if (!c || nv === "leve") return "";           // 🟢 não precisa de aviso
        return `<p class="aviso-conteudo n-${nv}">${c.cor} <b>${c.label}</b>${
          avisoConteudo(d) ? " — " + avisoConteudo(d) : " — " + c.desc}</p>`;
      })()}
      ${section("🏷️ Destaques", selosDe(d).map(s =>
        `<button class="selo" data-exp="${s.key}">${s.selo}</button>`).join("") || "")}
      ${section("Sinopse", has(d.sinopse) ? `<p>${d.sinopse}</p>` : "")}
      ${section("Por que assistir", has(d.porque_assistir) ? `<p>${d.porque_assistir}</p>` : "")}
      ${meters ? section("Termômetro", `<div class="meters">${meters}</div>`) : ""}
      ${section("Elenco", elenco)}
      ${section("Curiosidades", curios)}
      ${has(d.ost) ? section("Trilha sonora (OST)", `<ul class="curio-list">${d.ost.map((s) => `<li>${s}</li>`).join("")}</ul>`) : ""}
      ${has(d.premios) ? section("Prêmios", `<ul class="curio-list">${d.premios.map((p) => `<li>${p}</li>`).join("")}</ul>`) : ""}
      ${recs.length ? section("Se você gostou, assista", `<div class="rec-track">${recs.map(renderCard).join("")}</div>`) : ""}
      ${d.status_curadoria === "exemplo" ? '<span class="exemplo-flag">⚠ Registro de exemplo — substituir pela curadoria oficial.</span>' : ""}
    </div>`;

  const modal = document.getElementById("modal");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("modalClose").addEventListener("click", closeModal, { once: true });
  const card = document.getElementById("modalCard");
  card.dataset.doramaId = d.id; // permite atualizar a ficha ao marcar status
  hydrateImages(card);
  card.scrollTop = 0;
}

export function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) modal.hidden = true;
  document.body.style.overflow = "";
}
