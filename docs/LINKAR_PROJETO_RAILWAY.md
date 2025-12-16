# 🔗 Linkar Projeto Railway

## ⚠️ Necessário

O projeto precisa estar linkado ao diretório para eu poder verificar automaticamente.

---

## 🚀 Como Fazer

### Opção 1: Via Terminal (Recomendado)

1. Abra o terminal/PowerShell
2. Navegue até o projeto:
   ```bash
   cd C:\Projetos\endpoint-flow
   ```
3. Execute:
   ```bash
   railway link
   ```
4. Quando aparecer o menu:
   - Selecione o workspace (provavelmente "limalb01's Projects")
   - Selecione o projeto "FlowBrasil"
   - Pressione Enter

**Pronto!** O projeto estará linkado.

---

### Opção 2: Linkar Serviço Específico

Se preferir linkar diretamente ao serviço:

```bash
railway link --service whatsapp-flow-endpoint
```

---

## ✅ Verificar se Está Linkado

Execute:

```bash
railway status
```

Deve mostrar informações do projeto linkado.

---

## 📊 Após Linkar

Depois de fazer o link, me avise e eu posso verificar automaticamente:

- ✅ Status do serviço
- ✅ Variáveis de ambiente
- ✅ Deploys recentes
- ✅ Logs
- ✅ URLs públicas
- ✅ Tudo que precisa para o webhook funcionar

---

**Execute `railway link` e me avise quando terminar!** 🚀

