# Lotes de curadoria — DRAMABOOK

Coloque aqui os arquivos JSON de curadoria produzidos pelo ChatGPT.
Ex.: lote01a.json, lote01b.json, lote02a.json...

Cada arquivo = um array de fichas no schema v4 (só a curadoria + título + ano).
O Claude lê o arquivo, busca os metadados/imagens no TMDb, completa cada ficha
e importa (merge) no ../database/doramas.json. Os arquivos ficam aqui arquivados
para histórico/versionamento — a fonte compilada do site é o doramas.json.
