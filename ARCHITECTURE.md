# Arquitetura e Decisões Técnicas — NFT Marketplace

Documento técnico que consolida a arquitetura, padrões estruturais, contratos e o histórico de decisões técnicas da aplicação.

---

## 1. Organização de Pastas e Fronteiras de Módulos

A arquitetura do projeto adota uma divisão modular baseada em responsabilidades e domínios de negócio (_feature-based_), garantindo alto desacoplamento e isolamento de dependências.

```plaintext
src/
├── assets/          # Assets estáticos, ícones e mídias compartilhadas
├── components/      # Componentes de UI genéricos (Design System e Primitivos)
├── features/        # Módulos de domínio de negócio isolados (auth, marketplace, cart, etc.)
├── hooks/           # Hooks React reutilizáveis de escopo transversal
├── layouts/         # Layouts estruturais da aplicação (RootLayout com Outlet e ScrollToTop)
├── lib/             # Adaptadores de bibliotecas terceiras e clientes de infraestrutura
│   ├── http/        # Cliente HTTP encapsulado (Axios)
│   └── realtime/    # Cliente de WebSocket encapsulado (Socket.IO)
├── mocks/           # Camada de interceptação e simulação de rede (MSW)
├── pages/           # Páginas e views de rotas (home, nft-detail, checkout, not-found)
├── routes/          # Configuração declarativa de rotas SPA (createBrowserRouter)
├── store/           # Stores de estado global de cliente (Zustand com persist)
├── styles/          # Tokens CSS, Tailwind v4 e estilos globais
├── types/           # Declarações e contratos globais de tipos TypeScript
└── utils/           # Funções utilitárias puras
```

### Barreiras Arquiteturais e Restrições de Importação

Para evitar vazamento de dependências de infraestrutura nas camadas de apresentação ou regras de negócio, o projeto utiliza a regra `no-restricted-imports` do ESLint:

- **MSW (`msw`, `@mswjs/*`)**: Permitido exclusivamente em `src/mocks/**`.
- **Axios (`axios`, `axios/*`)**: Permitido exclusivamente em `src/lib/http/**`.
- **Socket.IO (`socket.io-client`, `socket.io-client/*`)**: Permitido exclusivamente em `src/lib/realtime/**`.

---

## 2. Contratos REST e Catálogo de Eventos em Tempo Real (Socket.IO)

[Pendente - Será detalhado durante a especificação da API e dos mocks]

### Contratos REST Previstos

- `GET /api/nfts`: Listagem paginada de NFTs com suporte a filtros e ordenação.
- `GET /api/nfts/:id`: Detalhes de um NFT específico e histórico de transações.
- `POST /api/auth/login`: Autenticação e obtenção de token de sessão.
- `POST /api/checkout`: Criação de pedido com suporte a cabeçalho de idempotência.

### Catálogo de Eventos Socket.IO Previstos

- `nft:price_updated`: Notificação de alteração de preço ou lance em tempo real.
- `nft:purchased`: Notificação de NFT vendido (remoção ou atualização de status).
- `order:status_changed`: Atualização do ciclo de vida de uma ordem de compra.

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

---

## 4. Estado do Carrinho, Precisão Decimal (ETH) e Merge de Visitante

- **Gerenciamento de Estado Global (`src/store/cart-store.ts`)**:
  - Implementado com **Zustand** e middleware `persist` gravando no `localStorage` sob a chave `@nft-marketplace:cart`.
  - **Unicidade de NFTs (1 de 1)**: Por serem ativos digitais não-fungíveis únicos, a quantidade por item é rigidamente fixada em `1`. A ação `addItem` rejeita automaticamente duplicações de um mesmo identificador.
  - **Ações Atômicas e Seletores**: Prover `addItem`, `removeItem`, `clearCart`, `isInCart`, `getItemCount`, `getTotalEth` e `getTotalUsd`.
- **Precisão Numérica Rigorosa (IEEE 754)**:
  - Todo cálculo de soma e conversão monetária é computado por meio de `calculateTotalEth` e `BigNumber.js` (`src/lib/formatters.ts`), eliminando anomalias decimais comuns de ponto flutuante em JavaScript (`0.1 + 0.2 = 0.30000000000000004`).
