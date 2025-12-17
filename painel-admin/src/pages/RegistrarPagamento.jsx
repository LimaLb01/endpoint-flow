import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, utils } from '../utils/api';

export default function RegistrarPagamento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [planos, setPlanos] = useState([]);
  const [formData, setFormData] = useState({
    cpf: searchParams.get('cpf') || '',
    plan_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    confirmed_by: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarPlanos();
    if (searchParams.get('cpf')) {
      setFormData(prev => ({ ...prev, cpf: utils.aplicarMascaraCPF(searchParams.get('cpf')) }));
    }
  }, [searchParams]);

  const carregarPlanos = async () => {
    try {
      const listaPlanos = await api.listarPlanos();
      setPlanos(listaPlanos);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: utils.aplicarMascaraCPF(value) }));
    } else if (name === 'plan_id') {
      const plano = planos.find(p => p.id === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        amount: plano ? parseFloat(plano.price).toFixed(2) : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.cpf.replace(/\D/g, '').length !== 11) {
      alert('Por favor, digite um CPF válido');
      return;
    }
    
    if (!formData.plan_id) {
      alert('Por favor, selecione um plano');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Por favor, digite um valor válido');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.registrarPagamento(formData);
      alert('Pagamento registrado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      alert('Erro ao registrar pagamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-neutral-dark dark:text-white font-display antialiased overflow-x-hidden min-h-screen">
      <div className="relative flex min-h-screen w-full flex-col md:flex-row">
        <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-[#e5e5dc] dark:border-[#3a3928] bg-white dark:bg-[#1a190b] z-20">
          <div className="flex h-full flex-col justify-between p-4 md:p-6 sticky top-0">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col px-2">
                <h1 className="text-neutral-dark dark:text-white text-xl font-bold">BarberAdmin</h1>
              </div>
              <nav className="flex flex-col gap-2">
                <a onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] cursor-pointer">
                  <span className="material-symbols-outlined">dashboard</span>
                  <span className="text-sm font-medium">Dashboard</span>
                </a>
              </nav>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full min-h-screen relative overflow-hidden">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
            <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold">Registrar Pagamento</h2>
          </header>

          <div className="p-6 md:p-10 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
            <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#f0f0eb] dark:border-[#2e2d1a] shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-bold text-neutral-dark dark:text-white mb-8">New Transaction Details</h3>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-neutral-dark dark:text-white ml-2">CPF do Cliente</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8b5f]">person_search</span>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      className="w-full h-12 pl-12 pr-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-transparent focus:border-primary focus:ring-2 focus:ring-primary/50 text-neutral-dark dark:text-white placeholder-[#8c8b5f] transition-all"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-neutral-dark dark:text-white ml-2">Plano</label>
                    <div className="relative">
                      <select
                        name="plan_id"
                        value={formData.plan_id}
                        onChange={handleChange}
                        className="w-full h-12 pl-4 pr-10 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-transparent focus:border-primary focus:ring-2 focus:ring-primary/50 text-neutral-dark dark:text-white appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Selecione um plano</option>
                        {planos.map(plano => (
                          <option key={plano.id} value={plano.id}>
                            {plano.name} - {utils.formatarMoeda(parseFloat(plano.price))}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#8c8b5f] pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-neutral-dark dark:text-white ml-2">Valor (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-dark dark:text-white font-bold">R$</span>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full h-12 pl-8 pr-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-transparent focus:border-primary focus:ring-2 focus:ring-primary/50 text-neutral-dark dark:text-white font-bold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-neutral-dark dark:text-white ml-2">Data do Pagamento</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-transparent focus:border-primary focus:ring-2 focus:ring-primary/50 text-neutral-dark dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-neutral-dark dark:text-white ml-2">Confirmado por</label>
                    <input
                      type="text"
                      name="confirmed_by"
                      value={formData.confirmed_by}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-transparent focus:border-primary focus:ring-2 focus:ring-primary/50 text-neutral-dark dark:text-white"
                      placeholder="Nome do funcionário"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-neutral-dark dark:text-white ml-2">Observações</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-light dark:bg-[#2e2d1a] border-transparent focus:border-primary focus:ring-2 focus:ring-primary/50 text-neutral-dark dark:text-white placeholder-[#8c8b5f] resize-none"
                    placeholder="Adicione observações sobre este pagamento..."
                    rows="3"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 bg-primary text-neutral-dark rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Registrando...' : 'Confirmar Pagamento'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="sm:w-32 h-12 bg-white dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white rounded-full font-semibold hover:bg-neutral-light dark:hover:bg-[#3a3928] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

