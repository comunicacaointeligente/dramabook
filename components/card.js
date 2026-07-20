/* =========================================================
   components/card.js — cartão de dorama (componente reutilizável)
   ========================================================= */
import { STATE, resolvePoster, posterColors, flag, fmtNota, inList, getNota, platformText } from "../js/store.js";

/* Selos de status do usuário mostrados no próprio card (busca inclusa). */
export function statusHTML(id) {
  return [
    inList("assisti", id) ? '<span class="st seen" title="Já assisti">✅ Assistido</span>' : "",
    inList("favoritos", id) ? '<span class="st" title="Favorito">❤️</span>' : "",
    inList("quero", id) ? '<span class="st" title="Quero assistir">🔖</span>' : "",
  ].join("");
}

function qaButton(id, list, ico) {
  return `<button class="qa ${inList(list, id) ? "on" : ""}" data-qa="${list}" data-id="${id}" title="${list}" aria-label="${list}">${ico}</button>`;
}

/* Retorna o HTML de um cartão. Placeholder elegante (gradiente + título) quando não há capa. */
export function renderCard(d) {
  const [c1, c2] = posterColors(d.id);
  const src = resolvePoster(d);
  const img = src ? `<img src="${src}" alt="Pôster de ${d.titulo}" loading="lazy">` : "";
  return `
  <article class="card" data-id="${d.id}" tabindex="0" role="button" aria-label="${d.titulo}">
    <div class="poster" style="--pc1:${c1};--pc2:${c2}">
      ${img}
      <div class="poster-fallback"><b>${d.titulo}</b><span>${d.ano || ""}</span></div>
      <div class="rating-badge">★ ${fmtNota(getNota(d))}</div>
      ${(d.obra_prima === true || (getNota(d) ?? 0) >= 9) ? '<div class="mp-badge" title="Obra-prima">⭐</div>' : ""}
      ${d.dublado ? '<div class="dub-badge">DUB</div>' : ""}
      <div class="card-status">${statusHTML(d.id)}</div>
      <div class="quick-actions">
        ${qaButton(d.id, "favoritos", "❤️")}
        ${qaButton(d.id, "quero", "🔖")}
        ${qaButton(d.id, "assisti", "✅")}
      </div>
    </div>
    <div class="card-body">
      <p class="card-title">${d.titulo}</p>
      <p class="card-meta">${flag(d.pais)} ${d.ano || ""}${platformText(d) ? " · " + platformText(d) : ""}</p>
    </div>
  </article>`;
}

export function renderCards(list) { return list.map(renderCard).join(""); }

/* Fade-in robusto: marca .loaded mesmo com imagem em cache; erro cai no gradiente. */
export function hydrateImages(root = document) {
  root.querySelectorAll(".poster img, .hero-poster img, .modal-poster img").forEach(img => {
    if (img.dataset.hy) return; img.dataset.hy = "1";
    if (img.complete && img.naturalWidth > 0) img.classList.add("loaded");
    else {
      img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
      img.addEventListener("error", () => img.classList.add("failed"), { once: true });
    }
  });
}
