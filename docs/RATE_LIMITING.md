# Rate Limiting - Documentação

## Visão Geral

O sistema implementa rate limiting em múltiplas camadas para proteger contra abuso e ataques DDoS:

1. **Rate Limiting por IP**: Proteção geral contra requisições excessivas
2. **Rate Limiting por Número de WhatsApp**: Proteção específica por usuário
3. **Rate Limiting para Endpoints Críticos**: Limites mais restritivos para operações sensíveis

## Configuração

### Limites Aplicados

| Tipo | Limite | Janela de Tempo | Aplicado em |
|------|--------|-----------------|-------------|
| Geral por IP | 100 requisições | 15 minutos | Todas as rotas (exceto health checks) |
| Por Número WhatsApp | 20 requisições | 15 minutos | Webhook do WhatsApp Flow |
| Endpoints Críticos | 10 requisições | 15 minutos | Operações sensíveis (ex: criação de agendamento) |

### Endpoints Excluídos

Os seguintes endpoints **não** têm rate limiting aplicado:
- `GET /` - Health check básico
- `GET /health` - Health check detalhado
- `POST /webhook/whatsapp-flow` com `action: 'ping'` - Health check do WhatsApp

## Comportamento

### Quando o Rate Limit é Excedido

1. **Status HTTP**: `429 Too Many Requests`
2. **Resposta JSON**:
   ```json
   {
     "error": true,
     "error_message": "Muitas requisições. Tente novamente mais tarde.",
     "retry_after": 900
   }
   ```
3. **Headers HTTP**:
   - `RateLimit-Limit`: Limite máximo de requisições
   - `RateLimit-Remaining`: Requisições restantes
   - `RateLimit-Reset`: Timestamp de quando o limite será resetado

### Logs

Quando o rate limit é excedido, um log de aviso é gerado com:
- IP do cliente
- Número de WhatsApp (mascarado para privacidade)
- Caminho da requisição
- Contagem de requisições

## Implementação Técnica

### Arquivos

- `src/middleware/rate-limit-middleware.js`: Middleware de rate limiting
- `src/index.js`: Aplicação do rate limiting global
- `src/routes/webhook-routes.js`: Rate limiting específico para webhook

### Store em Memória

O rate limiting por número de WhatsApp usa um `Map` em memória. Entradas antigas são limpas automaticamente a cada 5 minutos.

**Nota**: Para ambientes distribuídos (múltiplas instâncias), considere usar Redis para compartilhar o estado do rate limiting entre instâncias.

## Personalização

### Variáveis de Ambiente

Atualmente, os limites são fixos no código. Para tornar configuráveis, adicione variáveis de ambiente:

```env
RATE_LIMIT_IP_MAX=100
RATE_LIMIT_IP_WINDOW_MS=900000
RATE_LIMIT_WHATSAPP_MAX=20
RATE_LIMIT_WHATSAPP_WINDOW_MS=900000
RATE_LIMIT_CRITICAL_MAX=10
RATE_LIMIT_CRITICAL_WINDOW_MS=900000
```

### Ajustar Limites

Edite `src/middleware/rate-limit-middleware.js`:

```javascript
// Rate limiting geral por IP
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de tempo
  max: 100, // Número máximo de requisições
  // ...
});

// Rate limiting por número de WhatsApp
const maxRequests = 20; // Ajustar aqui
const windowMs = 15 * 60 * 1000; // Ajustar aqui
```

## Testes

### Testar Rate Limiting Localmente

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Faça requisições repetidas:
   ```bash
   # Fazer 101 requisições rapidamente
   for i in {1..101}; do
     curl http://localhost:3000/webhook/whatsapp-flow
   done
   ```

3. A 101ª requisição deve retornar `429 Too Many Requests`

### Verificar Headers

```bash
curl -I http://localhost:3000/webhook/whatsapp-flow
```

Deve incluir headers `RateLimit-*` na resposta.

## Monitoramento

### Métricas Recomendadas

- Número de requisições bloqueadas por rate limit
- IPs mais frequentes que atingem o limite
- Números de WhatsApp que atingem o limite
- Tempo médio até reset do limite

### Alertas

Configure alertas para:
- Taxa de requisições bloqueadas > 5% do total
- Mesmo IP bloqueado repetidamente (possível ataque)
- Múltiplos números de WhatsApp bloqueados simultaneamente

## Melhorias Futuras

1. **Redis para Distribuição**: Usar Redis para compartilhar estado entre instâncias
2. **Whitelist/Blacklist**: Permitir/bloquear IPs específicos
3. **Rate Limiting Adaptativo**: Ajustar limites baseado em comportamento
4. **Métricas Detalhadas**: Dashboard com estatísticas de rate limiting
5. **Configuração Dinâmica**: Permitir ajustar limites sem reiniciar o servidor

