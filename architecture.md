# Sistema de Agendamento — Arquitetura

## 1. Objetivo

Este documento define a arquitetura de referência do Sistema de Agendamento e orienta a implementação e evolução das funcionalidades.

O projeto utiliza Next.js App Router, React, TypeScript, Prisma e PostgreSQL. A organização deve favorecer a manutenção, a evolução incremental e a reutilização de comportamentos realmente comuns.

A feature `service` é a referência inicial para os CRUDs administrativos. Seu código deve ser consultado antes de implementar novas funcionalidades semelhantes.

**Regra fundamental:** seguir a arquitetura existente, reutilizar os componentes genéricos disponíveis e evitar novas abstrações sem benefício concreto.

Este documento descreve convenções arquiteturais. Quando houver divergência entre a documentação e o código atual, o agente deve identificar a divergência e solicitar ou propor uma atualização explícita, sem presumir que o código está incorreto.

## 2. Princípios de organização

### 2.1. Feature-based architecture e Vertical Slices

A unidade principal de organização é a funcionalidade de negócio.

Cada feature reúne os componentes necessários para implementar seu comportamento: interface, validação, consultas, operações de escrita e testes, conforme a necessidade.

Exemplos de funcionalidades:

- `service`
- `client`
- `professional`
- `appointment`
- `user`

A organização interna não precisa ser idêntica em todas as features. Devem ser criadas apenas as pastas e abstrações necessárias.

Não organizar toda a aplicação exclusivamente por camadas técnicas globais, como `services/`, `repositories/`, `controllers/` e `dtos/`, quando isso dispersar o código de cada funcionalidade.

### 2.2. Simplicidade arquitetural

Não introduzir camadas, interfaces, DTOs, mappers, adapters ou factories apenas por convenção.

Usar abstrações quando resolverem um problema real, como reutilização efetiva, isolamento de responsabilidades ou complexidade demonstrável.

O projeto não pretende permitir a troca hipotética do Prisma por outro ORM. O acesso ao banco pode utilizar Prisma diretamente dentro da feature.

### 2.3. Stack e tipagem

- Next.js App Router e React.
- TypeScript strict.
- Prisma com PostgreSQL.
- Zod para validação em runtime.
- TanStack Query para consultas e mutações no cliente quando apropriado.
- TanStack Table para implementação das tabelas.
- React Hook Form e `@hookform/resolvers` para formulários, conforme o padrão da feature `service`.
- Tailwind CSS e componentes shadcn/ui.
- Vitest para testes, seguindo a configuração existente.

Não utilizar `any`. Preferir inferência de tipos e tipos derivados de schemas ou do Prisma, evitando representações equivalentes desnecessárias.

## 3. Organização do código

A estrutura real do repositório deve ser consultada antes de criar arquivos. O exemplo conceitual abaixo ilustra a separação de responsabilidades, sem impor nomes ou diretórios que não existam no projeto.

```text
src/
├── app/
│   ├── (auth)/
│   └── (dashboard)/
│
├── features/
│   ├── service/
│   │   ├── service.actions.ts
│   │   ├── service.query.ts
│   │   ├── service.repository.ts
│   │   ├── service.schema.ts
│   │   ├── service-container.tsx
│   │   ├── service-form.tsx
│   │   └── service.test.ts
│   ├── client/
│   ├── professional/
│   └── appointment/
│
├── components/
│   ├── data-table/
│   ├── crud/
│   ├── forms/
│   ├── feedback/
│   └── ui/
│
├── hooks/
└── lib/
    ├── db/
    └── logger/
```

A árvore acima é uma referência conceitual baseada nos arquivos conhecidos da feature `service`. Os caminhos efetivos, a nomenclatura singular ou plural e a distribuição atual das pastas devem ser confirmados no repositório antes de qualquer alteração.

### 3.1. Responsabilidades dos arquivos da feature

A estrutura abaixo representa o padrão observado no snapshot da feature `service`. Nem todos os arquivos precisam existir em todas as funcionalidades.

| Arquivo           | Responsabilidade                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `*.schema.ts`     | Schemas Zod de entrada e saída e tipos inferidos.                                                             |
| `*.query.ts`      | Contratos de consulta, parâmetros de listagem e tipos de resultados quando necessário.                        |
| `*.actions.ts`    | Server Actions, autenticação, validação das entradas e coordenação das operações.                             |
| `*.repository.ts` | Consultas e mutações no PostgreSQL por meio do Prisma.                                                        |
| `*-container.tsx` | Estado da interface, consultas, mutações, filtros, composição dos componentes e ações específicas da feature. |
| `*-form.tsx`      | Formulário específico da funcionalidade e integração com validação.                                           |
| `*.test.ts`       | Testes dos schemas e das operações relevantes da feature.                                                     |

