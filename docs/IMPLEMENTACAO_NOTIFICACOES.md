# 📧📱 Implementação de Notificações

## ✅ Status

**Implementado:** Serviço de notificações criado e integrado nos pontos críticos.

## 📋 O que foi implementado

### 1. Serviço de Notificações (`src/services/notification-service.js`)

**Funções disponíveis:**
- `sendWhatsAppNotification(phoneNumber, message)` - Envia mensagem WhatsApp
- `sendEmailNotification(email, subject, htmlBody)` - Envia email
- `notifyPaymentConfirmed(customer, payment, plan)` - Notifica pagamento confirmado
- `notifySubscriptionExpiring(customer, subscription, plan)` - Notifica vencimento próximo
- `notifySubscriptionCanceled(customer, subscription, plan)` - Notifica cancelamento

### 2. Integrações Implementadas

**✅ Pagamento Manual (Admin)**
- Quando um pagamento manual é registrado via `/api/admin/payments/manual`
- Notifica cliente por WhatsApp e Email

**✅ Webhook Stripe - Checkout Completed**
- Quando um checkout do Stripe é completado
- Notifica cliente sobre pagamento confirmado

**✅ Webhook Stripe - Payment Succeeded**
- Quando uma fatura é paga com sucesso
- Notifica cliente sobre pagamento confirmado

**✅ Cancelamento de Assinatura**
- Quando uma assinatura é cancelada via `/api/admin/subscriptions/:id/cancel`
- Quando uma assinatura é cancelada via webhook do Stripe
- Notifica cliente sobre cancelamento

---

## ⏳ Pendente (Próximos Passos)

### 1. Implementar Envio Real de WhatsApp

**Atual:** Apenas log (simulado)

**Próximo passo:**
- Integrar com WhatsApp Business API
- Usar o mesmo serviço já existente (`whatsapp-service.js`)
- Implementar função `sendWhatsAppMessage()` real

**Exemplo de implementação:**
```javascript
async function sendWhatsAppNotification(phoneNumber, message) {
  try {
    // Formatar número (5511999999999)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Enviar via WhatsApp Business API
    await sendWhatsAppMessage(formattedPhone, message);
    
    return true;
  } catch (error) {
    logger.error('Erro ao enviar WhatsApp', { error: error.message });
    return false;
  }
}
```

### 2. Implementar Envio Real de Email

**Atual:** Apenas log (simulado)

**Opções de serviços de email:**
- **SendGrid** (recomendado - fácil de usar)
- **AWS SES** (econômico)
- **Resend** (moderno e simples)
- **Nodemailer** (SMTP direto)

**Exemplo com SendGrid:**
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmailNotification(email, subject, htmlBody) {
  try {
    await sgMail.send({
      to: email,
      from: 'noreply@barbearia.com',
      subject,
      html: htmlBody
    });
    return true;
  } catch (error) {
    logger.error('Erro ao enviar email', { error: error.message });
    return false;
  }
}
```

### 3. Implementar Notificação de Vencimento

**Atual:** Função criada, mas não chamada automaticamente

**Próximo passo:**
- Criar job/cron para verificar assinaturas próximas do vencimento
- Enviar notificação 7 dias antes do vencimento
- Enviar notificação 1 dia antes do vencimento

**Exemplo de implementação:**
```javascript
// Job diário para verificar vencimentos
async function checkExpiringSubscriptions() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*, customer:customers(*), plan:plans(*)')
    .eq('status', 'active')
    .lte('current_period_end', sevenDaysFromNow.toISOString())
    .gte('current_period_end', new Date().toISOString());
  
  for (const sub of subscriptions) {
    await notifySubscriptionExpiring(sub.customer, sub, sub.plan);
  }
}
```

### 4. Adicionar Templates de Mensagem

**Melhorias:**
- Criar templates reutilizáveis
- Personalizar mensagens por tipo de plano
- Adicionar variáveis dinâmicas
- Suporte a múltiplos idiomas (futuro)

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente

**Para WhatsApp:**
- `WHATSAPP_PHONE_NUMBER_ID` - ID do número do WhatsApp Business
- `WHATSAPP_ACCESS_TOKEN` - Token de acesso (já configurado)

**Para Email (exemplo com SendGrid):**
- `SENDGRID_API_KEY` - Chave API do SendGrid
- `EMAIL_FROM` - Email remetente (ex: noreply@barbearia.com)

**Adicionar ao `env.example`:**
```bash
# Notificações
SENDGRID_API_KEY=sg.xxx
EMAIL_FROM=noreply@barbearia.com
```

---

## 📊 Logs e Monitoramento

**Logs implementados:**
- ✅ Log quando notificação é enviada (simulada)
- ✅ Log de erros ao enviar notificações
- ✅ Log de sucesso/falha por canal (WhatsApp/Email)

**Melhorias futuras:**
- Métricas de taxa de entrega
- Histórico de notificações enviadas
- Retry automático em caso de falha

---

## 🧪 Como Testar

### 1. Testar Notificação de Pagamento

```bash
# Registrar pagamento manual via API
POST /api/admin/payments/manual
Headers: Authorization: Bearer [token]
Body: {
  "cpf": "12345678900",
  "plan_id": "[uuid]",
  "amount": 99.90,
  "payment_date": "2025-12-19T10:00:00Z",
  "confirmed_by": "Teste"
}

# Verificar logs - deve aparecer:
# "Notificação WhatsApp (simulada)"
# "Notificação Email (simulada)"
```

### 2. Testar Notificação de Cancelamento

```bash
# Cancelar assinatura via API
PUT /api/admin/subscriptions/[id]/cancel
Headers: Authorization: Bearer [token]

# Verificar logs - deve aparecer notificações de cancelamento
```

---

## 📝 Notas Importantes

1. **Modo Simulado:** Atualmente, as notificações apenas fazem log. Para ativar envio real, implemente as funções `sendWhatsAppNotification` e `sendEmailNotification`.

2. **Não Bloqueante:** As notificações são enviadas de forma assíncrona e não bloqueiam a resposta da API.

3. **Tolerante a Falhas:** Se uma notificação falhar, não afeta o processamento principal.

4. **Privacidade:** Emails e telefones são mascarados nos logs para privacidade.

---

## 🎯 Próximos Passos Recomendados

1. **Escolher serviço de email** (SendGrid recomendado)
2. **Configurar variáveis de ambiente** no Railway
3. **Implementar envio real de email**
4. **Implementar envio real de WhatsApp** (usar WhatsApp Business API existente)
5. **Criar job para verificar vencimentos** (cron job ou função agendada)
6. **Testar notificações em produção**

---

**Última atualização:** 19/12/2025

