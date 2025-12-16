# Sugestões para Implementação do Clube CODE

## Contexto
Quando o cliente não possui plano ativo, o sistema oferece a opção de fazer parte do Clube CODE para ter acesso a preços especiais.

## Opções de Implementação

### Opção 1: Apenas Informativa (Implementação Atual)
**Como funciona:**
- Cliente escolhe se quer ser do clube ou não
- Se escolher "Sim", recebe preços de membro do clube
- Se escolher "Não", continua com valores regulares
- **Não há integração real** - é apenas uma escolha do cliente no momento do agendamento

**Vantagens:**
- Implementação simples e rápida
- Não requer integração com sistema externo
- Cliente decide no momento do agendamento

**Desvantagens:**
- Não há controle real de quem é membro do clube
- Pode ser abusado (qualquer um pode escolher ser do clube)
- Não há histórico de membros

**Recomendação:** Usar temporariamente até implementar sistema real de membros

---

### Opção 2: Integração com Sistema de Membros (Recomendado)
**Como funciona:**
- Cliente escolhe se quer ser do clube
- Se escolher "Sim", sistema registra interesse em ser membro
- Envia dados (CPF, nome, telefone) para sistema de gestão
- Sistema de gestão processa adesão e retorna status
- Cliente recebe confirmação de adesão via WhatsApp

**Vantagens:**
- Controle real de membros
- Integração com sistema de gestão
- Histórico de adesões
- Possibilidade de cobrança/processamento de pagamento

**Desvantagens:**
- Requer integração com API externa
- Processo mais complexo
- Pode haver delay na confirmação

**Implementação sugerida:**
```javascript
// Em club-handler.js
async function handleClubOption(payload) {
  const { client_cpf, wants_club } = payload;
  
  if (wants_club === true || wants_club === 'true') {
    // Chamar API de adesão ao clube
    const clubResponse = await registerClubMember({
      cpf: client_cpf,
      // outros dados do cliente
    });
    
    if (clubResponse.success) {
      return {
        version: '3.0',
        screen: 'BRANCH_SELECTION',
        data: {
          client_cpf,
          has_plan: false,
          is_club_member: true,
          club_member_id: clubResponse.memberId,
          branches: getBranchesForFlow()
        }
      };
    } else {
      // Se falhar, mostrar erro ou continuar sem clube
      return {
        version: '3.0',
        screen: 'CLUB_OPTION',
        data: {
          error: true,
          error_message: 'Não foi possível processar sua adesão. Tente novamente ou continue sem clube.'
        }
      };
    }
  }
  
  // Se não quer clube, continua normalmente
  return {
    version: '3.0',
    screen: 'BRANCH_SELECTION',
    data: {
      client_cpf,
      has_plan: false,
      is_club_member: false,
      branches: getBranchesForFlow()
    }
  };
}
```

---

### Opção 3: Adesão com Pagamento
**Como funciona:**
- Cliente escolhe ser do clube
- Sistema redireciona para página de pagamento ou integração com gateway
- Após pagamento confirmado, cliente recebe status de membro
- Próximos agendamentos já reconhecem como membro

**Vantagens:**
- Monetização direta
- Controle de pagamentos
- Membros reais e pagantes

**Desvantagens:**
- Requer integração com gateway de pagamento
- Processo mais longo
- Pode reduzir conversão

**Recomendação:** Implementar após validar interesse com Opção 1 ou 2

---

### Opção 4: Adesão Manual (Híbrida)
**Como funciona:**
- Cliente escolhe ser do clube
- Sistema registra interesse e envia notificação para equipe
- Equipe entra em contato com cliente para finalizar adesão
- Após adesão confirmada manualmente, cliente recebe status de membro

**Vantagens:**
- Controle humano sobre adesões
- Possibilidade de personalizar ofertas
- Não requer integração técnica complexa

**Desvantagens:**
- Processo manual pode ser lento
- Requer acompanhamento da equipe
- Não é automático

**Implementação sugerida:**
```javascript
// Enviar notificação para equipe (email, WhatsApp Business API, etc)
await sendClubInterestNotification({
  cpf: client_cpf,
  name: client_name,
  phone: client_phone,
  timestamp: new Date().toISOString()
});
```

---

## Recomendação Final

**Fase 1 (Atual):** Implementação informativa - cliente escolhe ser do clube e recebe preços especiais no agendamento atual.

**Fase 2 (Próxima):** Integrar com sistema de gestão para registrar interesse e processar adesões.

**Fase 3 (Futuro):** Implementar sistema de pagamento para adesões automáticas.

---

## Perguntas para Decisão

1. **Existe um sistema de gestão de membros do clube?**
   - Se sim, qual a API/disponibilidade para integração?

2. **Como funciona a adesão ao clube atualmente?**
   - Presencial? Online? Por telefone?

3. **Há cobrança para adesão ao clube?**
   - Se sim, qual o valor e forma de pagamento?

4. **Qual o processo de validação de membros?**
   - Como verificar se alguém é realmente membro?

5. **Há limite de membros ou lista de espera?**
   - Quantos membros o clube suporta?

---

## Notas Técnicas

- O campo `is_club_member` está sendo passado através de todo o fluxo
- Os preços são calculados dinamicamente baseados em `has_plan` e `is_club_member`
- Serviços exclusivos do clube (`showForClub: true`) só aparecem para membros
- O CPF é coletado no início e pode ser usado para verificação futura

