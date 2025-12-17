# 🔑 Como Obter a Service Role Key no Supabase

## 📍 Localização Exata

A **service_role key** está na mesma página onde você viu a **anon key**, mas mais abaixo na página.

## 🎯 Passo a Passo Detalhado

### 1. Acesse o Painel do Supabase
- URL: https://supabase.com/dashboard
- Faça login na sua conta

### 2. Selecione o Projeto
- Clique no projeto **"FlowBrasil"** (ou procure pelo ID: `ajqyqogusrmdsyckhtay`)

### 3. Vá para Settings > API
- No menu lateral esquerdo, clique em **"Settings"** (⚙️ Configurações)
- Depois clique em **"API"** (ou "APIs" dependendo da versão)

### 4. Localize a Seção "Project API keys"
Você verá várias seções na página:

#### Seção 1: "Project URL"
- Mostra: `https://ajqyqogusrmdsyckhtay.supabase.co`

#### Seção 2: "anon" ou "public" key
- Esta é a chave que você já tem
- Começa com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Seção 3: "service_role" key ⭐ (AQUI!)
- **Role a página para BAIXO**
- Procure por uma seção chamada **"service_role"** ou **"Service Role"**
- Pode estar em uma seção separada ou em uma aba diferente
- A chave começa com: `eyJhbGc...` (igual à anon, mas é diferente)

### 5. Revele a Chave
- Ao lado da chave, há um ícone de **👁️ olho** ou botão **"Reveal"** ou **"Show"**
- Clique para revelar a chave completa
- **⚠️ ATENÇÃO:** Esta chave é SECRETA! Não compartilhe.

### 6. Copie a Chave
- Clique no botão **"Copy"** ou selecione e copie manualmente
- A chave é bem longa (mais de 200 caracteres)

---

## 🔍 Se Não Encontrar

### Alternativa 1: Verificar Abas/Tabs
Algumas versões do Supabase têm abas:
- Procure por abas como: **"API Keys"**, **"Keys"**, **"Credentials"**
- A service_role pode estar em uma aba separada

### Alternativa 2: Usar a Busca
- Use Ctrl+F (ou Cmd+F no Mac)
- Digite: `service_role`
- Isso vai destacar onde está na página

### Alternativa 3: Verificar Permissões
- Certifique-se de que você é **Owner** ou **Admin** do projeto
- Usuários com permissões menores podem não ver a service_role key

---

## 🆘 Solução Temporária (Enquanto Não Encontra)

Se você não conseguir encontrar agora, podemos fazer o seguinte:

### Opção A: Usar apenas Anon Key (Limitado)
- O sistema funcionará, mas com limitações
- Algumas operações administrativas podem não funcionar
- **Recomendação:** Encontre a service_role key para funcionalidade completa

### Opção B: Criar uma Nova Chave
1. No painel do Supabase, vá em **Settings > API**
2. Procure por **"Create new key"** ou **"Generate new key"**
3. Selecione o tipo **"service_role"**
4. Copie a nova chave

---

## 📸 Onde Está Visualmente

A página deve ter esta estrutura:

```
┌─────────────────────────────────────┐
│ Settings > API                      │
├─────────────────────────────────────┤
│                                     │
│ Project URL                         │
│ https://...supabase.co              │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ anon / public key                   │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
│ [👁️ Reveal] [📋 Copy]              │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ service_role key ⭐                  │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
│ [👁️ Reveal] [📋 Copy]              │
│                                     │
│ ⚠️ Keep this key secret!            │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Depois de Copiar

1. Cole no Railway como: `SUPABASE_SERVICE_ROLE_KEY`
2. **NÃO** compartilhe essa chave
3. **NÃO** commite no Git
4. Mantenha apenas nas variáveis de ambiente do Railway

---

## 🆘 Ainda Não Encontrou?

Se mesmo seguindo esses passos você não encontrar:

1. **Tire um print da tela** da página Settings > API
2. Ou me diga o que você está vendo na tela
3. Posso ajudar a identificar onde está

**Dica:** A service_role key geralmente está **logo abaixo** da anon key, na mesma página.

