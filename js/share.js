/* =========================================================
   share.js — compartilhamento de dorama e de listas
   Usa a Web Share API quando disponível; senão abre uma folha
   com "copiar link" e "WhatsApp". Links funcionam por hash,
   sem back-end (o site abre direto no item/lista compartilhada).
   ========================================================= */
import { $, getNota, fmtNota, toast } from "./store.js";

const base = () => location.href.split("#")[0];
export const linkDorama = (id) => `${base()}#d=${encodeURIComponent(id)}`;

/* Codifica/decodifica uma lista personalizada no próprio link (unicode-safe). */
export function linkLista(lista) {
  const payload = { n: lista.nome, e: lista.emoji, i: lista.itens };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return `${base()}#lista=${b64}`;
}
export function lerListaDoLink(b64) {
  try { return JSON.parse(decodeURIComponent(escape(atob(b64)))); } catch { return null; }
}

function resumo(txt, max = 160) {
  const t = String(txt || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

export async function compartilharDorama(d) {
  const url = linkDorama(d.id);
  const nota = getNota(d);
  const titulo = `${d.titulo}${d.ano ? ` (${d.ano})` : ""}`;
  const texto = `🎬 ${titulo}${nota > 0 ? ` — ★ ${fmtNota(nota)} no DRAMABOOK` : ""}\n${resumo(d.sinopse)}`;
  return compartilhar({ title: titulo, text: texto, url, poster: d.poster });
}

export async function compartilharLista(lista, qtd) {
  const url = linkLista(lista);
  const titulo = `${lista.emoji} ${lista.nome}`;
  const texto = `${titulo} — minha lista com ${qtd} dorama(s) no DRAMABOOK 💜`;
  return compartilhar({ title: titulo, text: texto, url });
}

async function compartilhar({ title, text, url }) {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return "nativo"; }
    catch (e) { if (e?.name === "AbortError") return "cancelado"; }
  }
  abrirFolha({ title, text, url });
  return "folha";
}

function abrirFolha({ title, text, url }) {
  const el = $("#shareSheet");
  el.innerHTML = `
    <div class="share-card">
      <button class="share-close" data-sharefechar aria-label="Fechar">✕</button>
      <h3>Compartilhar</h3>
      <p class="share-preview">${title}</p>
      <div class="share-actions">
        <button class="mbtn" data-sharecopiar>📋 Copiar link</button>
        <a class="mbtn" target="_blank" rel="noopener"
           href="https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}">💬 WhatsApp</a>
      </div>
      <input class="share-url" value="${url}" readonly />
    </div>`;
  el.hidden = false;
  el.dataset.url = url;
}
export function fecharFolha() { const el = $("#shareSheet"); if (el) el.hidden = true; }

export async function copiarLink(url) {
  try { await navigator.clipboard.writeText(url); toast("Link copiado ✓"); }
  catch { toast("Não consegui copiar — selecione o link"); }
}
