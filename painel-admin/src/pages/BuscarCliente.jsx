import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

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
        await buscar(resultado.customer.cpf);
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

  return (
    <Layout>
      <header className="flex items-center justify-between border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">
            {modo === 'buscar' ? 'Buscar Cliente' : 'Criar Cliente'}
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
        {modo === 'criar' ? (
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
            {/* Search Section */}
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
              </div>
            </div>

            {/* Results */}
            {cliente && cliente.customer && (
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
                {assinaturaAtiva && (
                  <div className="bg-white rounded-lg p-6 border border-[#e6e6db] shadow-sm">
                    <h3 className="text-lg font-bold text-[#181811] mb-4">Plano Atual</h3>
                    <p className="text-xl font-bold text-[#181811]">{assinaturaAtiva.plan?.name || 'Plano Ativo'}</p>
                    <p className="text-sm text-[#8c8b5f] mt-2">
                      Vencimento: {utils.formatarData(assinaturaAtiva.current_period_end)}
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

