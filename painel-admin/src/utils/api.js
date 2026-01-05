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
      throw new Error(error.message || error.error || `Erro ${response.status}`);
    }
    
    // Se não tem conteúdo (204 No Content), retornar true para DELETE
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return true;
    }
    
    const data = await response.json();
    
    // Para DELETE, verificar se retornou success
    if (options.method === 'DELETE' && data.success !== undefined) {
      return data.success;
    }
    
    return data;
  } catch (error) {
    console.error('Erro na requisição:', error);
    // Se for erro de rede, retornar null em vez de lançar exceção
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.warn('Erro de rede, retornando null');
      return null;
    }
    // Para DELETE com 404, retornar false em vez de lançar exceção
    if (options.method === 'DELETE' && error.message.includes('404')) {
      console.warn('Interação não encontrada (404), retornando false');
      return false;
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
   * Listar todos os clientes
   */
  listarClientes: async (limit = 50, offset = 0, search = '') => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (search) {
      params.append('search', search);
    }
    return apiRequest(`/admin/customers?${params.toString()}`);
  },

  /**
   * Excluir cliente
   */
  excluirCliente: async (customerId) => {
    return apiRequest(`/admin/customers/${customerId}`, {
      method: 'DELETE'
    });
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
  },

  /**
   * Obter estatísticas do dashboard
   */
  obterEstatisticas: async () => {
    try {
      const data = await apiRequest('/admin/stats');
      if (!data) {
        throw new Error('Erro ao conectar com o servidor');
      }
      return data;
    } catch (error) {
      console.error('Erro em obterEstatisticas:', error);
      throw error;
    }
  },

  /**
   * Listar pagamentos
   */
  listarPagamentos: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.customer_id) params.append('customer_id', filtros.customer_id);
    if (filtros.subscription_id) params.append('subscription_id', filtros.subscription_id);
    if (filtros.limit) params.append('limit', filtros.limit);
    
    const data = await apiRequest(`/admin/payments?${params.toString()}`);
    return data?.payments || [];
  },

  /**
   * Listar interações do flow
   */
  listarFlowInteractions: async (queryString = '') => {
    return apiRequest(`/admin/flow/interactions?${queryString}`);
  },

  /**
   * Obter timeline de um flow_token
   */
  obterFlowTimeline: async (flowToken) => {
    return apiRequest(`/admin/flow/timeline/${flowToken}`);
  },

  /**
   * Obter estatísticas do flow
   */
  obterFlowStats: async () => {
    return apiRequest('/admin/flow/stats');
  },

  /**
   * Obter analytics completos do flow
   */
  obterFlowAnalytics: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.startDate) params.append('startDate', filtros.startDate);
    if (filtros.endDate) params.append('endDate', filtros.endDate);
    
    const data = await apiRequest(`/admin/flow/analytics?${params.toString()}`);
    return data?.analytics || {
      funnel: [],
      abandonment: {},
      averageTime: {},
      interactionsOverTime: [],
      heatmap: {},
      location: {}
    };
  },

  /**
   * Excluir uma interação do flow
   */
  excluirFlowInteraction: async (interactionId) => {
    console.log(`🔗 Chamando API para excluir interação ${interactionId}...`);
    try {
      const result = await apiRequest(`/admin/flow/interactions/${interactionId}`, {
        method: 'DELETE'
      });
      console.log(`📥 Resposta da API para ${interactionId}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Erro na API ao excluir ${interactionId}:`, error);
      throw error;
    }
  },

  /**
   * Excluir todas as interações de um flow_token
   */
  excluirFlowInteractionsByToken: async (flowToken) => {
    return apiRequest(`/admin/flow/interactions/token/${flowToken}`, {
      method: 'DELETE'
    });
  },

  /**
   * Listar agendamentos do Google Calendar
   */
  listarAgendamentos: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.startDate) params.append('startDate', filtros.startDate);
    if (filtros.endDate) params.append('endDate', filtros.endDate);
    if (filtros.barberId) params.append('barberId', filtros.barberId);
    if (filtros.maxResults) params.append('maxResults', filtros.maxResults);
    
    const data = await apiRequest(`/admin/appointments?${params.toString()}`);
    return data?.appointments || [];
  },

  /**
   * Cancelar agendamento
   */
  cancelarAgendamento: async (eventId, barberId) => {
    const params = new URLSearchParams();
    if (barberId) params.append('barberId', barberId);
    
    return apiRequest(`/admin/appointments/${eventId}?${params.toString()}`, {
      method: 'DELETE'
    });
  },

  /**
   * Listar barbeiros
   */
  listarBarbeiros: async () => {
    return apiRequest('/admin/barbers');
  },

  /**
   * Buscar notificações administrativas
   */
  obterNotificacoes: async () => {
    return await apiRequest('/admin/notifications', {
      method: 'GET'
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
    if (!dataISO) {
      return 'Sem data de vencimento';
    }
    const data = new Date(dataISO);
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      return 'Data inválida';
    }
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
  },

  /**
   * Obter relatório financeiro
   */
  obterRelatorioFinanceiro: async (period, month, year) => {
    const params = new URLSearchParams({ period, year });
    if (month) params.append('month', month);
    return await apiRequest(`/admin/reports/financial?${params.toString()}`);
  },

  /**
   * Exportar clientes
   */
  exportarClientes: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return await apiRequest(`/admin/reports/customers/export?${params.toString()}`);
  },

  /**
   * Exportar pagamentos
   */
  exportarPagamentos: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return await apiRequest(`/admin/reports/payments/export?${params.toString()}`);
  },

  /**
   * Obter relatório de assinaturas
   */
  obterRelatorioAssinaturas: async (status, startDate, endDate) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return await apiRequest(`/admin/reports/subscriptions?${params.toString()}`);
  },

  /**
   * Obter relatório de agendamentos
   */
  obterRelatorioAgendamentos: async (startDate, endDate, barberId) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (barberId) params.append('barberId', barberId);
    return await apiRequest(`/admin/reports/appointments?${params.toString()}`);
  }
};

