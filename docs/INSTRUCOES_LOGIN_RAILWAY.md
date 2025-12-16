# 🔐 Instruções: Login no Railway CLI

## ⚠️ Importante

O Railway CLI precisa de login interativo (abre o navegador). Você precisa executar manualmente.

---

## 🚀 Passo a Passo

### 1. Abrir Terminal/PowerShell

No Windows:
- Pressione `Win + R`
- Digite `cmd` ou `powershell`
- Pressione Enter

### 2. Executar Login

```bash
railway login
```

**O que vai acontecer:**
1. O comando vai abrir seu navegador automaticamente
2. Você será redirecionado para a página de login do Railway
3. Faça login com sua conta (GitHub, Google, etc.)
4. Autorize o Railway CLI
5. O terminal vai mostrar: `✅ Logged in successfully`

### 3. Verificar Login

```bash
railway whoami
```

Deve mostrar seu email/username.

---

## 📊 Após Login - Verificações Automáticas

Depois de fazer login, me avise e eu posso executar:

```bash
# Verificar status
railway status

# Listar projetos
railway list

# Ver serviços
railway list-services

# Ver logs
railway logs

# Ver variáveis
railway variables

# Ver deploys
railway list-deploys
```

---

## 🔍 Verificação Manual (Dashboard)

Enquanto isso, você pode verificar no dashboard:

1. **Acesse:** https://railway.app
2. **Faça login**
3. **Verifique seu projeto:**
   - Status do serviço
   - Último deploy
   - URL pública
   - Variáveis de ambiente
   - Logs

---

## ✅ Checklist Rápido

- [ ] Railway CLI instalado (`railway --version` funciona)
- [ ] Login feito (`railway login`)
- [ ] Projeto visível (`railway list`)
- [ ] Serviço rodando (dashboard Railway)
- [ ] Deploy bem-sucedido (dashboard Railway)
- [ ] URL pública configurada (dashboard Railway)
- [ ] Variáveis de ambiente configuradas (dashboard Railway)
- [ ] Endpoint `/health` responde (teste no navegador)

---

## 🆘 Problemas?

### "railway: command not found"
**Solução:** Instale o CLI:
```bash
npm install -g @railway/cli
```

### "Not logged in"
**Solução:** Execute:
```bash
railway login
```

### "Cannot login in non-interactive mode"
**Solução:** Execute no terminal manualmente (não via script):
```bash
railway login
```

---

**Depois de fazer login, me avise e eu verifico tudo automaticamente!** 🚀

