# Feature Specification: Client Management

**Feature Branch**: `001-client-management`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Implementar somente o CRUD de clientes (Client), com listagem, pesquisa, paginação, cadastro, edição e exclusão, alinhado ao CRUD de Services e à arquitetura existente; preservar o isolamento por tenant e não incluir funcionalidades de relacionamentos ou outros recursos."

## Clarifications

### Session 2026-10-26

- Q: Quais usuários devem poder listar, cadastrar, editar e excluir clientes dentro da organização autenticada? → A: ADMIN e PROFESSIONAL autenticados podem executar todas as operações do CRUD na própria organização.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar clientes (Priority: P1)

Como usuário autenticado de uma organização, quero consultar, pesquisar e percorrer a lista de clientes da minha organização para localizar rapidamente um cadastro.

**Why this priority**: A consulta é a entrada principal para administrar os clientes e permite localizar registros antes de editá-los ou excluí-los.

**Independent Test**: Cadastrar registros em duas organizações, abrir a lista em uma delas, pesquisar por dados de contato e navegar entre páginas; confirmar que só aparecem clientes da organização autenticada.

**Acceptance Scenarios**:

1. **Given** que a organização possui clientes, **When** o usuário abre Clientes, **Then** vê uma lista paginada somente dos clientes daquela organização, com nome e dados de contato disponíveis.
2. **Given** que há clientes correspondentes em nome, e-mail ou telefone, **When** o usuário pesquisa por um trecho desses dados, **Then** a lista exibe os resultados correspondentes sem diferenciar maiúsculas de minúsculas.
3. **Given** que há mais clientes que o limite de uma página, **When** o usuário avança ou retorna uma página, **Then** vê o conjunto correto de registros e a indicação atualizada da página.
4. **Given** que há clientes na lista, **When** o usuário ordena por nome ou dados de contato, **Then** os registros são exibidos na direção selecionada.
5. **Given** que a busca não encontra correspondências, **When** os resultados são exibidos, **Then** o usuário vê um estado vazio que o orienta a ajustar a busca.
6. **Given** que a organização não possui clientes, **When** o usuário abre a lista, **Then** vê um estado vazio que informa que ainda não há clientes e oferece iniciar um cadastro.
7. **Given** que o usuário não está autenticado, **When** tenta acessar a lista, **Then** não vê dados de clientes.
8. **Given** que o usuário autenticado é ADMIN ou PROFESSIONAL, **When** acessa Clientes, **Then** pode consultar e administrar clientes de sua organização.

---

### User Story 2 - Cadastrar e atualizar clientes (Priority: P1)

Como usuário autenticado de uma organização, quero cadastrar e corrigir os dados de contato de seus clientes para manter a lista útil e atualizada.

**Why this priority**: Cadastrar e manter os dados corretos é o valor central do CRUD e torna os registros utilizáveis na gestão diária.

**Independent Test**: Criar um cliente com nome e sem dados de contato, criar outro com e-mail e telefone, editar seus dados, e confirmar mensagens de sucesso e atualização da lista.

**Acceptance Scenarios**:

1. **Given** que o usuário ADMIN ou PROFESSIONAL iniciou um novo cadastro, **When** informa um nome válido e salva, **Then** o cliente é criado na organização autenticada e aparece na lista.
2. **Given** que e-mail e telefone são opcionais, **When** o usuário cadastra um cliente somente com nome, **Then** o cadastro é aceito.
3. **Given** que o usuário enviou dados inválidos, **When** tenta salvar, **Then** o cadastro não é gravado e os campos inválidos recebem feedback claro.
4. **Given** que o usuário escolhe editar um cliente da lista, **When** altera os dados e salva, **Then** as informações são atualizadas e a lista reflete a mudança.
5. **Given** que uma operação de cadastro ou edição falha, **When** o erro é apresentado, **Then** os dados existentes permanecem íntegros e o usuário recebe feedback de falha.
6. **Given** que o cliente envia um identificador de outra organização junto com um novo cadastro, **When** a operação é autorizada e salva, **Then** o cliente pertence à organização da sessão, não à indicada pelo cliente.
7. **Given** que o usuário tenta editar um cliente de outra organização, **When** envia a alteração, **Then** nenhum dado é revelado ou modificado.

---

### User Story 3 - Excluir clientes (Priority: P2)

Como usuário autenticado de uma organização, quero excluir um cliente que não deve mais constar na lista, confirmando a ação para evitar remoções acidentais.

**Why this priority**: A exclusão completa o CRUD, mas requer confirmação por ser destrutiva e pode ser impedida por registros já vinculados.

**Independent Test**: Solicitar a exclusão de um cliente, cancelar para verificar que permanece, confirmar para verificar remoção e tentar excluir um registro cuja remoção seja impedida por dados existentes.

**Acceptance Scenarios**:

1. **Given** que o usuário iniciou a exclusão de um cliente, **When** cancela a confirmação, **Then** o cliente permanece inalterado.
2. **Given** que o usuário confirmou a exclusão e o cliente pode ser removido, **When** a operação termina com sucesso, **Then** o cliente deixa de aparecer na lista e o usuário recebe feedback de sucesso.
3. **Given** que outros registros existentes impedem a remoção, **When** o usuário confirma a exclusão, **Then** o cliente e os registros vinculados são preservados e o usuário recebe uma mensagem clara de que a exclusão não foi possível.
4. **Given** que a exclusão falha por outro motivo, **When** o erro é apresentado, **Then** o cliente não é removido silenciosamente e o usuário recebe feedback de falha.
5. **Given** que o usuário tenta excluir um cliente de outra organização, **When** confirma a exclusão, **Then** nenhum dado é revelado ou removido.

### Edge Cases

