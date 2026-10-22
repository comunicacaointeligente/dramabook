/* =========================================================
   entrada.js — tela de entrada: cadastro, login e plano.
   Cobre o app até a pessoa entrar. Fundo = mosaico de pôsteres do acervo.
   ========================================================= */
import { contaModo, contaValidar, contaCadastrar, contaEntrar, contaAtual, contaSair, contaRecuperar } from "../js/conta.js";
import { IMG_BASE } from "../js/config.js";

const entradaEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let entradaAoEntrar = () => {};

export function entradaMontar(onEntrar) {
  entradaAoEntrar = onEntrar;
  const el = document.getElementById("entrada");
  const teste = contaModo() === "teste";
  el.innerHTML = `
    <div class="entrada-mosaico" aria-hidden="true"><div class="entrada-trilho"></div></div>
    <div class="entrada-veu" aria-hidden="true"></div>
    <main class="entrada-conteudo">
      <section class="entrada-lado">
        <div class="entrada-logo"><span class="logo-mark">▶</span><span>dorama <b>book</b></span></div>
        <h1>Nunca mais esqueça um dorama que você já viu.</h1>
        <p>Mais de 800 doramas em português, com onde assistir no Brasil, dublagem, notas e listas pessoais: o que você já assistiu, o que está vendo e o que quer ver.</p>
        <ul class="entrada-beneficios">
          <li>✅ Marque o que já assistiu</li><li>🔖 Monte sua lista de desejos</li><li>⭐ Dê sua nota e escreva o que achou</li>
        </ul>
      </section>
      <section class="entrada-cartao" role="dialog" aria-label="Entrar no dorama book">
        <div class="entrada-abas" role="tablist">
          <button role="tab" class="ativo" data-aba="cadastro">Criar conta</button>
          <button role="tab" data-aba="login">Entrar</button>
        </div>
        <form class="entrada-form" data-form="cadastro" novalidate>
          <label>Nome<input name="nome" autocomplete="name" required></label>
          <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
          <div class="entrada-duas">
            <label>Senha<input name="senha" type="password" autocomplete="new-password" minlength="8" required></label>
            <label>Repita a senha<input name="senha2" type="password" autocomplete="new-password" minlength="8" required></label>
          </div>
          <div class="entrada-duas">
            <label>Telefone<input name="telefone" type="tel" autocomplete="tel" placeholder="(31) 99999-9999" required></label>
            <label>Cidade<input name="cidade" autocomplete="address-level2" required></label>
          </div>
          <label>Endereço (opcional)<input name="endereco" autocomplete="street-address" placeholder="Rua, número, bairro"></label>
          <fieldset class="entrada-planos">
            <legend>Plano</legend>
            <label class="plano escolhido"><input type="radio" name="plano" value="gratuito" checked>
              <span class="plano-nome">Gratuito</span><span class="plano-preco">R$ 0</span>
              <span class="plano-desc">Acervo completo, listas e notas pessoais.</span></label>
            <label class="plano breve" aria-disabled="true"><input type="radio" name="plano" value="premium" disabled>
              <span class="plano-nome">Premium</span><span class="plano-preco">em breve</span>
              <span class="plano-desc">Recursos extras para quem é dorameira de verdade.</span></label>
          </fieldset>
          <label class="entrada-aceite"><input type="checkbox" name="aceite">
            <span>Li e aceito a <a href="#" data-acao="privacidade">política de privacidade</a>.</span></label>
          <p class="entrada-erro" role="alert"></p>
          <button class="entrada-botao" type="submit">Criar minha conta</button>
        </form>
        <form class="entrada-form" data-form="login" hidden novalidate>
          <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
          <label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>
          <p class="entrada-erro" role="alert"></p>
          <button class="entrada-botao" type="submit">Entrar</button>
          <button class="entrada-link" type="button" data-acao="esqueci">Esqueci a senha</button>
        </form>
        <div class="entrada-privacidade" hidden>
          <h3>Seus dados</h3>
          <p>Usamos nome, e-mail, telefone, cidade e endereço só para a sua conta no dorama book. Não vendemos nem compartilhamos com ninguém. A senha nunca é guardada em texto: guardamos apenas uma versão criptografada. Você pode pedir para apagar sua conta quando quiser.</p>
          <button class="entrada-link" type="button" data-acao="fechar-privacidade">Voltar</button>
        </div>
        ${teste ? `<p class="entrada-aviso">🧪 Versão de teste: a conta fica salva só neste navegador.</p>` : ""}
      </section>
    </main>`;
  el.addEventListener("click", entradaClique);
  el.addEventListener("submit", entradaEnviar);
}