- **Formatação de Criptoativos**:
  - Valores exibidos através de `formatEth` (com precisão configurável e sem zeros residuais) e `formatUsd` com separadores monetários padronizados.
- **Merge de Visitante (Previsto)**:
  - Ao autenticar a sessão Web3 ou conta de usuário, os itens armazenados localmente no estado de visitante serão sincronizados com o backend antes do checkout definitivo.

---

## 5. Estratégia de Cache, Invalidação, Retries e Atualização Otimista (TanStack Query)

- **Instância Centralizada (`src/lib/query-client.ts`)**:
  - `staleTime`: 30 segundos (`1000 * 30`) como padrão, equilibrando atualização frequente de dados do marketplace com consumo de rede.
  - `gcTime`: 5 minutos (`1000 * 60 * 5`) para retenção em cache antes da liberação de memória de queries inativas.
  - `retry`: Política defensiva de 1 retry para falhas transitórias, com bypass imediato (retorno `false`) para erros determinísticos como `401 Unauthorized` e `404 Not Found` identificados via `ApiError`.
  - `refetchOnWindowFocus`: desativado (`false`) para evitar refetches acidentais e tráfego redundante ao alternar janelas locais.
  - `mutations`: `retry: 0` para preservar integridade e idempotência de transações Web3 e operações de carrinho.
- **Fábrica Padronizada de Chaves (`src/lib/query-keys.ts`)**:
  - Estrutura hierárquica e imutável (`as const`) dividida por domínios (`nfts`, `cart`, `user`, `health`).
  - Facilita a invalidação cirúrgica de cache (ex: invalidar todas as listas de NFTs sem descartar detalhes específicos em cache).
- **Ferramentas de Diagnóstico (`ReactQueryDevtools`)**:
  - Carregado exclusivamente em desenvolvimento (`import.meta.env.DEV`) na raiz da aplicação (`src/main.tsx`), garantindo zero impacto no bundle final de produção.

---

## 6. Reconciliação entre API REST e WebSocket (Socket.IO)

[Pendente - Será detalhado na camada de sincronização em tempo real]

- Deduplicação de eventos baseada em identificadores únicos e timestamps.
- Atualização direta do cache do TanStack Query ao receber eventos de socket.
- Revalidação defensiva da API REST caso a conexão WebSocket seja interrompida e reconectada.

---

## 7. Camada de Mocks (MSW), Persistência e Limitações Conhecidas

- **Arquitetura Isolada**: Todo o código e handlers do Mock Service Worker estão restritos a `src/mocks/**`, protegidos pela barreira arquitetural do ESLint (`no-restricted-imports`).
- **Interceptação no Navegador e Node**: `src/mocks/browser.ts` para runtime do browser via Service Worker (`public/mockServiceWorker.js`) e `src/mocks/server.ts` para testes automatizados.
- **Inicialização Condicional**: Controlada pela variável `VITE_ENABLE_MOCKS=true` via função assíncrona `enableMocking()`, postergando a renderização da UI até o registro do worker.
- **Modo de Operação**: Configurado com `bypass` em requisições não interceptadas (`onUnhandledFrame: 'bypass'`) para não interferir em assets estáticos ou chamadas externas.

---

## 8. Decisões de UX, Acessibilidade e Registro de Desvios do Figma

[Pendente - Será detalhado conforme a interface for construída]

- Conformidade com padrões WCAG 2.1 nível AA.
- Suporte completo a navegação por teclado e semântica acessível para leitores de tela.
- Tabela de desvios e adaptações em relação ao protótipo do Figma documentadas com justificativa de usabilidade ou viabilidade técnica.

---

## 9. Log de Decisões Técnicas

