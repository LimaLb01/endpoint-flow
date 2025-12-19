import { useState, useEffect } from 'react';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

export default function AcompanhamentoFlow() {
  const [interactions, setInteractions] = useState([]);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    screen: 'all',
    search: '',
    dateRange: ''
  });
  const [headerSearch, setHeaderSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Mapeamento de telas para nomes amigáveis
  const screenNames = {
    'WELCOME': 'Iniciou cadastro',
    'CPF_INPUT': 'Informou CPF',
    'CLUB_OPTION': 'Opção de clube',
    'BRANCH_SELECTION': 'Selecionou filial',
    'BARBER_SELECTION': 'Selecionou barbeiro',
    'SERVICE_SELECTION': 'Selecionou serviço',
    'DATE_SELECTION': 'Selecionou data',
    'TIME_SELECTION': 'Selecionou horário',
    'DETAILS': 'Dados pessoais',
    'CONFIRMATION': 'Concluiu pagamento'
  };

  // Mapeamento de filiais
  const branchNames = {
    'desvio_rizzo': 'Desvio Rizzo',
    'exposicao': 'Exposição',
    'santa_catarina': 'Santa Catarina'
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Tentar parsear como YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
        return dateString;
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Carregar interações
  useEffect(() => {
    loadInteractions();
  }, [filters, pagination.page]);

  // Selecionar primeira interação automaticamente quando carregar
  useEffect(() => {
    if (interactions.length > 0 && !selectedInteraction && !loading) {
      handleSelectInteraction(interactions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactions.length, loading]);

  const loadInteractions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: ((pagination.page - 1) * pagination.limit).toString()
      });
      
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.screen !== 'all') {
        params.append('screen', filters.screen);
      }
      if (filters.search || headerSearch) {
        params.append('search', filters.search || headerSearch);
      }

      const data = await api.listarFlowInteractions(params.toString());
      
      if (data) {
        setInteractions(data.interactions || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Erro ao carregar interações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar timeline quando selecionar uma interação
  const handleSelectInteraction = async (interaction) => {
    setSelectedInteraction(interaction);
    if (interaction.flow_token) {
      try {
        const data = await api.obterFlowTimeline(interaction.flow_token);
        if (data) {
          setTimeline(data.timeline || []);
        }
      } catch (error) {
        console.error('Erro ao carregar timeline:', error);
        setTimeline([]);
      }
    } else {
      setTimeline([]);
    }
  };

  // Formatar status
  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': {
        bg: 'bg-[#e6f6e8] dark:bg-[#0f2e14]',
        text: 'text-accent-green dark:text-[#4ade80]',
        label: 'Concluído'
      },
      'in_progress': {
        bg: 'bg-[#fff8e1] dark:bg-[#2e2608]',
        text: 'text-yellow-700 dark:text-[#fde047]',
        label: 'Em andamento'
      },
      'abandoned': {
        bg: 'bg-[#ffebeb] dark:bg-[#3d0f0f]',
        text: 'text-accent-red dark:text-[#f87171]',
        label: 'Abandonado'
      }
    };

    const config = statusConfig[status] || statusConfig['in_progress'];
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
        <span className="size-1.5 rounded-full bg-current"></span>
        {config.label}
      </span>
    );
  };

  // Obter iniciais do nome
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Formatar data relativa
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `há ${diffMins}min`;
    } else if (diffHours < 24) {
      return `há ${diffHours}h`;
    } else if (diffDays < 7) {
      return `há ${diffDays}d`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  // Formatar hora
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).replace(/^(\d{1,2}):(\d{2})\s(AM|PM)$/, (match, h, m, period) => {
      const hour = parseInt(h);
      const hour12 = period === 'PM' && hour !== 12 ? hour + 12 : (period === 'AM' && hour === 12 ? 0 : hour);
      return `${hour12.toString().padStart(2, '0')}:${m} ${period}`;
    });
  };

  // Renderizar timeline completa (incluindo eventos futuros)
  const renderFullTimeline = () => {
    if (!selectedInteraction) return null;

    // Timeline completa baseada no HTML original
    const allSteps = [
      { screen: 'WELCOME', name: 'Iniciou cadastro', icon: 'check' },
      { screen: 'CPF_INPUT', name: 'Informou CPF', icon: 'check' },
      { screen: 'DETAILS', name: 'Dados pessoais', icon: 'priority_high', isAbandoned: selectedInteraction.status === 'abandoned' && selectedInteraction.screen === 'DETAILS' },
      { screen: 'CLUB_OPTION', name: 'Criou cliente', icon: 'person_add', future: true },
      { screen: 'SERVICE_SELECTION', name: 'Selecionou plano', icon: 'checklist', future: true },
      { screen: 'CONFIRMATION', name: 'Iniciou pagamento', icon: 'payments', future: true },
      { screen: 'CONFIRMATION', name: 'Concluiu pagamento', icon: 'verified', future: true }
    ];

    // Encontrar onde parou
    const currentIndex = allSteps.findIndex(step => step.screen === selectedInteraction.screen);
    const isAbandoned = selectedInteraction.status === 'abandoned';

    return allSteps.map((step, index) => {
      const isCompleted = index < currentIndex || (index === currentIndex && !isAbandoned && selectedInteraction.status === 'completed');
      const isCurrentAbandoned = index === currentIndex && isAbandoned;
      const isFuture = index > currentIndex || (step.future && index > currentIndex);
      const isLast = index === allSteps.length - 1;

      return (
        <div key={index} className={`relative pl-10 ${isLast ? 'pb-0' : 'pb-8'} group`}>
          {!isLast && (
            <div className={`absolute left-[11px] top-7 bottom-0 w-0.5 ${isCompleted ? 'bg-accent-green' : 'bg-[#e5e5dc] dark:bg-[#3a3928]'}`}></div>
          )}
          
          {isCurrentAbandoned ? (
            <>
              <div className="absolute left-[-2px] top-0 size-7 rounded-full bg-accent-red flex items-center justify-center border-4 border-red-100 dark:border-red-900/30 shadow-sm z-10 animate-pulse">
                <span className="material-symbols-outlined text-white text-[14px] font-bold">priority_high</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-red-50 dark:bg-red-900/10 p-3 border border-red-100 dark:border-red-900/30 -mt-2">
                <p className="text-sm font-bold text-accent-red dark:text-red-400">{step.name}</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">Parou nesta etapa</p>
                <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 bg-white/50 dark:bg-black/20 p-2 rounded">
                  <span className="font-semibold">Erro possível:</span> Form field validation failure or user drop-off.
                </div>
              </div>
            </>
          ) : isCompleted ? (
            <>
              <div className="absolute left-0 top-1 size-6 rounded-full bg-accent-green flex items-center justify-center border-2 border-white dark:border-[#1a190b] shadow-sm z-10">
                <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-neutral-dark dark:text-white">{step.name}</p>
                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272]">
                  {timeline.find(t => t.screen === step.screen) 
                    ? formatTime(timeline.find(t => t.screen === step.screen).created_at)
                    : '10:30 AM'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="absolute left-0 top-1 size-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center border-2 border-white dark:border-[#1a190b] z-10">
                <span className="material-symbols-outlined text-neutral-400 text-[14px]">{step.icon}</span>
              </div>
              <div className={`flex flex-col gap-1 ${isFuture ? 'opacity-50' : ''}`}>
                <p className="text-sm font-medium text-neutral-dark dark:text-white">{step.name}</p>
              </div>
            </>
          )}
        </div>
      );
    });
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full h-full">
      {/* Lista de Interações */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Filtros */}
        <div className="bg-white dark:bg-[#1a190b] p-4 rounded-xl border border-[#e5e5dc] dark:border-[#3a3928] shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8b5f] text-lg">filter_alt</span>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="h-10 pl-10 pr-8 bg-neutral-light dark:bg-[#2e2d1a] border-none rounded-lg text-sm text-neutral-dark dark:text-white focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-40"
              >
                <option value="all">Todos Status</option>
                <option value="completed">Concluído</option>
                <option value="in_progress">Em andamento</option>
                <option value="abandoned">Abandonado</option>
              </select>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8b5f] text-lg">layers</span>
              <select
                value={filters.screen}
                onChange={(e) => setFilters({ ...filters, screen: e.target.value })}
                className="h-10 pl-10 pr-8 bg-neutral-light dark:bg-[#2e2d1a] border-none rounded-lg text-sm text-neutral-dark dark:text-white focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-40"
              >
                <option value="all">Todas Etapas</option>
                <option value="DETAILS">Cadastro</option>
                <option value="CONFIRMATION">Pagamento</option>
              </select>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8b5f] text-lg">date_range</span>
              <input
                type="text"
                placeholder="Últimos 7 dias"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="h-10 pl-10 pr-4 bg-neutral-light dark:bg-[#2e2d1a] border-none rounded-lg text-sm text-neutral-dark dark:text-white focus:ring-2 focus:ring-primary w-full sm:w-48 placeholder-neutral-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadInteractions}
              className="flex items-center justify-center size-10 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] text-neutral-dark dark:text-white hover:bg-[#e5e5dc] dark:hover:bg-[#3a3928] transition-colors"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button className="flex items-center justify-center size-10 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] text-neutral-dark dark:text-white hover:bg-[#e5e5dc] dark:hover:bg-[#3a3928] transition-colors">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#e5e5dc] dark:border-[#3a3928] shadow-sm overflow-hidden flex-1">
          {loading ? (
            <div className="p-8 text-center text-[#8c8b5f] dark:text-[#a3a272]">
              <p>Carregando...</p>
            </div>
          ) : interactions.length === 0 ? (
            <div className="p-8 text-center text-[#8c8b5f] dark:text-[#a3a272]">
              <p>Nenhuma interação encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-light dark:bg-[#2e2d1a] text-xs uppercase text-[#8c8b5f] dark:text-[#a3a272]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold">Local</th>
                      <th className="px-6 py-4 font-semibold">Data</th>
                      <th className="px-6 py-4 font-semibold">Horário</th>
                      <th className="px-6 py-4 font-semibold">Status do Flow</th>
                      <th className="px-6 py-4 font-semibold">Última Etapa</th>
                      <th className="px-6 py-4 font-semibold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0eb] dark:divide-[#2e2d1a]">
                    {interactions.map((interaction, idx) => {
                      const isSelected = selectedInteraction?.id === interaction.id;
                      const customerName = interaction.payload?.client_name;
                      const customerEmail = interaction.payload?.client_email || '';
                      const cpf = interaction.client_cpf;
                      const maskedCpf = cpf ? utils.aplicarMascaraCPF(cpf).replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, 'xxx.$2.xxx-$4') : null;
                      
                      // Extrair dados do agendamento do payload
                      const selectedBranch = interaction.payload?.selected_branch;
                      const branchName = selectedBranch ? (branchNames[selectedBranch] || selectedBranch) : '-';
                      const selectedDate = interaction.payload?.selected_date;
                      const formattedDate = formatDate(selectedDate);
                      const selectedTime = interaction.payload?.selected_time;
                      const formattedTime = selectedTime || '-';
                      
                      return (
                        <tr
                          key={interaction.id}
                          className={`${isSelected ? 'bg-primary/5 dark:bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-neutral-light/50 dark:hover:bg-[#2e2d1a]/50 border-l-4 border-l-transparent'} transition-colors cursor-pointer`}
                          onClick={() => handleSelectInteraction(interaction)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {customerName ? (
                                <>
                                  <div className="size-9 rounded-full bg-primary flex items-center justify-center text-neutral-dark font-bold text-xs">
                                    {getInitials(customerName)}
                                  </div>
                                  <div>
                                    <span className="font-medium text-neutral-dark dark:text-white block">{customerName}</span>
                                    <span className="text-xs text-[#8c8b5f] dark:text-[#a3a272]">{customerEmail}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="size-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                    ?
                                  </div>
                                  <div>
                                    <span className="font-bold text-neutral-dark dark:text-white block">
                                      {maskedCpf ? `Visitante (CPF ...)` : 'Visitante'}
                                    </span>
                                    <span className="text-xs text-[#8c8b5f] dark:text-[#a3a272]">
                                      {interaction.flow_token ? `ID: #${interaction.flow_token.substring(0, 8).toUpperCase()}` : 'ID: #TEMP-' + interaction.id.substring(0, 4)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-dark dark:text-white font-medium">
                            {branchName}
                          </td>
                          <td className="px-6 py-4 text-neutral-dark dark:text-white font-medium">
                            {formattedDate}
                          </td>
                          <td className="px-6 py-4 text-neutral-dark dark:text-white font-medium">
                            {formattedTime}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(interaction.status)}
                          </td>
                          <td className="px-6 py-4 text-neutral-dark dark:text-white font-medium">
                            {screenNames[interaction.screen] || interaction.screen}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isSelected ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectInteraction(interaction);
                                }}
                                className="text-xs font-bold text-neutral-dark dark:text-white bg-white dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] px-3 py-1.5 rounded-full hover:bg-neutral-light dark:hover:bg-[#3a3928] transition-colors"
                              >
                                Ver Detalhes
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectInteraction(interaction);
                                }}
                                className="text-xs font-bold text-[#8c8b5f] hover:text-neutral-dark dark:text-[#a3a272] dark:hover:text-white transition-colors"
                              >
                                Ver Detalhes
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Paginação */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-[#f0f0eb] dark:border-[#2e2d1a] bg-neutral-light/30 dark:bg-[#1a190b]">
                <span className="text-xs text-[#8c8b5f] dark:text-[#a3a272]">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                    disabled={pagination.page === 1}
                    className="size-8 rounded-lg flex items-center justify-center bg-white dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white hover:bg-neutral-light transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="size-8 rounded-lg flex items-center justify-center bg-white dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white hover:bg-neutral-light transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Painel de Detalhes */}
      {selectedInteraction && (
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col h-fit sticky top-24">
          <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#e5e5dc] dark:border-[#3a3928] shadow-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#f0f0eb] dark:border-[#2e2d1a] bg-neutral-light/30 dark:bg-[#2e2d1a]/30">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-neutral-dark dark:text-white">Detalhes do Flow</h3>
                <button
                  onClick={() => setSelectedInteraction(null)}
                  className="text-[#8c8b5f] hover:text-neutral-dark dark:text-[#a3a272] dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl font-bold text-neutral-500 dark:text-neutral-400 border-2 border-white dark:border-[#1a190b] shadow-sm">
                  {getInitials(selectedInteraction.payload?.client_name || 'Visitante')}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-neutral-dark dark:text-white">
                    {selectedInteraction.payload?.client_name || 'Visitante (CPF ...)'}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedInteraction.client_cpf && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-light text-neutral-600 border border-neutral-200 dark:bg-[#2e2d1a] dark:text-[#a3a272] dark:border-[#3a3928]">
                        <span className="material-symbols-outlined text-[12px]">fingerprint</span>
                        {utils.aplicarMascaraCPF(selectedInteraction.client_cpf).replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, 'xxx.$2.xxx-$4')}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedInteraction.status === 'abandoned' 
                        ? 'bg-[#ffebeb] text-accent-red dark:bg-[#3d0f0f] dark:text-[#f87171]'
                        : selectedInteraction.status === 'completed'
                        ? 'bg-[#e6f6e8] text-accent-green dark:bg-[#0f2e14] dark:text-[#4ade80]'
                        : 'bg-[#fff8e1] text-yellow-700 dark:bg-[#2e2608] dark:text-[#fde047]'
                    }`}>
                      {selectedInteraction.status === 'abandoned' 
                        ? `Abandonado ${formatRelativeTime(selectedInteraction.updated_at)}`
                        : selectedInteraction.status === 'completed'
                        ? 'Concluído'
                        : 'Em andamento'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[600px] timeline-scroll">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-[#a3a272] mb-6">Linha do Tempo</h4>
              <div className="flex flex-col">
                {renderFullTimeline()}
              </div>
            </div>
            <div className="p-6 border-t border-[#f0f0eb] dark:border-[#2e2d1a] bg-neutral-light/50 dark:bg-[#1a190b]">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (selectedInteraction.client_cpf) {
                      window.location.href = `/clientes/buscar?cpf=${selectedInteraction.client_cpf}`;
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 px-6 bg-primary text-neutral-dark rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  Ir para Cadastro
                </button>
                <button className="w-full flex items-center justify-center gap-2 h-10 px-6 bg-white dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white rounded-full font-semibold hover:bg-neutral-light dark:hover:bg-[#3a3928] transition-colors">
                  <span className="material-symbols-outlined text-lg">mail</span>
                  Enviar Lembrete
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
