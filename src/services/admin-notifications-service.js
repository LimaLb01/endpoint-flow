/**
 * Serviço de Notificações para o Painel Administrativo
 * Busca alertas e notificações para exibir no dashboard
 */

const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { globalLogger } = require('../utils/logger');

/**
 * Busca todas as notificações e alertas para o painel administrativo
 * @returns {Promise<object>} Objeto com notificações categorizadas
 */
async function getAdminNotifications() {
  if (!isAdminConfigured()) {
    return {
      subscriptionsExpiring: [],
      pendingPayments: [],
      canceledAppointments: [],
      newCustomers: [],
      total: 0
    };
  }

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    const twentyFourHoursAgo = new Date(now);
    twentyFourHoursAgo.setHours(now.getHours() - 24);

    // 1. Assinaturas vencendo em 7 dias
    const { data: subscriptionsExpiring, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        current_period_end,
        status,
        customer:customers(id, name, cpf, email, phone),
        plan:plans(id, name, price)
      `)
      .eq('status', 'active')
      .gte('current_period_end', now.toISOString())
      .lte('current_period_end', sevenDaysFromNow.toISOString())
      .order('current_period_end', { ascending: true });

    if (subsError) {
      globalLogger.error('Erro ao buscar assinaturas vencendo', { error: subsError.message });
    }

    // 2. Pagamentos pendentes
    const { data: pendingPayments, error: paymentsError } = await supabaseAdmin
      .from('manual_payments')
      .select(`
        id,
        amount,
        payment_date,
        status,
        confirmed_by,
        customer:customers(id, name, cpf, email),
        plan:plans(id, name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (paymentsError) {
      globalLogger.error('Erro ao buscar pagamentos pendentes', { error: paymentsError.message });
    }

    // 3. Novos clientes (últimas 24h)
    const { data: newCustomers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, name, cpf, email, phone, created_at')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    if (customersError) {
      globalLogger.error('Erro ao buscar novos clientes', { error: customersError.message });
    }

    // 4. Agendamentos cancelados (últimas 24h) - se houver integração com Google Calendar
    // Por enquanto, retornamos array vazio pois não temos tabela de agendamentos no banco
    const canceledAppointments = [];

    // Formatar notificações
    const notifications = {
      subscriptionsExpiring: (subscriptionsExpiring || []).map(sub => ({
        id: sub.id,
        type: 'subscription_expiring',
        title: 'Assinatura vencendo em breve',
        message: `A assinatura de ${sub.customer?.name || 'Cliente'} (${sub.plan?.name || 'Plano'}) vence em ${Math.ceil((new Date(sub.current_period_end) - now) / (1000 * 60 * 60 * 24))} dia(s)`,
        date: sub.current_period_end,
        priority: 'high',
        data: {
          subscriptionId: sub.id,
          customerId: sub.customer?.id,
          customerName: sub.customer?.name,
          customerCpf: sub.customer?.cpf,
          planName: sub.plan?.name,
          daysUntilExpiry: Math.ceil((new Date(sub.current_period_end) - now) / (1000 * 60 * 60 * 24))
        }
      })),
      pendingPayments: (pendingPayments || []).map(payment => ({
        id: payment.id,
        type: 'pending_payment',
        title: 'Pagamento pendente',
        message: `Pagamento de R$ ${parseFloat(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente de confirmação - ${payment.customer?.name || 'Cliente'}`,
        date: payment.created_at,
        priority: 'medium',
        data: {
          paymentId: payment.id,
          customerId: payment.customer?.id,
          customerName: payment.customer?.name,
          customerCpf: payment.customer?.cpf,
          amount: payment.amount,
          planName: payment.plan?.name
        }
      })),
      newCustomers: (newCustomers || []).map(customer => ({
        id: customer.id,
        type: 'new_customer',
        title: 'Novo cliente cadastrado',
        message: `${customer.name || 'Cliente'} se cadastrou nas últimas 24h`,
        date: customer.created_at,
        priority: 'low',
        data: {
          customerId: customer.id,
          customerName: customer.name,
          customerCpf: customer.cpf,
          customerEmail: customer.email
        }
      })),
      canceledAppointments: canceledAppointments,
      total: (subscriptionsExpiring?.length || 0) + 
             (pendingPayments?.length || 0) + 
             (newCustomers?.length || 0) + 
             canceledAppointments.length
    };

    return notifications;
  } catch (error) {
    globalLogger.error('Erro ao buscar notificações administrativas', {
      error: error.message
    });
    return {
      subscriptionsExpiring: [],
      pendingPayments: [],
      canceledAppointments: [],
      newCustomers: [],
      total: 0
    };
  }
}

module.exports = {
  getAdminNotifications
};

