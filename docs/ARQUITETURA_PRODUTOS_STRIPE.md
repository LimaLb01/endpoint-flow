# Arquitetura: Criação de Produtos no Stripe

**Data:** 06/01/2026  
**Status:** ✅ Implementado

---

## ❓ Pergunta do Cliente

> "Quando eu for vender para a Code, tem que ser o Dashboard do Stripe da Code que vai criar esses produtos? E dai o cliente vai ter que fazer que ir lá criar os produtos e copiar o ID?"

---

## ✅ Resposta: NÃO!

### ❌ O que NÃO deve acontecer:

1. **Cliente NÃO acessa Stripe Dashboard**
2. **Cliente NÃO cria produtos manualmente**
3. **Cliente NÃO copia Price IDs**

### ✅ O que DEVE acontecer:

1. **Plataforma cria produtos automaticamente via API**
2. **Cliente apenas gerencia planos no painel admin**
3. **Tudo é automático e transparente**

---

## 🏗️ Arquitetura Implementada

### Modelo Marketplace com Stripe Connect

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATAFORMA (FlowBrasil)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Painel Admin (React)                         │  │
│  │  - Criar/Editar Planos                               │  │
│  │  - Gerenciar Assinaturas                              │  │
│  │  - Ver Pagamentos                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Backend API (Node.js/Express)                │  │
│  │  - plans-service.js                                   │  │
│  │  - stripe-products-service.js (NOVO)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Stripe API                                    │  │
│  │  - Criar Produto (prod_xxx)                          │  │
│  │  - Criar Preço (price_xxx)                           │  │
│  │  - Associar à Conta Connect (se necessário)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              BARBEARIA (Code Identidade Masculina)           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Conta Stripe Connect (Express)                 │  │
│  │  - Recebe pagamentos diretamente                     │  │
│  │  - Plataforma cobra taxa (application_fee)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Automático

### 1. Admin da Plataforma Cria Plano

```
Admin → Painel Admin → "Novo Plano"
  ↓
Preenche: Nome, Tipo, Preço, Descrição
  ↓
Clica "Criar Plano"
  ↓
Backend cria plano no banco
  ↓
Backend cria produto no Stripe automaticamente
  ↓
Backend cria preço no Stripe automaticamente
  ↓
Backend associa price_id ao plano
  ↓
✅ Plano pronto para uso!
```

### 2. Cliente (Barbearia) Usa o Plano

```
Cliente → Painel Admin → "Pagamentos"
  ↓
Clica "Criar Assinatura"
  ↓
Seleciona plano (já tem price_id configurado)
  ↓
Redireciona para Stripe Checkout
  ↓
Completa pagamento
  ↓
✅ Assinatura criada automaticamente!
```

---

## 📋 Onde os Produtos São Criados?

### Opção 1: Conta Principal da Plataforma (Recomendado)

- ✅ **Produtos criados na conta principal do Stripe**
- ✅ **Usados por todas as barbearias**
- ✅ **Mais simples de gerenciar**
- ✅ **Ideal para planos padronizados**

**Quando usar:**
- Planos são os mesmos para todas as barbearias
- Plataforma quer controlar os produtos
- Facilita gestão centralizada

### Opção 2: Conta Connect de Cada Barbearia

- ⚠️ **Produtos criados na conta Connect de cada barbearia**
- ⚠️ **Cada barbearia tem seus próprios produtos**
- ⚠️ **Mais complexo de gerenciar**
- ⚠️ **Ideal para planos personalizados por barbearia**

**Quando usar:**
- Cada barbearia tem planos diferentes
- Barbearias querem controlar seus próprios produtos
- Necessário para casos específicos

---

## 🎯 Implementação Atual

### ✅ O que está implementado:

1. **Serviço de Produtos Stripe** (`stripe-products-service.js`)
   - `createProduct()` - Cria produto no Stripe
   - `createPrice()` - Cria preço no Stripe
   - `createProductAndPriceFromPlan()` - Cria produto e preço automaticamente

2. **Integração Automática** (`plans-service.js`)
   - Ao criar plano, cria produto/preço no Stripe automaticamente
   - Associa `stripe_price_id` ao plano
   - Se falhar, plano é criado sem `stripe_price_id` (pode configurar depois)

3. **Fallback Manual**
   - Se Stripe não estiver configurado, pode criar plano sem `stripe_price_id`
   - Admin pode adicionar `stripe_price_id` manualmente depois
   - Campo "Stripe Price ID" disponível no formulário de edição

---

## 🔧 Como Funciona na Prática

### Cenário 1: Criação Automática (Ideal)

```javascript
// Admin cria plano no painel
POST /api/admin/plans
{
  "name": "Plano Mensal",
  "type": "monthly",
  "price": 99.90,
  "currency": "BRL"
}

// Backend automaticamente:
1. Cria plano no banco
2. Cria produto no Stripe: "Plano Mensal"
3. Cria preço no Stripe: R$ 99,90/mês
4. Atualiza plano com stripe_price_id
5. Retorna plano completo
```

### Cenário 2: Criação Manual (Fallback)

```javascript
// Se Stripe não estiver configurado ou falhar:
1. Cria plano no banco (sem stripe_price_id)
2. Admin pode editar depois e adicionar stripe_price_id manualmente
3. Ou criar produto no Stripe Dashboard e copiar ID
```

---

## 📝 Resumo para o Cliente

### ❌ O que o Cliente NÃO precisa fazer:

- ❌ Acessar Stripe Dashboard
- ❌ Criar produtos manualmente
- ❌ Copiar Price IDs
- ❌ Entender como Stripe funciona

### ✅ O que o Cliente precisa fazer:

- ✅ Criar/editar planos no painel admin
- ✅ Preencher: Nome, Tipo, Preço, Descrição
- ✅ Clicar "Salvar"
- ✅ **TUDO MAIS É AUTOMÁTICO!**

---

## 🚀 Próximos Passos

1. **Testar criação automática:**
   - Criar novo plano no painel
   - Verificar se produto/preço são criados no Stripe
   - Verificar se `stripe_price_id` é associado automaticamente

2. **Melhorias futuras:**
   - Botão "Sincronizar com Stripe" para planos existentes
   - Visualização de produtos Stripe no painel
   - Atualização automática de preços no Stripe quando plano é editado

---

## ✅ Conclusão

**A plataforma cria produtos automaticamente via API do Stripe.**

**O cliente (Code) NÃO precisa:**
- Acessar Stripe Dashboard
- Criar produtos manualmente
- Copiar Price IDs

**O cliente apenas:**
- Cria/edita planos no painel admin
- Tudo mais é automático!

