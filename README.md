# DRAMABOOK 🎬

A maior biblioteca de doramas em português. Experiência estilo streaming (Netflix / MyDramaList / Letterboxd), em **HTML + CSS + JavaScript modular (ES Modules)**, sem frameworks. Arquitetura preparada para 500+ títulos e para virar **PWA** (instalável no celular).

---

## Arquitetura

```
DRAMABOOK/
├── index.html               # casca da página (semântica, sem lógica)
├── styles.css               # design system (tokens, temas, componentes)
├── app.js                   # ponto de entrada (ES module) — só orquestra
│
├── js/                      # lógica (sem DOM de layout)
│   ├── config.js            # constantes, menu, imagens, humores (fonte única)
│   ├── store.js             # estado, listas (localStorage), carregamento, imagens
│   ├── filters.js           # busca, facetas, ordenações, sorteio
│   └── views.js             # telas: home, resultados (paginados), menu, badges
│
├── components/              # componentes reutilizáveis (renderizam HTML)
│   ├── card.js              # cartão de dorama + hidratação de imagem
│   ├── rail.js              # trilho horizontal
│   ├── hero.js              # destaque com banner + pôster
│   └── modal.js             # ficha completa
│
├── database/                # BANCO — separado do código
│   ├── manifest.json        # aponta o(s) arquivo(s) de dados
│   └── doramas.json         # FONTE ÚNICA: todos os doramas (menus derivados das categorias)
│
├── assets/                  # posters/ banners/ capas/ icones/ icons/
├── pwa/manifest.webmanifest # PWA (instalação)
├── service-worker.js        # PWA (offline) — pronto, desligado por padrão
├── build.mjs                # empacota tudo no arquivo único (ver abaixo)
└── dramabook-standalone.html# EXPORT p/ abrir com duplo-clique (gerado)
```

Princípios: banco separado do código · componentes reutilizáveis · configuração centralizada · faceta/menu dirigidos por dados · paginação para escalar · zero dependências externas de código.

---

## Como rodar

**Desenvolvimento (recomendado):** servidor local, porque ES Modules e `fetch` de JSON precisam de HTTP.
```bash
cd ~/DRAMABOOK
python3 -m http.server 8080
```
Abra **http://localhost:8080**.

**Só ver rápido (offline):** duplo-clique em **`dramabook-standalone.html`** — é o site inteiro empacotado num arquivo, gerado pelo build.

---

## Como ADICIONAR doramas (fluxo de lotes)

A curadoria (ChatGPT) chega em arquivos `lotes/loteXX.json` (só curadoria + título + ano). O Claude busca os metadados no TMDb e importa de forma **incremental**:

1. Salve o arquivo do lote em `lotes/` (ex.: `lote01b.json`).
2. Claude gera os metadados TMDb em `lotes/lote01b.meta.json` (chaveado por id/slug).
3. Importe (upsert por id, preserva o resto):
   ```bash
   node import-lote.mjs lote01b
   node build.mjs
   ```

**Padrões travados:**
- **IDs permanentes** = slug do título (`crash-landing-on-you`). Nunca mudam, nunca numéricos.
- **Recomendações por ID** (o importador converte títulos → ids automaticamente).
- **Episódios** = versão de exibição original (não a divisão Netflix/TMDb).
- **Importação incremental**: `import-lote.mjs` faz UPSERT por id — adiciona novos, atualiza existentes, nunca sobrescreve a base inteira.
- **Dados do usuário preservados**: favoritos / "já assisti" / "quero assistir" ficam no `localStorage` do navegador, por id permanente — importar lote nenhum os toca.

Os menus/filtros são **derivados automaticamente** das `categorias`/`tropos`/`temas`/`profissoes` — o mesmo dorama aparece em vários filtros. Fonte única: `database/doramas.json`.

### Ficha (SCHEMA v4 — 🔒 CONGELADO 17/07/2026, não muda mais)
```json
{
  "id": "",
  "titulo": "", "titulo_original": "", "tipo": "",
  "pais": "", "ano": 0, "episodios": 0, "temporadas": 1, "duracao": "",
  "status": "", "classificacao": 0, "final": "",
  "plataformas": [], "dublado": false,
  "categorias": [], "tropos": [], "temas": [], "profissoes": [],
  "elenco": [], "diretor": "", "roteirista": "", "adaptacao": "", "universo": "",
  "avaliacao": { "chatgpt": 0, "mdl": 0, "imdb": 0 },
  "sensacoes": { "romance": 0, "quimica": 0, "emocao": 0, "humor": 0, "beijos": 0 },
  "flags": { "green": 0, "red": 0 },
  "triangulo_amoroso": false,
  "perfil": { "iniciante": false, "dorameiro_veterano": false },
  "ost": [], "premios": [],
  "banner": "", "poster": "", "trailer": "",
  "sinopse": "", "porque_assistir": "",
  "curiosidades": [], "recomendacoes": []
}
```

