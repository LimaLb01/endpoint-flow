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

  const buscar = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setError('Por favor, digite um CPF válido');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await api.buscarCliente(cpf);
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

  return (
    <Layout>
      <header className="flex items-center justify-between border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
        <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">Buscar Cliente</h2>
      </header>

      <div className="p-4 md:p-10 flex flex-col gap-8 max-w-[1200px] mx-auto w-full">
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
                    onClick={buscar}
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
      </div>
    </Layout>
  );
}

