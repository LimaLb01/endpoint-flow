import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../utils/api';

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState('financial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
  const [period, setPeriod] = useState('month');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Dados dos relatórios
  const [financialReport, setFinancialReport] = useState(null);
  const [customersData, setCustomersData] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [subscriptionsReport, setSubscriptionsReport] = useState(null);
  const [appointmentsReport, setAppointmentsReport] = useState(null);

  // Carregar relatório financeiro
  const loadFinancialReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.obterRelatorioFinanceiro(period, month, year);
      if (result?.success) {
        setFinancialReport(result.report);
      } else {
        setError('Erro ao carregar relatório financeiro');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar relatório financeiro');
    } finally {
      setLoading(false);
    }
  };

  // Carregar clientes para exportação
  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.exportarClientes(startDate || undefined, endDate || undefined);
      if (result?.success) {
        setCustomersData(result.customers);
      } else {
        setError('Erro ao carregar clientes');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Carregar pagamentos para exportação
  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.exportarPagamentos(startDate || undefined, endDate || undefined);
      if (result?.success) {
        setPaymentsData(result.payments);
      } else {
        setError('Erro ao carregar pagamentos');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar relatório de assinaturas
  const loadSubscriptionsReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.obterRelatorioAssinaturas(null, startDate || undefined, endDate || undefined);
      if (result?.success) {
        setSubscriptionsReport(result.report);
      } else {
        setError('Erro ao carregar relatório de assinaturas');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar relatório de assinaturas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar relatório de agendamentos
  const loadAppointmentsReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.obterRelatorioAgendamentos(startDate || undefined, endDate || undefined);
      if (result?.success) {
        setAppointmentsReport(result.report);
      } else {
        setError('Erro ao carregar relatório de agendamentos');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar relatório de agendamentos');
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar para CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar vírgulas e aspas
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Carregar dados quando a aba muda
  useEffect(() => {
    if (activeTab === 'financial') {
      loadFinancialReport();
    } else if (activeTab === 'customers') {
      loadCustomers();
    } else if (activeTab === 'payments') {
      loadPayments();
    } else if (activeTab === 'subscriptions') {
      loadSubscriptionsReport();
    } else if (activeTab === 'appointments') {
      loadAppointmentsReport();
    }
  }, [activeTab]);

  return (
    <Layout>
      <div className="p-6 md:p-10">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-dark dark:text-white mb-2">
            Relatórios e Exportação
          </h1>
          <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
            Gere relatórios financeiros, exporte dados e visualize estatísticas
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-[#e5e5dc] dark:border-[#3a3928]">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'financial', label: 'Financeiro', icon: 'attach_money' },
              { id: 'customers', label: 'Clientes', icon: 'groups' },
              { id: 'payments', label: 'Pagamentos', icon: 'payments' },
              { id: 'subscriptions', label: 'Assinaturas', icon: 'credit_card' },
              { id: 'appointments', label: 'Agendamentos', icon: 'event' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-neutral-dark font-semibold'
                    : 'text-[#8c8b5f] dark:text-[#a3a272] hover:bg-neutral-light dark:hover:bg-[#2e2d1a]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="bg-white dark:bg-[#1a190b] rounded-lg border border-[#e5e5dc] dark:border-[#3a3928] p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">
                refresh
              </span>
            </div>
          )}

          {/* Relatório Financeiro */}
          {activeTab === 'financial' && !loading && (
            <div>
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Período
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  >
                    <option value="month">Mensal</option>
                    <option value="year">Anual</option>
                  </select>
                </div>
                {period === 'month' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                      Mês
                    </label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white w-32"
                  />
                </div>
                <button
                  onClick={loadFinancialReport}
                  className="px-6 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Gerar Relatório
                </button>
              </div>

              {financialReport && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Total Geral</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {api.formatarMoeda(financialReport.summary.totalGeral)}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Pagamentos Manuais</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {api.formatarMoeda(financialReport.summary.totalManuais)}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Pagamentos Stripe</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {api.formatarMoeda(financialReport.summary.totalStripe)}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Total de Pagamentos</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {financialReport.summary.totalPagamentos}
                      </p>
                    </div>
                  </div>

                  {financialReport.porPlano.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-neutral-dark dark:text-white">
                        Receita por Plano
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                              <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Plano</th>
                              <th className="text-right py-2 px-4 text-neutral-dark dark:text-white">Quantidade</th>
                              <th className="text-right py-2 px-4 text-neutral-dark dark:text-white">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialReport.porPlano.map(plano => (
                              <tr key={plano.plan_id} className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                                <td className="py-2 px-4 text-neutral-dark dark:text-white">{plano.plan_name}</td>
                                <td className="py-2 px-4 text-right text-neutral-dark dark:text-white">{plano.count}</td>
                                <td className="py-2 px-4 text-right text-neutral-dark dark:text-white">
                                  {api.formatarMoeda(plano.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Exportar Clientees */}
          {activeTab === 'customers' && !loading && (
            <div>
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <button
                  onClick={loadCustomers}
                  className="px-6 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Carregar
                </button>
                {customersData && (
                  <button
                    onClick={() => exportToCSV(customersData, `clientes_${new Date().toISOString().split('T')[0]}.csv`)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined inline mr-2">download</span>
                    Exportar CSV
                  </button>
                )}
              </div>

              {customersData && (
                <div>
                  <p className="mb-4 text-neutral-dark dark:text-white">
                    Total de clientes: <strong>{customersData.length}</strong>
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">CPF</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Nome</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Email</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Telefone</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Data Cadastro</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Assinatura Ativa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersData.slice(0, 50).map(customer => (
                          <tr key={customer.id} className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">
                              {customer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">{customer.name || 'N/A'}</td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">{customer.email || 'N/A'}</td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">{customer.phone || 'N/A'}</td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">
                              {api.formatarData(customer.created_at)}
                            </td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">
                              {customer.hasActiveSubscription ? 'Sim' : 'Não'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {customersData.length > 50 && (
                      <p className="mt-4 text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                        Mostrando 50 de {customersData.length} clientes. Exporte para CSV para ver todos.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Exportar Pagamentos */}
          {activeTab === 'payments' && !loading && (
            <div>
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <button
                  onClick={loadPayments}
                  className="px-6 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Carregar
                </button>
                {paymentsData && (
                  <button
                    onClick={() => exportToCSV(paymentsData, `pagamentos_${new Date().toISOString().split('T')[0]}.csv`)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined inline mr-2">download</span>
                    Exportar CSV
                  </button>
                )}
              </div>

              {paymentsData && (
                <div>
                  <p className="mb-4 text-neutral-dark dark:text-white">
                    Total de pagamentos: <strong>{paymentsData.length}</strong>
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Tipo</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Data</th>
                          <th className="text-right py-2 px-4 text-neutral-dark dark:text-white">Valor</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Cliente</th>
                          <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Plano</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentsData.slice(0, 50).map(payment => (
                          <tr key={payment.id} className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">{payment.tipo}</td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">
                              {api.formatarData(payment.data)}
                            </td>
                            <td className="py-2 px-4 text-right text-neutral-dark dark:text-white">
                              {api.formatarMoeda(payment.valor)}
                            </td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">{payment.cliente}</td>
                            <td className="py-2 px-4 text-neutral-dark dark:text-white">{payment.plano}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {paymentsData.length > 50 && (
                      <p className="mt-4 text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                        Mostrando 50 de {paymentsData.length} pagamentos. Exporte para CSV para ver todos.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Relatório de Assinaturas */}
          {activeTab === 'subscriptions' && !loading && (
            <div>
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <button
                  onClick={loadSubscriptionsReport}
                  className="px-6 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Gerar Relatório
                </button>
              </div>

              {subscriptionsReport && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Total</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {subscriptionsReport.stats.total}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Ativas</p>
                      <p className="text-2xl font-bold text-green-600">{subscriptionsReport.stats.ativas}</p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Canceladas</p>
                      <p className="text-2xl font-bold text-red-600">{subscriptionsReport.stats.canceladas}</p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Vencidas</p>
                      <p className="text-2xl font-bold text-orange-600">{subscriptionsReport.stats.vencidas}</p>
                    </div>
                  </div>

                  {subscriptionsReport.stats.porPlano.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-neutral-dark dark:text-white">
                        Assinaturas por Plano
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                              <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Plano</th>
                              <th className="text-right py-2 px-4 text-neutral-dark dark:text-white">Total</th>
                              <th className="text-right py-2 px-4 text-neutral-dark dark:text-white">Ativas</th>
                              <th className="text-right py-2 px-4 text-neutral-dark dark:text-white">Canceladas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subscriptionsReport.stats.porPlano.map(plano => (
                              <tr key={plano.plan_id} className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                                <td className="py-2 px-4 text-neutral-dark dark:text-white">{plano.plan_name}</td>
                                <td className="py-2 px-4 text-right text-neutral-dark dark:text-white">{plano.total}</td>
                                <td className="py-2 px-4 text-right text-green-600">{plano.ativas}</td>
                                <td className="py-2 px-4 text-right text-red-600">{plano.canceladas}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Relatório de Agendamentos */}
          {activeTab === 'appointments' && !loading && (
            <div>
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  />
                </div>
                <button
                  onClick={loadAppointmentsReport}
                  className="px-6 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Gerar Relatório
                </button>
              </div>

              {appointmentsReport && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Total</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {appointmentsReport.stats.total}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Confirmados</p>
                      <p className="text-2xl font-bold text-green-600">{appointmentsReport.stats.confirmados}</p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Cancelados</p>
                      <p className="text-2xl font-bold text-red-600">{appointmentsReport.stats.cancelados}</p>
                    </div>
                  </div>

                  {appointmentsReport.stats.porBarbeiro.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-neutral-dark dark:text-white">
                        Agendamentos por Barbeiro
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                              <th className="text-left py-2 px-4 text-neutral-dark dark:text-white">Barbeiro</th>
                              <th className="text-right py-2 px-4 text-neutral-dark dark:text-white">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointmentsReport.stats.porBarbeiro.map(barber => (
                              <tr key={barber.barberName} className="border-b border-[#e5e5dc] dark:border-[#3a3928]">
                                <td className="py-2 px-4 text-neutral-dark dark:text-white">{barber.barberName}</td>
                                <td className="py-2 px-4 text-right text-neutral-dark dark:text-white">{barber.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

