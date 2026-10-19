# Camada de Mocks e Simulação de Rede (MSW v3 + WebSockets + OCC)

Esta camada fornece uma infraestrutura completa, resiliente e determinística de simulação de backend para o marketplace **Jungle Gaming NFT**. Construída com **Mock Service Worker (MSW) v3**, ela reproduz fielmente as regras de negócio de comércio Web3, autenticação, controle de concorrência otimista (OCC), mensageria em tempo real e injeção de falhas controladas.

---

## 1. Visão Geral e Ciclo de Inicialização

A arquitetura de mocking foi desenhada para operar de forma transparente tanto no navegador (desenvolvimento local) quanto no Node.js (testes automatizados com Vitest), garantindo **0 condições de corrida** na carga inicial.

### Inicialização no Navegador

O ponto de entrada de inicialização é gerenciado por `enableMocking()` em [`src/mocks/index.ts`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/mocks/index.ts) e invocado em [`src/main.tsx`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/main.tsx) antes da montagem do React:

```typescript
// src/main.tsx
async function initApp() {
  await enableMocking();
  createRoot(document.getElementById("root")!).render(<App />);
}
```

O mock só é ativado quando a variável de ambiente `VITE_ENABLE_MOCKS` estiver definida como `"true"`, garantindo que bundles de produção permaneçam leves e livres de interceptadores.

### Inicialização nos Testes (Node.js)

Nos testes com Vitest, o servidor MSW Node é configurado em [`src/mocks/server.ts`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/mocks/server.ts) e gerenciado no ciclo de vida das suítes:

```typescript
import { server } from "@/mocks/server";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetDb();
  scenarioEngine.reset();
});
afterAll(() => server.close());
```

---

## 2. Banco de Dados em Memória (`src/mocks/db`)

O módulo [`src/mocks/db`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/mocks/db) implementa um banco em memória relacional simulado estruturado em coleções `Map<string, T>` indexadas por ID, respeitando estritamente os contratos definidos em `src/contracts/`.

### Entidades Disponíveis

| Coleção      | Tipo                    | Descrição                                                                                      |
| ------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `db.nfts`    | `Map<string, Nft>`      | Catálogo completo de NFTs com metadados, raridade, coleção e edições com controle de estoque.  |
| `db.users`   | `Map<string, DbUser>`   | Usuários registrados, incluindo usuário demo (`demo@jungle.com`) com `passwordHash`.           |
| `db.wallets` | `Map<string, Wallet>`   | Carteiras Web3 vinculadas (Ethereum, Polygon, etc.) com endereços públicos e saldos simulados. |
| `db.carts`   | `Map<string, Cart>`     | Carrinhos de compras versionados com suporte a visitantes (`guest`) e usuários autenticados.   |
| `db.quotes`  | `Map<string, Quote>`    | Cotações ativas emitidas com validade temporal (`expiresAt`), taxas de rede e cupons.          |
| `db.orders`  | `Map<string, Order>`    | Histórico de pedidos finalizados contendo recibo imutável (`snapshot`) e hash de transação.    |
| `db.coupons` | `Map<string, DbCoupon>` | Tabela de cupons promocionais com percentual de desconto em pontos-base (BPS).                 |

### Isolamento e `resetDb()`

A função `resetDb()` repovoa instantaneamente todas as coleções com as seeds iniciais de [`src/mocks/db/seeds.ts`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/mocks/db/seeds.ts), garantindo idempotência e isolamento entre cada teste.

---

## 3. Rotas e Handlers HTTP (`src/mocks/handlers`)

Os handlers interceptam chamadas REST e executam validações de schema, controle de concorrência e cálculos financeiros estritos.

### Catálogo de NFTs (`/api/nfts`)

- **Filtros Combinados**: Suporte a busca textual (`q`), filtros múltiplos por categoria, coleção, raridade e rede blockchain.
- **Filtro de Disponibilidade**: Filtragem por `all`, `available` ou `sold_out`.
- **Aritmética Exata de Preço**: Ordenação por menor/maior preço calculada em Wei via `compareEth` de `@/lib/money`, sem imprecisões de ponto flutuante do JavaScript.
- **Facetas Agregadas**: Retorna a contagem de itens disponíveis para cada faceta de filtro.

