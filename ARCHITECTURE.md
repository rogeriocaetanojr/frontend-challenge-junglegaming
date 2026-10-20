# Arquitetura e Decisões Técnicas — NFT Marketplace

Documento técnico que consolida a arquitetura, padrões estruturais, contratos e o histórico de decisões técnicas da aplicação **KURIO NFT Marketplace**.

---

## 1. Organização de Pastas e Fronteiras de Módulos

A arquitetura do projeto adota uma divisão modular baseada em responsabilidades e domínios de negócio (_feature-based_), garantindo alto desacoplamento e isolamento de dependências.

```plaintext
src/
├── components/      # Componentes de UI genéricos (Design System e Primitivos shadcn/ui)
├── contracts/       # Interfaces e tipos estritos dos contratos REST e WebSocket
├── features/        # Módulos de domínio de negócio isolados (auth, catalog, cart, checkout, nft-details)
├── hooks/           # Hooks React reutilizáveis de escopo transversal
├── layouts/         # Layouts estruturais da aplicação (RootLayout com Header, Outlet e Footer)
├── lib/             # Adaptadores de bibliotecas terceiras e clientes de infraestrutura
│   ├── auth/        # Lógica de sessão, guest ID (UUID v4) e sanitização de retorno
│   ├── http/        # Cliente HTTP encapsulado (Axios com interceptors)
│   ├── money/       # Precisão monetária rigorosa em ETH (BigNumber.js e Wei)
│   └── query/       # Configuração e fábrica de queryKeys do TanStack Query
├── mocks/           # Camada de interceptação e simulação de rede (MSW v3)
│   ├── db/          # Banco de dados relacional em memória com persistência local
│   ├── handlers/    # Handlers unificados de rotas simuladas
│   ├── realtime/    # Barramento de eventos Socket.IO tipado (emitter e socket-server)
│   └── ui/          # Alternador de cenários de teste (ScenarioSwitcher)
├── pages/           # Páginas e views de rotas (home, nft-detail, cart, payment, profile, not-found)
├── routes/          # Configuração declarativa de rotas SPA com React Router DOM
├── store/           # Stores de estado global de cliente (Zustand com persist)
├── styles/          # Tokens CSS, Tailwind v4 e estilos globais
└── types/           # Declarações e contratos globais de tipos TypeScript
```

### Barreiras Arquiteturais e Restrições de Importação

Para evitar vazamento de dependências de infraestrutura nas camadas de apresentação ou regras de negócio, o projeto utiliza a regra `no-restricted-imports` do ESLint:

- **MSW (`msw`, `@mswjs/*`)**: Permitido exclusivamente em `src/mocks/**`.
- **Axios (`axios`, `axios/*`)**: Permitido exclusivamente em `src/lib/http/**`.
- **Socket.IO (`socket.io-client`, `socket.io-client/*`)**: Permitido exclusivamente em `src/lib/realtime/**` e `src/mocks/realtime/**`.

---

## 2. Contratos REST da Camada de Mocks (MSW)

Todos os endpoints estão implementados na camada de interceptação do Mock Service Worker, garantindo conformidade com a especificação técnica:

