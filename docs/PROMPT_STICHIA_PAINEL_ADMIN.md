# 🎨 Prompt para StichIA - Painel Administrativo Clube CODE

## Contexto
Criar um painel administrativo web para gerenciar clientes, assinaturas e pagamentos do Clube CODE (sistema de barbearia). O backend já está implementado e fornece APIs REST.

## Tecnologias e Requisitos
- Framework: React ou Vue (conforme preferência do StichIA)
- Estilização: Tailwind CSS ou similar
- Gerenciamento de estado: Context API ou Redux
- Requisições HTTP: Axios ou Fetch
- Autenticação: JWT (token no localStorage)
- Responsivo: Mobile-first

## Estrutura de Telas

### 1. Login (`/login`)
- Formulário simples: email e senha
- Botão "Entrar"
- Validação básica de campos
- Ao fazer login, salvar token JWT no localStorage
- Redirecionar para `/dashboard`

### 2. Dashboard (`/dashboard`)
- Cards com métricas:
  - Total de Clientes
  - Assinaturas Ativas
  - Receita do Mês
- Botões de ação rápida:
  - "Buscar Cliente"
  - "Registrar Pagamento"
  - "Ver Assinaturas"
- Layout: Grid responsivo

### 3. Buscar Cliente (`/clientes/buscar`)
- Campo de busca por CPF (máscara: 000.000.000-00)
- Botão "Buscar"
- Resultado exibido em card:
  - Dados do cliente (nome, email, telefone, CPF)
  - Lista de assinaturas (se houver)
  - Botão "Registrar Pagamento" (se não tiver plano ativo)
- Estado vazio: "Digite um CPF para buscar"

### 4. Registrar Pagamento (`/pagamentos/registrar`)
- Formulário com campos:
  - CPF (com botão "Buscar Cliente" ao lado)
  - Dropdown de Planos (carregar via API)
  - Valor (preenchido automaticamente ao selecionar plano, mas editável)
  - Data do Pagamento (date picker, padrão: hoje)
  - "Confirmado por" (texto)
  - Observações (textarea opcional)
- Validações:
  - CPF obrigatório e válido (11 dígitos)
  - Todos os campos obrigatórios
  - Valor > 0
- Botões: "Cancelar" e "Registrar Pagamento"
- Loading durante submit
- Mensagem de sucesso/erro

### 5. Listar Assinaturas (`/assinaturas`)
- Filtro dropdown: "Todas", "Ativas", "Canceladas", "Vencidas"
- Tabela responsiva com colunas:
  - Cliente (nome e CPF)
  - Plano
  - Status (badge colorido)
  - Data de Vencimento
  - Ações (botão "Ver Detalhes")
- Paginação (se necessário)

### 6. Detalhes da Assinatura (`/assinaturas/:id`)
- Card com dados completos:
  - Informações do cliente
  - Dados da assinatura
  - Histórico de pagamentos
- Botão "Cancelar Assinatura" (com confirmação)
- Botão "Voltar"

## Design System

### Cores
- Primária: `#1a365d` (azul escuro)
- Sucesso: `#48bb78` (verde)
- Erro: `#f56565` (vermelho)
- Aviso: `#ed8936` (laranja)
- Fundo: `#f7fafc` (cinza claro)
- Texto: `#2d3748` (cinza escuro)

### Componentes
- **Input:** Borda cinza, foco azul, padding confortável
- **Botão Primário:** Fundo azul, texto branco, hover mais escuro
- **Botão Secundário:** Borda azul, fundo transparente
- **Card:** Sombra sutil, bordas arredondadas, padding
- **Badge Status:**
  - Ativa: verde
  - Cancelada: vermelho
  - Vencida: laranja
- **Tabela:** Linhas alternadas, hover effect

### Tipografia
- Títulos: Bold, tamanho maior
- Texto: Regular, tamanho médio
- Labels: Medium, tamanho pequeno

## Integração com API

