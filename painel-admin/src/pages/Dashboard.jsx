import { useEffect, useState } from 'react';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    assinaturasAtivas: 0,
    assinaturasVencidas: 0,
    receitaMes: 0
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const [loading, setLoading] = useState(true);

  const carregarEstatisticas = async () => {
    setLoading(true);
    try {
      const estatisticas = await api.obterEstatisticas();
      
      if (estatisticas) {
        setStats({
          totalClientes: estatisticas.totalClientes || 0,
          assinaturasAtivas: estatisticas.assinaturasAtivas || 0,
          assinaturasVencidas: estatisticas.assinaturasVencidas || 0,
          receitaMes: estatisticas.receitaMes || 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Manter valores padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">Dashboard Overview</h2>
        </div>
      </header>
      
      <div className="p-6 md:p-10 flex flex-col gap-8 max-w-[1400px] mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
              <p className="text-[#8c8b5f] dark:text-[#a3a272]">Carregando estatísticas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {/* Card 1 - Total Clients */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a190b] shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] hover:border-primary/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-neutral-light dark:bg-[#2e2d1a] group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">groups</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Total Clients</p>
                  <p className="text-3xl font-bold text-neutral-dark dark:text-white tracking-tight">{stats.totalClientes}</p>
                </div>
              </div>
              
              {/* Card 2 - Active Subscriptions */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a190b] shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] hover:border-primary/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-neutral-light dark:bg-[#2e2d1a] group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">loyalty</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-neutral-dark dark:text-white tracking-tight">{stats.assinaturasAtivas}</p>
                </div>
              </div>
              
              {/* Card 3 - Expired Subscriptions */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a190b] shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] hover:border-primary/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-neutral-light dark:bg-[#2e2d1a] group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">running_with_errors</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Expired Subscriptions</p>
                  <p className="text-3xl font-bold text-neutral-dark dark:text-white tracking-tight">{stats.assinaturasVencidas}</p>
                </div>
              </div>
              
              {/* Card 4 - Revenue */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-neutral-dark dark:bg-[#f9f506] shadow-sm border border-neutral-dark dark:border-primary hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-[#3a3928] dark:bg-[#d6d311] group-hover:bg-[#4a4933] dark:group-hover:bg-[#bfbd0f] transition-colors">
                    <span className="material-symbols-outlined text-primary dark:text-neutral-dark">attach_money</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#a3a272] dark:text-[#6b6a07] text-sm font-medium mb-1">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-white dark:text-neutral-dark tracking-tight">
                    {utils.formatarMoeda(stats.receitaMes || 0)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