| Data       | Commit    | Decisão                                                                            | Motivo                                                                                                                                                                        |
| ---------- | --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-19 | `972cf09` | Ativação do modo estrito do TypeScript e path alias `@/*`                          | Garantir segurança máxima de tipos no compilador e facilitar refatorações com imports absolutos limpos.                                                                       |
| 2026-10-19 | `f0c9fe0` | Barreiras arquiteturais com ESLint (`no-restricted-imports`)                       | Impedir vazamento de dependências terceiras (Axios, Socket.IO, MSW) fora de suas camadas de abstração dedicadas.                                                              |
| 2026-10-19 | `0a85bbe` | Padronização de commits com Conventional Commits, Husky e lint-staged              | Assegurar rastreabilidade histórica, mensagens semânticas e validação automática de código antes de qualquer commit.                                                          |
| 2026-10-19 | `569d00b` | Fixação da versão do Node.js (22) via `.nvmrc` e scripts operacionais              | Unificar o ambiente de execução entre membros do time e garantir scripts consistentes para CI/CD.                                                                             |
| 2026-10-19 | `8602956` | Adoção do Tailwind CSS v4 com plugin `@tailwindcss/vite`                           | Performance de build superior com engine Oxide, configuração CSS-first simplificada sem PostCSS e integração nativa ao Vite.                                                  |
| 2026-10-19 | `d4b7930` | Mapeamento cirúrgico dos design tokens do Figma (paleta Dark Mode Bronze-Caramelo) | Extração precisa do arquivo oficial `figma-tokens.json` em `tokens.css` com variáveis CSS e mapeamento `@theme` no Tailwind v4, garantindo fidelidade visual e temática Web3. |
| 2026-10-19 | `3d4229a` | Adoção do shadcn/ui customizado sobre os tokens de design do Figma                 | Prover componentes atômicos primitivos (Button, Badge, Input) acessíveis (WAI-ARIA), extensíveis com CVA e integrados com precisão cirúrgica aos tokens da aplicação.         |
| 2026-10-19 | `d584a24` | Inclusão das primitivas Radix UI (Dialog, DropdownMenu, Separator, Slot)           | Garantir conformidade rigorosa com diretrizes de acessibilidade WCAG 2.1 AA (foco, trap, navegação por teclado e semântica ARIA) em componentes compostos interativos.        |
| 2026-10-19 | `9af98ed` | Adoção do bignumber.js para aritmética e formatação de criptoativos (ETH/USD)      | Eliminar vulnerabilidades e inconsistências de ponto flutuante (IEEE 754) em operações financeiras e checkout, garantindo precisão arbitrária exata.                          |
| 2026-10-19 | `f5ea535` | Isolamento do cliente HTTP com Axios em `src/lib/http/`                            | Centralizar baseURL, timeout de 10s, injeção de Bearer token e tratamento de erro tipado (ApiError), respeitando rigorosamente a barreira no-restricted-imports.              |
| 2026-10-19 | `b81c179` | Arquitetura do Mock Service Worker (MSW) isolada em `src/mocks/`                   | Simular APIs REST via Service Worker no navegador e Node.js com inicialização condicional (VITE_ENABLE_MOCKS) e isolamento arquitetural.                                      |
| 2026-10-19 | `acb5951` | Configuração do TanStack Query v5 e fábrica de queryKeys                           | Instância centralizada com políticas de cache/retry adequadas a Web3 e chaves padronizadas para previsibilidade de invalidação.                                               |
| 2026-10-19 | `b419f5a` | Roteamento declarativo SPA com React Router DOM v7 e layouts aninhados             | Estrutura de rotas baseada em `createBrowserRouter`, layout estrutural com `<Outlet />`, restauração de scroll (`ScrollToTop`) e página 404 acessível.                        |
| 2026-10-19 | `b079894` | Gerenciamento de estado do carrinho (`cartStore`) com Zustand e persistência       | Store global com middleware `persist` (`localStorage`), garantia de unicidade de NFTs 1/1 e totalização imune a IEEE 754 via `bignumber.js`.                                  |
| 2026-10-19 | Pendente  | Autenticação e carteira Web3 (`authStore`) com auto-logout e sincronização HTTP    | Gerenciamento de sessão com Zustand (`persist`), injeção automática de Bearer token no cliente HTTP e auto-logout reativo para o evento `http:unauthorized`.                  |
