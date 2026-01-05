import { useEffect, useState } from 'react';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

export default function Agendamentos() {
  // Função helper para formatar data no formato YYYY-MM-DD usando fuso horário local
  const formatarDataLocal = (data) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  // Calcular datas iniciais
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximos30 = new Date(hoje);
  proximos30.setDate(hoje.getDate() + 30);

  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [barbeiros, setBarbeiros] = useState([]);
  const [filtros, setFiltros] = useState({
    startDate: formatarDataLocal(hoje),
    endDate: formatarDataLocal(proximos30),
    barberId: '',
    buscaCliente: '',
    status: ''
  });
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroRapidoAtivo, setFiltroRapidoAtivo] = useState(null);

  // Carregar barbeiros ao montar
  useEffect(() => {
    const carregarBarbeiros = async () => {
      try {
        const dados = await api.listarBarbeiros();
        // Filtrar apenas barbeiros reais (não "Sem preferência")
        const barbeirosFiltrados = (dados || []).filter(b => 
          b.id && !b.id.startsWith('sem_preferencia')
        );
        setBarbeiros(barbeirosFiltrados);
      } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
      }
    };
    carregarBarbeiros();
  }, []);

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarAgendamentos();
    }, 300);

    return () => clearTimeout(timer);
  }, [filtros.startDate, filtros.endDate, filtros.barberId]);

  // Filtrar agendamentos localmente (busca e status)
  useEffect(() => {
    let filtrados = [...agendamentos];

    // Filtro por busca de cliente
    if (filtros.buscaCliente) {
      const busca = filtros.buscaCliente.toLowerCase();
      filtrados = filtrados.filter(ag => 
        ag.clientName?.toLowerCase().includes(busca) ||
        ag.clientPhone?.includes(busca) ||
        ag.clientEmail?.toLowerCase().includes(busca) ||
        ag.service?.toLowerCase().includes(busca)
      );
    }

    // Filtro por status
    if (filtros.status) {
      filtrados = filtrados.filter(ag => ag.status === filtros.status);
    }

    setAgendamentosFiltrados(filtrados);
  }, [agendamentos, filtros.buscaCliente, filtros.status]);

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

  // Funções de filtros rápidos
  const aplicarFiltroRapido = (tipo) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let startDate, endDate;
    
    switch (tipo) {
      case 'hoje':
        startDate = formatarDataLocal(hoje);
        endDate = formatarDataLocal(hoje);
        break;
      case 'esta_semana':
        // Esta Semana: Domingo a Sábado da semana atual (pode incluir dias passados)
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo da semana atual
        inicioSemana.setHours(0, 0, 0, 0);
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado da semana atual
        fimSemana.setHours(23, 59, 59, 999);
        startDate = formatarDataLocal(inicioSemana);
        endDate = formatarDataLocal(fimSemana);
        break;
      case 'este_mes':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        inicioMes.setHours(0, 0, 0, 0);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        fimMes.setHours(23, 59, 59, 999);
        startDate = formatarDataLocal(inicioMes);
        endDate = formatarDataLocal(fimMes);
        break;
      case 'proximos_7_dias':
        // Próximos 7 Dias: De hoje até 7 dias à frente (sempre futuro, sem dias passados)
        startDate = formatarDataLocal(hoje);
        const proximos7 = new Date(hoje);
        proximos7.setDate(hoje.getDate() + 7);
        proximos7.setHours(23, 59, 59, 999);
        endDate = formatarDataLocal(proximos7);
        break;
      case 'proximos_30_dias':
        startDate = formatarDataLocal(hoje);
        const proximos30 = new Date(hoje);
        proximos30.setDate(hoje.getDate() + 30);
        proximos30.setHours(23, 59, 59, 999);
        endDate = formatarDataLocal(proximos30);
        break;
      default:
        return;
    }
    
    setFiltros({ ...filtros, startDate, endDate });
    setFiltroRapidoAtivo(tipo); // Marcar como ativo
  };

  const limparFiltros = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const proximos30 = new Date(hoje);
    proximos30.setDate(hoje.getDate() + 30);
    
    setFiltros({
      startDate: formatarDataLocal(hoje),
      endDate: formatarDataLocal(proximos30),
      barberId: '',
      buscaCliente: '',
      status: ''
    });
    setFiltroRapidoAtivo(null); // Limpar seleção de filtro rápido
  };

  // Verificar se um filtro rápido está ativo baseado nas datas
  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = formatarDataLocal(hoje);
    
    // Se as datas mudarem manualmente, verificar se corresponde a algum filtro rápido
    if (filtros.startDate === hojeStr && filtros.endDate === hojeStr) {
      setFiltroRapidoAtivo('hoje');
    } else {
      // Verificar outros filtros apenas se não houver busca ou outros filtros ativos
      if (!filtros.buscaCliente && !filtros.barberId && !filtros.status) {
        // Verificar se corresponde a algum filtro rápido
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        
        if (filtros.startDate === formatarDataLocal(inicioSemana) && 
            filtros.endDate === formatarDataLocal(fimSemana)) {
          setFiltroRapidoAtivo('esta_semana');
        } else {
          const proximos7 = new Date(hoje);
          proximos7.setDate(hoje.getDate() + 7);
          if (filtros.startDate === hojeStr && 
              filtros.endDate === formatarDataLocal(proximos7)) {
            setFiltroRapidoAtivo('proximos_7_dias');
          } else {
            const proximos30 = new Date(hoje);
            proximos30.setDate(hoje.getDate() + 30);
            if (filtros.startDate === hojeStr && 
                filtros.endDate === formatarDataLocal(proximos30)) {
              setFiltroRapidoAtivo('proximos_30_dias');
            } else {
              const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
              const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
              if (filtros.startDate === formatarDataLocal(inicioMes) && 
                  filtros.endDate === formatarDataLocal(fimMes)) {
                setFiltroRapidoAtivo('este_mes');
              } else {
                setFiltroRapidoAtivo(null);
              }
            }
          }
        }
      } else {
        setFiltroRapidoAtivo(null);
      }
    }
  }, [filtros.startDate, filtros.endDate, filtros.buscaCliente, filtros.barberId, filtros.status]);

  // Validar datas
  const validarDatas = () => {
    if (filtros.startDate && filtros.endDate) {
      const start = new Date(filtros.startDate);
      const end = new Date(filtros.endDate);
      if (start > end) {
        alert('A data inicial não pode ser maior que a data final!');
        return false;
      }
    }
    return true;
  };

  const agendamentosPorData = agendamentosFiltrados.reduce((acc, agendamento) => {
    const data = new Date(agendamento.start);
    const dataKey = data.toLocaleDateString('pt-BR');
    
    if (!acc[dataKey]) {
      acc[dataKey] = [];
    }
    acc[dataKey].push(agendamento);
    return acc;
  }, {});

  const agendamentosHoje = agendamentosFiltrados.filter(ag => {
    const hoje = new Date();
    const dataAg = new Date(ag.start);
    return dataAg.toDateString() === hoje.toDateString();
  });

  return (
    <Layout>
      <div className="p-6 md:p-10 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Filtros */}
        <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-dark dark:text-white">Filtros</h3>
            <button
              onClick={limparFiltros}
              className="px-4 h-9 rounded-full bg-neutral-light dark:bg-[#2e2d1a] text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium hover:bg-neutral dark:hover:bg-[#3e3d2a] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Limpar Filtros
            </button>
          </div>

          {/* Filtros Rápidos */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => aplicarFiltroRapido('hoje')}
              className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
                filtroRapidoAtivo === 'hoje'
                  ? 'bg-primary text-neutral-dark dark:text-white shadow-md'
                  : 'bg-neutral-light dark:bg-[#2e2d1a] text-[#8c8b5f] dark:text-[#a3a272] hover:bg-primary hover:text-neutral-dark dark:hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => aplicarFiltroRapido('esta_semana')}
              className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
                filtroRapidoAtivo === 'esta_semana'
                  ? 'bg-primary text-neutral-dark dark:text-white shadow-md'
                  : 'bg-neutral-light dark:bg-[#2e2d1a] text-[#8c8b5f] dark:text-[#a3a272] hover:bg-primary hover:text-neutral-dark dark:hover:text-white'
              }`}
              title="Domingo a Sábado da semana atual"
            >
              Esta Semana
            </button>
            <button
              onClick={() => aplicarFiltroRapido('este_mes')}
              className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
                filtroRapidoAtivo === 'este_mes'
                  ? 'bg-primary text-neutral-dark dark:text-white shadow-md'
                  : 'bg-neutral-light dark:bg-[#2e2d1a] text-[#8c8b5f] dark:text-[#a3a272] hover:bg-primary hover:text-neutral-dark dark:hover:text-white'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => aplicarFiltroRapido('proximos_7_dias')}
              className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
                filtroRapidoAtivo === 'proximos_7_dias'
                  ? 'bg-primary text-neutral-dark dark:text-white shadow-md'
                  : 'bg-neutral-light dark:bg-[#2e2d1a] text-[#8c8b5f] dark:text-[#a3a272] hover:bg-primary hover:text-neutral-dark dark:hover:text-white'
              }`}
              title="De hoje até 7 dias à frente (apenas futuro)"
            >
              Próximos 7 Dias
            </button>
            <button
              onClick={() => aplicarFiltroRapido('proximos_30_dias')}
              className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
                filtroRapidoAtivo === 'proximos_30_dias'
                  ? 'bg-primary text-neutral-dark dark:text-white shadow-md'
                  : 'bg-neutral-light dark:bg-[#2e2d1a] text-[#8c8b5f] dark:text-[#a3a272] hover:bg-primary hover:text-neutral-dark dark:hover:text-white'
              }`}
            >
              Próximos 30 Dias
            </button>
          </div>

          {/* Filtros Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={filtros.startDate}
                onChange={(e) => {
                  setFiltros({ ...filtros, startDate: e.target.value });
                  setTimeout(validarDatas, 100);
                }}
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
                onChange={(e) => {
                  setFiltros({ ...filtros, endDate: e.target.value });
                  setTimeout(validarDatas, 100);
                }}
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
                {barbeiros.map(barber => (
                  <option key={barber.id} value={barber.id}>
                    {barber.title || barber.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                Buscar (Cliente/Serviço)
              </label>
              <input
                type="text"
                value={filtros.buscaCliente}
                onChange={(e) => setFiltros({ ...filtros, buscaCliente: e.target.value })}
                placeholder="Nome, telefone, email..."
                className="w-full h-10 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-none text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full h-10 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-none text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos</option>
                <option value="confirmed">Confirmado</option>
                <option value="tentative">Tentativo</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
            <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">
              Total de Agendamentos
              {filtros.buscaCliente || filtros.status ? (
                <span className="ml-2 text-xs">({agendamentos.length} total)</span>
              ) : null}
            </p>
            <p className="text-3xl font-bold text-neutral-dark dark:text-white">{agendamentosFiltrados.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
            <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Agendamentos Hoje</p>
            <p className="text-3xl font-bold text-primary">{agendamentosHoje.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
            <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Próximos 7 Dias</p>
            <p className="text-3xl font-bold text-neutral-dark dark:text-white">
              {agendamentosFiltrados.filter(ag => {
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
        ) : agendamentosFiltrados.length === 0 ? (
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

