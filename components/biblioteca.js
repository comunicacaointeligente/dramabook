/* =========================================================
   components/biblioteca.js — tela "Minha Biblioteca"
   Resumo + estatísticas + listas personalizadas + exportar/importar.
   Lê apenas dados locais do usuário (user.js) cruzados com o catálogo.
   ========================================================= */
import { STATE, itemsInList, recentes } from "../js/store.js";
import { estatisticas, listasPersonalizadas } from "../js/user.js";
import { renderCards, hydrateImages } from "./card.js";

const tile = (valor, rotulo, extra = "") =>
  `<div class="stat-tile"><b>${valor}</b><span>${rotulo}</span>${extra ? `<i>${extra}</i>` : ""}</div>`;

const topLista = (titulo, pares, sufixo = "") => {
  if (!pares.length) return "";
  return `<div class="top-bloco"><h4>${titulo}</h4><ol class="top-lista">${pares
    .slice(0, 5)
    .map(([nome, n]) => `<li><span>${nome}</span><b>${n}${sufixo}</b></li>`)
    .join("")}</ol></div>`;
};

export function renderBiblioteca() {
  const el = document.getElementById("bibliotecaView");
  if (!el) return;
  const s = estatisticas(STATE.byId);
  const listas = listasPersonalizadas();

  const recFav = recentes("favoritos", 10).map((id) => STATE.byId[id]).filter(Boolean);
  const recVis = recentes("assisti", 10).map((id) => STATE.byId[id]).filter(Boolean);
  const quero = itemsInList("quero");

  el.innerHTML = `
    <div class="bib-head">
      <h1>📚 Minha Biblioteca</h1>
      <p>Sua jornada como dorameira — tudo salvo só no seu navegador.</p>
    </div>

    <div class="stat-grid">
      ${tile(STATE.all.length, "no catálogo")}
      ${tile(s.assistidos, "já assisti")}
      ${tile(s.favoritos, "favoritos")}
      ${tile(s.quero, "quero assistir")}
      ${tile(s.mediaNota != null ? s.mediaNota.toFixed(1) : "—", "minha nota média", s.totalNotas ? `${s.totalNotas} avaliados` : "")}
    </div>

    <div class="stat-grid">
      ${tile(s.episodios, "episódios assistidos")}
      ${tile(s.horas + "h", "horas assistidas", s.semDuracao ? `${s.semDuracao} sem duração` : "")}
      ${tile(s.paises[0]?.[0] || "—", "país que mais assiste")}
      ${tile(s.categorias[0]?.[0] || "—", "categoria favorita")}
      ${tile(s.comentarios, "comentários seus")}
    </div>

    ${(s.categorias.length || s.tropos.length || s.paises.length) ? `
    <section class="bib-secao">
      <h2>📊 Estatísticas</h2>
      <div class="tops">
        ${topLista("Categorias favoritas", s.categorias)}
        ${topLista("Tropos favoritos", s.tropos)}
        ${topLista("Países", s.paises)}
      </div>
    </section>` : ""}

    <section class="bib-secao">
      <h2>✨ Minhas listas</h2>
      <div class="listas-grid">
        ${listas.map((l) => `
          <div class="lista-card">
            <div class="lista-topo"><span class="lista-nome">${l.emoji} ${l.nome}</span>
              <span class="lista-qtd">${l.itens.length}</span></div>
            <div class="lista-acoes">
              <button class="mbtn sm" data-verlista="${l.id}">Ver</button>
              <button class="mbtn sm" data-sharelista="${l.id}">📤 Compartilhar</button>
              <button class="mbtn sm danger" data-dellista="${l.id}">Excluir</button>
            </div>
          </div>`).join("")}
        <div class="lista-card nova">
          <input class="lista-input" id="novaListaNome" placeholder="Nome da lista (ex.: Comfort dramas)" />
          <input class="lista-emoji" id="novaListaEmoji" value="💜" maxlength="2" aria-label="Emoji" />
          <button class="chip-btn" id="criarLista">+ Criar lista</button>
        </div>
      </div>
    </section>

    ${recVis.length ? `<section class="rail bib-rail"><div class="rail-head"><h2>✅ Últimos assistidos</h2></div>
      <div class="rail-track">${renderCards(recVis)}</div></section>` : ""}
    ${recFav.length ? `<section class="rail bib-rail"><div class="rail-head"><h2>❤️ Últimos favoritados</h2></div>
      <div class="rail-track">${renderCards(recFav)}</div></section>` : ""}
    ${quero.length ? `<section class="rail bib-rail"><div class="rail-head"><h2>🔖 Quero assistir</h2></div>
      <div class="rail-track">${renderCards(quero)}</div></section>` : ""}

    ${!s.assistidos && !s.favoritos && !s.quero ? `
      <div class="empty-state"><div class="empty-mark">💜</div>
        <h2>Sua biblioteca está vazia</h2>
        <p>Marque doramas como favoritos, "já assisti" ou "quero assistir" e eles aparecem aqui com suas estatísticas.</p>
      </div>` : ""}

    <section class="bib-secao">
      <h2>💾 Backup da minha biblioteca</h2>
      <p class="dim-hint">Seus dados ficam só neste navegador. Exporte para guardar ou levar para outro dispositivo.</p>
      <div class="bib-backup">
        <button class="mbtn" id="exportarBib">⬇️ Exportar</button>
        <label class="mbtn" for="importarBib">⬆️ Importar</label>
        <input type="file" id="importarBib" accept="application/json" hidden />
      </div>
    </section>`;

  hydrateImages(el);
}