Não criar arquivos vazios nem separar código apenas para reproduzir essa lista. A estrutura deve acompanhar a complexidade real da funcionalidade.

## 4. Fluxo de dados e responsabilidades

### 4.1. Consultas

O fluxo de consulta preferencial para CRUDs com interface interativa é:

```text
Page (Server Component)
        |
        v
Feature Container (Client Component)
        |
        v
TanStack Query
        |
        v
Server Action
        |
        v
Zod + autenticação
        |
        v
Repository / Prisma
        |
        v
PostgreSQL
```

A página deve permanecer simples, delegando a interface interativa ao container da feature quando esse for o padrão adequado.

O container administra o estado da interface e as consultas. A Server Action valida os dados recebidos e verifica a sessão e o contexto de autorização antes de acessar o repositório.

O repositório concentra as operações de persistência e as consultas específicas da entidade.

### 4.2. Criação, edição e exclusão

O fluxo de escrita é:

```text
Formulário
    |
    v
Validação do formulário
    |
    v
Mutação do TanStack Query
    |
    v
Server Action
    |
    v
Autenticação + autorização + Zod
    |
    v
Repository / Prisma
    |
    v
PostgreSQL
    |
    v
Invalidação do cache + feedback
```

O container coordena as mutações, os estados de carregamento, o fechamento dos diálogos e as notificações.

Após uma operação bem-sucedida, deve atualizar ou invalidar as consultas afetadas por meio do TanStack Query, conforme as chaves de cache existentes.

Não introduzir `revalidatePath` como mecanismo principal de atualização de CRUDs interativos que já utilizam TanStack Query, salvo quando houver uma necessidade específica de revalidação do cache do Next.js.

### 4.3. Server Actions e segurança

Toda Server Action deve tratar seus argumentos como dados não confiáveis.

Quando a operação exigir autenticação, deve obter e verificar a sessão no servidor. A autorização deve ser aplicada à operação, não apenas à interface.

Em operações multi-tenant:

- obter o `tenantId` do contexto autenticado e autorizado;
- nunca confiar em um `tenantId` arbitrário fornecido pelo cliente;
- restringir consultas e mutações ao tenant autorizado;
- evitar operações por identificador que possam acessar registros de outro tenant.

A validação com Zod não substitui autenticação nem autorização.

### 4.4. Repositórios

O repositório utiliza Prisma diretamente para executar as consultas e mutações da feature.

Deve preservar as restrições de tenant, selecionar os campos necessários e aplicar paginação e ordenação de forma segura.

Não criar interfaces de repositório ou uma camada de domínio adicional sem um benefício concreto.

## 5. DataTable genérica — componente compartilhado central

A `DataTable` é uma abstração compartilhada e deve ser utilizada pelas features que apresentam dados tabulares.

Referências conhecidas no código da feature `service`:

- `@/components/data-table/data-table`
- `@/components/data-table/table`
- `@/components/data-table/data-table-skeleton`

Os arquivos atuais desses componentes devem ser consultados para confirmar as APIs, os tipos e as funcionalidades disponíveis. O agente não deve criar uma segunda implementação de tabela antes de verificar esses componentes.

### 5.1. Responsabilidade da DataTable

A `DataTable` é responsável pela apresentação genérica dos dados tabulares e pela integração com TanStack Table.

Ela não deve conhecer regras específicas de `Service`, `Client`, `Professional` ou `Appointment`.

Também não deve depender diretamente de:

- Prisma;
- Server Actions;
- TanStack Query;
- autenticação ou tenant;
- schemas específicos de uma feature;
- regras de negócio de uma entidade.

A tabela recebe os dados e as configurações por propriedades. A feature que a utiliza mantém o controle sobre a consulta e sobre o comportamento específico de seus registros.

### 5.2. Uso de generics

A tabela deve preservar a tipagem do modelo apresentado.

O padrão de utilização observado na feature `service` é:

```tsx
<DataTable<ServiceListItem>
  columns={columns}
  data={data.items}
  sorting={sorting}
  onSortingChange={setSorting}
  pagination={pagination}
  onPaginationChange={setPagination}
  rowCount={data.total}
/>
```

