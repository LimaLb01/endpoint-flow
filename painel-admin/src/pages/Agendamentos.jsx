import { useEffect, useState } from 'react';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    barberId: ''
  });
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
  }, [filtros]);

  const carregarAgendamentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const dados = await api.listarAgendamentos({
        startDate: filtros.startDate ? new Date(filtros.startDate).toISOString() : undefined,
        endDate: filtros.endDate ? new Date(filtros.endDate).toISOString() : undefined,
        barberId: filtros.barberId || undefined,
        maxResults: 250
      });
      
      setAgendamentos(dados || []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setError(error.message || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (eventId, barberId) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      await api.cancelarAgendamento(eventId, barberId);
      alert('Agendamento cancelado com sucesso!');
      carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      alert('Erro ao cancelar agendamento: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const formatarHora = (dataISO) => {
    if (!dataISO) return 'N/A';
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarDataCompleta = (dataISO) => {
    if (!dataISO) return 'N/A';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const agendamentosPorData = agendamentos.reduce((acc, agendamento) => {
    const data = new Date(agendamento.start);
    const dataKey = data.toLocaleDateString('pt-BR');
    
    if (!acc[dataKey]) {
      acc[dataKey] = [];
    }
    acc[dataKey].push(agendamento);
    return acc;
  }, {});

  const agendamentosHoje = agendamentos.filter(ag => {
    const hoje = new Date();
    const dataAg = new Date(ag.start);
    return dataAg.toDateString() === hoje.toDateString();
  });

  return (
    <Layout>
      <div className="p-6 md:p-10 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Filtros */}
        <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
          <h3 className="text-lg font-bold text-neutral-dark dark:text-white mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={filtros.startDate}
                onChange={(e) => setFiltros({ ...filtros, startDate: e.target.value })}
                className="w-full h-10 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-none text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={filtros.endDate}
                onChange={(e) => setFiltros({ ...filtros, endDate: e.target.value })}
                className="w-full h-10 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-none text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                Barbeiro
              </label>
              <select
                value={filtros.barberId}
                onChange={(e) => setFiltros({ ...filtros, barberId: e.target.value })}
                className="w-full h-10 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-none text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos</option>
                {/* Opções serão preenchidas dinamicamente se necessário */}
              </select>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
            <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Total de Agendamentos</p>
            <p className="text-3xl font-bold text-neutral-dark dark:text-white">{agendamentos.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
            <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Agendamentos Hoje</p>
            <p className="text-3xl font-bold text-primary">{agendamentosHoje.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
            <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Próximos 7 Dias</p>
            <p className="text-3xl font-bold text-neutral-dark dark:text-white">
              {agendamentos.filter(ag => {
                const dataAg = new Date(ag.start);
                const hoje = new Date();
                const seteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
                return dataAg >= hoje && dataAg <= seteDias;
              }).length}
            </p>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
              <p className="text-[#8c8b5f] dark:text-[#a3a272]">Carregando agendamentos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-800 dark:text-red-300 font-bold mb-2">Erro ao carregar agendamentos</p>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={carregarAgendamentos}
              className="mt-4 px-4 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] text-center py-20">
            <span className="material-symbols-outlined text-6xl text-[#8c8b5f] dark:text-[#a3a272] mb-4">event_busy</span>
            <p className="text-lg font-bold text-neutral-dark dark:text-white mb-2">Nenhum agendamento encontrado</p>
            <p className="text-[#8c8b5f] dark:text-[#a3a272]">Tente ajustar os filtros de data</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(agendamentosPorData).map(([data, agendamentosDoDia]) => (
              <div key={data} className="bg-white dark:bg-[#1a190b] rounded-xl shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
                <div className="p-4 border-b border-[#f0f0eb] dark:border-[#2e2d1a]">
                  <h3 className="text-lg font-bold text-neutral-dark dark:text-white">{data}</h3>
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                    {agendamentosDoDia.length} agendamento{agendamentosDoDia.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="divide-y divide-[#f0f0eb] dark:divide-[#2e2d1a]">
                  {agendamentosDoDia.map((agendamento, index) => (
                    <div
                      key={`${agendamento.id}-${agendamento.barberId}-${index}`}
                      className="p-4 hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors cursor-pointer"
                      onClick={() => {
                        setAgendamentoSelecionado(agendamento);
                        setMostrarModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-primary">
                              {formatarHora(agendamento.start)}
                            </span>
                            <span className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                              até {formatarHora(agendamento.end)}
                            </span>
                          </div>
                          <h4 className="font-bold text-neutral-dark dark:text-white mb-1">
                            {agendamento.service} - {agendamento.clientName}
                          </h4>
                          <div className="flex flex-wrap gap-4 text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                            <span>✂️ {agendamento.barber}</span>
                            {agendamento.clientPhone && (
                              <span>📞 {utils.aplicarMascaraTelefone(agendamento.clientPhone)}</span>
                            )}
                            {agendamento.clientEmail && (
                              <span>📧 {agendamento.clientEmail}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {agendamento.htmlLink && (
                            <a
                              href={agendamento.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-full bg-primary text-neutral-dark hover:brightness-95 transition-all"
                              title="Abrir no Google Calendar"
                            >
                              <span className="material-symbols-outlined text-lg">open_in_new</span>
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelar(agendamento.id, agendamento.barberId);
                            }}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Cancelar agendamento"
                          >
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalhes */}
        {mostrarModal && agendamentoSelecionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a190b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#f0f0eb] dark:border-[#2e2d1a] flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-dark dark:text-white">Detalhes do Agendamento</h2>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="p-2 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Serviço</p>
                  <p className="font-bold text-neutral-dark dark:text-white">{agendamentoSelecionado.service}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Cliente</p>
                  <p className="font-bold text-neutral-dark dark:text-white">{agendamentoSelecionado.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Data e Hora</p>
                  <p className="font-bold text-neutral-dark dark:text-white">
                    {formatarDataCompleta(agendamentoSelecionado.start)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Barbeiro</p>
                  <p className="font-bold text-neutral-dark dark:text-white">{agendamentoSelecionado.barber}</p>
                </div>
                {agendamentoSelecionado.clientPhone && (
                  <div>
                    <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Telefone</p>
                    <p className="font-bold text-neutral-dark dark:text-white">
                      {utils.aplicarMascaraTelefone(agendamentoSelecionado.clientPhone)}
                    </p>
                  </div>
                )}
                {agendamentoSelecionado.clientEmail && (
                  <div>
                    <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Email</p>
                    <p className="font-bold text-neutral-dark dark:text-white">{agendamentoSelecionado.clientEmail}</p>
                  </div>
                )}
                {agendamentoSelecionado.notes && (
                  <div>
                    <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Observações</p>
                    <p className="font-bold text-neutral-dark dark:text-white">{agendamentoSelecionado.notes}</p>
                  </div>
                )}
                {agendamentoSelecionado.location && (
                  <div>
                    <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Localização</p>
                    <p className="font-bold text-neutral-dark dark:text-white">{agendamentoSelecionado.location}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  {agendamentoSelecionado.htmlLink && (
                    <a
                      href={agendamentoSelecionado.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 h-10 rounded-full bg-primary text-neutral-dark font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">open_in_new</span>
                      Abrir no Google Calendar
                    </a>
                  )}
                  <button
                    onClick={() => {
                      handleCancelar(agendamentoSelecionado.id, agendamentoSelecionado.barberId);
                      setMostrarModal(false);
                    }}
                    className="flex-1 px-4 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">cancel</span>
                    Cancelar Agendamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

