# NFT Marketplace — Desafio Frontend

Implementação do **KURIO NFT Marketplace** para o desafio técnico de frontend da Jungle Gaming. Cobre descoberta, compra e conta do colecionador, nas versões desktop e mobile, com API REST e Socket.IO simulados pelo MSW.

---

## 1. Links

- **Repositório:** [github.com/rogeriocaetanojr/frontend-challenge-junglegaming](https://github.com/rogeriocaetanojr/frontend-challenge-junglegaming)
- **Aplicação publicada (Vercel):** [rogerio-challenge-junglegaming.vercel.app](https://rogerio-challenge-junglegaming.vercel.app)
- **Design (Figma):** [Frontend Challenge](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f&t=MlMOFOydsmpZ3DUt-0)

---

## 2. Stack

| Camada            | Tecnologia                   | Uso no projeto                                                                                   |
| :---------------- | :--------------------------- | :----------------------------------------------------------------------------------------------- |
| **Interface**     | React 19 + TypeScript        | Componentes tipados de ponta a ponta, com contratos em `src/contracts`.                          |
| **Roteamento**    | TanStack Router (file-based) | Rotas em `src/routes`, search params validados com Zod, loaders e guarda `_auth` com `redirect`. |
| **Estado remoto** | TanStack Query v5            | Cache isolado por usuário e parâmetros, mutations com invalidação e atualização otimista.        |
| **Cliente HTTP**  | Axios                        | Instância única com interceptors de token, guest id, timeout e expiração de sessão (401).        |
| **Tempo real**    | `socket.io-client`           | Cliente real conectado ao `@mswjs/socket.io-binding` (`nft.updated`, `order.updated`).           |
| **Estilização**   | Tailwind CSS v4 + tokens     | Tokens extraídos do Figma em `src/styles/tokens.css`.                                            |
| **Componentes**   | shadcn/ui + Radix UI         | Primitivos acessíveis (dialog, dropdown) adaptados à identidade visual.                          |
| **Mocking**       | MSW v3                       | REST e WebSocket interceptados na rede, com banco em memória persistido no navegador.            |
| **Testes**        | Vitest + Playwright          | 390 testes unitários/integração e 44 cenários E2E em Chromium desktop e Mobile Chrome.           |
| **Auditoria**     | Lighthouse CI (`@lhci/cli`)  | Perfis em `lighthouserc.desktop.json` e `lighthouserc.mobile.json`.                              |

---

## 3. Setup local

- **Node.js** `22` (arquivo `.nvmrc`)
- **pnpm** `9` (campo `packageManager` do `package.json`)

```bash
pnpm install       # dependências (lockfile versionado)
pnpm dev           # desenvolvimento com mocks em http://localhost:5173
pnpm build         # tsc -b + vite build (mocks incluídos no build de demonstração)
pnpm preview       # serve o build em http://localhost:4173
```

Não há serviço externo: a API REST e o Socket.IO são simulados pelo MSW no próprio navegador.

---

## 4. Variáveis de ambiente

Os valores de referência estão em `.env.example`, e o `.env.development` já vem configurado.

| Variável            | Descrição                                                                                                  | Padrão           |
| :------------------ | :--------------------------------------------------------------------------------------------------------- | :--------------- |
| `VITE_ENABLE_MOCKS` | Liga o MSW (REST + Socket.IO). Só o valor `"false"` desliga os mocks; o painel de cenários exige `"true"`. | `true`           |
| `VITE_API_BASE_URL` | `baseURL` da instância Axios.                                                                              | `/api`           |
| `VITE_REALTIME_URL` | Endereço do `socket.io-client`. Com os mocks ativos, o binding do MSW intercepta a conexão.                | `ws://localhost` |

O deploy de demonstração não define nenhuma variável, então os mocks ficam ativos.

---

## 5. Credenciais fictícias

O banco simulado começa com dois usuários. As senhas ficam guardadas apenas como hash PBKDF2 com salt, nunca em claro.

| Usuário     | E-mail              | Senha          | Dados iniciais                                                      |
| :---------- | :------------------ | :------------- | :------------------------------------------------------------------ |
| Alex Jungle | `demo@jungle.com`   | `Password123!` | Carteiras principal (Ethereum) e secundária (Polygon), 2 favoritos. |
| Sam Curator | `curator@kurio.art` | `Password123!` | Carteira principal (Ethereum), 1 favorito.                          |

Use as duas contas para validar a troca de usuário e o isolamento de carrinho, favoritos, perfil, carteiras e pedidos.

**Cupons:** `JUNGLE10` (10%), `WELCOME20` (20%) e `EXPIRED50` (expirado). Qualquer outro código é tratado como inválido.

---

## 6. Cenários de simulação e reset

O catálogo inicial tem **12 NFTs**, com variações de categoria, rede, raridade, preço e disponibilidade, o suficiente para exercitar filtros e paginação (9 itens por página).

**Painel de cenários:** sempre visível em `pnpm dev`. No build, no preview e no deploy, acrescente `?scenarios=1` à URL, por exemplo `http://localhost:4173/?scenarios=1`.

| Cenário             | Efeito                                                                                  |
| :------------------ | :-------------------------------------------------------------------------------------- |
| `default`           | Latência de 100 ms, sem falhas.                                                         |
| `slow_network`      | Latência de 2000 ms, que deixa visíveis os skeletons com shimmer.                       |
| `flaky_connection`  | 35% das requisições respondem `503` transitório (erro e "Tentar novamente").            |
| `out_of_stock`      | A cotação responde `409 conflict_availability` (edição esgotada).                       |
| `checkout_conflict` | A criação do pedido responde `409 conflict_price_changed`.                              |
| `auth_expired`      | Carteiras e pedidos respondem `401 session_expired` e abrem o modal de sessão expirada. |
| `order_timeout`     | Latência de 1500 ms na criação do pedido, para exercitar pedido pendente e recuperação. |
| `wallet_rejected`   | A conexão da carteira é recusada (`400 wallet_connection_refused`).                     |
| `price_surge`       | Latência de 150 ms. As mudanças de preço vêm de eventos `nft.updated` (seção 7C).       |

O painel também permite ajustar latência e taxa de falhas manualmente.

**Reset completo:** o botão **"Reset Database & Cenários"** (`data-testid="reset-db-button"`) restaura o banco a partir das seeds, volta ao cenário `default`, limpa sessão, guest id e dados persistidos e recarrega a página.

---

## 7. Como reproduzir os fluxos de falha

### A. Idempotência e recuperação de pedido pendente

1. Faça login, adicione um NFT ao carrinho e siga para `/payment` (`/checkout` redireciona para essa rota).
2. A confirmação envia o header `Idempotency-Key`. Cliques repetidos não criam um segundo pedido: o cliente tem uma trava síncrona e o servidor responde ao replay com `Idempotent-Replayed: true`.
3. Reutilizar a mesma chave com outro payload responde `409` (`idempotency_conflict`).
4. Com o cenário `order_timeout`, recarregue a página enquanto o pedido está pendente. A chave e o `orderId` ficam no `sessionStorage`, isolados por usuário, e o polling é retomado sem criar outra compra. O registro é apagado quando o pedido chega a um estado terminal (`CONFIRMED` ou `FAILED`).

### B. Cupom inválido ou expirado

No carrinho, aplique `EXPIRED50` (expirado) ou qualquer código inexistente (inválido). A validação é sempre feita pela API.

### C. Preço ou disponibilidade alterados durante a compra

Com um item no carrinho, dispare o evento pelo servidor simulado no console do navegador:

```js
window.__mockRealtime.emitNftUpdated({ nftId: "nft-1", price: "2.50", available: 3 });
```

O evento passa pelo transporte Socket.IO até o `socket.io-client`. O carrinho avisa a alteração e atualiza o resumo, e o checkout exige nova confirmação com a cotação atualizada. `window.__mockRealtime.dropConnections()` derruba o socket, o que leva à reconexão e à reconciliação com a API REST.

### D. Sessão expirada

Ative `auth_expired` e abra o perfil ou as carteiras. O interceptor do Axios emite o evento de expiração, o `SessionExpiredModal` (`role="alertdialog"`) avisa o usuário e o login devolve à rota de origem.

### E. Falhas de rede e recuperação

Ative `slow_network` para ver os skeletons, ou `flaky_connection` para ver as mensagens de erro e o botão "Tentar novamente".

---

## 8. Scripts

| Comando                | Descrição                                                    |
| :--------------------- | :----------------------------------------------------------- |
| `pnpm dev`             | Desenvolvimento com mocks e HMR.                             |
| `pnpm build`           | `tsc -b` + build otimizado em `dist/`.                       |
| `pnpm preview`         | Serve o build localmente.                                    |
| `pnpm typecheck`       | Verificação de tipos.                                        |
| `pnpm lint`            | ESLint com `--max-warnings 0`.                               |
| `pnpm test`            | Testes unitários e de integração (Vitest).                   |
| `pnpm test:e2e`        | Suíte E2E Playwright (Chromium desktop + Mobile Chrome).     |
| `pnpm test:e2e:update` | Regenera as baselines visuais (use só de forma intencional). |
| `pnpm lighthouse`      | Build + auditoria Lighthouse desktop e mobile + resumo.      |

### E2E (Playwright)

```bash
pnpm exec playwright install chromium   # primeira execução
pnpm test:e2e                           # sobe o dev server automaticamente (porta 5173)
pnpm exec playwright show-report        # relatório HTML (playwright-report/)
```

- Traces e screenshots das falhas ficam em `test-results/`.
- Para rodar contra o build, execute `pnpm preview` e depois `PLAYWRIGHT_TEST_BASE_URL=http://localhost:4173 pnpm test:e2e`.
- Cada teste parte de um estado isolado, com reset do banco simulado e do storage.
- Os eventos de tempo real saem do servidor simulado e chegam pelo `socket.io-client`. Nenhum teste injeta dados direto no cache.
- No projeto mobile, a navegação inferior só existe na Home, como no Figma. Fora dela, os testes autenticam pela rota `/login?redirect=…`.
- As **baselines visuais** (`e2e/visual.spec.ts-snapshots/`) foram geradas no Windows (`*-win32.png`). Em outro sistema operacional, gere baselines próprias com `pnpm test:e2e:update` antes de comparar.

### Lighthouse

```bash
pnpm lighthouse
```

Audita `/` e `/nfts/1` sobre o build otimizado (`pnpm preview`), com o cenário padrão dos mocks e 3 execuções por página e perfil (desktop e mobile). Os dois perfis rodam até o fim mesmo quando uma meta reprova, e o comando sai com código 1 nesse caso.

- **Execuções completas** (12 relatórios HTML/JSON): `lighthouse-reports/`, não versionado.
- **Versionado em [`reports/lighthouse/`](reports/lighthouse/):** `summary.json` com as medianas, versões e condições de execução, além do relatório HTML/JSON da execução mediana de cada página e perfil.

#### Resultados (mediana de 3 execuções)

Lighthouse 12.6.1, LHCI 0.15.1, Chrome 155, Node 24.18 e Windows 11 (Intel i5-10500H), com throttling simulado. Desktop: RTT de 40 ms, 10 Mbps, CPU 1×. Mobile: RTT de 150 ms, 1,6 Mbps, CPU 4×, viewport de 412 px.

| Perfil  | Página    | Performance | Acessibilidade | Boas práticas |    SEO | LCP    | CLS   | TBT   |
| :------ | :-------- | ----------: | -------------: | ------------: | -----: | :----- | :---- | :---- |
| Desktop | `/`       |      **97** |         _92_ ✗ |       **100** | _83_ ✗ | 1,08 s | 0,002 | 0 ms  |
| Desktop | `/nfts/1` |      **97** |         **97** |       **100** | _83_ ✗ | 1,08 s | 0,043 | 0 ms  |
| Mobile  | `/`       |      _74_ ✗ |         _92_ ✗ |       **100** | _83_ ✗ | 4,35 s | 0     | 83 ms |
| Mobile  | `/nfts/1` |      _76_ ✗ |        **100** |       **100** | _83_ ✗ | 4,34 s | 0     | 58 ms |

Metas do edital: Performance ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95, SEO ≥ 90. ✗ indica abaixo da meta.

#### Causas dos resultados abaixo da meta

- **SEO 83 (todas as páginas):**
  - `index.html` não tem `<meta name="description">`.
  - Não existe `public/robots.txt`. Por causa do rewrite de SPA, `/robots.txt` devolve o próprio `index.html`, que o Lighthouse marca como inválido.
  - O documento também declara `lang="en"`, com conteúdo em português.
- **Acessibilidade 92 na Home:**
  - Contraste insuficiente nos textos `text-[#CFB28C]/60`.
  - Um `aria-label` proibido no indicador de slides do hero.
  - Títulos fora de ordem (`h3` sem `h2` antes).
  - No mobile, os controles do filtro de preço têm área de toque pequena.
  - No detalhe desktop (97), as estrelas de avaliação também ficam abaixo do tamanho mínimo de toque.
- **Performance mobile (74–76):** quase todo o LCP de 4,3 s é atraso de renderização. O primeiro conteúdo só aparece em cerca de 3,8 s porque:
  - o app só renderiza depois que o MSW e a sessão são inicializados, de propósito, para que nenhuma requisição escape dos mocks, e a auditoria inclui os mocks, como o edital exige;
  - o JavaScript sai num bundle único de 703 kB (250 kB gzip), sem divisão por rota, o que pesa sob CPU 4× (o Lighthouse estima 125 KiB de JS não usado);
  - na Home, a imagem de LCP (primeiro card do catálogo) tem `loading="lazy"`.
- **Desktop:** Performance 97 e Boas práticas 100 em ambas as páginas. A rede e a CPU sem throttling absorvem o custo de inicialização.

---

## 9. Limitações conhecidas

- `flaky_connection` sorteia as falhas com `Math.random`: reproduz o comportamento, mas não a mesma sequência a cada execução. Para um resultado determinístico, ajuste a taxa de falhas para 0 ou 1 no painel.
- `price_surge` e `order_timeout` só ajustam a latência. A mudança de preço é exercitada pelos eventos `nft.updated` (seção 7C), e o pedido pendente pela latência combinada com o refresh.
- O Socket.IO roda inteiramente no navegador, via `@mswjs/socket.io-binding`. Não há servidor real nem rooms entre abas; o isolamento por usuário vem do `session.bind` de cada conexão.

Arquitetura, contratos REST e de eventos, política de sessão, cache e desvios do Figma estão documentados em [`ARCHITECTURE.md`](ARCHITECTURE.md).