### Identidade e Carteiras (`/api/auth/*`, `/api/wallets`)

- **`POST /api/auth/login`**: Valida credenciais e gera token de sessão simulado (`mock-token-<userId>`).
- **`POST /api/auth/register`**: Registra novo usuário com validação de unicidade de e-mail (`409 email_taken`).
- **`GET /api/auth/me`**: Retorna os dados do perfil autenticado com base no token `Bearer`.
- **`GET /api/wallets` & `POST /api/wallets/connect`**: Lista e conecta novas carteiras Web3 à sessão do usuário.

### Carrinho de Compras (`/api/cart/*`)

- **Gestão de Sessão Dupla**: Identifica o carrinho por usuário autenticado (via header `Authorization`) ou por visitante anônimo (via header `x-cart-id`).
- **Validação de Estoque**: Impede adição de quantidade superior ao total disponível na edição (`409 conflict_availability`).
- **Versionamento Monotônico**: Incrementa o campo `version` a cada mutação para suportar validação de concorrência.

### Cotação e Checkout (`/api/quotes`)

- **Cálculo Financeiro Confiável**: Subtotal, descontos e taxas calculados exclusivamente em números inteiros / Wei com `@/lib/money`.
- **Cupons Promocionais**:
  - `JUNGLE10`: 10% de desconto (1000 BPS).
  - `EXPIRED50`: Cupom expirado (gera issue `coupon_expired`).
- **Estimativa de Taxa de Rede**: Taxa dinâmica baseada na rede blockchain de destino (ex.: Ethereum vs. Polygon).

### Pedidos e Recibo Imutável (`/api/orders`)

- **Baixa Atômica de Estoque**: Deduz a quantidade de cada edição adquirida no momento da confirmação.
- **Recibo Imutável (`snapshot`)**: Congela os preços cotados, carteira pagadora e gera uma referência de transação na blockchain (`txRef: 0x...`) e URL do explorer.
- **Esvaziamento do Carrinho**: Limpa automaticamente o carrinho do usuário após a compra bem-sucedida.

---

## 4. Motor de Cenários e Injeção de Falhas (`src/mocks/scenarios`)

O [`scenarioEngine`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/mocks/scenarios) permite alternar o comportamento da rede em tempo real sem alterar uma única linha de código da aplicação.

### Cenários Pré-configurados

| Cenário             | Latência | Falha Transitória | Erros Forçados                                        | Caso de Uso                                                |
| ------------------- | :------: | :---------------: | ----------------------------------------------------- | ---------------------------------------------------------- |
| `default`           |  100ms   |        0%         | Nenhum                                                | Fluxo nominal padrão da aplicação.                         |
| `slow_network`      |  2000ms  |        0%         | Nenhum                                                | Teste de loading states, skeletons e spinners.             |
| `flaky_connection`  |  250ms   |        35%        | Nenhum (503 aleatório)                                | Validação de retentativas automáticas e toasts de erro.    |
| `price_surge`       |  150ms   |        0%         | Nenhum                                                | Simulação de oscilações de preço no mercado.               |
| `out_of_stock`      |  100ms   |        0%         | `/api/quotes` ➔ `409 conflict_availability`           | Teste de itens esgotados no carrinho.                      |
| `auth_expired`      |  100ms   |        0%         | `/api/auth/me`, `/api/orders` ➔ `401 session_expired` | Redirecionamento e renovação de sessão expirada.           |
| `checkout_conflict` |  200ms   |        0%         | `/api/orders` ➔ `409 conflict_price_changed`          | Conflito de preço e concorrência na finalização da compra. |

### Como Utilizar

- **Em Testes Automatizados**:

  ```typescript
  import { scenarioEngine } from "@/mocks/scenarios";

  scenarioEngine.setScenario("checkout_conflict");
  // O endpoint /api/orders agora responderá com status 409 conflict_price_changed
  ```

