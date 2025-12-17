import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

export default function ListarAssinaturas() {
  const navigate = useNavigate();
  const [assinaturas, setAssinaturas] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAssinaturas();
  }, [statusFiltro]);

  const carregarAssinaturas = async () => {
    setLoading(true);
    try {
      const data = await api.listarAssinaturas(statusFiltro);
      setAssinaturas(data.subscriptions || []);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarAssinatura = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return;
    
    try {
      await api.cancelarAssinatura(id, false);
      alert('Assinatura cancelada com sucesso!');
      carregarAssinaturas();
    } catch (error) {
      alert('Erro ao cancelar assinatura: ' + error.message);
    }
  };

  return (
    <Layout>
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
        <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">Listar Assinaturas</h2>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="h-10 px-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-none text-sm"
        >
          <option value="active">Ativas</option>
          <option value="canceled">Canceladas</option>
          <option value="expired">Vencidas</option>
        </select>
      </header>

      <div className="p-6 md:p-10 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : assinaturas.length === 0 ? (
              <div className="text-center py-8 text-[#8c8b5f]">Nenhuma assinatura encontrada</div>
            ) : (
              <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#f0f0eb] dark:border-[#2e2d1a] overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-light dark:bg-[#2e2d1a] text-xs uppercase text-[#8c8b5f]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold">Plano</th>
                      <th className="px-6 py-4 font-semibold">Vencimento</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0eb] dark:divide-[#2e2d1a]">
                    {assinaturas.map((sub) => {
                      const customer = sub.customer || {};
                      const plan = sub.plan || {};
                      const statusClass = sub.status === 'active' ? 'bg-[#e6f6e8] text-accent-green' : 
                                        sub.status === 'canceled' ? 'bg-[#ffebeb] text-accent-red' : 
                                        'bg-neutral-light text-[#5e5d40]';
                      const statusText = sub.status === 'active' ? 'Ativa' : 
                                        sub.status === 'canceled' ? 'Cancelada' : 'Vencida';
                      
                      return (
                        <tr key={sub.id} className="hover:bg-neutral-light/50 dark:hover:bg-[#2e2d1a]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-primary flex items-center justify-center text-neutral-dark font-bold text-xs">
                                {(customer.name || 'C').substring(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-neutral-dark dark:text-white">{customer.name || 'Cliente'}</p>
                                <p className="text-xs text-[#8c8b5f]">{utils.aplicarMascaraCPF(customer.cpf || '')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#5e5d40] dark:text-[#d1d0c5]">{plan.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-[#8c8b5f] dark:text-[#a3a272]">{utils.formatarData(sub.current_period_end)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                              <span className="size-1.5 rounded-full bg-current"></span>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/assinaturas/${sub.id}`)}
                                className="p-2 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-[#8c8b5f] transition-colors"
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              {sub.status === 'active' && (
                                <button
                                  onClick={() => cancelarAssinatura(sub.id)}
                                  className="p-2 rounded-full hover:bg-[#ffebeb] dark:hover:bg-[#3d0f0f] text-accent-red transition-colors"
                                  title="Cancel Subscription"
                                >
                                  <span className="material-symbols-outlined text-lg">cancel</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
      </div>
    </Layout>
  );
}

