# Solicitação de Suporte - Captura de Localização Geográfica no WhatsApp Flow

## Contexto do Projeto

Estamos desenvolvendo uma solução de agendamento para barbearias utilizando o **WhatsApp Flow** (versão 3.0). O sistema permite que clientes agendem horários diretamente pelo WhatsApp, proporcionando uma experiência fluida e integrada.

## Problema Identificado

Atualmente, não conseguimos capturar a **localização geográfica real** (cidade/região) dos usuários que acessam nosso Flow. Isso é crítico para nossa análise de KPIs e entendimento do mercado.

### Situação Atual

1. **Requisições via Proxy**: Todas as requisições do WhatsApp Flow chegam através dos servidores da Meta/WhatsApp, não diretamente do dispositivo do cliente.

2. **IP Capturado é do Servidor**: Quando tentamos obter o IP do cliente através dos headers HTTP (`x-forwarded-for`, `x-real-ip`, `req.ip`), recebemos o IP do servidor da Meta ou do nosso provedor de hospedagem (Railway), não o IP real do dispositivo do usuário.

3. **Exemplo do Problema**: 
   - Cliente está em São Paulo, Brasil
   - IP capturado: Hillsboro, Oregon (servidor da infraestrutura)
   - Localização exibida: incorreta

### Impacto no Negócio

A localização geográfica é essencial para:
- **Análise de Mercado**: Entender de quais cidades/regiões nossos clientes estão acessando
- **KPIs Operacionais**: Medir alcance geográfico do serviço
- **Estratégia Comercial**: Identificar oportunidades de expansão
- **Otimização de Recursos**: Focar marketing em regiões com maior demanda

## O Que Precisamos

Gostaríamos de saber se existe alguma forma de obter a **localização geográfica real** (cidade/região) dos usuários que acessam nosso WhatsApp Flow. Especificamente:

1. **Dados de Localização no Payload**: Existe algum campo no payload do Flow que contenha informações de localização do usuário?

2. **Headers HTTP Adicionais**: A Meta envia algum header HTTP especial que contenha o IP real do cliente ou informações de localização?

3. **API de Geolocalização**: Existe alguma API ou endpoint da Meta que forneça a localização baseada no número de telefone ou ID do usuário?

4. **Permissões do Flow**: Podemos solicitar permissão de localização dentro do próprio Flow (similar ao que existe em outras plataformas)?

5. **Webhook com Dados de Localização**: Os webhooks do WhatsApp Business API incluem informações de localização do usuário?

## Informações Técnicas

- **Plataforma**: WhatsApp Business API
- **Flow Version**: 3.0
- **Tipo de Requisição**: `data_exchange` (criptografado)
- **Headers Disponíveis**: `x-forwarded-for`, `x-real-ip`, `x-railway-edge`, `x-railway-request-id`
- **Ambiente**: Produção (Railway hosting)

## Tentativas Realizadas

Já tentamos as seguintes abordagens (sem sucesso):

1. ✅ Extrair IP de `x-forwarded-for` (retorna IP do servidor)
2. ✅ Extrair IP de `x-real-ip` (retorna IP do servidor)
3. ✅ Usar `req.ip` do Express (retorna IP do servidor)
4. ✅ Geolocalização por IP (IP capturado é de infraestrutura, não do cliente)
5. ✅ Analisar payload do Flow (não contém dados de localização)

## Possíveis Soluções que Gostaríamos de Explorar

1. **Campo de Localização no Payload**: Se a Meta pudesse incluir um campo `user_location` ou similar no payload do Flow com dados de localização do usuário.

2. **Header Especial**: Um header HTTP específico como `x-whatsapp-user-location` ou `x-meta-user-location` com informações de localização.

3. **API de Consulta**: Uma API que permita consultar a localização do usuário usando o `wa_id` (WhatsApp ID) ou número de telefone.

4. **Permissão no Flow**: Capacidade de solicitar permissão de localização dentro do próprio Flow, similar ao que existe em outras plataformas de mensageria.

5. **Webhook com Metadata**: Incluir dados de localização nos webhooks de status/mensagens do WhatsApp Business API.

## Exemplo de Dados Necessários

Idealmente, gostaríamos de receber dados no seguinte formato:

```json
{
  "location": {
    "city": "São Paulo",
    "region": "SP",
    "country": "Brasil",
    "countryCode": "BR",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "timezone": "America/Sao_Paulo"
  }
}
```

Ou pelo menos:
```json
{
  "location": {
    "city": "São Paulo",
    "region": "SP",
    "country": "Brasil"
  }
}
```

## Privacidade e Conformidade

Entendemos que dados de localização são sensíveis. Estamos comprometidos com:
- ✅ LGPD (Lei Geral de Proteção de Dados)
- ✅ Privacidade do usuário
- ✅ Uso apenas para análise de KPIs e otimização do serviço
- ✅ Não compartilhamento com terceiros

Se necessário, podemos solicitar consentimento explícito do usuário antes de capturar a localização.

## Próximos Passos

Gostaríamos muito de:
1. Entender se existe alguma solução disponível atualmente
2. Saber se há planos para incluir essa funcionalidade em futuras versões
3. Receber orientação sobre a melhor forma de implementar isso
4. Ser informados sobre qualquer limitação técnica ou de privacidade

## Contato

Estamos à disposição para fornecer mais informações técnicas, exemplos de código, ou qualquer outro detalhe que possa ajudar a entender melhor nossa necessidade.

---

**Observação**: Esta é uma funcionalidade crítica para nosso negócio e análise de dados. Qualquer orientação ou solução que a Meta possa oferecer será extremamente valiosa.


