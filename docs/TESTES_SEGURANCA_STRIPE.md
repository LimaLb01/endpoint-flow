# Testes de Segurança - Stripe Connect

Este documento descreve os testes de segurança implementados e recomendações para validação do sistema Stripe Connect.

## ✅ Implementações de Segurança

### 1. Validação de Assinatura de Webhook (T9.1) ✅

**Status:** Implementado

**Localização:** `src/routes/stripe-routes.js`

**Implementação:**
- Validação obrigatória da assinatura Stripe usando `stripe.webhooks.constructEvent()`
- Rejeição de requisições sem assinatura
- Logs detalhados de tentativas de webhook inválidas

**Teste Manual:**
```bash
# Teste 1: Webhook sem assinatura (deve falhar)
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
# Esperado: 400 - "Assinatura do webhook não fornecida"

# Teste 2: Webhook com assinatura inválida (deve falhar)
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid_signature" \
  -d '{"type": "test"}'
# Esperado: 400 - "Webhook Error: ..."
```

### 2. Variáveis de Ambiente (T9.2) ✅

**Status:** Implementado

**Variáveis Obrigatórias:**
- `STRIPE_SECRET_KEY` - Chave secreta da API Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret para validação de webhooks
- `DAYS_TO_SUSPEND_BARBERSHOP` - Dias para suspender após falha (opcional, padrão: 7)

**Validação:**
- Verificação de configuração antes de processar webhooks
- Logs de erro quando variáveis não estão configuradas

**Teste:**
```bash
# Remover STRIPE_WEBHOOK_SECRET do .env
# Tentar receber webhook
# Esperado: 503 - "Stripe não configurado"
```

### 3. Logs de Eventos Críticos (T9.3) ✅

**Status:** Implementado

**Eventos com Logs de Segurança:**
- `checkout.session.completed` - Pagamento concluído
- `customer.subscription.deleted` - Assinatura cancelada
- `invoice.payment_failed` - Falha de pagamento
- `account.updated` - Atualização de conta Connect

**Informações Registradas:**
- Tipo de evento
- ID do evento
- Timestamp
- IP do remetente (para webhooks)
- User-Agent (para webhooks)
- Detalhes de erros com stack trace

**Localização dos Logs:**
- `src/services/stripe-service.js` - Função `handleWebhookEvent()`
- `src/routes/stripe-routes.js` - Validação de assinatura

### 4. Testes de Segurança (T9.4) ✅

**Status:** Documentado (testes manuais)

## 📋 Checklist de Segurança

### Configuração
- [x] Variáveis de ambiente não expostas no código
- [x] Validação de assinatura de webhook implementada
- [x] Logs de eventos críticos implementados
- [x] Tratamento de erros sem expor informações sensíveis

### Webhooks
- [x] Validação obrigatória de assinatura
- [x] Rejeição de requisições sem assinatura
- [x] Logs de tentativas inválidas
- [x] Uso de `express.raw()` para preservar body original

### Dados Sensíveis
- [x] Nenhum dado de cartão armazenado localmente
- [x] Redirecionamento seguro para Stripe Checkout
- [x] Uso de Stripe Customer Portal para gerenciamento
- [x] Aplicação de taxas via `application_fee_percent` (não toca no dinheiro)

## 🔒 Recomendações Adicionais

### 1. Rate Limiting
**Recomendação:** Implementar rate limiting no endpoint de webhook para prevenir ataques de força bruta.

**Exemplo:**
```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requisições por IP
});

router.post('/stripe', webhookLimiter, express.raw({ type: 'application/json' }), ...);
```

### 2. Validação de IP (Opcional)
**Recomendação:** Validar IPs de origem dos webhooks do Stripe (lista de IPs do Stripe disponível).

**Nota:** Não recomendado para Railway/cloud, pois IPs podem mudar.

### 3. Idempotência
**Status:** Parcialmente implementado (Stripe garante idempotência via event.id)

**Recomendação:** Implementar cache de eventos processados para evitar processamento duplicado.

### 4. Monitoramento
**Recomendação:** 
- Configurar alertas para webhooks com assinatura inválida
- Monitorar taxa de falhas de pagamento
- Alertar sobre suspensões de barbearias

### 5. Testes Automatizados
**Recomendação:** Criar testes automatizados usando Stripe CLI:

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Testar webhook localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Disparar evento de teste
stripe trigger checkout.session.completed
```

## 🧪 Testes com Stripe CLI

### 1. Testar Validação de Assinatura
```bash
# Terminal 1: Escutar webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Disparar evento
stripe trigger checkout.session.completed
```

### 2. Testar Falha de Pagamento
```bash
stripe trigger invoice.payment_failed
```

### 3. Testar Cancelamento de Assinatura
```bash
stripe trigger customer.subscription.deleted
```

### 4. Testar Atualização de Conta Connect
```bash
stripe trigger account.updated
```

## 📊 Métricas de Segurança

### Logs a Monitorar:
1. **Tentativas de webhook inválidas**
   - Frequência
   - IPs de origem
   - Padrões suspeitos

2. **Falhas de pagamento**
   - Taxa de falhas
   - Barbearias afetadas
   - Tendências temporais

3. **Suspensões automáticas**
   - Quantidade de suspensões
   - Tempo médio até suspensão
   - Taxa de reativação

## ✅ Conclusão

A Fase 9 (Segurança e Validações) está **implementada** com:
- ✅ Validação de assinatura de webhook
- ✅ Uso de variáveis de ambiente
- ✅ Logs de eventos críticos
- ✅ Documentação de testes de segurança

**Próximos passos recomendados:**
- Implementar rate limiting (opcional)
- Configurar monitoramento e alertas
- Criar testes automatizados com Stripe CLI

