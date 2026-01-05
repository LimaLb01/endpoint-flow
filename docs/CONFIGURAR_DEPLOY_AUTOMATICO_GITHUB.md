# 🚀 Configurar Deploy Automático via GitHub no Railway

## ✅ Status Atual

- ✅ Código enviado para o GitHub (`LimaLb01/endpoint-flow`)
- ✅ Railway CLI instalado e autenticado
- ✅ Projeto Railway "FlowBrasil" criado
- ⏳ **Próximo passo:** Conectar GitHub ao Railway

---

## 📋 Passo a Passo

### 1. Acessar o Dashboard do Railway

1. Acesse: **https://railway.app**
2. Faça login (se necessário)
3. Selecione o projeto **"FlowBrasil"**

### 2. Conectar o Repositório GitHub

1. No projeto Railway, clique em **"Settings"** (no menu lateral)
2. Role até a seção **"Source"** ou **"GitHub"**
3. Clique em **"Connect GitHub Repo"** ou **"Connect Repository"**
4. Se solicitado, autorize o Railway a acessar seus repositórios GitHub
5. Selecione o repositório: **`LimaLb01/endpoint-flow`**
6. Selecione a branch: **`main`**
7. Clique em **"Connect"** ou **"Save"**

### 3. Configurar Deploy Automático

Após conectar o repositório:

1. Na seção **"Deployments"** ou **"Settings"**
2. Ative a opção **"Auto Deploy"** ou **"Automatic Deployments"**
3. Configure para fazer deploy automaticamente quando houver push na branch `main`
4. Salve as configurações

### 4. Verificar Configuração

Após configurar:

1. Vá em **"Deployments"** no menu lateral
2. Você verá uma lista de deploys
3. O próximo push no GitHub irá disparar um deploy automaticamente

---

## ✅ Como Funciona Depois

### Deploy Automático

A partir de agora, **toda vez que você fizer push no GitHub**:

1. ✅ O Railway detecta automaticamente o push
2. ✅ Inicia o build automaticamente
3. ✅ Faz o deploy automaticamente
4. ✅ O servidor é atualizado sem você precisar fazer nada!

### Exemplo de Fluxo

```bash
# 1. Você faz mudanças no código
# 2. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 3. Railway detecta automaticamente
# 4. Deploy automático inicia
# 5. Servidor atualizado em ~2-3 minutos
```

---

## 🔍 Verificar se Está Funcionando

### Opção 1: Via Dashboard Railway

1. Acesse o projeto no Railway
2. Vá em **"Deployments"**
3. Você verá um novo deploy sendo criado automaticamente após cada push

### Opção 2: Via Terminal

```bash
railway deployments
```

Isso mostrará todos os deploys, incluindo os automáticos.

---

## ⚠️ Importante

- **Variáveis de Ambiente:** Continuam funcionando normalmente
- **Deploy Manual:** Ainda pode ser feito via `railway deploy` se necessário
- **Rollback:** Pode ser feito via dashboard do Railway se algo der errado

---

## 🎯 Próximos Passos

1. ✅ Conectar GitHub ao Railway (seguir passos acima)
2. ✅ Fazer um teste: fazer um pequeno commit e push
3. ✅ Verificar se o deploy automático funcionou
4. ✅ Pronto! De agora em diante, todo push = deploy automático

---

**🚀 Após conectar, me avise e eu posso verificar se está funcionando!**

