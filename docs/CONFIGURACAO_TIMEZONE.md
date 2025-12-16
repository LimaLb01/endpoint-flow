# 🕐 Configuração de Timezone

## Problema

Quando você marca um agendamento para uma data/hora específica (ex: 19/12/2025 às 09:00), o evento pode ser criado no Google Calendar com data/hora incorreta devido a problemas de timezone.

## Solução

### 1. Variável de Ambiente TZ no Railway

O Railway precisa saber qual timezone usar. Adicione a variável de ambiente `TZ`:

**No Railway Dashboard:**
1. Acesse seu projeto no Railway
2. Vá em **Variables**
3. Adicione uma nova variável:
   - **Nome:** `TZ`
   - **Valor:** `America/Sao_Paulo`
4. Clique em **Add**

**Ou via Railway CLI:**
```bash
railway variables set TZ=America/Sao_Paulo
```

### 2. Correções no Código

O código foi atualizado para:

1. **Usar formato RFC3339 com offset explícito** ao criar eventos no Google Calendar:
   - Formato: `YYYY-MM-DDTHH:MM:SS-03:00`
   - Exemplo: `2025-12-19T09:00:00-03:00`
   - Isso garante que o Google Calendar interprete corretamente o horário de São Paulo

2. **Calcular datas mínimas/máximas usando timezone de São Paulo**:
   - Usa `Intl.DateTimeFormat` com `timeZone: 'America/Sao_Paulo'`
   - Garante que "hoje" seja calculado corretamente no horário brasileiro

### 3. Verificação

Após configurar, teste criando um agendamento e verifique:

1. ✅ A data/hora no Google Calendar está correta
2. ✅ O evento aparece no dia e horário esperados
3. ✅ Não há diferença de 1 dia ou algumas horas

## Notas Importantes

- **Brasil não usa mais horário de verão** desde 2019, então o offset é sempre `-03:00` (UTC-3)
- O timezone `America/Sao_Paulo` cobre todo o Brasil (horário de Brasília)
- A variável `TZ` afeta como o Node.js interpreta datas/horas no servidor

## Troubleshooting

Se ainda houver problemas:

1. Verifique se a variável `TZ` está configurada no Railway
2. Verifique os logs do Railway para ver as datas sendo enviadas ao Google Calendar
3. Confirme que o formato está como `YYYY-MM-DDTHH:MM:SS-03:00`
4. Verifique as configurações do Google Calendar para garantir que está usando o timezone correto

