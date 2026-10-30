# Feature Specification: Appointment Calendar

**Feature Branch**: `002-appointment-calendar`
**Created**: 2026-10-28
**Status**: Draft
**Input**: Calendário semanal, diário e mensal de appointments com filtros, criação por slot, detalhes, mudança de status e início de atendimento.

## User Scenarios & Testing

### User Story 1 - Consultar agendamentos no calendário (Priority: P1)

ADMIN consulta os agendamentos do tenant e PROFESSIONAL consulta os próprios agendamentos em um calendário, inicialmente semanal, podendo alternar entre dia e mês e filtrar os resultados.

**Why this priority**: Oferece a visão temporal necessária para planejar e acompanhar a agenda.

**Independent Test**: Consultar intervalos semanais, diários e mensais com usuários de diferentes perfis e confirmar eventos e filtros correspondentes.

**Acceptance Scenarios**:

1. **Given** um usuário autorizado, **When** abre o calendário, **Then** vê a semana atual com os agendamentos que intersectam o intervalo exibido.
2. **Given** a visualização do calendário, **When** seleciona dia ou mês e navega para outro período, **Then** os eventos exibidos correspondem ao novo intervalo.
3. **Given** filtros por profissional, serviço ou status, **When** aplica ou remove filtros, **Then** vê somente os agendamentos correspondentes e autorizados.
4. **Given** agendamentos de outro tenant ou de outro profissional, **When** consulta como PROFESSIONAL, **Then** esses registros não são exibidos.

### User Story 2 - Criar e inspecionar agendamentos (Priority: P2)

O usuário pode iniciar a criação de um agendamento a partir de um horário livre ou abrir os detalhes de um agendamento existente.

**Why this priority**: Permite executar ações da agenda sem perder o contexto temporal.

**Independent Test**: Selecionar um slot e confirmar que o formulário existente recebe o horário; abrir um evento e conferir os detalhes.

**Acceptance Scenarios**:

1. **Given** um slot selecionável, **When** o usuário o aciona, **Then** o formulário existente abre com a data e os horários preenchidos no fuso exibido.
2. **Given** um agendamento, **When** o usuário o seleciona, **Then** os detalhes desse agendamento são apresentados.

### User Story 3 - Atualizar status e iniciar atendimento (Priority: P3)

O usuário pode atualizar o status de um agendamento e iniciar seu atendimento pelos detalhes ou pela tabela de Appointment.

**Why this priority**: Conecta a agenda à execução do serviço mantendo uma única operação de negócio.

**Independent Test**: Alterar status válido e iniciar atendimento por cada ponto de entrada; confirmar que ambos usam as mesmas validações e não criam atendimentos duplicados.

**Acceptance Scenarios**:

1. **Given** os detalhes de um agendamento, **When** o usuário escolhe um status do domínio, **Then** a atualização é validada e refletida na tabela e no calendário.
2. **Given** um agendamento elegível sem atendimento, **When** o usuário inicia o atendimento pelos detalhes ou pela tabela, **Then** um único Attendance é criado e o usuário segue para ele.
3. **Given** um Appointment cancelado ou já associado a Attendance, **When** o usuário tenta iniciar outro atendimento, **Then** a operação é recusada ou abre o atendimento existente, sem duplicação.

### Edge Cases

- Período inválido ou superior ao limite aceito deve ser rejeitado sem consulta ampla.
- Agendamentos que começam antes do intervalo, mas terminam dentro dele, devem aparecer.
- Agendamentos cancelados permanecem visíveis com seu status; a regra existente não os considera conflito e impede iniciar Attendance para eles.
- Falhas de carregamento devem ser apresentadas sem aparentar sucesso; usuário sem sessão ou perfil profissional configurado não pode consultar dados.
- Datas exibidas devem preservar o instante armazenado e respeitar o fuso local da visualização.

## Requirements

### Functional Requirements

- **FR-001**: O calendário MUST mostrar inicialmente a semana atual e permitir visualizações diária e mensal.
- **FR-002**: O calendário MUST consultar agendamentos que intersectam o intervalo visível e validar que o intervalo é crescente e limitado.
- **FR-003**: O sistema MUST filtrar por profissional, serviço e status, mantendo o escopo do tenant; PROFESSIONAL MUST ver somente agendamentos do próprio perfil.
- **FR-004**: A seleção de um slot MUST abrir o formulário existente de Appointment com data e horário preenchidos.
- **FR-005**: A seleção de um agendamento MUST apresentar seus detalhes.
- **FR-006**: A alteração de status MUST aceitar somente valores existentes no domínio e aplicar as regras de Appointment já implementadas.
- **FR-007**: A ação de iniciar Attendance MUST estar disponível nos detalhes e na tabela de Appointment, reutilizar a mesma operação protegida e impedir duplicidade.
- **FR-008**: O sistema MUST rejeitar o início de Attendance para Appointment cancelado, conforme a regra atual, e oferecer o Attendance existente quando aplicável.
- **FR-009**: Consultas e mutações MUST derivar o tenant da sessão no servidor e validar autorização independentemente da interface.

### Key Entities

- **Appointment**: Agendamento com período, status, cliente, profissional, serviço e possível Attendance associado.
- **Attendance**: Atendimento vinculado de forma única a um Appointment.
- **Tenant / Professional**: Definem o escopo de acesso aos agendamentos conforme sessão e papel.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Usuários autorizados conseguem visualizar e navegar entre períodos diário, semanal e mensal com os eventos do intervalo correto.
- **SC-002**: Em até 2 segundos, pelo menos 95% das consultas do calendário retornam eventos e filtros para o período solicitado em condições normais de uso.
- **SC-003**: Nenhum teste de autorização retorna appointments de outro tenant ou fora do escopo de um PROFESSIONAL.
- **SC-004**: Iniciar o atendimento pela tabela ou pelos detalhes resulta em no máximo um Attendance por Appointment.

## Assumptions

- ADMIN pode consultar appointments de todo o tenant; PROFESSIONAL fica restrito ao próprio perfil, conforme os mecanismos existentes.
- O calendário apresenta os horários no fuso local do usuário, preservando os instantes armazenados.
- Os status disponíveis são os valores existentes do enum. O código atual valida o enum, mas não define uma máquina de transições mais restritiva; a feature preservará esse comportamento.
- A criação, edição, conflito de horários e integridade de Attendance continuam sob as operações e regras existentes, sem criar políticas adicionais.
- A Etapa 1 entrega consulta, filtros, visualizações e renderização; criação por slot, detalhes, mudança de status e início de Attendance ficam para as etapas seguintes.