- **No Navegador**: O cenário selecionado é persistido automaticamente em `sessionStorage` na chave `jungle:mock:scenario`, sobrevivendo a recarregamentos de página (F5).

---

## 5. Eventos em Tempo Real e Concorrência

### Barramento de Eventos e Sockets (`src/mocks/realtime`)

Implementa compatibilidade estrita com os contratos `ClientToServerEvents` e `ServerToClientEvents` de [`src/contracts/realtime.ts`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/contracts/realtime.ts).

- **`RealtimeEventEmitter`**: Barramento tipado de eventos em memória com métodos `on`, `off` e `emit`.
- **`MockSocketServer` & `MockSocket`**:
  - Simulação de conexão cliente-servidor com suporte ao evento `session.bind` para autenticação do socket.
  - Suporte a `broadcast` global (para eventos públicos como `nft.updated`).
  - Suporte a entrega direcionada por usuário autenticado (`sendToUser`, para eventos privados como `order.updated`).
- **Funções Utilitárias de Domínio**:
  - `emitNftUpdated({ nftId, price, available })`: Dispara o envelope canônico `RealtimeEnvelope<'nft.updated', NftUpdatedPayload>`.
  - `emitOrderUpdated({ orderId, status, settledAt, declineReason })`: Dispara o envelope canônico `RealtimeEnvelope<'order.updated', OrderUpdatedPayload>`.

### Concorrência Otimista e Simulador de Corridas (`src/mocks/concurrency`)

- **Bloqueio Otimista (`optimistic-lock.ts`)**:
  - `validateVersion(currentVersion, expectedVersion)`: Valida se a versão enviada pelo cliente diverge da versão atual no banco em memória. Em caso de divergência, devolve erro estruturado com status HTTP `409 Conflict` e código `conflict_version_mismatch`.
  - `applyOptimisticLock(entity, expectedVersion)`: Aplica a validação e incrementa a versão da entidade atomicamente (`entity.version += 1`).
- **Simulador de Corridas (`race-simulator.ts`)**:
  - `raceSimulator.delayForRace(key, baseDelayMs)`: Simula atrasos arbitrários em requisições paralelas para testar respostas fora de ordem (ex.: requisição B rápida ultrapassando requisição A lenta).
  - Retenção determinística com `hold(key)` e `release(key)` para pausar e liberar requisições sob demanda nos testes de integração.

---

## 6. Painel Visual de Depuração (`src/mocks/ui`)

O componente [`ScenarioSwitcher`](file:///c:/Users/rcaet/OneDrive/Desktop/frontend-challenge-junglegaming/src/mocks/ui/scenario-switcher.tsx) disponibiliza um drawer flutuante no canto inferior direito da aplicação quando `VITE_ENABLE_MOCKS === 'true'`.

### Recursos da Interface

1. **Badge do Cenário Ativo**: Indicador visual dinâmico exibindo o cenário atual diretamente no launcher.
2. **Seletor de Perfis**: Alterna instantaneamente entre qualquer um dos cenários pré-configurados.
3. **Sliders de Precisão**:
   - Ajuste manual de latência de 0ms a 3000ms.
   - Ajuste manual de taxa de perda de pacotes / falhas de 0% a 100%.
4. **Alerta de Erros Forçados**: Painel visual informando quais endpoints sofrerão falhas forçadas no cenário ativo.
5. **Botão de Reset**: Reinicia o banco em memória (`resetDb()`) e restaura as configurações nominais (`scenarioEngine.reset()`).

---

## 7. Verificação e Comandos Úteis

```bash
# Executa todos os testes unitários e de integração dos mocks
pnpm test

# Executa especificamente a suíte de integração ponta a ponta
pnpm test src/mocks/__tests__/integration.test.ts

# Valida tipagem estrita de TypeScript e regras do ESLint
pnpm check

# Executa o build de produção para validação de bundle
pnpm build

# Inicia o servidor local de desenvolvimento com mocks habilitados
VITE_ENABLE_MOCKS=true pnpm dev
```