`ServiceListItem` representa o tipo dos registros exibidos. Para outras features, deve ser utilizado o tipo de listagem correspondente.

A tabela não deve exigir que todas as entidades compartilhem um único tipo de domínio. O generic permite que cada feature mantenha seu próprio modelo de apresentação.

Não substituir essa tipagem por `any` nem realizar conversões desnecessárias para contornar incompatibilidades.

### 5.3. Definição das colunas

As colunas são específicas da feature e devem ser definidas junto ao container ou ao módulo de apresentação correspondente, conforme a organização existente.

A feature `service` utiliza `createAppColumnHelper`:

```tsx
const columnHelper = createAppColumnHelper<ServiceListItem>();

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Nome",
    enableSorting: true,
  }),

  columnHelper.accessor("duration", {
    header: "Duração",
    enableSorting: true,
    cell: ({ getValue }) => `${getValue()} min`,
  }),

  columnHelper.display({
    id: "actions",
    header: "Ações",
    enableSorting: false,
    cell: ({ row }) => (
      // Ações específicas da feature
      // usando row.original
    ),
  }),
]);
```

O exemplo é ilustrativo: o conteúdo da célula de ações deve ser implementado com os componentes e manipuladores reais da feature.

Regras:

- usar o tipo correto no helper de colunas;
- manter cabeçalhos, formatação e ações específicos da entidade na feature;
- utilizar colunas `accessor` para campos de dados;
- utilizar colunas `display` para ações ou conteúdo que não corresponda a um campo;
- manter a `DataTable` independente desses detalhes;
- respeitar os tipos e as convenções já definidos em `components/data-table/table`.

### 5.4. Paginação e ordenação

No padrão observado em `service`, a paginação e a ordenação são controladas pela feature.

O container utiliza `useListControls`, mantém o estado de busca, ordenação e paginação e transforma esse estado nos parâmetros aceitos pela consulta.

A `DataTable` recebe o estado e os callbacks:

```tsx
<DataTable<ServiceListItem>
  columns={columns}
  data={data.items}
  sorting={sorting}
  onSortingChange={setSorting}
  pagination={pagination}
  onPaginationChange={setPagination}
  rowCount={data.total}
/>
```

Nesse padrão, a tabela não é responsável por buscar os registros no banco. Ela comunica as mudanças de estado ao container, que atualiza a consulta.

Quando a listagem é paginada no servidor:

1. o container mantém o estado de paginação e ordenação;
2. converte esse estado nos parâmetros de consulta da feature;
3. a Server Action valida os parâmetros;
4. o repositório aplica ordenação e paginação no Prisma;
5. o resultado retorna com os registros e os metadados de paginação;
6. o container fornece os dados atualizados à tabela.

Não duplicar a paginação no cliente quando o servidor já entrega uma página de resultados. A configuração do TanStack Table deve corresponder à estratégia de paginação adotada.

Os nomes exatos das propriedades e a configuração interna devem seguir a implementação atual da `DataTable`; não criar uma API alternativa para cada feature.

### 5.5. Busca e filtros

A busca pertence ao estado e à lógica de consulta da feature, não ao componente genérico de tabela.

O snapshot de `service` utiliza `SearchInput` e `useListControls`, com debounce antes da consulta. A busca é transformada em parâmetros validados e aplicada no repositório.

Filtros específicos de outras entidades devem seguir a mesma separação: controles e parâmetros pertencem à feature; a tabela recebe os resultados e o estado tabular.

### 5.6. Estados de interface

A feature deve tratar explicitamente os estados de carregamento inicial, atualização, ausência de registros e falha de consulta.

O padrão observado em `service` utiliza componentes compartilhados como:

- `DataTableSkeleton`;
- `EmptyState`;
- `ErrorState`;
- `SearchInput`.

O container coordena esses estados. A tabela genérica não deve incorporar mensagens, textos ou regras específicas de uma entidade.

### 5.7. Ações por linha

Ações como editar e excluir são específicas da feature.

Elas devem ser definidas nas colunas, utilizando o registro tipado de `row.original`, e delegar a execução aos manipuladores do container.

A `DataTable` não deve implementar operações de CRUD nem conhecer os diálogos específicos de cada entidade.

### 5.8. Regra de reutilização

Antes de implementar uma tabela para uma nova feature:

