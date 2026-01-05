/**
 * Serviço de Relatórios e Exportação
 * Gera relatórios financeiros, de clientes, pagamentos, assinaturas e agendamentos
 */

const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { globalLogger } = require('../utils/logger');
const { listAppointments } = require('./calendar-service');

/**
 * Gera relatório financeiro (mensal ou anual)
 * @param {object} options - Opções do relatório
 * @param {string} options.period - 'month' ou 'year'
 * @param {number} options.month - Mês (1-12) se period = 'month'
 * @param {number} options.year - Ano
 * @returns {Promise<object>} Relatório financeiro
 */
async function getFinancialReport({ period = 'month', month, year }) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    const startDate = new Date();
    const endDate = new Date();

    if (period === 'month') {
      startDate.setFullYear(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setFullYear(year, month, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Anual
      startDate.setFullYear(year, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setFullYear(year, 11, 31);
      endDate.setHours(23, 59, 59, 999);
    }

    // Pagamentos manuais confirmados
    const { data: pagamentosManuais, error: errorManuais } = await supabaseAdmin
      .from('manual_payments')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .eq('status', 'confirmed')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString())
      .order('payment_date', { ascending: false });

    // Pagamentos Stripe
    const { data: pagamentosStripe, error: errorStripe } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        customer:customers(*),
        subscription:subscriptions(
          plan:plans(*)
        )
      `)
      .eq('status', 'succeeded')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString())
      .order('payment_date', { ascending: false });

    if (errorManuais || errorStripe) {
      throw errorManuais || errorStripe;
    }

    // Calcular totais
    const totalManuais = pagamentosManuais?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const totalStripe = pagamentosStripe?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const totalGeral = totalManuais + totalStripe;

    // Agrupar por plano
    const porPlano = {};
    
    pagamentosManuais?.forEach(p => {
      if (p.plan) {
        const planId = p.plan.id;
        if (!porPlano[planId]) {
          porPlano[planId] = {
            plan_id: planId,
            plan_name: p.plan.name,
            count: 0,
            total: 0
          };
        }
        porPlano[planId].count += 1;
        porPlano[planId].total += parseFloat(p.amount || 0);
      }
    });

    pagamentosStripe?.forEach(p => {
      if (p.subscription?.plan) {
        const planId = p.subscription.plan.id;
        if (!porPlano[planId]) {
          porPlano[planId] = {
            plan_id: planId,
            plan_name: p.subscription.plan.name,
            count: 0,
            total: 0
          };
        }
        porPlano[planId].count += 1;
        porPlano[planId].total += parseFloat(p.amount || 0);
      }
    });

    return {
      period,
      month: period === 'month' ? month : null,
      year,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalGeral,
        totalManuais,
        totalStripe,
        totalPagamentos: (pagamentosManuais?.length || 0) + (pagamentosStripe?.length || 0)
      },
      porPlano: Object.values(porPlano),
      pagamentos: {
        manuais: pagamentosManuais || [],
        stripe: pagamentosStripe || []
      }
    };
  } catch (error) {
    globalLogger.error('Erro ao gerar relatório financeiro', {
      error: error.message,
      period,
      month,
      year
    });
    throw error;
  }
}

/**
 * Exporta clientes para CSV/Excel
 * @param {object} options - Opções de filtro
 * @returns {Promise<Array>} Lista de clientes formatada
 */
async function exportCustomers(options = {}) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    let query = supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtros opcionais
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data: customers, error } = await query;

    if (error) {
      throw error;
    }

    // Buscar assinaturas ativas para cada cliente
    const customersWithSubscriptions = await Promise.all(
      (customers || []).map(async (customer) => {
        const { data: subscriptions } = await supabaseAdmin
          .from('subscriptions')
          .select(`
            *,
            plan:plans(*)
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          ...customer,
          hasActiveSubscription: subscriptions?.some(s => s.status === 'active') || false,
          lastSubscription: subscriptions?.[0] || null
        };
      })
    );

    return customersWithSubscriptions;
  } catch (error) {
    globalLogger.error('Erro ao exportar clientes', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Exporta pagamentos para CSV/Excel
 * @param {object} options - Opções de filtro
 * @returns {Promise<Array>} Lista de pagamentos formatada
 */
async function exportPayments(options = {}) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    // Pagamentos manuais
    let queryManuais = supabaseAdmin
      .from('manual_payments')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .eq('status', 'confirmed')
      .order('payment_date', { ascending: false });

    if (options.startDate) {
      queryManuais = queryManuais.gte('payment_date', options.startDate);
    }
    if (options.endDate) {
      queryManuais = queryManuais.lte('payment_date', options.endDate);
    }

    const { data: pagamentosManuais, error: errorManuais } = await queryManuais;

    // Pagamentos Stripe
    let queryStripe = supabaseAdmin
      .from('payments')
      .select(`
        *,
        customer:customers(*),
        subscription:subscriptions(
          plan:plans(*)
        )
      `)
      .eq('status', 'succeeded')
      .order('payment_date', { ascending: false });

    if (options.startDate) {
      queryStripe = queryStripe.gte('payment_date', options.startDate);
    }
    if (options.endDate) {
      queryStripe = queryStripe.lte('payment_date', options.endDate);
    }

    const { data: pagamentosStripe, error: errorStripe } = await queryStripe;

    if (errorManuais || errorStripe) {
      throw errorManuais || errorStripe;
    }

    // Formatar pagamentos manuais
    const manuaisFormatados = (pagamentosManuais || []).map(p => ({
      id: p.id,
      tipo: 'Manual',
      data: p.payment_date,
      valor: parseFloat(p.amount || 0),
      cliente: p.customer?.name || 'N/A',
      cpf: p.customer?.cpf || 'N/A',
      plano: p.plan?.name || 'N/A',
      confirmado_por: p.confirmed_by || 'N/A',
      notas: p.notes || ''
    }));

    // Formatar pagamentos Stripe
    const stripeFormatados = (pagamentosStripe || []).map(p => ({
      id: p.id,
      tipo: 'Stripe',
      data: p.payment_date,
      valor: parseFloat(p.amount || 0),
      cliente: p.customer?.name || 'N/A',
      cpf: p.customer?.cpf || 'N/A',
      plano: p.subscription?.plan?.name || 'N/A',
      metodo: p.payment_method || 'card',
      stripe_payment_intent_id: p.stripe_payment_intent_id || ''
    }));

    // Combinar e ordenar por data
    const todosPagamentos = [...manuaisFormatados, ...stripeFormatados]
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    return todosPagamentos;
  } catch (error) {
    globalLogger.error('Erro ao exportar pagamentos', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Gera relatório de assinaturas
 * @param {object} options - Opções de filtro
 * @returns {Promise<object>} Relatório de assinaturas
 */
async function getSubscriptionsReport(options = {}) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw error;
    }

    // Estatísticas
    const stats = {
      total: subscriptions?.length || 0,
      ativas: subscriptions?.filter(s => s.status === 'active').length || 0,
      canceladas: subscriptions?.filter(s => s.status === 'canceled').length || 0,
      vencidas: subscriptions?.filter(s => s.status === 'past_due' || s.status === 'unpaid').length || 0,
      porPlano: {}
    };

    // Agrupar por plano
    subscriptions?.forEach(sub => {
      if (sub.plan) {
        const planId = sub.plan.id;
        if (!stats.porPlano[planId]) {
          stats.porPlano[planId] = {
            plan_id: planId,
            plan_name: sub.plan.name,
            total: 0,
            ativas: 0,
            canceladas: 0
          };
        }
        stats.porPlano[planId].total += 1;
        if (sub.status === 'active') {
          stats.porPlano[planId].ativas += 1;
        }
        if (sub.status === 'canceled') {
          stats.porPlano[planId].canceladas += 1;
        }
      }
    });

    return {
      subscriptions: subscriptions || [],
      stats: {
        ...stats,
        porPlano: Object.values(stats.porPlano)
      }
    };
  } catch (error) {
    globalLogger.error('Erro ao gerar relatório de assinaturas', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Gera relatório de agendamentos
 * @param {object} options - Opções de filtro
 * @returns {Promise<object>} Relatório de agendamentos
 */
async function getAppointmentsReport(options = {}) {
  try {
    const appointments = await listAppointments({
      startDate: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: options.endDate,
      barberId: options.barberId,
      maxResults: 1000
    });

    // Estatísticas
    const stats = {
      total: appointments.length,
      porBarbeiro: {},
      porDia: {},
      cancelados: appointments.filter(a => a.status === 'cancelled').length,
      confirmados: appointments.filter(a => a.status === 'confirmed').length
    };

    appointments.forEach(apt => {
      // Por barbeiro
      const barberName = apt.barberName || 'Não especificado';
      if (!stats.porBarbeiro[barberName]) {
        stats.porBarbeiro[barberName] = 0;
      }
      stats.porBarbeiro[barberName] += 1;

      // Por dia
      if (apt.start) {
        const date = new Date(apt.start).toISOString().split('T')[0];
        if (!stats.porDia[date]) {
          stats.porDia[date] = 0;
        }
        stats.porDia[date] += 1;
      }
    });

    return {
      appointments,
      stats: {
        ...stats,
        porBarbeiro: Object.entries(stats.porBarbeiro).map(([name, count]) => ({
          barberName: name,
          count
        })),
        porDia: Object.entries(stats.porDia).map(([date, count]) => ({
          date,
          count
        })).sort((a, b) => a.date.localeCompare(b.date))
      }
    };
  } catch (error) {
    globalLogger.error('Erro ao gerar relatório de agendamentos', {
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  getFinancialReport,
  exportCustomers,
  exportPayments,
  getSubscriptionsReport,
  getAppointmentsReport
};