export function entradaPreencherMosaico(lista) {
  const trilho = document.querySelector("#entrada .entrada-trilho");
  if (!trilho) return;
  const com = lista.filter((d) => d.poster).sort((a, b) => (b.avaliacao?.chatgpt || 0) - (a.avaliacao?.chatgpt || 0)).slice(0, 60);
  const embaralhado = com.sort(() => Math.random() - 0.5);
  const imgs = embaralhado.map((d) => `<img src="${IMG_BASE}/w342${entradaEsc(d.poster)}" alt="" loading="lazy">`).join("");
  trilho.innerHTML = imgs + imgs;   // duplicado: o deslize fica contínuo
}

export async function entradaVerificar() {
  const el = document.getElementById("entrada");
  // Arquivo offline (duplo-clique) não tem criptografia do navegador: abre direto.
  if (location.protocol === "file:" || !window.crypto?.subtle) { el.hidden = true; return null; }
  const u = await contaAtual().catch(() => null);
  el.hidden = !!u;
  document.body.classList.toggle("sem-conta", !u);
  return u;
}

export async function entradaSair() {
  await contaSair();
  document.getElementById("entrada").hidden = false;
  document.body.classList.add("sem-conta");
  window.scrollTo(0, 0);
}

function entradaAba(nome) {
  const el = document.getElementById("entrada");
  el.querySelectorAll("[data-aba]").forEach((b) => b.classList.toggle("ativo", b.dataset.aba === nome));
  el.querySelectorAll("[data-form]").forEach((f) => { f.hidden = f.dataset.form !== nome; });
  el.querySelector(".entrada-privacidade").hidden = true;
}

async function entradaClique(e) {
  const aba = e.target.closest("[data-aba]");
  if (aba) return entradaAba(aba.dataset.aba);
  const acao = e.target.closest("[data-acao]")?.dataset.acao;
  if (!acao) return;
  e.preventDefault();
  const el = document.getElementById("entrada");
  if (acao === "privacidade") { el.querySelectorAll("[data-form]").forEach((f) => (f.hidden = true)); el.querySelector(".entrada-privacidade").hidden = false; }
  if (acao === "fechar-privacidade") entradaAba("cadastro");
  if (acao === "esqueci") {
    const form = el.querySelector('[data-form="login"]');
    const r = await contaRecuperar(form.email.value);
    form.querySelector(".entrada-erro").textContent = r.erro || "Enviamos um link para o seu e-mail.";
  }
}

async function entradaEnviar(e) {
  e.preventDefault();
  const form = e.target;
  const erro = form.querySelector(".entrada-erro");
  const botao = form.querySelector(".entrada-botao");
  const d = Object.fromEntries(new FormData(form));
  d.aceite = !!form.aceite?.checked;
  const cadastro = form.dataset.form === "cadastro";
  const msg = contaValidar(d, cadastro);
  if (msg) { erro.textContent = msg; return; }
  erro.textContent = ""; botao.disabled = true; botao.textContent = "Aguarde…";
  try {
    const r = cadastro ? await contaCadastrar(d) : await contaEntrar(d.email, d.senha);
    if (r.erro) { erro.textContent = r.erro; return; }
    if (r.confirmarEmail) { erro.textContent = "Conta criada! Confirme pelo link que enviamos ao seu e-mail e depois entre."; entradaAba("login"); return; }
    form.reset();
    document.getElementById("entrada").hidden = true;
    document.body.classList.remove("sem-conta");
    entradaAoEntrar(r.usuario);
  } catch (err) {
    erro.textContent = "Não foi possível concluir agora. Tente de novo.";
  } finally {
    botao.disabled = false; botao.textContent = cadastro ? "Criar minha conta" : "Entrar";
  }
}
