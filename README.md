# NFT Marketplace — Desafio Frontend

Aplicação completa desenvolvida para o desafio técnico de frontend da Jungle Gaming, implementando a experiência completa do **KURIO NFT Marketplace** com fidelidade ao design do Figma, arquitetura resiliente e contratos estritos.

---

## 1. Visão Geral e Links

- **Repositório GitHub**: [https://github.com/rogeriocaetanojr/frontend-challenge-junglegaming](https://github.com/rogeriocaetanojr/frontend-challenge-junglegaming)
- **URL de Produção (Vercel)**: `https://frontend-challenge-junglegaming.vercel.app` _(ou URL configurada no deploy)_

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
| **Testes**        | Vitest + Playwright             | 394 testes automatizados de integração/contratos e suíte E2E em Chromium.                    |
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
5. **Reset de Estado**:
   - O botão flutuante em desenvolvimento (ou recarregar limpando o `localStorage`) restaura instantaneamente as fixtures limpas.

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

- `pnpm dev`: Inicia o servidor local de desenvolvimento (com HMR).
- `pnpm build`: Executa checagem de tipos (`tsc -b`) e compila a aplicação para produção.
- `pnpm preview`: Executa prévia local do build gerado em `dist/`.
- `pnpm check`: Executa validação unificada estrita (`tsc -b && eslint . --max-warnings 0`).
- `pnpm test`: Executa 394 testes unitários e de integração com Vitest.
- `pnpm test:e2e`: Executa a suíte de testes de ponta a ponta com Playwright.
- `pnpm lighthouse`: Executa o build e exibe as diretrizes da auditoria Lighthouse (`lighthouserc.json`).
