# Solicitação Rápida - Localização no WhatsApp Flow

Olá, equipe de suporte da Meta!

Estou desenvolvendo uma solução de agendamento usando **WhatsApp Flow v3.0** e preciso de ajuda para capturar a **localização geográfica** (cidade/região) dos usuários que acessam o Flow.

## Problema

Não conseguimos obter o IP real do cliente porque todas as requisições chegam através dos servidores da Meta. Quando tentamos capturar o IP, recebemos o IP do servidor (ex: Hillsboro, Oregon), não a localização real do usuário (ex: São Paulo, Brasil).

## O Que Precisamos

Existe alguma forma de obter a localização geográfica dos usuários no WhatsApp Flow? Por exemplo:

1. **Campo no payload do Flow** com dados de localização?
2. **Header HTTP especial** com IP real ou localização?
3. **API para consultar localização** usando o `wa_id`?
4. **Permissão de localização** dentro do Flow?
5. **Dados de localização nos webhooks** do WhatsApp Business API?

## Por Que É Importante

Precisamos dessa informação para:
- Análise de KPIs (de quais cidades nossos clientes estão acessando)
- Estratégia comercial (identificar oportunidades de expansão)
- Otimização de recursos (focar marketing em regiões com maior demanda)

## Informações Técnicas

- **Plataforma**: WhatsApp Business API
- **Flow Version**: 3.0
- **Tipo**: `data_exchange` (criptografado)
- **Headers testados**: `x-forwarded-for`, `x-real-ip`, `req.ip` (todos retornam IP do servidor)

## Exemplo de Dados Necessários

```json
{
  "location": {
    "city": "São Paulo",
    "region": "SP", 
    "country": "Brasil"
  }
}
```

Estamos comprometidos com privacidade (LGPD) e usaríamos apenas para análise interna.

Agradeço qualquer orientação ou solução que possam oferecer!


