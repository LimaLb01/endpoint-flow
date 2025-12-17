# 🔑 Como Obter a Service Role Key no Supabase

## ⚠️ ATUALIZAÇÃO: Nova Interface do Supabase

O Supabase atualizou a interface! Agora não é mais "anon" e "service_role", mas sim:
- **Publishable key** = antiga "anon key" (pode ser usada publicamente)
- **Secret key** = antiga "service_role key" (mantenha secreta!)

## 📍 Localização Exata

A **Secret key** está na seção **"Secret keys"** na mesma página de API Keys.

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

#### Seção 2: "Publishable key"
- Esta é a chave pública (antiga "anon key")
- Começa com: `sb_publishable_...`
- Pode ser usada publicamente (com RLS ativado)

#### Seção 3: "Secret keys" ⭐ (AQUI ESTÁ!)
- Procure pela seção **"Secret keys"**
- Descrição: "These API keys allow privileged access to your project's APIs"
- Você verá uma chave mascarada: `sb_secret_...` (com asteriscos)
- Esta é a chave que você precisa!

### 5. Revele a Chave
- Ao lado da chave mascarada (`sb_secret_...`), há um ícone de **👁️ olho**
- Clique no ícone de **olho** para revelar a chave completa
- A chave será desmascarada e você verá: `sb_secret_...` (chave completa)
- **⚠️ ATENÇÃO:** Esta chave é SECRETA! Não compartilhe.

### 6. Copie a Chave
- Após revelar, clique no ícone de **📋 copiar** ao lado da chave
- Ou selecione e copie manualmente (Ctrl+C)
- A chave começa com `sb_secret_` e é bem longa

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
│ Settings > API Keys                 │
├─────────────────────────────────────┤
│                                     │
│ Publishable key                     │
│ sb_publishable_N64Ud5-l3_...       │
│ [📋 Copy]                           │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Secret keys ⭐                       │
│ sb_secret_WNf9D............        │
│ [👁️ Reveal] [📋 Copy]              │
│                                     │
│ ⚠️ These API keys allow privileged  │
│    access to your project's APIs    │
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

