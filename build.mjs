#!/usr/bin/env node
/* build.mjs — empacota os módulos ES num arquivo único (dramabook-standalone.html)
   pra abrir com duplo-clique (offline). Fonte de dados: manifest.files (doramas.json).
   Uso: node build.mjs  */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), "utf8");

/* 1. lê o(s) arquivo(s) de dados do manifesto e junta num array único */
const manifest = JSON.parse(read("database/manifest.json"));
const files = Array.isArray(manifest.files) && manifest.files.length ? manifest.files : ["doramas.json"];
const all = files.flatMap((f) => JSON.parse(read(`database/${f}`)));

/* 2. empacota os módulos ES (remove import/export) */
const MODULES = [
  "js/config.js", "js/user.js", "js/plataformas.js", "js/store.js", "js/filters.js",
  "js/diagnostico.js",
  "components/card.js", "components/rail.js", "components/hero.js", "components/modal.js",
  "components/biblioteca.js", "js/share.js", "js/views.js", "app.js",
];
const apelidos = [];
function strip(src, arquivo = "") {
  const out = [];
  let skip = false;
  for (const line of src.split("\n")) {
    const s = line.trimStart();
    // Apelido de import (`x as y`) some no bundle → o nome vira undefined em runtime.
    if (s.startsWith("import ") && /\{[^}]*\s+as\s+/.test(line)) apelidos.push(`${arquivo}: ${s.trim()}`);
    if (!skip && s.startsWith("import ")) { if (line.includes(";")) continue; skip = true; continue; }
    if (skip) { if (line.includes(";")) skip = false; continue; }
    // re-export (`export { a, b } from "./x.js"`) some: no bundle tudo vive no mesmo escopo
    if (/^export\s+[^=]*\bfrom\s+["']/.test(s)) continue;
    out.push(line.replace(/^(\s*)export\s+/, "$1"));
  }
  return out.join("\n");
}
const pedacos = MODULES.map((m) => ({ m, src: strip(read(m), m) }));

if (apelidos.length) {
  console.error("✗ Import com apelido (`x as y`) não sobrevive ao empacotamento — use o nome direto:\n  - " + apelidos.join("\n  - "));
  process.exit(1);
}

/* GUARDA: no bundle tudo vive num escopo só. Nomes repetidos entre módulos
   se sobrescrevem silenciosamente — então o build FALHA se isso acontecer. */
const declarados = new Map();
const colisoes = [];
for (const { m, src } of pedacos) {
  for (const linha of src.split("\n")) {
    const d = linha.match(/^(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/);
    if (!d) continue;
    const nome = d[1];
    if (declarados.has(nome)) colisoes.push(`${nome} (${declarados.get(nome)} × ${m})`);
    else declarados.set(nome, m);
  }
}
if (colisoes.length) {
  console.error("✗ Colisão de nomes entre módulos — renomeie antes de empacotar:\n  - " + colisoes.join("\n  - "));
  process.exit(1);
}

const bundle = pedacos.map(({ m, src }) => `/* ---- ${m} ---- */\n${src}`).join("\n\n");

/* 3. monta o HTML (sem doctype/html/head/body — o envelope é externo) */
const index = read("index.html");
let body = index.match(/<body>([\s\S]*)<\/body>/)[1];
body = body.replace(/<script type="module" src="app\.js"><\/script>/, "").trim();

const html =
  `<meta charset="utf-8">\n` +
  `<title>dorama book — Biblioteca de Doramas</title>\n` +
  `<style>\n${read("styles.css")}\n</style>\n` +
  `${body}\n` +
  `<script>window.DRAMABOOK_DB = ${JSON.stringify(all)};</script>\n` +
  `<script>(function(){\n${bundle}\n})();</script>\n`;

writeFileSync(join(ROOT, "dramabook-standalone.html"), html);
console.log(`OK  standalone: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB · ${all.length} doramas · ${MODULES.length} módulos`);
