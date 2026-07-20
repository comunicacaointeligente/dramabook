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
    <div class="rail-track">${renderCards(items)}</div>`;
}