- A busca não encontra resultados, mas há clientes cadastrados.
- A alteração da busca ocorre enquanto o usuário está em uma página posterior; os resultados devem começar pela primeira página correspondente à nova busca.
- A remoção do último registro de uma página deixa a página atual sem itens; a listagem volta à página anterior quando existir e, caso contrário, apresenta o estado vazio.
- Um cadastro não contém e-mail nem telefone, ambos opcionais.
- Um e-mail informado não tem formato válido, ou o nome obrigatório está vazio.
- Um usuário tenta acessar ou alterar um identificador pertencente a outra organização; a operação não revela nem altera o registro.
- Uma exclusão é bloqueada por registros existentes que dependem do cliente; nenhuma exclusão em cascata ou gerenciamento desses registros faz parte desta versão.
- Uma falha de consulta ou mutação deve ser comunicada e permitir recuperação quando aplicável, sem indicar sucesso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O módulo MUST permitir que usuários autenticados com papel ADMIN ou PROFESSIONAL acessem a lista e executem todas as operações de CRUD para clientes da organização associada à sua sessão.
- **FR-002**: A lista MUST apresentar nome e os dados de contato existentes do cliente, permitir ordenação por nome e dados de contato, e incluir paginação com controles para avançar e retornar páginas.
- **FR-003**: O usuário MUST poder pesquisar clientes por trechos de nome, e-mail ou telefone, sem distinção entre maiúsculas e minúsculas.
- **FR-004**: A busca MUST reiniciar a listagem na primeira página e distinguir visualmente uma lista sem cadastros de uma busca sem resultados.
- **FR-005**: O usuário MUST poder cadastrar um cliente com nome obrigatório e e-mail e telefone opcionais.
- **FR-006**: O sistema MUST rejeitar dados inválidos antes de gravá-los, explicar os erros junto aos campos pertinentes e manter os dados existentes quando a operação falhar.
- **FR-007**: O usuário MUST poder editar um cliente de sua organização, visualizar seus dados atuais no formulário e receber feedback explícito de sucesso ou falha.
- **FR-008**: O usuário MUST confirmar uma exclusão antes que ela seja executada e poder cancelá-la sem alterar o cliente.
- **FR-009**: Quando exclusão não for possível por registros existentes que dependem do cliente, o sistema MUST preservar o cliente e esses registros e informar que a operação não foi concluída. Esta versão não inclui gerenciamento de relacionamentos nem exclusões em cascata.
- **FR-010**: Toda consulta, cadastro, edição ou exclusão MUST ser autorizada no servidor e limitada à organização identificada pela sessão autenticada; identificadores e dados enviados pelo cliente MUST NOT definir o tenant confiável.
- **FR-011**: O módulo MUST manter os padrões funcionais e visuais estabelecidos no CRUD de Services, incluindo uso da DataTable genérica já compartilhada; MUST NOT duplicar componentes compartilhados nem introduzir abstrações sem benefício concreto.
- **FR-012**: Falhas de listagem e mutação MUST ser comunicadas com feedback compreensível; a interface MUST distinguir carregamento, erro, ausência de dados e sucesso da operação.
- **FR-013**: A primeira versão MUST limitar-se ao CRUD de clientes e à busca, paginação e ordenação da listagem. MUST NOT incluir funcionalidades de relacionamento com agendamentos, profissionais ou serviços, nem funcionalidades adicionais fora deste escopo.

### Key Entities *(include if feature involves data)*

- **Cliente**: Pessoa cadastrada por uma organização. Possui nome obrigatório e e-mail e telefone opcionais para contato. A separação por organização controla quais usuários podem consultar e administrar cada cliente.
- **Organização (tenant)**: Contexto de isolamento que determina a coleção de clientes acessível ao usuário autenticado. O contexto autorizado vem da sessão, não de dados fornecidos pelo usuário na operação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em uma lista de até 1.000 clientes da mesma organização, pelo menos 95% das pesquisas apresentam os resultados correspondentes em até 2 segundos em condições normais de uso.
- **SC-002**: 100% das operações de listagem e mutação são restritas à organização da sessão; tentativas de acessar registros de outra organização não exibem, modificam ou excluem esses registros.
- **SC-003**: Usuários conseguem concluir cadastro e edição de clientes com dados válidos, e cada operação concluída aparece na lista sem recarregamento manual da página.
- **SC-004**: Em 100% das tentativas de exclusão, o usuário pode cancelar antes da remoção; quando a remoção é impedida, o cliente e os registros relacionados permanecem intactos e o motivo é comunicado.

## Assumptions

- Os dados básicos de cliente são nome, e-mail e telefone; e-mail e telefone são opcionais, conforme os dados de cliente já existentes no projeto.
- Para manter consistência com a listagem de Services, a página exibe inicialmente até 10 clientes por vez e permite ordenação por nome e dados de contato.
- A pesquisa abrange nome, e-mail e telefone e utiliza correspondência parcial sem distinção de maiúsculas e minúsculas.
- ADMIN e PROFESSIONAL possuem as mesmas permissões para este CRUD; o usuário já está autenticado e possui uma organização associada à sessão, cujo contexto é reutilizado.
- A interface segue os padrões de interação e apresentação existentes no CRUD de Services e as convenções de componentes compartilhados do projeto. Esta especificação não prescreve uma nova estrutura de arquivos ou camadas.
- O banco pode conter registros que referenciam clientes. Esta versão não gerencia tais vínculos; se eles impedirem a exclusão, a operação é recusada sem apagar dados relacionados.
- Regras de unicidade de e-mail ou telefone não são acrescentadas nesta versão, pois não foram estabelecidas como requisito.
- A métrica de tempo de pesquisa considera condições normais de uso e até 1.000 clientes no escopo da organização.
