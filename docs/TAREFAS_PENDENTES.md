# Tarefas Pendentes - Projeto Endpoint Flow

Este documento lista as tarefas pendentes e melhorias futuras para o projeto.

---

## 📅 Agendamento de Horário no WhatsApp Flow

### Descrição
Implementar funcionalidade de agendamento de horário diretamente pelo WhatsApp Flow, considerando as **3 filiais da Code Identidade Masculina**.

### Filiais da Code
1. **Desvio Rizzo** (`desvio_rizzo`)
   - Endereço: Rua Nilceu de Melo Catarina, 2791
   - Barbeiros: Emanoel Pires, Mairon de Oliveira, Eduardo Salas Soares

2. **Exposição** (`exposicao`)
   - Endereço: Rua Tronca, 1968
   - Barbeiros: William Huff, Vinícius Branchieri, Elivelton Pedroso, Claire Borges, Rosane Maciel

3. **Santa Catarina** (`santa_catarina`)
   - Endereço: Rua Matteo Gianella, 1068
   - Barbeiros: Laura Gasparini, Guilherme Machado, Robson Rangel, Lourenço da Silva, Henrique Santos

### Requisitos
- [ ] Integrar agendamento de horário no fluxo do WhatsApp Flow
- [ ] Adicionar tela de seleção de filial no Flow (antes da seleção de barbeiro)
- [ ] Permitir seleção de filial (3 filiais da Code)
- [ ] Exibir horários disponíveis por filial e barbeiro
- [ ] Validar disponibilidade em tempo real consultando Google Calendar
- [ ] Sincronizar com Google Calendar de cada filial/barbeiro
- [ ] Enviar confirmação de agendamento via WhatsApp
- [ ] Atualizar painel administrativo com novos agendamentos automaticamente
- [ ] Considerar timezone e horário de funcionamento de cada filial

### Contexto Técnico
- O projeto já possui integração com Google Calendar (`src/services/calendar-service.js`)
- Existem 3 filiais configuradas em `src/config/branches.js`
- O WhatsApp Flow já está implementado para outras funcionalidades
- O painel administrativo já possui página de agendamentos (`painel-admin/src/pages/Agendamentos.jsx`)
- Cada filial possui múltiplos barbeiros configurados

### Fluxo Sugerido no WhatsApp Flow
1. **WELCOME** - Tela inicial
2. **SERVICE_SELECTION** - Seleção do serviço
3. **BRANCH_SELECTION** - Seleção da filial (NOVO)
4. **BARBER_SELECTION** - Seleção do barbeiro (filtrar por filial selecionada)
5. **DATE_SELECTION** - Seleção da data
6. **TIME_SELECTION** - Seleção do horário (consultar disponibilidade do barbeiro na filial)
7. **DETAILS** - Coleta de dados do cliente
8. **CONFIRMATION** - Confirmação final

### Prioridade
**Média** - Funcionalidade importante, mas pode ser implementada após melhorias atuais do painel administrativo

### Observações
- Verificar estrutura atual das filiais em `src/config/branches.js`
- Cada filial pode ter calendário Google separado ou usar calendários individuais por barbeiro
- Implementar validação de conflitos de horário
- Considerar horários de funcionamento diferentes por filial
- Validar se cada barbeiro possui calendário Google próprio ou se é compartilhado por filial

---

## 📝 Notas
- Este arquivo será atualizado conforme novas tarefas forem identificadas
- Tarefas concluídas devem ser movidas para histórico ou removidas

