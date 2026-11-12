# Instruções para agentes de código

- Preserve a arquitetura existente e mantenha funcionalidades em
  `src/features/<feature>/`; use `src/features/example-item/` como referência.
- Obtenha `tenantId` do ator autenticado e filtre toda consulta ou mutação
  tenant-scoped. Autorização deve ser verificada no servidor, não só na UI.
- Nunca conecte comandos locais ao banco do sistema original ou de produção.
  Use scripts pnpm com validação explícita de ambiente e destino.
- Não execute resets destrutivos nem aplique migrations legadas. Migrations
  ativas ficam em `prisma/migrations/`; o histórico antigo está arquivado.
- Valide alterações com `pnpm lint`, `pnpm format:check`,
  `pnpm typecheck` e testes relevantes. Revise código gerado por IA/Plop e
  nunca submeta segredos ou dados pessoais.
- Consulte [CONTRIBUTING](../CONTRIBUTING.md) e o
  [guia do starter](../docs/software-starter.md) para fluxos e convenções.