### Base URL
```
https://seu-dominio.com/api/admin
```

### Endpoints Disponíveis

**Buscar Cliente:**
```
GET /customers/:cpf
Headers: { Authorization: "Bearer {token}" }
```

**Registrar Pagamento:**
```
POST /payments/manual
Headers: { Authorization: "Bearer {token}" }
Body: {
  cpf: string,
  plan_id: string (UUID),
  amount: number,
  payment_date: string (ISO),
  confirmed_by: string,
  notes?: string
}
```

**Listar Assinaturas:**
```
GET /subscriptions?status=active&limit=50
Headers: { Authorization: "Bearer {token}" }
```

**Cancelar Assinatura:**
```
PUT /subscriptions/:id/cancel
Headers: { Authorization: "Bearer {token}" }
Body: { cancel_at_period_end: boolean }
```

**Listar Planos:**
```
GET /plans
Headers: { Authorization: "Bearer {token}" }
```

### Tratamento de Erros
- 401: Redirecionar para login
- 403: Mostrar mensagem "Sem permissão"
- 404: Mostrar mensagem "Não encontrado"
- 500: Mostrar mensagem "Erro do servidor"

### Loading States
- Spinner durante requisições
- Desabilitar botões durante submit
- Skeleton loaders em listas

## Funcionalidades Especiais

### Máscara de CPF
- Formato: `000.000.000-00`
- Remover formatação ao enviar para API

### Date Picker
- Formato brasileiro: `DD/MM/YYYY`
- Converter para ISO ao enviar para API

### Validação de CPF
- Verificar se tem 11 dígitos
- Validar algoritmo de CPF (opcional, mas recomendado)

### Autocomplete de Cliente
- Ao buscar CPF, mostrar nome do cliente se encontrado
- Preencher campos automaticamente

## Fluxos Principais

### Fluxo de Login
1. Usuário digita email e senha
2. Clica "Entrar"
3. Envia POST para `/api/auth/login` (a implementar)
4. Recebe token JWT
5. Salva token no localStorage
6. Redireciona para dashboard

### Fluxo de Registrar Pagamento
1. Usuário acessa "Registrar Pagamento"
2. Digita CPF e busca cliente
3. Seleciona plano (valor preenchido automaticamente)
4. Preenche data e "Confirmado por"
5. Clica "Registrar"
6. Mostra loading
7. Se sucesso: mensagem e redireciona
8. Se erro: mostra mensagem de erro

### Fluxo de Buscar Cliente
1. Usuário digita CPF
2. Clica "Buscar"
3. Mostra loading
4. Exibe dados do cliente e assinaturas
5. Se não encontrado: mensagem "Cliente não encontrado"

## Responsividade
- Mobile: Menu hambúrguer, cards empilhados
- Tablet: Layout em 2 colunas
- Desktop: Layout completo, sidebar fixa

## Acessibilidade
- Labels descritivos
- Contraste adequado
- Navegação por teclado
- Mensagens de erro claras

## Performance
- Lazy loading de rotas
- Debounce em buscas
- Cache de dados quando apropriado
- Otimização de imagens

## Segurança
- Token JWT no localStorage
- Interceptor para adicionar token em todas as requisições
- Logout ao expirar token
- Não armazenar senhas

## Testes Sugeridos
- Testar todos os fluxos principais
- Testar validações de formulário
- Testar tratamento de erros
- Testar responsividade

---

## Exemplo de Código (Referência)

### Configuração do Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://seu-dominio.com/api/admin',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Exemplo de Buscar Cliente
```javascript
const buscarCliente = async (cpf) => {
  try {
    const response = await api.get(`/customers/${cpf.replace(/\D/g, '')}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

---

## Notas Finais
- O backend já está implementado e funcionando
- A autenticação JWT será implementada depois (por enquanto, usar token mock)
- Focar em UX clara e intuitiva
- Priorizar funcionalidades essenciais primeiro
- Adicionar melhorias visuais depois


