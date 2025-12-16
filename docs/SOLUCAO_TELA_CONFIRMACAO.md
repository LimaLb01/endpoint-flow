# ✅ Solução: Tela de Confirmação - WhatsApp Flow

## 📚 Baseado na Documentação Oficial

Esta solução é baseada no exemplo oficial **Pre-Approved Loan** da documentação do WhatsApp Flow, que demonstra a forma correta de criar telas de confirmação.

---

## 🎯 Princípios Fundamentais

### 1. **A tela de confirmação NÃO deve ser terminal**
- `terminal: false` (ou omitir, pois false é o padrão)
- Permite que o usuário veja os dados antes de finalizar

### 2. **Dados vêm do endpoint via `data_exchange` response**
- O endpoint retorna `screen: "CONFIRMATION"` com `data: { ... }`
- Os dados são aplicados automaticamente na tela

### 3. **Use Form component para envolver os elementos**
- Todos os elementos de texto devem estar dentro de um `Form`
- Isso garante que os dados sejam aplicados corretamente

### 4. **Exiba dados usando `${data.field_name}`**
- Use referências diretas: `${data.booking_id}`, `${data.service_name}`, etc.
- Não dependa de dados de telas anteriores

### 5. **Tela terminal separada para finalizar**
- Após a confirmação, navegue para uma tela terminal (`terminal: true`, `success: true`)
- Use `complete` action na tela terminal

---

## 📋 Estrutura da Tela CONFIRMATION

```json
{
  "id": "CONFIRMATION",
  "title": "Confirmação",
  "terminal": false,
  "data": {
    "booking_id": {
      "type": "string",
      "__example__": "AGD-123456"
    },
    "service_name": {
      "type": "string",
      "__example__": "Corte Masculino"
    },
    "service_price": {
      "type": "string",
      "__example__": "R$ 45"
    },
    "barber_name": {
      "type": "string",
      "__example__": "João Silva"
    },
    "formatted_date": {
      "type": "string",
      "__example__": "17/12/2025 (Quarta)"
    },
    "selected_time": {
      "type": "string",
      "__example__": "14:00"
    },
    "client_name": {
      "type": "string",
      "__example__": "João Cliente"
    },
    "client_phone": {
      "type": "string",
      "__example__": "54992917132"
    },
    "client_email": {
      "type": "string",
      "__example__": "cliente@email.com"
    },
    "notes": {
      "type": "string",
      "__example__": ""
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "Form",
        "name": "confirmation_form",
        "children": [
          {
            "type": "TextHeading",
            "text": "✅ Agendamento confirmado!"
          },
          {
            "type": "TextSubheading",
            "text": "Código: ${data.booking_id}"
          },
          {
            "type": "TextBody",
            "text": "Seu horário está reservado:"
          },
          {
            "type": "TextBody",
            "text": "💈 ${data.service_name}"
          },
          {
            "type": "TextBody",
            "text": "💰 ${data.service_price}"
          },
          {
            "type": "TextBody",
            "text": "✂️ ${data.barber_name}"
          },
          {
            "type": "TextBody",
            "text": "📅 ${data.formatted_date}"
          },
          {
            "type": "TextBody",
            "text": "🕐 ${data.selected_time}"
          },
          {
            "type": "TextBody",
            "text": "👤 ${data.client_name}"
          },
          {
            "type": "TextBody",
            "text": "📞 ${data.client_phone}"
          },
          {
            "type": "TextCaption",
            "text": "📲 Você receberá confirmação e lembrete"
          },
          {
            "type": "TextCaption",
            "text": "⚠️ Para cancelar, informe o código ${data.booking_id}"
          },
          {
            "type": "Footer",
            "label": "Concluir",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "CONFIRMATION_COMPLETE"
              },
              "payload": {
                "booking_id": "${data.booking_id}",
                "status": "confirmed"
              }
            }
          }
        ]
      }
    ]
  }
}
```

---

## 📋 Estrutura da Tela CONFIRMATION_COMPLETE (Terminal)

```json
{
  "id": "CONFIRMATION_COMPLETE",
  "title": "Concluído",
  "terminal": true,
  "success": true,
  "data": {
    "booking_id": {
      "type": "string",
      "__example__": "AGD-123456"
    },
    "status": {
      "type": "string",
      "__example__": "confirmed"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "✅ Agendamento confirmado!"
      },
      {
        "type": "TextBody",
        "text": "Obrigado por agendar conosco!"
      },
      {
        "type": "Footer",
        "label": "Concluir",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "booking_id": "${data.booking_id}",
            "status": "${data.status}"
          }
        }
      }
    ]
  }
}
```

