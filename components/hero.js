/* =========================================================
   components/hero.js — destaque com banner horizontal + pôster
   ========================================================= */
import { resolvePoster, resolveBackdrop, posterColors, flag, fmtNota, getNota, platformText } from "../js/store.js";
import { statusHTML } from "./card.js";

export function renderHero(d) {
  const hero = document.getElementById("hero");
  if (!hero || !d) return;
  hero.hidden = false;
  const [c1, c2] = posterColors(d.id);
  const back = resolveBackdrop(d);
  const poster = resolvePoster(d);
  hero.style.setProperty("--pc1", c1);
  hero.style.setProperty("--pc2", c2);
  hero.classList.toggle("has-backdrop", !!back);

  hero.innerHTML = `
    <div class="hero-bg" ${back ? `style="background-image:url('${back}')"` : ""}></div>
    <div class="hero-scrim"></div>
    <div class="hero-text">
      <span class="hero-tag">Destaque de hoje</span>
      <h1 class="hero-title">${d.titulo}</h1>
      <div class="hero-meta">
        <span class="hero-nota">★ <b>${fmtNota(getNota(d))}</b></span>
        <span>${flag(d.pais)} ${d.pais || ""}</span><span>${d.ano || ""}</span>
        ${platformText(d) ? `<span>${platformText(d)}</span>` : ""}${d.dublado ? "<span>Dublado</span>" : ""}
      </div>
      <div class="hero-status" data-id="${d.id}">${statusHTML(d.id)}</div>
      <p class="hero-syn">${d.sinopse || ""}</p>
      <div class="hero-actions">
        <button class="chip-btn" data-open="${d.id}">▶ Ver ficha</button>
        <button class="chip-btn ghost" data-qa="quero" data-id="${d.id}">🔖 Quero assistir</button>
      </div>
    </div>
    ${poster ? `<div class="hero-poster"><img src="${poster}" alt="Pôster de ${d.titulo}" loading="lazy"></div>` : ""}`;
}
