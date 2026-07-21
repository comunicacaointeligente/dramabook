/* =========================================================
   components/rail.js — trilho horizontal (Netflix-style)
   ========================================================= */
import { renderCards } from "./card.js";

export function renderRail(el, { title, sub = "", items }) {
  if (!el) return;
  if (!items || !items.length) { el.innerHTML = ""; el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `
    <div class="rail-head"><h2>${title}</h2>${sub ? `<span class="rail-sub">${sub}</span>` : ""}</div>
    <div class="rail-wrap">
      <button class="rail-arrow left" aria-label="Anterior">‹</button>
      <div class="rail-track">${renderCards(items)}</div>
      <button class="rail-arrow right" aria-label="Próximo">›</button>
    </div>`;
  const track = el.querySelector(".rail-track");
  const roll = (dir) => track.scrollBy({ left: dir * (track.clientWidth * 0.85), behavior: "smooth" });
  el.querySelector(".rail-arrow.left").addEventListener("click", () => roll(-1));
  el.querySelector(".rail-arrow.right").addEventListener("click", () => roll(1));
}
