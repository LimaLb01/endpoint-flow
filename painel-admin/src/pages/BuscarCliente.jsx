import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';
import { toast } from '../utils/toast';
import Tooltip from '../components/Tooltip';

export default function BuscarCliente() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState(searchParams.get('cpf') || '');
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState('');
  const [modo, setModo] = useState('buscar'); // 'buscar' ou 'criar'
  
  // Estados para criar cliente
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [criando, setCriando] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [detalhesAssinatura, setDetalhesAssinatura] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [pagamentos, setPagamentos] = useState([]);
  
  // Estados para edição de cliente
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [dadosEdicao, setDadosEdicao] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [errosEdicao, setErrosEdicao] = useState({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  
  // Estados para lista de clientes
  const [listaClientes, setListaClientes] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [totalClientes, setTotalClientes] = useState(0);

  // Estados para busca global
  const [modoBusca, setModoBusca] = useState('cpf'); // 'cpf' ou 'global'
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const buscaGlobalInputRef = useRef(null); // Ref para acessar o valor atual do input
  const [tipoBusca, setTipoBusca] = useState('all'); // 'all', 'customers', 'subscriptions', 'payments'
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState(null);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [historicoBuscas, setHistoricoBuscas] = useState([]);

  const buscar = async (cpfParaBuscar = null) => {
    const cpfBuscar = cpfParaBuscar || cpf;
    const cpfLimpo = cpfBuscar.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      setError('Por favor, digite um CPF válido');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await api.buscarCliente(cpfBuscar);
      if (data && data.customer) {
        setCliente(data);
      } else {
        setError('Cliente não encontrado');
        setCliente(null);
      }
    } catch (err) {
      setError(err.message || 'Erro ao buscar cliente');
      setCliente(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (e) => {
    setCpf(utils.aplicarMascaraCPF(e.target.value));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscar();
    }
  };

  const iniciais = cliente?.customer?.name
    ? cliente.customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '';

  const assinaturaAtiva = cliente?.subscriptions?.find(s => s.status === 'active');

  // Funções para criar cliente
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: utils.aplicarMascaraCPF(value) }));
    } else if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: utils.aplicarMascaraTelefone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const novosErros = {};
    
    if (!formData.name.trim()) {
      novosErros.name = 'Nome é obrigatório';
    }
    
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      novosErros.cpf = 'CPF inválido ou já cadastrado';
    }
    
    if (!formData.phone.trim()) {
      novosErros.phone = 'Telefone é obrigatório';
    }
    
    if (!formData.email.trim()) {
      novosErros.email = 'Email é obrigatório';
    } else if (!utils.validarEmail(formData.email)) {
      novosErros.email = 'Formato de e-mail inválido';
    }
    
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleCriarCliente = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setCriando(true);
    setError('');
    
    try {
      const resultado = await api.criarCliente(formData);
      
      if (resultado && resultado.customer) {
        // Limpar formulário
        setFormData({ name: '', cpf: '', phone: '', email: '' });
        setErrors({});
        
        // Voltar para modo buscar e buscar o cliente criado
        setModo('buscar');
        setCpf(resultado.customer.cpf);
        setCliente(null); // Limpar cliente anterior para forçar nova busca
        await buscar(resultado.customer.cpf);
        // Recarregar lista após criar (será recarregada automaticamente pelo useEffect)
      }
    } catch (err) {
      const errorMessage = err.message || 'Erro ao criar cliente';
      
      if (errorMessage.includes('já existe') || 
          errorMessage.includes('já cadastrado') || 
          errorMessage.includes('409')) {
        setErrors({ cpf: 'CPF já cadastrado' });
        setError('Este CPF já está cadastrado no sistema');
      } else {
        setError(errorMessage);
      }
    } finally {
      setCriando(false);
    }
  };

  const carregarDetalhesAssinatura = async (subscriptionId) => {
    setCarregandoDetalhes(true);
    setError('');
    try {
      console.log('Carregando detalhes da assinatura:', subscriptionId);
      const detalhes = await api.obterAssinatura(subscriptionId);
      console.log('Detalhes carregados:', detalhes);
      
      if (!detalhes) {
        throw new Error('Assinatura não encontrada');
      }
      
      setDetalhesAssinatura(detalhes);
      
      // Buscar pagamentos do cliente via API
      if (detalhes?.customer?.id) {
        try {
          const pagamentosData = await api.listarPagamentos({ 
            customer_id: detalhes.customer.id,
            limit: 20
          });
          console.log('Pagamentos carregados:', pagamentosData);
          setPagamentos(pagamentosData || []);
        } catch (err) {
          console.warn('Erro ao buscar pagamentos:', err);
          setPagamentos([]);
        }
      } else {
        console.warn('Detalhes não têm customer.id');
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      setError('Erro ao carregar detalhes da assinatura: ' + (error.message || 'Erro desconhecido'));
      setDetalhesAssinatura(null);
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  // Carregar histórico de buscas do localStorage
  useEffect(() => {
    const historico = localStorage.getItem('historicoBuscas');
    if (historico) {
      try {
        setHistoricoBuscas(JSON.parse(historico));
      } catch (err) {
        console.error('Erro ao carregar histórico de buscas:', err);
      }
    }
  }, []);

  // Salvar busca no histórico
  const salvarNoHistorico = (query, type) => {
    if (!query || query.trim().length === 0) return;
    
    const novaBusca = {
      query: query.trim(),
      type,
      timestamp: new Date().toISOString()
    };
    
    const novoHistorico = [
      novaBusca,
      ...historicoBuscas.filter(b => b.query !== novaBusca.query || b.type !== novaBusca.type)
    ].slice(0, 10); // Manter apenas as últimas 10 buscas
    
    setHistoricoBuscas(novoHistorico);
    localStorage.setItem('historicoBuscas', JSON.stringify(novoHistorico));
  };

  // Busca global
  const realizarBuscaGlobal = async () => {
    // Usar ref para obter o valor atual do input (evita problemas de closure)
    const valorAtual = buscaGlobalInputRef.current?.value || buscaGlobal;
    console.log('🔍 Iniciando busca global:', { 
      buscaGlobal: buscaGlobal, 
      valorAtual: valorAtual,
      tipoBusca: tipoBusca, 
      buscaGlobalLength: buscaGlobal?.length 
    });
    
    if (!valorAtual || (!valorAtual.trim() && tipoBusca === 'all')) {
      console.warn('⚠️ Validação falhou: buscaGlobal vazio e tipoBusca é "all"');
      setError('Digite um termo de busca ou selecione um tipo específico');
      return;
    }
    
    console.log('✅ Validação passou, continuando...');

    setCarregandoBusca(true);
    setError('');
    
    try {
      const filters = {
        query: valorAtual.trim(),
        type: tipoBusca,
        limit: 50,
        offset: 0
      };

      if (filtrosAvancados.status) filters.status = filtrosAvancados.status;
      if (filtrosAvancados.startDate) filters.startDate = filtrosAvancados.startDate;
      if (filtrosAvancados.endDate) filters.endDate = filtrosAvancados.endDate;
      if (filtrosAvancados.minAmount) filters.minAmount = parseFloat(filtrosAvancados.minAmount);
      if (filtrosAvancados.maxAmount) filters.maxAmount = parseFloat(filtrosAvancados.maxAmount);

      console.log('📤 Enviando requisição com filtros:', filters);
      const data = await api.buscarGlobal(filters);
      console.log('📥 Resposta recebida:', data);
      
      if (data && data.results) {
        setResultadosBusca(data.results);
        salvarNoHistorico(valorAtual, tipoBusca);
        const total = (data.results.customers?.length || 0) + (data.results.subscriptions?.length || 0) + (data.results.payments?.length || 0);
        if (total > 0) {
          toast.success(`${total} resultado(s) encontrado(s)`);
        } else {
          toast.info('Nenhum resultado encontrado');
        }
      } else {
        setResultadosBusca({ customers: [], subscriptions: [], payments: [], total: 0 });
        toast.info('Nenhum resultado encontrado');
      }
    } catch (err) {
      setError(err.message || 'Erro ao realizar busca');
      setResultadosBusca(null);
    } finally {
      setCarregandoBusca(false);
    }
  };

  // Carregar lista de clientes ao montar o componente
  useEffect(() => {
    const carregarListaClientes = async () => {
      if (modo !== 'buscar' || cliente || mostrarDetalhes || modoBusca === 'global') return;
      
      setCarregandoLista(true);
      try {
        const data = await api.listarClientes(50, 0);
        if (data) {
          setListaClientes(data.customers || []);
          setTotalClientes(data.count || 0);
        }
      } catch (err) {
        console.error('Erro ao carregar lista de clientes:', err);
        setListaClientes([]);
      } finally {
        setCarregandoLista(false);
      }
    };

    carregarListaClientes();
  }, [modo, cliente, mostrarDetalhes, modoBusca]);

  return (
    <Layout>
      <header className="flex items-center justify-between border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">
            {modo === 'buscar' ? 'Buscar' : 'Criar Cliente'}
          </h2>
        </div>
        {modo === 'buscar' && (
          <button
            onClick={() => {
              setModo('criar');
              setCliente(null);
              setError('');
            }}
            className="h-10 px-6 rounded-full bg-primary text-[#181811] text-sm font-bold shadow-sm hover:brightness-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Criar Cliente
          </button>
        )}
      </header>

      <div className="p-4 md:p-10 flex flex-col gap-8 max-w-[1200px] mx-auto w-full">
        {mostrarDetalhes ? (
          /* Tela de Detalhes da Assinatura */
          carregandoDetalhes ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
                <p className="text-[#8c8b5f] dark:text-[#a3a272]">Carregando detalhes...</p>
              </div>
            </div>
          ) : detalhesAssinatura ? (
            <div className="flex flex-col gap-8">
              {/* Botão Voltar */}
              <div className="mb-6 flex items-center gap-2">
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="flex items-center gap-1 text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] hover:text-neutral-dark dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Voltar para consultar cliente
                </button>
              </div>

              {/* Status Banner */}
              <div className="w-full rounded-2xl bg-primary/10 border border-primary/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                    detalhesAssinatura.status === 'active' 
                      ? 'bg-primary' 
                      : detalhesAssinatura.status === 'canceled'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}>
                    <span className={`material-symbols-outlined ${
                      detalhesAssinatura.status === 'active' 
                        ? 'text-black' 
                        : 'text-white'
                    }`}>
                      {detalhesAssinatura.status === 'active' 
                        ? 'check_circle' 
                        : detalhesAssinatura.status === 'canceled'
                        ? 'cancel'
                        : 'warning'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#181811] dark:text-white text-base">
                      Assinatura {detalhesAssinatura.status === 'active' ? 'Ativa' : detalhesAssinatura.status === 'canceled' ? 'Cancelada' : 'Vencida'}
                    </h3>
                    <p className="text-[#8c8b5f] dark:text-gray-300 text-sm">
                      {detalhesAssinatura.current_period_end 
                        ? `Próxima renovação em ${utils.formatarData(detalhesAssinatura.current_period_end)}`
                        : 'Sem renovação programada'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Principal */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Cliente e Plano */}
                <div className="xl:col-span-1 flex flex-col gap-8">
                  {/* Card Cliente */}
                  <div className="bg-white dark:bg-[#1a190b] rounded-3xl p-6 shadow-sm border border-[#e6e6db] dark:border-[#3a392a]">
                    <div className="flex items-start justify-between mb-6">
                      <h3 className="text-lg font-bold text-[#181811] dark:text-white">Cliente</h3>
                      {!editandoCliente && (
                        <button
                          onClick={() => {
                            const customer = detalhesAssinatura?.customer || cliente?.customer;
                            if (customer) {
                              setDadosEdicao({
                                name: customer.name || '',
                                email: customer.email || '',
                                phone: customer.phone || ''
                              });
                              setErrosEdicao({});
                              setEditandoCliente(true);
                            }
                          }}
                          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Editar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="size-24 rounded-full bg-[#f8f8f5] dark:bg-[#23220f] border-4 border-[#f8f8f5] dark:border-[#23220f] mb-4 flex items-center justify-center text-3xl font-bold text-[#8c8b5f]">
                        {detalhesAssinatura?.customer?.name 
                          ? detalhesAssinatura.customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : cliente?.customer?.name 
                            ? cliente.customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : '??'}
                      </div>
                      {editandoCliente ? (
                        <input
                          type="text"
                          value={dadosEdicao.name}
                          onChange={(e) => {
                            setDadosEdicao({ ...dadosEdicao, name: e.target.value });
                            if (errosEdicao.name) {
                              setErrosEdicao({ ...errosEdicao, name: '' });
                            }
                          }}
                          className="text-xl font-bold text-[#181811] dark:text-white bg-transparent border-b-2 border-primary focus:outline-none text-center w-full"
                          placeholder="Nome completo"
                        />
                      ) : (
                        <h4 className="text-xl font-bold text-[#181811] dark:text-white">
                          {detalhesAssinatura?.customer?.name || cliente?.customer?.name || 'N/A'}
                        </h4>
                      )}
                      <p className="text-[#8c8b5f] dark:text-gray-400 text-sm mt-1">
                        {(detalhesAssinatura?.customer?.created_at || cliente?.customer?.created_at)
                          ? `Membro desde ${new Date((detalhesAssinatura?.customer?.created_at || cliente?.customer?.created_at)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                          : 'Cliente'}
                      </p>
                    </div>
                    {editandoCliente ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const customer = detalhesAssinatura?.customer || cliente?.customer;
                          if (!customer) return;

                          // Validação
                          const novosErros = {};
                          if (!dadosEdicao.name.trim()) {
                            novosErros.name = 'Nome é obrigatório';
                          }
                          if (!dadosEdicao.email.trim()) {
                            novosErros.email = 'Email é obrigatório';
                          } else if (!utils.validarEmail(dadosEdicao.email)) {
                            novosErros.email = 'Formato de e-mail inválido';
                          }
                          if (!dadosEdicao.phone.trim()) {
                            novosErros.phone = 'Telefone é obrigatório';
                          }

                          if (Object.keys(novosErros).length > 0) {
                            setErrosEdicao(novosErros);
                            return;
                          }

                          setSalvandoEdicao(true);
                          setError('');

                          try {
                            await api.atualizarCliente(customer.cpf, dadosEdicao);
                            
                            // Atualizar dados locais
                            if (detalhesAssinatura?.customer) {
                              setDetalhesAssinatura({
                                ...detalhesAssinatura,
                                customer: {
                                  ...detalhesAssinatura.customer,
                                  ...dadosEdicao
                                }
                              });
                            }
                            if (cliente?.customer) {
                              setCliente({
                                ...cliente,
                                customer: {
                                  ...cliente.customer,
                                  ...dadosEdicao
                                }
                              });
                            }

                            setEditandoCliente(false);
                            setErrosEdicao({});
                          } catch (err) {
                            setError(err.message || 'Erro ao atualizar cliente');
                          } finally {
                            setSalvandoEdicao(false);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-[#8c8b5f] dark:text-gray-500 font-medium">Nome</label>
                          <input
                            type="text"
                            value={dadosEdicao.name}
                            onChange={(e) => {
                              setDadosEdicao({ ...dadosEdicao, name: e.target.value });
                              if (errosEdicao.name) {
                                setErrosEdicao({ ...errosEdicao, name: '' });
                              }
                            }}
                            className={`w-full h-10 px-3 rounded-lg bg-[#f8f8f5] dark:bg-[#23220f] border-2 ${
                              errosEdicao.name ? 'border-red-500' : 'border-transparent'
                            } focus:border-primary focus:ring-0 text-[#181811] dark:text-white transition-all`}
                            placeholder="Nome completo"
                          />
                          {errosEdicao.name && (
                            <p className="text-xs text-red-500">{errosEdicao.name}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-[#8c8b5f] dark:text-gray-500 font-medium">Email</label>
                          <input
                            type="email"
                            value={dadosEdicao.email}
                            onChange={(e) => {
                              setDadosEdicao({ ...dadosEdicao, email: e.target.value });
                              if (errosEdicao.email) {
                                setErrosEdicao({ ...errosEdicao, email: '' });
                              }
                            }}
                            className={`w-full h-10 px-3 rounded-lg bg-[#f8f8f5] dark:bg-[#23220f] border-2 ${
                              errosEdicao.email ? 'border-red-500' : 'border-transparent'
                            } focus:border-primary focus:ring-0 text-[#181811] dark:text-white transition-all`}
                            placeholder="email@exemplo.com"
                          />
                          {errosEdicao.email && (
                            <p className="text-xs text-red-500">{errosEdicao.email}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-[#8c8b5f] dark:text-gray-500 font-medium">Telefone</label>
                          <input
                            type="tel"
                            value={dadosEdicao.phone}
                            onChange={(e) => {
                              const formatted = utils.aplicarMascaraTelefone(e.target.value);
                              setDadosEdicao({ ...dadosEdicao, phone: formatted });
                              if (errosEdicao.phone) {
                                setErrosEdicao({ ...errosEdicao, phone: '' });
                              }
                            }}
                            className={`w-full h-10 px-3 rounded-lg bg-[#f8f8f5] dark:bg-[#23220f] border-2 ${
                              errosEdicao.phone ? 'border-red-500' : 'border-transparent'
                            } focus:border-primary focus:ring-0 text-[#181811] dark:text-white transition-all`}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                          {errosEdicao.phone && (
                            <p className="text-xs text-red-500">{errosEdicao.phone}</p>
                          )}
                        </div>

                        {error && (
                          <div className="text-red-500 text-sm">{error}</div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={salvandoEdicao}
                            className="flex-1 h-10 px-4 rounded-lg bg-primary text-[#181811] font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {salvandoEdicao ? (
                              <>
                                <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                                Salvando...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-lg">save</span>
                                Salvar
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoCliente(false);
                              setErrosEdicao({});
                              setError('');
                            }}
                            className="h-10 px-4 rounded-lg border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white font-medium hover:bg-[#f8f8f5] dark:hover:bg-[#23220f] transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f8f5] dark:bg-[#23220f]">
                          <span className="material-symbols-outlined text-[#8c8b5f] dark:text-gray-500">mail</span>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs text-[#8c8b5f] dark:text-gray-500 font-medium">Email</span>
                            <span className="text-sm font-semibold text-[#181811] dark:text-white truncate">
                              {detalhesAssinatura?.customer?.email || cliente?.customer?.email || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f8f5] dark:bg-[#23220f]">
                          <span className="material-symbols-outlined text-[#8c8b5f] dark:text-gray-500">call</span>
                          <div className="flex flex-col">
                            <span className="text-xs text-[#8c8b5f] dark:text-gray-500 font-medium">Telefone</span>
                            <span className="text-sm font-semibold text-[#181811] dark:text-white">
                              {detalhesAssinatura?.customer?.phone || cliente?.customer?.phone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Plano */}
                  <div className="bg-white dark:bg-[#1a190b] rounded-3xl p-6 shadow-sm border border-[#e6e6db] dark:border-[#3a392a]">
                    <h3 className="text-lg font-bold text-[#181811] dark:text-white mb-6">Plano Atual</h3>
                    <div className="flex flex-col gap-6">
                      <div>
                        <p className="text-sm text-[#8c8b5f] dark:text-gray-400 mb-1">Nome do Plano</p>
                        <p className="text-base font-bold text-[#181811] dark:text-white">
                          {detalhesAssinatura.plan?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[#8c8b5f] dark:text-gray-400 mb-1">Valor</p>
                          <p className="text-base font-bold text-[#181811] dark:text-white">
                            {detalhesAssinatura.plan?.price 
                              ? utils.formatarMoeda(parseFloat(detalhesAssinatura.plan.price))
                              : 'N/A'}
                            {detalhesAssinatura.plan?.type === 'monthly' && (
                              <span className="text-xs font-normal text-[#8c8b5f] dark:text-gray-500 ml-1">/mês</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#8c8b5f] dark:text-gray-400 mb-1">Ciclo</p>
                          <p className="text-base font-bold text-[#181811] dark:text-white">
                            {detalhesAssinatura.plan?.type === 'monthly' ? 'Mensal' : 
                             detalhesAssinatura.plan?.type === 'yearly' ? 'Anual' : 'Único'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Histórico */}
                <div className="xl:col-span-2 flex flex-col h-full">
                  <div className="bg-white dark:bg-[#1a190b] rounded-3xl p-6 shadow-sm border border-[#e6e6db] dark:border-[#3a392a] flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-lg font-bold text-[#181811] dark:text-white">Histórico de Pagamentos</h3>
                    </div>
                    
                    {pagamentos.length > 0 ? (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#e6e6db] dark:border-[#3a392a]">
                              <th className="py-4 pl-4 pr-3 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500">Status</th>
                              <th className="py-4 px-3 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500">Data</th>
                              <th className="py-4 px-3 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500">Descrição</th>
                              <th className="py-4 px-3 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500">Método</th>
                              <th className="py-4 pl-3 pr-4 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e6e6db] dark:divide-[#3a392a]">
                            {pagamentos.map((pagamento) => (
                              <tr key={pagamento.id} className="group hover:bg-[#f8f8f5] dark:hover:bg-[#23220f] transition-colors">
                                <td className="py-4 pl-4 pr-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <span className="size-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                                    Pago
                                  </span>
                                </td>
                                <td className="py-4 px-3 text-sm font-medium text-[#181811] dark:text-white whitespace-nowrap">
                                  {utils.formatarData(pagamento.payment_date)}
                                </td>
                                <td className="py-4 px-3 text-sm text-[#8c8b5f] dark:text-gray-400">
                                  {pagamento.notes || 'Pagamento confirmado'}
                                </td>
                                <td className="py-4 px-3 text-sm text-[#8c8b5f] dark:text-gray-400">
                                  {pagamento.confirmed_by || 'Manual'}
                                </td>
                                <td className="py-4 pl-3 pr-4 text-sm font-bold text-[#181811] dark:text-white text-right">
                                  {utils.formatarMoeda(parseFloat(pagamento.amount))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-[#8c8b5f] dark:text-gray-400">
                        <p>Nenhum pagamento encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl text-[#8c8b5f]">error</span>
                <p className="text-[#8c8b5f] dark:text-[#a3a272]">
                  {error || 'Erro ao carregar detalhes da assinatura'}
                </p>
                <button
                  onClick={() => {
                    setMostrarDetalhes(false);
                    setError('');
                  }}
                  className="px-6 h-12 rounded-full bg-primary text-[#181811] font-bold shadow-sm hover:brightness-95 transition-all"
                >
                  Voltar
                </button>
              </div>
            </div>
          )
        ) : modo === 'criar' ? (
          <>
            <div className="mb-6 flex items-center gap-2">
              <button
                onClick={() => {
                  setModo('buscar');
                  setFormData({ name: '', cpf: '', phone: '', email: '' });
                  setErrors({});
                  setError('');
                }}
                className="flex items-center gap-1 text-sm font-medium text-[#8c8b5f] dark:text-[#a3a272] hover:text-neutral-dark dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Voltar para Buscar Cliente
              </button>
            </div>
            
            <div className="bg-white dark:bg-[#1a190b] rounded-xl shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] p-6 md:p-8">
              <div className="mb-8 border-b border-[#f0f0eb] dark:border-[#2e2d1a] pb-6">
                <h3 className="text-xl font-bold text-neutral-dark dark:text-white">Informações do Cliente</h3>
                <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mt-1">
                  Preencha os dados abaixo para registrar um novo cliente.
                </p>
              </div>
              
              <form onSubmit={handleCriarCliente} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-neutral-dark dark:text-white" htmlFor="name">
                    Nome completo <span className="text-accent-red">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className={`w-full h-12 px-4 rounded-xl bg-neutral-light dark:bg-[#2e2d1a] border-2 ${
                        errors.name ? 'border-accent-red' : 'border-transparent'
                      } focus:border-primary focus:ring-0 text-neutral-dark dark:text-white placeholder-[#8c8b5f] transition-all`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Ex: João da Silva"
                      type="text"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-accent-red font-medium flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.name}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-neutral-dark dark:text-white" htmlFor="cpf">
                      CPF <span className="text-accent-red">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className={`w-full h-12 px-4 rounded-xl bg-neutral-light dark:bg-[#2e2d1a] border-2 ${
                          errors.cpf ? 'border-accent-red' : 'border-transparent'
                        } focus:border-primary focus:ring-0 text-neutral-dark dark:text-white placeholder-[#8c8b5f] transition-all`}
                        id="cpf"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleFormChange}
                        placeholder="000.000.000-00"
                        type="text"
                        maxLength={14}
                      />
                    </div>
                    {errors.cpf && (
                      <p className="text-xs text-accent-red font-medium flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {errors.cpf}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-neutral-dark dark:text-white" htmlFor="phone">
                      Telefone <span className="text-accent-red">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className={`w-full h-12 px-4 rounded-xl bg-neutral-light dark:bg-[#2e2d1a] border-2 ${
                          errors.phone ? 'border-accent-red' : 'border-transparent'
                        } focus:border-primary focus:ring-0 text-neutral-dark dark:text-white placeholder-[#8c8b5f] transition-all`}
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="(00) 00000-0000"
                        type="tel"
                        maxLength={15}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-accent-red font-medium flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-neutral-dark dark:text-white" htmlFor="email">
                    Email <span className="text-accent-red">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className={`w-full h-12 px-4 rounded-xl bg-neutral-light dark:bg-[#2e2d1a] border-2 ${
                        errors.email ? 'border-accent-red' : 'border-transparent'
                      } focus:border-primary focus:ring-0 text-neutral-dark dark:text-white placeholder-[#8c8b5f] transition-all`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="cliente@exemplo.com"
                      type="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-accent-red font-medium flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.email}
                    </p>
                  )}
                </div>
                
                {error && (
                  <div className="text-accent-red text-sm font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#f0f0eb] dark:border-[#2e2d1a]">
                  <button
                    type="button"
                    onClick={() => {
                      setModo('buscar');
                      setFormData({ name: '', cpf: '', phone: '', email: '' });
                      setErrors({});
                      setError('');
                    }}
                    className="px-6 h-12 rounded-full border border-[#e5e5dc] dark:border-[#3a3928] font-bold text-neutral-dark dark:text-white hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={criando}
                    className="px-8 h-12 rounded-full bg-primary text-neutral-dark font-bold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {criando ? (
                      <>
                        <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                        Criando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">check</span>
                        Criar Cliente
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* Tabs de Modo de Busca */}
            <div className="flex gap-2 border-b border-[#e6e6db] dark:border-[#3a392a]">
              <button
                onClick={() => {
                  setModoBusca('cpf');
                  setResultadosBusca(null);
                  setBuscaGlobal('');
                  setError('');
                }}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                  modoBusca === 'cpf'
                    ? 'border-primary text-[#181811] dark:text-white'
                    : 'border-transparent text-[#8c8b5f] dark:text-[#a3a272] hover:text-[#181811] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg align-middle mr-2">id_card</span>
                Busca por CPF
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Mudando para modo global, buscaGlobal atual:', buscaGlobal);
                  setModoBusca('global');
                  setCliente(null);
                  setCpf('');
                  setError('');
                  // Não resetar buscaGlobal aqui para manter o valor digitado
                }}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                  modoBusca === 'global'
                    ? 'border-primary text-[#181811] dark:text-white'
                    : 'border-transparent text-[#8c8b5f] dark:text-[#a3a272] hover:text-[#181811] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg align-middle mr-2">search</span>
                Busca Avançada
              </button>
            </div>

            {/* Busca Global */}
            {modoBusca === 'global' ? (
              <div className="bg-white dark:bg-[#1a190b] rounded-lg shadow-sm border border-[#e6e6db] dark:border-[#3a392a] p-6">
                <div className="flex flex-col gap-4">
                  {/* Barra de Busca */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center rounded-full bg-[#f8f8f5] dark:bg-[#23220f] border border-[#e6e6db] dark:border-[#3a392a] focus-within:border-primary transition-all h-12 px-4">
                      <span className="material-symbols-outlined text-[#8c8b5f] dark:text-[#a3a272] mr-2">search</span>
                      <input
                        ref={buscaGlobalInputRef}
                        type="text"
                        value={buscaGlobal}
                        onChange={(e) => {
                          console.log('📝 Input onChange:', e.target.value);
                          setBuscaGlobal(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            console.log('⌨️ Enter pressionado, valor do input:', buscaGlobalInputRef.current?.value);
                            realizarBuscaGlobal();
                          }
                        }}
                        className="flex-1 bg-transparent border-none text-[#181811] dark:text-white placeholder:text-[#8c8b5f]/60 focus:ring-0 h-full"
                        placeholder="Buscar por nome, CPF, email..."
                      />
                    </div>
                    <select
                      value={tipoBusca}
                      onChange={(e) => setTipoBusca(e.target.value)}
                      className="h-12 px-4 rounded-full bg-[#f8f8f5] dark:bg-[#23220f] border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white focus:border-primary focus:ring-0"
                    >
                      <option value="all">Todos</option>
                      <option value="customers">Clientes</option>
                      <option value="subscriptions">Assinaturas</option>
                      <option value="payments">Pagamentos</option>
                    </select>
                    <Tooltip text="Buscar (ou pressione Enter)">
                      <button
                        onClick={() => {
                          console.log('🖱️ Botão clicado, valor do input:', buscaGlobalInputRef.current?.value);
                          realizarBuscaGlobal();
                        }}
                        disabled={carregandoBusca}
                        className="h-12 px-6 rounded-full bg-primary text-[#181811] font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2 animate-scale-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {carregandoBusca ? (
                          <>
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            Buscando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">search</span>
                            Buscar
                          </>
                        )}
                      </button>
                    </Tooltip>
                    <Tooltip text="Filtros avançados de busca">
                      <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`h-12 px-4 rounded-full border font-medium transition-all flex items-center justify-center gap-2 hover:scale-105 ${
                          mostrarFiltros
                          ? 'bg-primary text-[#181811] border-primary'
                          : 'bg-white dark:bg-[#1a190b] text-[#181811] dark:text-white border-[#e6e6db] dark:border-[#3a392a]'
                      }`}
                      >
                        <span className="material-symbols-outlined">tune</span>
                        Filtros
                      </button>
                    </Tooltip>
                  </div>

                  {/* Filtros Avançados */}
                  {mostrarFiltros && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[#f8f8f5] dark:bg-[#23220f] rounded-lg border border-[#e6e6db] dark:border-[#3a392a]">
                      {tipoBusca === 'subscriptions' || tipoBusca === 'all' ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-[#181811] dark:text-white">Status</label>
                          <select
                            value={filtrosAvancados.status}
                            onChange={(e) => setFiltrosAvancados({ ...filtrosAvancados, status: e.target.value })}
                            className="h-10 px-3 rounded-lg bg-white dark:bg-[#1a190b] border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white focus:border-primary focus:ring-0"
                          >
                            <option value="">Todos</option>
                            <option value="active">Ativo</option>
                            <option value="canceled">Cancelado</option>
                            <option value="past_due">Vencido</option>
                            <option value="unpaid">Não Pago</option>
                          </select>
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#181811] dark:text-white">Data Inicial</label>
                        <input
                          type="date"
                          value={filtrosAvancados.startDate}
                          onChange={(e) => setFiltrosAvancados({ ...filtrosAvancados, startDate: e.target.value })}
                          className="h-10 px-3 rounded-lg bg-white dark:bg-[#1a190b] border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white focus:border-primary focus:ring-0"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#181811] dark:text-white">Data Final</label>
                        <input
                          type="date"
                          value={filtrosAvancados.endDate}
                          onChange={(e) => setFiltrosAvancados({ ...filtrosAvancados, endDate: e.target.value })}
                          className="h-10 px-3 rounded-lg bg-white dark:bg-[#1a190b] border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white focus:border-primary focus:ring-0"
                        />
                      </div>
                      {(tipoBusca === 'payments' || tipoBusca === 'all') && (
                        <>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-[#181811] dark:text-white">Valor Mínimo</label>
                            <input
                              type="number"
                              step="0.01"
                              value={filtrosAvancados.minAmount}
                              onChange={(e) => setFiltrosAvancados({ ...filtrosAvancados, minAmount: e.target.value })}
                              className="h-10 px-3 rounded-lg bg-white dark:bg-[#1a190b] border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white focus:border-primary focus:ring-0"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-[#181811] dark:text-white">Valor Máximo</label>
                            <input
                              type="number"
                              step="0.01"
                              value={filtrosAvancados.maxAmount}
                              onChange={(e) => setFiltrosAvancados({ ...filtrosAvancados, maxAmount: e.target.value })}
                              className="h-10 px-3 rounded-lg bg-white dark:bg-[#1a190b] border border-[#e6e6db] dark:border-[#3a392a] text-[#181811] dark:text-white focus:border-primary focus:ring-0"
                              placeholder="0.00"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Histórico de Buscas */}
                  {historicoBuscas.length > 0 && !resultadosBusca && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-[#8c8b5f] dark:text-[#a3a272]">Buscas Recentes</p>
                      <div className="flex flex-wrap gap-2">
                        {historicoBuscas.slice(0, 5).map((busca, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setBuscaGlobal(busca.query);
                              setTipoBusca(busca.type);
                              realizarBuscaGlobal();
                            }}
                            className="px-3 py-1.5 rounded-full bg-[#f8f8f5] dark:bg-[#23220f] border border-[#e6e6db] dark:border-[#3a392a] text-sm text-[#181811] dark:text-white hover:bg-primary hover:text-[#181811] transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-base">history</span>
                            {busca.query}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Search Section - Busca por CPF */}
            {modoBusca === 'cpf' && (
            <div className="bg-white rounded-lg shadow-sm border border-[#e6e6db] overflow-hidden">
              <div className="p-6 md:p-10 flex flex-col items-center text-center gap-6">
                <div className="flex flex-col gap-2 max-w-lg">
                  <h1 className="text-[#181811] text-3xl md:text-4xl font-bold leading-tight">Buscar Cliente</h1>
                  <p className="text-[#8c8b5f] text-base font-normal">Digite o CPF do cliente para visualizar assinaturas e histórico.</p>
                </div>
                <div className="w-full max-w-xl flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  <label className="flex flex-col w-full flex-1 group">
                    <span className="text-[#181811] text-sm font-semibold mb-2 text-left ml-4">CPF do Cliente</span>
                    <div className="flex w-full items-center rounded-full bg-[#f8f8f5] border border-[#e6e6db] focus-within:border-[#181811] focus-within:ring-1 focus-within:ring-[#181811] transition-all h-14 px-2">
                      <div className="pl-4 pr-2 text-[#8c8b5f]">
                        <span className="material-symbols-outlined">id_card</span>
                      </div>
                      <input
                        type="text"
                        value={cpf}
                        onChange={handleCpfChange}
                        onKeyPress={handleKeyPress}
                        className="w-full bg-transparent border-none text-[#181811] placeholder:text-[#8c8b5f]/60 focus:ring-0 h-full text-lg"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                  </label>
                  <button
                    onClick={() => buscar()}
                    disabled={loading}
                    className="h-14 px-8 rounded-full bg-primary text-[#181811] text-base font-bold tracking-wide hover:brightness-95 active:scale-95 transition-all w-full sm:w-auto shadow-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">search</span>
                        Buscar
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="text-red-600 text-sm mt-2">{error}</div>
                )}
                {cliente && (
                  <button
                    onClick={() => {
                      setCliente(null);
                      setCpf('');
                      setError('');
                      setMostrarDetalhes(false);
                    }}
                    className="text-sm text-[#8c8b5f] dark:text-[#a3a272] hover:text-[#181811] dark:hover:text-white transition-colors flex items-center gap-1 mt-2"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                    Limpar busca e ver todos os clientes
                  </button>
                )}
              </div>
            </div>
            )}

            {/* Resultados da Busca Global */}
            {modoBusca === 'global' && resultadosBusca && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#181811] dark:text-white">
                    Resultados da Busca ({resultadosBusca.total})
                  </h2>
                  <button
                    onClick={() => {
                      setResultadosBusca(null);
                      setBuscaGlobal('');
                      setError('');
                    }}
                    className="text-sm text-[#8c8b5f] dark:text-[#a3a272] hover:text-[#181811] dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                    Limpar
                  </button>
                </div>

                {/* Clientes */}
                {(tipoBusca === 'all' || tipoBusca === 'customers') && resultadosBusca.customers && resultadosBusca.customers.length > 0 && (
                  <div className="bg-white dark:bg-[#1a190b] rounded-lg shadow-sm border border-[#e6e6db] dark:border-[#3a392a] p-6">
                    <h3 className="text-lg font-bold text-[#181811] dark:text-white mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined">people</span>
                      Clientes ({resultadosBusca.customers.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {resultadosBusca.customers.map((clienteItem) => {
                        const iniciaisCliente = clienteItem.name
                          ? clienteItem.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                          : '??';
                        return (
                          <div
                            key={clienteItem.id}
                            onClick={() => {
                              setCpf(clienteItem.cpf);
                              setModoBusca('cpf');
                              buscar(clienteItem.cpf);
                            }}
                            className="bg-[#f8f8f5] dark:bg-[#23220f] rounded-lg p-4 border border-[#e6e6db] dark:border-[#3a392a] cursor-pointer hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                                {iniciaisCliente}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-bold text-[#181811] dark:text-white truncate">
                                  {clienteItem.name || 'Sem nome'}
                                </h4>
                                <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] truncate">
                                  {utils.aplicarMascaraCPF(clienteItem.cpf)}
                                </p>
                                {clienteItem.email && (
                                  <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] truncate mt-1">
                                    {clienteItem.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assinaturas */}
                {(tipoBusca === 'all' || tipoBusca === 'subscriptions') && resultadosBusca.subscriptions && resultadosBusca.subscriptions.length > 0 && (
                  <div className="bg-white dark:bg-[#1a190b] rounded-lg shadow-sm border border-[#e6e6db] dark:border-[#3a392a] p-6">
                    <h3 className="text-lg font-bold text-[#181811] dark:text-white mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined">subscriptions</span>
                      Assinaturas ({resultadosBusca.subscriptions.length})
                    </h3>
                    <div className="space-y-3">
                      {resultadosBusca.subscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => {
                            if (sub.customer?.cpf) {
                              setCpf(sub.customer.cpf);
                              setModoBusca('cpf');
                              buscar(sub.customer.cpf);
                            }
                          }}
                          className="flex items-center justify-between p-4 bg-[#f8f8f5] dark:bg-[#23220f] rounded-lg border border-[#e6e6db] dark:border-[#3a392a] cursor-pointer hover:shadow-md transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#181811] dark:text-white">
                                {sub.customer?.name || 'Cliente desconhecido'}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                sub.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {sub.status === 'active' ? 'Ativo' : sub.status}
                              </span>
                            </div>
                            <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                              {sub.plan?.name || 'Plano desconhecido'} • {utils.formatarMoeda(parseFloat(sub.plan?.price || 0))}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-[#8c8b5f] dark:text-[#a3a272]">chevron_right</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagamentos */}
                {(tipoBusca === 'all' || tipoBusca === 'payments') && resultadosBusca.payments && resultadosBusca.payments.length > 0 && (
                  <div className="bg-white dark:bg-[#1a190b] rounded-lg shadow-sm border border-[#e6e6db] dark:border-[#3a392a] p-6">
                    <h3 className="text-lg font-bold text-[#181811] dark:text-white mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined">payments</span>
                      Pagamentos ({resultadosBusca.payments.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#e6e6db] dark:border-[#3a392a]">
                            <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500">Cliente</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500">Data</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500">Plano</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8c8b5f] dark:text-gray-500 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e6db] dark:divide-[#3a392a]">
                          {resultadosBusca.payments.map((payment) => (
                            <tr
                              key={payment.id}
                              onClick={() => {
                                if (payment.customer?.cpf) {
                                  setCpf(payment.customer.cpf);
                                  setModoBusca('cpf');
                                  buscar(payment.customer.cpf);
                                }
                              }}
                              className="hover:bg-[#f8f8f5] dark:hover:bg-[#23220f] cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4">
                                <p className="font-semibold text-[#181811] dark:text-white">
                                  {payment.customer?.name || 'Cliente desconhecido'}
                                </p>
                                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272]">
                                  {payment.customer?.cpf ? utils.aplicarMascaraCPF(payment.customer.cpf) : 'N/A'}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                                {utils.formatarData(payment.payment_date)}
                              </td>
                              <td className="py-3 px-4 text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                                {payment.plan?.name || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-sm font-bold text-[#181811] dark:text-white text-right">
                                {utils.formatarMoeda(parseFloat(payment.amount))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Nenhum resultado */}
                {resultadosBusca.total === 0 && (
                  <div className="bg-white dark:bg-[#1a190b] rounded-lg p-8 border border-[#e6e6db] dark:border-[#3a392a] text-center">
                    <span className="material-symbols-outlined text-4xl text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                      search_off
                    </span>
                    <p className="text-[#8c8b5f] dark:text-[#a3a272]">Nenhum resultado encontrado</p>
                  </div>
                )}
              </div>
            )}

            {/* Lista de Clientes */}
            {modoBusca === 'cpf' && !cliente && !mostrarDetalhes && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#181811] dark:text-white">
                    Todos os Clientes {totalClientes > 0 && `(${totalClientes})`}
                  </h2>
                </div>
                
                {carregandoLista ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
                      <p className="text-[#8c8b5f] dark:text-[#a3a272]">Carregando clientes...</p>
                    </div>
                  </div>
                ) : (
                  listaClientes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {listaClientes.map((clienteItem) => {
                      const iniciaisCliente = clienteItem.name
                        ? clienteItem.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : '??';
                      
                      return (
                        <div
                          key={clienteItem.id}
                          className="bg-white dark:bg-[#1a190b] rounded-lg p-4 border border-[#e6e6db] dark:border-[#3a392a] shadow-sm hover:shadow-md transition-all"
                        >
                          <div 
                            onClick={() => {
                              setCpf(clienteItem.cpf);
                              buscar(clienteItem.cpf);
                            }}
                            className="flex items-center gap-4 cursor-pointer"
                          >
                            <div className="size-12 rounded-full bg-[#f8f8f5] dark:bg-[#23220f] border border-[#e6e6db] dark:border-[#3a392a] flex items-center justify-center text-lg font-bold text-[#8c8b5f] dark:text-[#a3a272] flex-shrink-0">
                              {iniciaisCliente}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-[#181811] dark:text-white truncate">
                                {clienteItem.name || 'Sem nome'}
                              </h3>
                              <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] truncate">
                                {utils.aplicarMascaraCPF(clienteItem.cpf)}
                              </p>
                              {clienteItem.email && (
                                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] truncate mt-1">
                                  {clienteItem.email}
                                </p>
                              )}
                            </div>
                            <span className="material-symbols-outlined text-[#8c8b5f] dark:text-[#a3a272] flex-shrink-0">
                              chevron_right
                            </span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#e6e6db] dark:border-[#3a392a] flex justify-end">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Tem certeza que deseja excluir o cliente ${clienteItem.name || utils.aplicarMascaraCPF(clienteItem.cpf)}?`)) {
                                  try {
                                    await api.excluirCliente(clienteItem.id);
                                    // Recarregar lista
                                    const data = await api.listarClientes(50, 0);
                                    if (data) {
                                      setListaClientes(data.customers || []);
                                      setTotalClientes(data.count || 0);
                                    }
                                  } catch (err) {
                                    toast.error('Erro ao excluir cliente: ' + (err.message || 'Erro desconhecido'));
                                  }
                                }
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1a190b] rounded-lg p-8 border border-[#e6e6db] dark:border-[#3a392a] text-center">
                      <span className="material-symbols-outlined text-4xl text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                        person_off
                      </span>
                      <p className="text-[#8c8b5f] dark:text-[#a3a272]">Nenhum cliente cadastrado ainda</p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Results */}
            {cliente && cliente.customer && !mostrarDetalhes && (
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-lg p-6 border border-[#e6e6db] shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="size-20 rounded-full bg-[#f8f8f5] border border-[#e6e6db] flex items-center justify-center text-2xl font-bold text-[#8c8b5f]">
                      {iniciais}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-[#181811]">{cliente.customer.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          assinaturaAtiva 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {assinaturaAtiva ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#8c8b5f]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">mail</span>
                          {cliente.customer.email || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">call</span>
                          {cliente.customer.phone || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    {assinaturaAtiva && (
                      <button
                        onClick={async () => {
                          console.log('Botão Ver Detalhes clicado, mostrarDetalhes:', mostrarDetalhes);
                          if (!mostrarDetalhes) {
                            console.log('Carregando detalhes para assinatura:', assinaturaAtiva.id);
                            await carregarDetalhesAssinatura(assinaturaAtiva.id);
                            console.log('Detalhes carregados, mostrando tela');
                          }
                          setMostrarDetalhes(!mostrarDetalhes);
                          console.log('mostrarDetalhes atualizado para:', !mostrarDetalhes);
                        }}
                        className="flex-1 md:flex-none h-12 px-6 rounded-full bg-primary text-[#181811] font-bold shadow-sm hover:brightness-95 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                        Ver Detalhes
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/pagamentos/registrar?cpf=${cliente.customer.cpf}`)}
                      className="flex-1 md:flex-none h-12 px-6 rounded-full bg-primary text-[#181811] font-bold shadow-sm hover:brightness-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                      Registrar Pagamento
                    </button>
                  </div>
                </div>

                {/* Subscription Info */}
                {assinaturaAtiva && !mostrarDetalhes && (
                  <div className="bg-white rounded-lg p-6 border border-[#e6e6db] shadow-sm">
                    <h3 className="text-lg font-bold text-[#181811] mb-4">Plano Atual</h3>
                    <p className="text-xl font-bold text-[#181811]">{assinaturaAtiva.plan?.name || 'Plano Ativo'}</p>
                    <p className="text-sm text-[#8c8b5f] mt-2">
                      {assinaturaAtiva.current_period_end 
                        ? `Vencimento: ${utils.formatarData(assinaturaAtiva.current_period_end)}`
                        : 'Sem data de vencimento'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

