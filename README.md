# NFT Marketplace — Desafio Frontend

Aplicação completa desenvolvida para o desafio técnico de frontend da Jungle Gaming, implementando a experiência completa do **KURIO NFT Marketplace** com fidelidade ao design do Figma, arquitetura resiliente e contratos estritos.

---

## 1. Visão Geral e Links

- **Repositório GitHub**: [https://github.com/rogeriocaetanojr/frontend-challenge-junglegaming](https://github.com/rogeriocaetanojr/frontend-challenge-junglegaming)
- **URL de Produção (Vercel):** [https://rogerio-challenge-junglegaming.vercel.app](https://rogerio-challenge-junglegaming.vercel.app)
- **Protótipo / Design (Figma):** [Link do Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f&t=MlMOFOydsmpZ3DUt-0)

---

## 2. Stack Tecnológica Obrigatória

| Camada            | Tecnologia                      | Descrição                                                                                    |
| :---------------- | :------------------------------ | :------------------------------------------------------------------------------------------- |
| **Interface**     | React 19 + TypeScript           | Componentização declarativa, estrita e imutável.                                             |
| **Roteamento**    | TanStack Router (file-based)    | Rotas em src/routes, search params validados com Zod, loaders e guarda de rotas privadas.    |
| **Estado Remoto** | TanStack Query v5               | Gerenciamento de cache, mutações e sincronização em segundo plano.                           |
| **Cliente HTTP**  | Axios                           | Instância isolada com interceptors de autenticação, timeout e auto-logout (401).             |
| **Tempo Real**    | Socket.IO (Mock Binding)        | Barramento de eventos resiliente com envelopes versionados (`nft.updated`, `order.updated`). |
| **Estilização**   | Tailwind CSS v4 + Design Tokens | Engine Oxide de alta performance baseada nos tokens extraídos do Figma.                      |
| **Componentes**   | shadcn/ui + Radix UI Primitives | Primitivos acessíveis em conformidade com WCAG 2.1 AA (WAI-ARIA).                            |
| **Mocking**       | Mock Service Worker (MSW v3)    | Interceptação em nível de rede para REST e WebSocket com banco em memória.                   |
| **Testes**        | Vitest + Playwright             | 389 testes automatizados de integração/contratos e suíte E2E em Chromium.                    |
| **Auditoria**     | Lighthouse CI (`@lhci/cli`)     | Metas de qualidade rigorosas versionadas em `lighthouserc.json`.                             |

---

## 3. Pré-requisitos e Setup Local

- **Node.js**: `>= 22` (definido no arquivo `.nvmrc`)
- **PNPM**: `>= 9`

```bash
# 1. Instalação das dependências
pnpm install

# 2. Execução em desenvolvimento local (porta 5173)
pnpm dev

# 3. Build de produção (tsc -b + vite build)
pnpm build

# 4. Prévia local do build (dist/)
pnpm preview
```

---

## 4. Variáveis de Ambiente

As configurações do projeto seguem o arquivo `.env.example`:

| Variável                     | Descrição                                         | Padrão                  |
| :--------------------------- | :------------------------------------------------ | :---------------------- |
| `VITE_ENABLE_MOCKS`          | Habilita os mocks via MSW no navegador e no build | `true`                  |
| `VITE_MOCK_DEFAULT_SCENARIO` | Define o cenário inicial dos mocks                | `default`               |
| `VITE_API_BASE_URL`          | URL base para requisições à API REST              | `/api`                  |
| `VITE_WS_URL`                | Endereço do servidor em tempo real (Socket.IO)    | `http://localhost:3000` |

---

## 5. Credenciais Fictícias de Demonstração

O banco de dados em memória do MSW inicializa com as seguintes credenciais pré-configuradas:

- **Usuário Padrão (Demo)**:
  - **E-mail**: `demo@jungle.com` _(ou `alex.vance@marketplace.local`)_
  - **Senha**: `Password123!`
  - **Nome**: Alex Vance
  - **Carteira Conectada**: `0x71C8364437a9C27779976872A42F340a6B233921`
  - **Saldo Simulado**: `4.5 ETH`
- **Segundo Usuário (Isolamento de Dados)**:
  - **E-mail**: `collector@kurio.art`
  - **Senha**: `Password123!`

---

## 6. Cenários de Simulação (MSW) e Reset de Estado

A aplicação conta com um banco em memória relacional determinístico (`src/mocks/db/index.ts`) e o alternador de cenários (`src/mocks/ui/scenario-switcher.tsx`):

1. **Cenário `default`**:
   - Catálogo completo com 11 NFTs categorizados em 4 coleções oficiais.
   - Carteira e cotações ativas com saldos estáveis.
2. **Cenário `empty`**:
   - Catálogo e carrinho vazios, acionando estados visuais ilustrados e acessíveis de "Nenhum NFT Encontrado".
3. **Cenário `slow-network` (Latência)**:
   - Aplica atraso artificial de `2000ms` a `4000ms`, permitindo avaliar os **skeletons com shimmer effect**.
4. **Cenário `network-error` (Falhas HTTP 500)**:
   - Simula indisponibilidade de servidor para testar o fallback de erro com botão de repetição.
5. **Acesso ao painel**:
   - Em `pnpm dev` o painel é sempre exibido.
   - Em produção/preview, acrescente `?scenarios=1` (ou `?scenarios=true`) à URL, ex.: `http://localhost:4173/?scenarios=1`.
6. **Reset completo**:
   - No painel, clique em **"Reset Database & Cenários"** (`data-testid="reset-db-button"`): restaura o banco em memória (`resetDb`), volta o cenário para `default` e limpa os dados locais, recarregando a página.

---

## 7. Como Reproduzir Fluxos de Falha e Idempotência

### A. Idempotência em Pedidos (`Idempotency-Key`)

1. No fluxo de checkout (`/checkout`), ao clicar em "CONFIRMAR COMPRA", a aplicação gera um UUID v4 no cabeçalho `Idempotency-Key`.
2. Em caso de reenvio com payload idêntico ou perda transitória de conexão, o MSW detecta a chave e retorna o mesmo pedido com o header `Idempotent-Replayed: true`, impedindo compras duplicadas.
3. Se a mesma chave for enviada com payload divergente, o mock rejeita imediatamente com `409 Conflict (idempotency_conflict)`.

### B. Expiração de Cupom e Alteração de Preço

1. Adicione um NFT ao carrinho (`/cart`).
2. Digite um cupom inválido ou expirado (ex: `EXPIRADO2026`) para verificar o feedback acessível de erro.
3. Utilize o cupom promocional válido `JUNGLE10` para obter 10% de desconto.

### C. Sessão Expirada (`401 Unauthorized`)

1. Ao ocorrer um erro 401 de token inválido ou expirado, o interceptor do Axios dispara um evento global capturado pelo `SessionExpiredModal`.
2. O modal acessível (`role="alertdialog"`) orienta o colecionador a renovar o login sem perda do contexto de navegação.

---

## 8. Scripts e Comandos Operacionais

| Comando           | Descrição                                                           |
| :---------------- | :------------------------------------------------------------------ |
| `pnpm install`    | Instala as dependências.                                            |
| `pnpm dev`        | Servidor de desenvolvimento com HMR.                                |
| `pnpm build`      | Checagem de tipos (`tsc -b`) + build de produção em `dist/`.        |
| `pnpm preview`    | Prévia local do build.                                              |
| `pnpm typecheck`  | `tsc -b`.                                                           |
| `pnpm lint`       | ESLint com `--max-warnings 0`.                                      |
| `pnpm test`       | 389 testes unitários/integração (Vitest).                           |
| `pnpm test:e2e`   | Suíte E2E Playwright.                                               |
| `pnpm lighthouse` | Build + auditoria Lighthouse desktop e mobile + resumo consolidado. |

### E2E (Playwright)

```bash
pnpm exec playwright install chromium   # primeira execução
pnpm test:e2e                           # roda a suíte (desktop + mobile)
pnpm playwright show-report             # abre o relatório HTML (playwright-report/)
```

Traces e artefatos de falha ficam em `test-results/`.

### Lighthouse

```bash
pnpm lighthouse
```

Executa 3 runs por perfil (mediana) para desktop e mobile. Relatórios completos em `lighthouse-reports/desktop` e `lighthouse-reports/mobile`; resumo consolidado em **`lighthouse-reports/summary.json`**.

---

## 9. Requisitos Atendidos

**P0**

- **Roteamento tipado**: TanStack Router file-based, search params validados com Zod, loaders e guarda de rotas privadas.
- **Autenticação**: instância Axios com interceptor de token, sessão persistida e auto-logout/modal em `401`.
- **Checkout idempotente**: `Idempotency-Key` (UUID v4) por tentativa; replay retorna o mesmo pedido, payload divergente retorna `409`.
- **Carrinho**: persistido e sincronizado via API, com merge do carrinho anônimo após login.

**P1**

- **Tempo real**: cliente socket.io real conectado ao binding MSW (`nft.updated`, `order.updated`) com envelopes versionados.
- **Favoritos**: mutação otimista via TanStack Query com rollback em erro.
- **Perfil e carteiras**: integrados à API com estados de loading/erro tratados.
- **Qualidade**: E2E Playwright nos cenários críticos, Lighthouse automatizado, painel de cenários (`?scenarios=1`) com reset completo.