1. localizar e ler a implementação existente de `DataTable`;
2. verificar `createAppColumnHelper` e os tipos compartilhados;
3. identificar quais propriedades e recursos já estão disponíveis;
4. definir o tipo de listagem da nova feature;
5. criar as colunas específicas;
6. conectar paginação, ordenação e resultados do servidor;
7. utilizar os componentes compartilhados de busca, carregamento e estados vazios quando apropriado.

Se faltar algum recurso genérico, avaliar se ele é realmente comum a mais de uma feature antes de modificar a `DataTable`.

Não duplicar a tabela para contornar um recurso que pode ser incorporado de forma genérica e tipada.

## 6. Formulários e componentes compartilhados

Os formulários específicos devem permanecer na feature.

O snapshot de `service` utiliza React Hook Form, `zodResolver` e schemas definidos em `service.schema.ts`. Também utiliza `TextFormField` compartilhado e componentes de interface existentes.

Os componentes compartilhados devem encapsular comportamentos comuns, sem conhecer os campos ou as regras de negócio de uma entidade específica.

Diálogos genéricos, campos de formulário, botões, feedback visual e estados de interface devem ser reutilizados quando suas APIs atenderem à necessidade real.

Não criar componentes compartilhados apenas porque duas interfaces possuem aparência semelhante.

## 7. Validação e tipagem

Os schemas Zod devem definir os contratos de entrada das operações e validar os dados em runtime.

Preferir inferência de tipos a declarações manuais duplicadas.

Quando houver diferença legítima entre os dados de entrada e os dados validados, utilizar os tipos apropriados, como `z.input` e `z.output`.

Tipos de listagem podem ser definidos separadamente quando forem necessários para representar os campos efetivamente apresentados pela interface.

Não criar automaticamente uma sequência de tipos equivalentes entre formulário, aplicação, domínio, persistência e interface.

## 8. Persistência e evolução do banco

O PostgreSQL é acessado por meio do Prisma.

As alterações no schema devem ser acompanhadas de migrations versionadas. Consultas devem selecionar apenas os campos necessários sempre que apropriado.

As operações devem respeitar as relações, restrições e o isolamento de tenant definidos no modelo de dados.

A arquitetura não exige um repositório genérico compartilhado entre todas as entidades. Cada feature pode possuir suas próprias funções de consulta e mutação, usando Prisma diretamente.

## 9. Testes e qualidade

Os testes devem verificar o comportamento da funcionalidade e os riscos relevantes à mudança.

A referência de `service` inclui testes de schemas e de operações de persistência, incluindo isolamento entre tenants.

Ao criar ou alterar uma feature, avaliar:

- validação dos dados;
- comportamento das consultas e mutações;
- autorização e isolamento de tenant;
- paginação, busca e ordenação;
- integração da `DataTable` com os tipos e estados da feature;
- comportamento dos formulários;
- estados de erro e carregamento.

Executar os testes e as verificações pertinentes. Não declarar uma funcionalidade concluída apenas porque os arquivos foram gerados.

## 10. Convenções para novas funcionalidades

Antes de implementar uma nova feature, o agente deve:

1. consultar esta documentação;
2. inspecionar a estrutura real do projeto;
3. estudar a feature `service` existente;
4. verificar os componentes compartilhados, especialmente `DataTable`;
5. reutilizar os padrões existentes que atendam à necessidade;
6. implementar somente as abstrações adicionais justificadas;
7. preservar autenticação, autorização e isolamento de tenant;
8. validar a implementação com testes e verificações apropriadas.

A feature `service` é uma referência, não um molde imutável. Reutilizar seus padrões quando fizerem sentido, sem copiar erros, perpetuar inconsistências ou impor a mesma estrutura a funcionalidades de complexidade diferente.

## 11. Relação com o Spec Kit e o GitHub Copilot

Esta documentação deve ser consultada durante a especificação, o planejamento e a implementação de funcionalidades que afetem a arquitetura.

A constituição do projeto define os princípios permanentes. Este documento explica a organização arquitetural e as convenções compartilhadas. As especificações de cada funcionalidade definem seus requisitos particulares.

Antes de propor uma alteração arquitetural, o agente deve identificar a necessidade concreta, considerar o impacto nas funcionalidades existentes e explicar as mudanças relevantes.

As instruções do GitHub Copilot devem orientar explicitamente o agente a consultar `architecture.md` e a feature `service` antes de implementar novos CRUDs.
