/**
 * API Client - Funções compartilhadas para comunicação com o backend
 */

const API_BASE_URL = 'https://whatsapp-flow-endpoint-production.up.railway.app/api';

/**
 * Obtém o token JWT do localStorage
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Obtém headers de autenticação
 */
export function getAuthHeaders() {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Faz uma requisição à API com tratamento de erros
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  // Se não tem token e não é rota de login, retornar null (o componente vai redirecionar)
  if (!token && !endpoint.includes('/auth/login')) {
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });
    
    // Se não autorizado, limpar token
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }
    
    // Se erro, lançar exceção
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
      throw new Error(error.message || `Erro ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro na requisição:', error);
    // Se for erro de rede, retornar null em vez de lançar exceção
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.warn('Erro de rede, retornando null');
      return null;
    }
    throw error;
  }
}

/**
 * Funções da API
 */
export const api = {
  /**
   * Login
   */
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Credenciais inválidas' }));
      throw new Error(error.message || 'Erro ao fazer login');
    }
    
    return await response.json();
  },
  
  /**
   * Buscar cliente por CPF
   */
  buscarCliente: async (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return apiRequest(`/admin/customers/${cpfLimpo}`);
  },
  
  /**
   * Registrar pagamento manual
   */
  registrarPagamento: async (dados) => {
    return apiRequest('/admin/payments/manual', {
      method: 'POST',
      body: JSON.stringify({
        cpf: dados.cpf.replace(/\D/g, ''),
        plan_id: dados.plan_id,
        amount: parseFloat(dados.amount),
        payment_date: new Date(dados.payment_date).toISOString(),
        confirmed_by: dados.confirmed_by,
        notes: dados.notes || null
      })
    });
  },
  
  /**
   * Listar assinaturas
   */
  listarAssinaturas: async (status = 'active', limit = 50) => {
    return apiRequest(`/admin/subscriptions?status=${status}&limit=${limit}`);
  },
  
  /**
   * Cancelar assinatura
   */
  cancelarAssinatura: async (subscriptionId, cancelAtPeriodEnd = false) => {
    return apiRequest(`/admin/subscriptions/${subscriptionId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ cancel_at_period_end: cancelAtPeriodEnd })
    });
  },
  
  /**
   * Listar planos
   */
  listarPlanos: async () => {
    const data = await apiRequest('/admin/plans');
    return data.plans || [];
  },
  
  /**
   * Obter detalhes da assinatura
   */
  obterAssinatura: async (subscriptionId) => {
    return apiRequest(`/admin/subscriptions/${subscriptionId}`);
  },

  /**
   * Criar cliente
   */
  criarCliente: async (dados) => {
    return apiRequest('/admin/customers', {
      method: 'POST',
      body: JSON.stringify({
        cpf: dados.cpf.replace(/\D/g, ''),
        name: dados.name,
        email: dados.email,
        phone: dados.phone ? dados.phone.replace(/\D/g, '') : null
      })
    });
  },

  /**
   * Atualizar cliente
   */
  atualizarCliente: async (cpf, dados) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return apiRequest(`/admin/customers/${cpfLimpo}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: dados.name,
        email: dados.email,
        phone: dados.phone ? dados.phone.replace(/\D/g, '') : null
      })
    });
  }
};

/**
 * Utilitários
 */
export const utils = {
  /**
   * Aplicar máscara de CPF
   */
  aplicarMascaraCPF: (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  },
  
  /**
   * Formatar data para exibição
   */
  formatarData: (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },
  
  /**
   * Formatar data e hora
   */
  formatarDataHora: (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  /**
   * Formatar moeda
   */
  formatarMoeda: (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  },

  /**
   * Aplicar máscara de telefone
   */
  aplicarMascaraTelefone: (telefone) => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length <= 10) {
      return telefoneLimpo
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return telefoneLimpo
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  },

  /**
   * Validar email
   */
  validarEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
};

