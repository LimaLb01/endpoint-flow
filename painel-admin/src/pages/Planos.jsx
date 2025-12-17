import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

export default function Planos() {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    try {
      const listaPlanos = await api.listarPlanos();
      setPlanos(listaPlanos);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
        <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">Planos</h2>
      </header>

      <div className="p-6 md:p-10 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#f0f0eb] dark:border-[#2e2d1a] overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-light dark:bg-[#2e2d1a] text-xs uppercase text-[#8c8b5f]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Plano</th>
                      <th className="px-6 py-4 font-semibold">Tipo</th>
                      <th className="px-6 py-4 font-semibold">Preço</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0eb] dark:divide-[#2e2d1a]">
                    {planos.map((plano) => {
                      const tipoTexto = plano.type === 'monthly' ? 'Mensal' :
                                       plano.type === 'yearly' ? 'Anual' :
                                       plano.type === 'one_time' ? 'Único' : plano.type;
                      
                      return (
                        <tr key={plano.id} className="hover:bg-neutral-light/50 dark:hover:bg-[#2e2d1a]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">card_membership</span>
                              </div>
                              <div>
                                <p className="font-bold text-neutral-dark dark:text-white">{plano.name || 'Plano'}</p>
                                <p className="text-xs text-[#8c8b5f]">{plano.description || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#5e5d40] dark:text-[#d1d0c5]">{tipoTexto}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-neutral-dark dark:text-white">{utils.formatarMoeda(parseFloat(plano.price || 0))}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              plano.active 
                                ? 'bg-[#e6f6e8] text-accent-green' 
                                : 'bg-neutral-light text-[#5e5d40]'
                            }`}>
                              <span className="size-1.5 rounded-full bg-current"></span>
                              {plano.active ? 'Ativo' : 'Inativo'}
                            </span>
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

