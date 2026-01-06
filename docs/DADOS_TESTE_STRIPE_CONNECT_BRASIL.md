# Dados de Teste para Stripe Connect - Brasil

**Data:** 06/01/2026  
**Contexto:** Onboarding de conta Connect Express em modo sandbox/teste

---

## 📋 Dados de Teste para Preencher no Onboarding

Como você está em **modo de teste (sandbox)**, o Stripe aceita dados fictícios para completar o onboarding. Use os seguintes dados:

### Informações da Empresa

**Legal business name:**
```
Code Identidade Masculina LTDA
```
ou
```
Teste Barbearia LTDA
```

**Business name (Doing Business As) - Opcional:**
```
Code Identidade Masculina
```

**CNPJ (Cadastro Nacional da Pessoa Jurídica):**
```
11.222.333/0001-81
```
ou
```
00.000.000/0001-91
```

**Nota:** O Stripe aceita qualquer CNPJ válido em formato de teste. O formato é: `XX.XXX.XXX/XXXX-XX`

### Endereço da Empresa

**País:** 
```
Brazil (já selecionado)
```

**Street address:**
```
Rua Teste, 123
```

**Complemento (se houver campo):**
```
Sala 101
```

**Cidade:**
```
São Paulo
```

**Estado:**
```
SP
```

**CEP:**
```
01310-100
```

---

## ⚠️ Importante

1. **Modo de Teste:** Esses dados são apenas para testes. Em produção, você precisará de dados reais.

2. **CNPJ de Teste:** O Stripe não valida o CNPJ em modo sandbox, então qualquer número no formato correto funciona.

3. **Dados Reais em Produção:** Quando for para produção, você precisará:
   - Empresa registrada
   - CNPJ real
   - Endereço real da empresa
   - Documentos de verificação

4. **Continuidade:** Após preencher, continue o processo normalmente. O Stripe pode pedir mais informações, mas em modo teste tudo é aceito.

---

## 🎯 Próximos Passos Após Preencher

1. Preencha os dados acima
2. Clique em "Continue" ou "Submit"
3. O Stripe pode pedir mais informações (representante legal, etc.)
4. Continue preenchendo com dados de teste
5. Ao final, você será redirecionado de volta para o painel admin

---

## 📝 Observação

Se em algum momento o Stripe pedir documentos (RG, CPF, etc.), você pode:
- Usar dados fictícios em modo teste
- Ou pular a etapa se houver opção
- O importante é completar o fluxo para testar a integração

---

## ✅ Após Completar

Quando você completar o onboarding:
1. Será redirecionado para `/pagamentos?onboarding=success`
2. O webhook `account.updated` será disparado
3. O status da barbearia será atualizado no banco
4. A conta ficará ativa e pronta para receber pagamentos

