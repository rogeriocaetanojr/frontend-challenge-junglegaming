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
├── lib/             # Adaptadores de bibliotecas terceiras e clientes de infraestrutura
│   ├── http/        # Cliente HTTP encapsulado (Axios)
│   └── realtime/    # Cliente de WebSocket encapsulado (Socket.IO)
├── mocks/           # Camada de interceptação e simulação de rede (MSW)
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

[Pendente - Será detalhado no módulo de autenticação]

- Estrutura baseada em tokens com renovação e controle de expiração.
- Tratamento centralizado de erros de autorização (401/403) no interceptor HTTP.
- Limpeza de estado e redirecionamento elegante em caso de sessão expirada.

---

## 4. Estado do Carrinho, Precisão Decimal (ETH) e Merge de Visitante

- **Precisão Numérica**: Todos os cálculos monetários e agregações de preços (ex: total do carrinho, lances e conversões USD) utilizam estritamente a biblioteca `bignumber.js` (`src/lib/formatters.ts`), garantindo imunidade absoluta a inconsistências de arredondamento inerentes ao padrão _IEEE 754_ do JavaScript (ex: `0.1 + 0.2 = 0.3`).
- **Formatação de Criptoativos**: Os valores são exibidos via `formatEth` com controle explícito de casas decimais e sem zeros desnecessários à direita.
- **Persistência do Carrinho**: Armazenamento local para usuários não autenticados.
- **Merge de Visitante**: Ao autenticar, os itens do carrinho anônimo serão conciliados com o carrinho da conta do usuário.

---

## 5. Estratégia de Cache, Invalidação, Retries e Atualização Otimista (TanStack Query)

[Pendente - Será detalhado na integração com TanStack Query]

- Centralização de _query keys_ tipadas e estruturadas por domínio.
- Configuração de políticas de `staleTime` e `gcTime` conforme a volatilidade dos dados.
- Atualizações otimistas para ações críticas de usuário (ex: favoritos, carrinho).
- Políticas de retries exponenciais com fallback para erros de rede.

---

## 6. Reconciliação entre API REST e WebSocket (Socket.IO)

[Pendente - Será detalhado na camada de sincronização em tempo real]

- Deduplicação de eventos baseada em identificadores únicos e timestamps.
- Atualização direta do cache do TanStack Query ao receber eventos de socket.
- Revalidação defensiva da API REST caso a conexão WebSocket seja interrompida e reconectada.

---

## 7. Camada de Mocks (MSW), Persistência e Limitações Conhecidas

[Pendente - Será detalhado na implementação do MSW]

- Interceptação a nível de Service Worker em desenvolvimento e testes.
- Suporte a alternância de cenários em tempo de execução via parâmetros de configuração.
- Persistência volátil em memória/SessionStorage para permitir reset fácil do estado da simulação.

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
| 2026-10-19 | Pendente  | Adoção do bignumber.js para aritmética e formatação de criptoativos (ETH/USD)      | Eliminar vulnerabilidades e inconsistências de ponto flutuante (IEEE 754) em operações financeiras e checkout, garantindo precisão arbitrária exata.                          |