**Objetos aninhados:** `avaliacao{chatgpt,mdl,imdb}` (0–10), `sensacoes{romance,quimica,emocao,humor,beijos}` (0–10), `flags{green,red}` (0–10), `perfil{iniciante,dorameiro_veterano}` (booleanos).
**Classificação em 4 listas** (mesmo dorama entra em vários filtros): `categorias`, `tropos`, `temas`, `profissoes`.
**`plataformas`** = array simples (`["Netflix","Viki","Disney+"]`). **`final`** = "Feliz" | "Agridoce" | "Triste" | "Aberto". `classificacao` = número. Texto: `tipo`, `status`, `duracao`, `adaptacao`, `universo`.

**Imagens (`poster` 2:3; `banner` horizontal):** caminho TMDb `/abc.jpg`, URL, ou nome de arquivo local. Vazio → busco no TMDb pelo título; sem imagem → placeholder com gradiente.
**Nota principal** = `nota_chatgpt` (cai pra `nota_mdl`). **Obra-prima** = nota ≥ 9. **Trailer** YouTube vira player embutido.

### Filtros
Definidos em `js/config.js` → `CATEGORY_MENU` (lista fixa da curadoria). Países casam por inclusão; Green/Red Flag e Química Inesquecível casam por medidor numérico OU tag. Tropos extras (Gumiho, Viagem no Tempo…) não precisam de item de menu: viram filtro clicando no chip da ficha.

---

## PWA (instalar no celular) — preparada, desligada

Os arquivos já existem (`pwa/manifest.webmanifest`, `service-worker.js`, ícone). Para ativar quando o site estiver **hospedado** (https):
1. Em `app.js`, troque `const PWA_ENABLED = false;` por `true`.
2. Publique o site (a instalação/offline só funciona em http/https, não em `file://`).

---

## Personalizar a marca
No topo do `styles.css`, troque `--azul-ci` e `--laranja-ci` pelos hex oficiais da CI. Tudo usa esses tokens.

## Recursos
🔍 busca instantânea · 🧭 menu por categorias/tropos · ❤️ favoritos / já assisti / quero assistir (localStorage) · 🆕🏆⭐🔥 trilhos · 🎲 "Me indique um dorama" por humor · 📄 ficha com banner + recomendações · 🌙 tema claro/escuro · 📱 responsivo · ⚡ paginação para escalar.

> Registros com `"status_curadoria": "exemplo"` são demonstração — substituir pela curadoria oficial.

## Regra oficial do acervo (20/07/2026)
**Só entram doramas disponíveis oficialmente em ao menos um streaming no Brasil.**
Toda recomendação do DRAMABOOK precisa ser assistível — nada de encantar a leitora
com um título que ela não tem onde ver. Registros sem streaming BR ficam guardados
no banco (invisíveis) e reaparecem sozinhos quando a disponibilidade muda.
Implementação: `SOMENTE_BRASIL` em js/config.js + filtro em js/store.js.

## Selos editoriais (editor_tags)
As prateleiras "✨ Descubra por experiência" são DERIVADAS dos dados da ficha
(sensações, flags, episódios, nota, perfil). O campo opcional `editor_tags`
permite curadoria manual e SEMPRE vence a regra automática:
```json
"editor_tags": ["😭 Prepare os lencinhos", "💎 Joia escondida"]
```
Use só quando a régua automática errar — o padrão é deixar os dados falarem.

## 🚦 Semáforo de conteúdo
Em vez de excluir títulos pesados, o DRAMABOOK **avisa antes**:
🟢 leve · 🟡 contém violência · 🟠 temas sensíveis · 🔴 conteúdo intenso

Vem do campo `conteudo: { nivel, aviso }` na ficha. Sem ele, é deduzido das TAGS
temáticas (vingança, bullying, luto, crime…) + red flags — NUNCA da classificação
etária coreana, que marca 15+ até em comédia romântica e daria falso alarme.
O aviso aparece na ficha (com a frase do que esperar) e como pontinho no card.

ATENÇÃO: o semáforo cobre violência e temas duros. A linha editorial que barra
BL/GL e sexo explícito na importação (`foraDaLinha` em import-lote.mjs) continua
valendo e é independente disto.
