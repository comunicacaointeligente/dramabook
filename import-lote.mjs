#!/usr/bin/env node
/* import-lote.mjs — importação INCREMENTAL de um lote no doramas.json.
   - Funde curadoria (lotes/<nome>.json) + metadados TMDb (lotes/<nome>.meta.json).
   - id = slug permanente do título · recomendações convertidas p/ id.
   - UPSERT por id: adiciona novos, atualiza existentes, PRESERVA o resto.
     (Favoritos/"já assisti"/"quero assistir" ficam no localStorage do navegador,
      por id permanente — nunca são tocados por uma importação.)
   Uso: node import-lote.mjs <nome-do-lote>   (ex.: node import-lote.mjs lote01a)  */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

/* Trailer só entra VERIFICADO: YouTube oEmbed 200 = embutível; senão vira
   busca no YouTube; vazio fica vazio (a ficha simplesmente não mostra a seção). */
function validarTrailer(url, titulo) {
  if (!url || !/youtu/.test(url)) return url || "";
  try {
    const code = execSync(
      `curl -s -m 12 -o /dev/null -w "%{http_code}" "https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json"`
    ).toString().trim();
    if (code === "200") return url;
  } catch { /* rede indisponível → cai no fallback */ }
  console.log(`  ⚠ trailer inválido em "${titulo}" → substituído por busca no YouTube`);
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${titulo} official trailer`);
}

const ROOT = new URL(".", import.meta.url).pathname;
const name = process.argv[2];
if (!name) { console.error("uso: node import-lote.mjs <nome-do-lote>"); process.exit(1); }

/* slug permanente e estável a partir do título (mesma regra p/ id e p/ recomendações). */
export const slugify = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const tipoDe = (p) => /coreia/i.test(p) ? "K-Drama" : /jap/i.test(p) ? "J-Drama" : /china/i.test(p) ? "C-Drama" : "";

/* LINHA EDITORIAL (Clau, 20/07/2026): o catálogo não inclui títulos focados
   em romance BL/GL nem com conteúdo sexual explícito. Ficha com essas tags
   é BARRADA na importação (aviso no console; nada é gravado). */
const FORA_DA_LINHA = ["bl", "gl", "boys love", "girls love", "yaoi", "yuri", "erótico", "erotico", "sexo explícito", "sexo explicito", "conteúdo adulto", "19+"];
function foraDaLinha(rec) {
  const tags = [...(rec.categorias || []), ...(rec.tropos || []), ...(rec.temas || []), ...(rec.generos || [])]
    .map((t) => String(t).toLowerCase().trim());
  return FORA_DA_LINHA.filter((a) => tags.some((t) => t === a || (a.includes(" ") && t.includes(a))));
}

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const curation = read(`${ROOT}lotes/${name}.json`);
const meta = existsSync(`${ROOT}lotes/${name}.meta.json`) ? read(`${ROOT}lotes/${name}.meta.json`) : {};

const dbPath = `${ROOT}database/doramas.json`;
const existing = existsSync(dbPath) ? read(dbPath) : [];
const byId = new Map(existing.map((d) => [d.id, d]));

let added = 0, updated = 0;
for (const c of curation) {
  const id = slugify(c.titulo);
  const m = meta[id] || {};
  const rec = {
    id,
    titulo: c.titulo, titulo_original: m.titulo_original ?? "", titulo_br: m.titulo_br ?? c.titulo_br ?? "", tipo: m.tipo ?? tipoDe(m.pais || ""),
    pais: m.pais ?? "", ano: c.ano ?? m.ano ?? 0, episodios: m.episodios ?? 0, temporadas: m.temporadas ?? 1,
    duracao: m.duracao ?? "", status: m.status ?? "",
    ...(m.classificacao != null ? { classificacao: m.classificacao } : {}),
    final: c.final ?? "", plataformas: m.plataformas ?? [], dublado: c.dublado ?? false,
    categorias: c.categorias ?? [], tropos: c.tropos ?? [], temas: c.temas ?? [], profissoes: c.profissoes ?? [],
    elenco: m.elenco ?? [], diretor: m.diretor ?? "", roteirista: m.roteirista ?? "",
    adaptacao: c.adaptacao ?? "", universo: c.universo ?? "",
    avaliacao: c.avaliacao ?? {}, sensacoes: c.sensacoes ?? {}, flags: c.flags ?? {},
    triangulo_amoroso: c.triangulo_amoroso ?? false, perfil: c.perfil ?? {},
    ost: c.ost ?? [], premios: c.premios ?? [],
    banner: m.banner ?? "", poster: m.poster ?? "", trailer: validarTrailer(m.trailer ?? "", c.titulo),
    sinopse: c.sinopse ?? "", porque_assistir: c.porque_assistir ?? "",
    curiosidades: c.curiosidades ?? [],
    recomendacoes: (c.recomendacoes ?? []).map(slugify), // títulos → ids permanentes
  };
  const alerta = foraDaLinha(rec);
  if (alerta.length) {
    console.log(`  🚫 "${rec.titulo}" BARRADO pela linha editorial (${alerta.join(", ")}) — não importado.`);
    continue;
  }
  byId.has(id) ? updated++ : added++;
  byId.set(id, rec);
}

const out = [...byId.values()];
writeFileSync(dbPath, JSON.stringify(out, null, 2) + "\n");
console.log(`Lote "${name}": +${added} novo(s), ${updated} atualizado(s). Total no banco: ${out.length}.`);
