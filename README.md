# NFT Marketplace — Desafio Frontend

Aplicação desenvolvida para o desafio técnico de frontend da Jungle Gaming.

## 1. Visão Geral e Links

- Repositório: https://github.com/rogeriocaetanojr/frontend-challenge-junglegaming
- URL de Produção: [Pendente - Deploy a ser configurado]

## 2. Stack Tecnológica

- React 19
- TypeScript
- Vite
- PNPM
- Tailwind CSS v4
- ESLint (Flat Config) & Prettier
- Husky, lint-staged & Commitlint
- TanStack Query (previsto)
- Mock Service Worker (previsto)
- Vitest & Playwright (previsto)

## 3. Pré-requisitos e Setup Local

- Node.js >= 22 (conforme especificado no `.nvmrc`)
- PNPM >= 9

Instalação das dependências:

```bash
pnpm install
```

Execução em desenvolvimento:

```bash
pnpm dev
```

## 4. Variáveis de Ambiente

As variáveis de configuração do projeto devem seguir o modelo documentado em `.env.example`:

| Variável                     | Descrição                                        | Valor Padrão            |
| ---------------------------- | ------------------------------------------------ | ----------------------- |
| `VITE_ENABLE_MOCKS`          | Habilita ou desabilita a camada de mocks via MSW | `true`                  |
| `VITE_MOCK_DEFAULT_SCENARIO` | Define o cenário inicial dos mocks               | `default`               |
| `VITE_API_BASE_URL`          | URL base para requisições à API REST             | `/api`                  |
| `VITE_WS_URL`                | Endereço do servidor em tempo real (Socket.IO)   | `http://localhost:3000` |

Para desenvolvimento local, utilize o arquivo `.env.development`.

## 5. Credenciais Fictícias de Teste

[Pendente - Será preenchido na implementação do fluxo de autenticação]

- Usuário Padrão: `usuario@exemplo.com` / `Senha123!`
- Carteira Simulada: `0x71C...3921`

## 6. Cenários de Simulação (MSW) e Reset de Estado

[Pendente - Será detalhado na implementação da camada de mocks]

- Cenário `default`: Listagem de coleções, catálogo de NFTs e carteira com saldo.
- Cenário `error`: Simulação de instabilidade na rede e erros 500 no checkout.
- Cenário `empty`: Estados vazios para catálogo e carrinho.

## 7. Como Reproduzir Fluxos de Falha e Idempotência

[Pendente - Será detalhado na implementação do carrinho e checkout]

- Falhas de rede transitórias e mecanismo de retries automáticos.
- Validação de chave de idempotência para evitar compras duplicadas.
- Concorrência de compra para NFTs já negociados.

## 8. Comandos Disponíveis

- `pnpm dev`: Inicia o servidor local de desenvolvimento.
- `pnpm build`: Executa a checagem de tipos (`tsc -b`) e compila a aplicação para produção.
- `pnpm preview`: Executa a prévia local do build gerado em `/dist`.
- `pnpm typecheck`: Executa a análise estática de tipos com o compilador TypeScript.
- `pnpm lint`: Executa a análise estática de código com o ESLint (`--max-warnings 0`).
- `pnpm lint:fix`: Executa o ESLint com correção automática de problemas compatíveis.
- `pnpm format`: Formata todos os arquivos do projeto com o Prettier.
- `pnpm check`: Executa a validação unificada de tipos e linter (`typecheck && lint`).
- `pnpm test`: Executa os testes unitários e de integração com Vitest.
- `pnpm test:e2e`: Executa a suíte de testes de ponta a ponta com Playwright.
- `pnpm test:e2e:update`: Executa os testes E2E atualizando snapshots visuais.
- `pnpm lighthouse`: Executa a auditoria automatizada de performance, acessibilidade e SEO.