---

## 🔄 Fluxo de Dados

### 1. **Usuário preenche DETAILS e clica em "Revisar agendamento"**
- Flow envia `data_exchange` com `action_type: "SUBMIT_DETAILS"`
- Payload contém todos os dados do formulário

### 2. **Endpoint processa e retorna para CONFIRMATION**
```javascript
return {
  version: '3.0',
  screen: 'CONFIRMATION',
  data: {
    booking_id: 'AGD-123456',
    service_name: 'Corte Masculino',
    service_price: 'R$ 45',
    barber_name: 'João Silva',
    formatted_date: '17/12/2025 (Quarta)',
    selected_time: '14:00',
    client_name: 'João Cliente',
    client_phone: '54992917132',
    client_email: 'cliente@email.com',
    notes: ''
  }
};
```

### 3. **WhatsApp Flow aplica os dados na tela CONFIRMATION**
- Os dados são automaticamente aplicados ao `data` model da tela
- Os placeholders `${data.field}` são resolvidos com os valores reais

### 4. **Usuário vê a confirmação e clica em "Concluir"**
- Flow navega para `CONFIRMATION_COMPLETE` usando `navigate` action
- Payload mínimo é passado (apenas `booking_id` e `status`)

### 5. **Usuário clica em "Concluir" na tela terminal**
- Flow executa `complete` action
- Webhook `nfm_reply` é enviado ao endpoint com todos os dados

---

## ✅ Boas Práticas

### 1. **Data Model Completo**
- Declare TODOS os campos que serão exibidos no `data` model
- Use `__example__` para valores de exemplo (obrigatório)

### 2. **Form Component**
- Sempre envolva elementos de texto em um `Form` component
- Isso garante que os dados sejam aplicados corretamente

### 3. **Referências Diretas**
- Use `${data.field_name}` diretamente
- Não use referências globais como `${screen.DETAILS.data.field}`

### 4. **Separação de Responsabilidades**
- CONFIRMATION: Exibe dados (não terminal)
- CONFIRMATION_COMPLETE: Finaliza flow (terminal com success)

### 5. **Payload Mínimo no Navigate**
- Passe apenas dados essenciais no `navigate` action
- Dados completos já estão na tela via `data` model

---

## 🚨 Erros Comuns a Evitar

### ❌ **Tela terminal como confirmação**
```json
// ERRADO
{
  "id": "CONFIRMATION",
  "terminal": true,  // ❌ Não permite exibir dados corretamente
  "success": true
}
```

### ❌ **Sem Form component**
```json
// ERRADO
{
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextBody",
        "text": "${data.booking_id}"  // ❌ Pode não funcionar sem Form
      }
    ]
  }
}
```

### ❌ **Dependência de dados anteriores**
```json
// ERRADO
{
  "type": "TextBody",
  "text": "${screen.DETAILS.data.booking_id}"  // ❌ Não confiável
}
```

### ❌ **Data model incompleto**
```json
// ERRADO
{
  "data": {
    "booking_id": { "type": "string" }
    // ❌ Faltam outros campos que serão exibidos
  }
}
```

---

## 📝 Checklist de Implementação

- [ ] Tela CONFIRMATION com `terminal: false`
- [ ] Data model completo com todos os campos
- [ ] Form component envolvendo elementos de texto
- [ ] Referências usando `${data.field_name}`
- [ ] Endpoint retorna `screen: "CONFIRMATION"` com `data: { ... }`
- [ ] Tela CONFIRMATION_COMPLETE terminal com `success: true`
- [ ] Navigate action da CONFIRMATION para CONFIRMATION_COMPLETE
- [ ] Complete action na tela terminal

---

## 🎯 Resultado Esperado

Quando implementado corretamente:
1. ✅ Usuário preenche dados na tela DETAILS
2. ✅ Endpoint retorna para CONFIRMATION com todos os dados
3. ✅ Tela CONFIRMATION exibe todos os dados corretamente
4. ✅ Usuário navega para CONFIRMATION_COMPLETE
5. ✅ Flow é finalizado e webhook é enviado

---

## 📚 Referências

- **Documentação Oficial:** `docs_whatsappflow/Guides/Pre-Approved_Loan.md`
- **Flow JSON Reference:** `docs_whatsappflow/Reference/Flow_JSON.md`
- **Endpoints Guide:** `docs_whatsappflow/Guides/Endpoints_flow`

