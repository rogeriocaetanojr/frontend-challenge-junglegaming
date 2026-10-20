# Auditoria de Performance e Qualidade com Lighthouse (Seção 10 do Edital)

Este diretório armazena os metadados, baselines e configurações da auditoria contínua de qualidade de ponta a ponta da aplicação **KURIO NFT Marketplace**.

---

### 1. Metas e Critérios de Aceite (SLOs)

Conforme estipulado no edital de avaliação técnica, o projeto possui as seguintes metas mínimas de qualidade:

| Categoria                 | Meta Mínima (Score) | Severidade da Asserção |
| :------------------------ | :-----------------: | :--------------------: |
| **Performance**           |    >= 0.90 (90%)    |         `warn`         |
| **Acessibilidade (a11y)** |    >= 0.95 (95%)    |        `error`         |
| **Boas Práticas**         |    >= 0.95 (95%)    |        `error`         |
| **SEO**                   |    >= 0.90 (90%)    |         `warn`         |

---

### 2. Configuração do Lighthouse CI

A configuração automatizada reside na raiz do projeto em `lighthouserc.json` e monitora:

- **Home / Catálogo Geral:** Fluxo de carregamento dos banners, filtros combinados, lista de coleções e malha responsiva de NFTs.
- **Página de Detalhes do NFT:** Exibição das artes, histórico de lances, abas técnicas com atributos acessíveis (ARIA) e painel de compra.

---

### 3. Como Executar a Auditoria

```bash
# Executa o build de produção e a auditoria via script do projeto:
pnpm lighthouse

# Ou executar diretamente via CLI do LHCI:
npx @lhci/cli autorun
```
