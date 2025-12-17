# Teste de Criação de Cliente

## ✅ Implementação Concluída

### Backend
- ✅ Rota `POST /api/admin/customers` criada em `src/routes/admin-routes.js`
- ✅ Validação de CPF (11 dígitos)
- ✅ Verificação de duplicidade (retorna 409 se CPF já existe)
- ✅ Criação de cliente no Supabase
- ✅ Tratamento de erros completo

### Frontend
- ✅ Botão "Criar Cliente" no header da tela de buscar cliente
- ✅ Formulário completo com validação
- ✅ Máscaras automáticas (CPF e telefone)
- ✅ Mensagens de erro por campo
- ✅ Integração com API
- ✅ Navegação entre modos (buscar/criar)

## 🧪 Como Testar

### 1. Teste Manual no Frontend

1. Acesse o painel administrativo
2. Faça login com: `admin@barbearia.com` / `admin123`
3. Vá para "Clients" (Buscar Cliente)
4. Clique no botão "Criar Cliente" no topo
5. Preencha o formulário:
   - Nome: Obrigatório
   - CPF: 11 dígitos (formato automático)
   - Telefone: Obrigatório (formato automático)
   - Email: Obrigatório (validação de formato)
6. Clique em "Criar Cliente"
7. Verifique se:
   - Cliente é criado com sucesso
   - Volta para modo buscar
   - Cliente criado é exibido automaticamente

### 2. Teste via API (Node.js)

```bash
node test-criar-cliente.js
```

**Credenciais de teste:**
- Email: `admin@barbearia.com`
- Senha: `admin123`

### 3. Teste via cURL

```bash
# 1. Fazer login
curl -X POST https://whatsapp-flow-endpoint-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barbearia.com","password":"admin123"}'

# 2. Criar cliente (substitua TOKEN pelo token recebido)
curl -X POST https://whatsapp-flow-endpoint-production.up.railway.app/api/admin/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "cpf": "12345678901",
    "name": "Cliente Teste",
    "email": "teste@exemplo.com",
    "phone": "11999999999"
  }'
```

## ⚠️ Problema Identificado

A rota `POST /api/admin/customers` está retornando 404 no servidor remoto.

**Possíveis causas:**
1. Servidor não foi atualizado com as novas rotas
2. Deploy não incluiu as alterações
3. Cache do servidor

**Solução:**
- Verificar se o código foi commitado e enviado para o repositório
- Fazer novo deploy no Railway
- Verificar logs do servidor para erros

## 📋 Checklist de Verificação

- [ ] Código commitado no repositório
- [ ] Deploy realizado no Railway
- [ ] Servidor reiniciado
- [ ] Rota acessível via API
- [ ] Frontend conectado corretamente
- [ ] Validações funcionando
- [ ] Mensagens de erro exibidas corretamente
- [ ] Cliente criado aparece na busca

## 🔍 Verificação da Rota

Para verificar se a rota está registrada:

1. Verificar `src/index.js` - linha 266: `app.use('/api/admin', adminRoutes);`
2. Verificar `src/routes/admin-routes.js` - linha 114: `router.post('/customers', requireAuth, ...)`
3. Verificar se o servidor está rodando: `GET /health`

## 📝 Notas

- A rota requer autenticação JWT
- CPF deve ter exatamente 11 dígitos
- Email deve ter formato válido
- Telefone é opcional mas recomendado
- Nome é obrigatório

## 🐛 Troubleshooting

### Erro 404
- Verificar se a rota está registrada no `index.js`
- Verificar se o servidor foi reiniciado
- Verificar logs do servidor

### Erro 401
- Verificar se o token JWT é válido
- Fazer login novamente

### Erro 409
- CPF já existe no banco
- Comportamento esperado

### Erro 500
- Verificar logs do servidor
- Verificar conexão com Supabase
- Verificar se SUPABASE_SERVICE_ROLE_KEY está configurada

