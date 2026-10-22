/* =========================================================
   conta.js — cadastro e login do dorama book.
   Dois modos, mesma interface:
   • SUPABASE (produção): ativa quando AUTH.supabaseUrl e AUTH.supabaseAnonKey
     estão preenchidos em config.js. Senha fica no Supabase Auth (bcrypt);
     dados do perfil vão em user_metadata (depois: tabela profiles com RLS).
   • TESTE (agora): conta salva SÓ neste navegador. A senha nunca é guardada:
     guardamos um hash PBKDF2-SHA256 (210 mil iterações) com sal aleatório.
   ========================================================= */
import { AUTH } from "./config.js";

const CONTA_LS_CONTAS = "dramabook_contas_teste_v1";
const CONTA_LS_SESSAO = "dramabook_sessao_v1";
let contaSupa = null;

export const contaModo = () => (AUTH.supabaseUrl && AUTH.supabaseAnonKey ? "supabase" : "teste");

async function contaCliente() {
  if (contaSupa) return contaSupa;
  const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
  contaSupa = mod.createClient(AUTH.supabaseUrl, AUTH.supabaseAnonKey);
  return contaSupa;
}

const contaB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function contaHash(senha, salB64) {
  const sal = salB64 ? Uint8Array.from(atob(salB64), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: 210000 }, chave, 256);
  return { sal: contaB64(sal), hash: contaB64(bits) };
}
const contaLer = (k, pad) => { try { return JSON.parse(localStorage.getItem(k)) ?? pad; } catch { return pad; } };
const contaGravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* cota ou bloqueado */ } };
const contaEmail = (e) => String(e || "").trim().toLowerCase();

/* Validação comum aos dois modos. Devolve mensagem de erro ou "". */
export function contaValidar(d, cadastro) {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contaEmail(d.email))) return "Confira o e-mail.";
  if (!d.senha || d.senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!cadastro) return "";
  if (!/[A-Za-z]/.test(d.senha) || !/\d/.test(d.senha)) return "Use letras e números na senha.";
  if (d.senha !== d.senha2) return "As duas senhas não estão iguais.";
  if (!String(d.nome || "").trim()) return "Escreva seu nome.";
  if (String(d.telefone || "").replace(/\D/g, "").length < 10) return "Confira o telefone com DDD.";
  if (!String(d.cidade || "").trim()) return "Escreva sua cidade.";
  if (!d.aceite) return "Para criar a conta, aceite a política de privacidade.";
  return "";
}

export async function contaCadastrar(d) {
  const perfil = { nome: d.nome.trim(), telefone: d.telefone.trim(), cidade: d.cidade.trim(),
    endereco: String(d.endereco || "").trim(), plano: "gratuito", aceite_privacidade: new Date().toISOString() };
  if (contaModo() === "supabase") {
    const sb = await contaCliente();
    const { data, error } = await sb.auth.signUp({ email: contaEmail(d.email), password: d.senha, options: { data: perfil } });
    if (error) return { erro: error.message };
    return { usuario: { email: data.user?.email, ...perfil }, confirmarEmail: !data.session };
  }
  const contas = contaLer(CONTA_LS_CONTAS, {});
  const email = contaEmail(d.email);
  if (contas[email]) return { erro: "Já existe uma conta com esse e-mail neste navegador. Use Entrar." };
  const { sal, hash } = await contaHash(d.senha);
  contas[email] = { email, sal, hash, criadaEm: new Date().toISOString(), ...perfil };
  contaGravar(CONTA_LS_CONTAS, contas);
  contaGravar(CONTA_LS_SESSAO, { email, desde: Date.now() });
  return { usuario: contaPublica(contas[email]) };
}

export async function contaEntrar(emailBruto, senha) {
  const email = contaEmail(emailBruto);
  if (contaModo() === "supabase") {
    const sb = await contaCliente();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) return { erro: "E-mail ou senha incorretos." };
    return { usuario: { email: data.user.email, ...(data.user.user_metadata || {}) } };
  }
  const c = contaLer(CONTA_LS_CONTAS, {})[email];
  if (!c) return { erro: "E-mail ou senha incorretos." };
  const { hash } = await contaHash(senha, c.sal);
  if (hash !== c.hash) return { erro: "E-mail ou senha incorretos." };
  contaGravar(CONTA_LS_SESSAO, { email, desde: Date.now() });
  return { usuario: contaPublica(c) };
}

export async function contaAtual() {
  if (contaModo() === "supabase") {
    const sb = await contaCliente();
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    return u ? { email: u.email, ...(u.user_metadata || {}) } : null;
  }
  const s = contaLer(CONTA_LS_SESSAO, null);
  const c = s && contaLer(CONTA_LS_CONTAS, {})[s.email];
  return c ? contaPublica(c) : null;
}

export async function contaSair() {
  if (contaModo() === "supabase") { const sb = await contaCliente(); await sb.auth.signOut(); }
  try { localStorage.removeItem(CONTA_LS_SESSAO); } catch { /* ok */ }
}

export async function contaRecuperar(emailBruto) {
  if (contaModo() !== "supabase") return { erro: "No modo de teste não há envio de e-mail. Crie a conta de novo com outro e-mail, se precisar." };
  const sb = await contaCliente();
  const { error } = await sb.auth.resetPasswordForEmail(contaEmail(emailBruto), { redirectTo: location.href.split("#")[0] });
  return error ? { erro: error.message } : { ok: true };
}

function contaPublica(c) { const { sal, hash, ...resto } = c; return resto; }
