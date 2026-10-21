# Auditoria Lighthouse

Artefatos versionados da auditoria da seção 10 do edital. A tabela de resultados e a análise das causas estão no [README principal](../../README.md#lighthouse).

| Arquivo                   | Conteúdo                                                                                       |
| :------------------------ | :--------------------------------------------------------------------------------------------- |
| `summary.json`            | Medianas por página e perfil (categorias, LCP, CLS, TBT), versões das ferramentas e condições. |
| `desktop-home.report.*`   | Relatório HTML/JSON da execução mediana de `/` no perfil desktop.                              |
| `desktop-nfts-1.report.*` | Relatório HTML/JSON da execução mediana de `/nfts/1` no perfil desktop.                        |
| `mobile-home.report.*`    | Relatório HTML/JSON da execução mediana de `/` no perfil mobile.                               |
| `mobile-nfts-1.report.*`  | Relatório HTML/JSON da execução mediana de `/nfts/1` no perfil mobile.                         |

## Como reproduzir

```bash
pnpm lighthouse
```

1. Gera o build otimizado (`pnpm build`).
2. Roda o LHCI com `lighthouserc.desktop.json` e `lighthouserc.mobile.json`, cada um sobre o `pnpm preview` e com 3 execuções por página.
3. Executa `scripts/lighthouse-summary.mjs`, que calcula as medianas e copia para esta pasta os relatórios da execução representativa marcada pelo LHCI.

As 12 execuções completas ficam em `lighthouse-reports/`, que não é versionado.