| Recurso              | Método & Rota                | Descrição & Parâmetros                                                                           |      Códigos de Resposta       |
| :------------------- | :--------------------------- | :----------------------------------------------------------------------------------------------- | :----------------------------: |
| **Sessão & Conta**   | `POST /api/auth/login`       | Autenticação por e-mail e senha.                                                                 |          `200`, `401`          |
|                      | `POST /api/auth/register`    | Criação de conta com verificação de duplicidade.                                                 |          `201`, `409`          |
|                      | `GET /api/auth/session`      | Consulta dos dados da sessão ativa.                                                              |          `200`, `401`          |
|                      | `POST /api/auth/logout`      | Revogação de token e encerramento de sessão.                                                     |          `200`, `204`          |
| **Catálogo de NFTs** | `GET /api/nfts`              | Listagem com `search`, `category`, `network`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit`. |             `200`              |
|                      | `GET /api/nfts/:id`          | Detalhes completos do token e atributos visuais.                                                 |          `200`, `404`          |
| **Favoritos**        | `GET /api/favorites`         | Listagem de favoritos do usuário logado.                                                         |          `200`, `401`          |
|                      | `POST /api/favorites/:id`    | Inclusão de NFT nos favoritos.                                                                   |          `201`, `401`          |
|                      | `DELETE /api/favorites/:id`  | Remoção de NFT dos favoritos.                                                                    |          `200`, `401`          |
| **Carrinho**         | `GET /api/cart`              | Consulta de itens no carrinho (isolado por usuário/guest).                                       |             `200`              |
|                      | `POST /api/cart/items`       | Adição de item respeitando o limite de estoque.                                                  |          `200`, `409`          |
|                      | `PATCH /api/cart/items/:id`  | Alteração de quantidade de um item.                                                              |          `200`, `400`          |
|                      | `DELETE /api/cart/items/:id` | Remoção de item específico do carrinho.                                                          |             `200`              |
|                      | `POST /api/cart/merge`       | Merge idempotente do carrinho anônimo ao autenticar.                                             |             `200`              |
| **Cotação**          | `POST /api/quotes`           | Cálculo preciso com cupom, taxas e validação de disponibilidade.                                 |          `200`, `422`          |
| **Pedidos**          | `POST /api/orders`           | Criação de pedido com header `Idempotency-Key`.                                                  | `201`, `200` _(replay)_, `409` |
|                      | `GET /api/orders/:id`        | Consulta de estado e recibo imutável do pedido.                                                  |          `200`, `404`          |
| **Perfil**           | `GET /api/profile`           | Consulta dos dados cadastrais do colecionador.                                                   |          `200`, `401`          |
|                      | `PATCH /api/profile`         | Atualização de nome, bio, avatar e alteração de senha.                                           |      `200`, `400`, `401`       |
| **Carteiras**        | `GET /api/wallets`           | Listagem de carteiras principal e secundária.                                                    |          `200`, `401`          |
|                      | `POST /api/wallets`          | Vinculação de nova carteira Web3 simulada.                                                       |      `201`, `400`, `401`       |

---

## 3. Política de Sessão, Autenticação e Expiração

- **Store de Autenticação (`src/store/auth-store.ts`)**:
  - Implementado com **Zustand** e persistência local sob a chave `@nft-marketplace:auth`.
  - Gerencia o ciclo de vida da sessão (`UserSession` contendo `id`, `name`, `email`, `walletAddress`, `balanceEth` e `token`).
  - Provedor de ações: `login`, `connectWallet`, `disconnectWallet` e `logout`.
- **Sincronização com o Cliente HTTP (`src/lib/http/client.ts`)**:
  - Na autenticação ou reidratação do store (`onRehydrateStorage`), o token JWT Bearer é automaticamente repassado para `setAuthToken(token)`.
  - As requisições HTTP subjacentes injetam `Authorization: Bearer <token>` de maneira centralizada via interceptor do Axios.
- **Auto-Logout e Tratamento Reativo de Expiração (401)**:
  - O interceptor de resposta do Axios emite o evento global da janela `window.dispatchEvent(new CustomEvent("http:unauthorized"))` sempre que um código `401 Unauthorized` é retornado pela API.
  - O `authStore` registra um listener para o evento `http:unauthorized`, executando imediatamente `logout()` (limpeza de estado e `setAuthToken(null)`), evitando estados inconsistentes de autenticação.
- **Isolamento de Dados por Usuário**:
  - Todas as chaves privadas do TanStack Query utilizam a fábrica padronizada `queryKeys.user(userId)` (`src/lib/query/keys.ts`), garantindo que dados de carrinho, pedidos e perfil nunca vazem entre sessões distintas.

---

## 4. Estado do Carrinho, Precisão Decimal (ETH) e Merge de Visitante

- **Gerenciamento de Estado Global (`src/store/cart-store.ts`)**:
  - Implementado com **Zustand** e middleware `persist` gravando no `localStorage` sob a chave `@nft-marketplace:cart`.
  - **Ações Atômicas e Seletores**: Prover `addItem`, `removeItem`, `clearCart`, `isInCart`, `getItemCount`, `getTotalEth` e `getTotalUsd`.
- **Precisão Numérica Rigorosa (IEEE 754)**:
  - Cálculos financeiros de soma, desconto e taxas de rede utilizam `BigNumber.js` e conversões em Wei (`src/lib/money/eth.ts`), eliminando discrepâncias de ponto flutuante em JavaScript (`0.1 + 0.2 = 0.30000000000000004`).
- **Merge de Visitante Idempotente**:
  - Visitantes recebem um `guestId` persistente (UUID v4 canônico). Ao efetuar login, o endpoint `POST /api/cart/merge` mescla os itens do carrinho anônimo na conta do usuário autenticado de forma estritamente idempotente.

---

## 5. Estratégia de Cache, Invalidação e Mutações (TanStack Query)

- **Instância Centralizada (`src/lib/query-client.ts`)**:
  - `staleTime`: 30 segundos como padrão, equilibrando atualização frequente de dados do marketplace com consumo de rede.
  - `gcTime`: 5 minutos para retenção em cache antes da liberação de memória de queries inativas.
  - `retry`: Política defensiva de 1 retry para falhas transitórias, com bypass imediato (retorno `false`) para erros determinísticos como `401 Unauthorized` e `404 Not Found`.
  - `refetchOnWindowFocus`: desativado (`false`) para evitar refetches acidentais e tráfego redundante ao alternar janelas locais.
  - `mutations`: `retry: 0` para preservar integridade e idempotência de transações e checkout.
- **Fábrica Padronizada de Chaves (`src/lib/query/keys.ts`)**:
  - Estrutura hierárquica e imutável (`as const`) dividida por domínios (`public`, `user`, `cart`, `orders`).
  - Mutações de favoritos aplicam **atualização otimista** com rollback imediato no cache caso a requisição falhe.

---

## 6. Tempo Real com Socket.IO e Reconciliação com REST

A aplicação implementa um barramento de eventos em tempo real (`src/contracts/realtime.ts` e `src/mocks/realtime/`):

- **Eventos Monitorados**:
  - `nft.updated`: Transmite alteração de preço e estoque de determinado NFT.
  - `order.updated`: Transmite transições de estado do pedido (`pending`, `confirmed`, `declined`).
- **Envelope Tipado e Versionamento**:
  - Todos os eventos trafegam dentro do `RealtimeEnvelope<Type, Payload>`, contendo `eventId`, `version`, `occurredAt` e `resource`.
  - Eventos antigos ou duplicados cuja versão seja menor ou igual à já refletida no cache local são **descartados automaticamente**, evitando regressão de estado.
- **Reconciliação e Resiliência**:
  - Em reconexão de rede ou recarregamento de página, os recursos ativos são revalidados via chamadas REST (`GET /api/orders/:id`, `GET /api/nfts/:id`).
  - Listeners e subscriptions são limpos no desmonte dos componentes para prevenir vazamento de memória.

---

## 7. Camada de Mocks (MSW), Persistência e Limitações Conhecidas

- **Arquitetura Isolada**: Todo o código e handlers do Mock Service Worker estão restritos a `src/mocks/**`, protegidos pela barreira arquitetural do ESLint (`no-restricted-imports`).
- **Interceptação no Navegador e Node**: `src/mocks/browser.ts` para runtime do browser via Service Worker (`public/mockServiceWorker.js`) e `src/mocks/server.ts` para os testes de integração do Vitest.
- **Execução em Produção / Vercel**: No build publicado, o MSW é inicializado via `prepareApp()` em `src/main.tsx`, permitindo que a demonstração na Vercel execute 100% autônoma sem backend real.

---

## 8. UX, Acessibilidade (WCAG 2.1 AA) e Registro de Desvios do Figma

- **Navegação por Teclado e Foco Visível**:
  - Foco gerenciado em modais (`role="dialog"` e `role="alertdialog"`) com aprisionamento de foco (_focus trap_) e fechamento via tecla `Escape`.
- **Semântica e ARIA**:
  - Abas interativas do catálogo e detalhes do NFT possuem atributos `role="tablist"`, `role="tab"`, `aria-selected` e `aria-controls`.
  - Mensagens de erro de validação e alertas utilizam `role="alert"` associadas aos campos via `aria-describedby`.
- **Imagens e Mídias**:
  - Todas as artes e avatares contêm atributos `alt` descritivos e skeletons com efeito shimmer durante o carregamento de dados remotos.
- **Escala e Conforto Visual**:
  - O conteúdo interno utiliza zoom de 90% para leitura confortável em monitores com 100% de escala, mantendo a navbar intacta no topo conforme refinamento de usabilidade.

---

## 9. Log de Decisões Técnicas

| Data       | Commit    | Decisão                                                                | Motivo                                                                                                                 |
| :--------- | :-------- | :--------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| 2026-10-19 | `972cf09` | Modo estrito do TypeScript e path alias `@/*`                          | Garantir segurança máxima de tipos no compilador e facilitar refatorações com imports absolutos.                       |
| 2026-10-19 | `f0c9fe0` | Barreiras arquiteturais com ESLint (`no-restricted-imports`)           | Impedir vazamento de dependências terceiras (Axios, Socket.IO, MSW) fora de suas camadas dedicadas.                    |
| 2026-10-19 | `8602956` | Adoção do Tailwind CSS v4 com plugin `@tailwindcss/vite`               | Performance de build superior com engine Oxide e mapeamento nativo de design tokens.                                   |
| 2026-10-19 | `3d4229a` | Adoção do shadcn/ui customizado sobre os tokens do Figma               | Prover componentes primitivos acessíveis (WAI-ARIA) fiéis à paleta Dark Mode do Figma.                                 |
| 2026-10-19 | `9af98ed` | Adoção do BigNumber.js para aritmética de ETH e conversão monetária    | Eliminar vulnerabilidades de ponto flutuante (IEEE 754) em operações financeiras e checkout.                           |
| 2026-10-20 | `8a9aa28` | Estabilização de rotas, scroll e redirecionamento de compra            | Garantir que o botão Comprar leve ao carrinho e estabilizar navegação para início e mercado.                           |
| 2026-10-20 | `e797730` | Configuração do `vercel.json` e ativação do MSW para build de produção | Garantir que a versão publicada na Vercel intercepte as requisições sem backend real externo.                          |
| 2026-10-20 | `652a7f5` | Adaptação dos testes Playwright E2E ao AuthModal unificado             | Cobrir 100% dos fluxos de login, cadastro, alternância de abas e validação acessível no browser.                       |
| 2026-10-20 | `24310d2` | Configuração da auditoria de qualidade com Lighthouse CI               | Versionar `lighthouserc.json` com metas rígidas (Performance ≥ 90, Acessibilidade ≥ 95, Boas Práticas ≥ 95, SEO ≥ 90). |
