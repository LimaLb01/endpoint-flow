import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClientes: 0,
    assinaturasAtivas: 0,
    assinaturasVencidas: 0,
    receitaMes: 0
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const assinaturas = await api.listarAssinaturas('active').catch((err) => {
        console.warn('Erro ao buscar assinaturas:', err);
        return null;
      });
      
      if (assinaturas) {
        setStats(prev => ({
          ...prev,
          assinaturasAtivas: assinaturas.count || assinaturas.subscriptions?.length || 0
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Manter valores padrão em caso de erro
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-neutral-dark dark:text-white font-display antialiased overflow-x-hidden">
      <div className="relative flex min-h-screen w-full flex-col md:flex-row">
        {/* Side Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-[#e5e5dc] dark:border-[#3a3928] bg-white dark:bg-[#1a190b] z-20">
          <div className="flex h-full flex-col justify-between p-4 md:p-6 sticky top-0">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col px-2">
                <h1 className="text-neutral-dark dark:text-white text-xl font-bold leading-normal tracking-tight">BarberAdmin</h1>
                <p className="text-[#8c8b5f] dark:text-[#a3a272] text-xs font-normal leading-normal">Management Panel</p>
              </div>
              <nav className="flex flex-col gap-2">
                <a
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-3 px-4 py-3 rounded-full bg-primary text-neutral-dark shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                  <span className="text-sm font-semibold">Dashboard</span>
                </a>
                <a
                  onClick={() => navigate('/clientes/buscar')}
                  className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">groups</span>
                  <span className="text-sm font-medium">Clients</span>
                </a>
                <a
                  onClick={() => navigate('/assinaturas')}
                  className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">credit_card</span>
                  <span className="text-sm font-medium">Subscriptions</span>
                </a>
                <a
                  onClick={() => navigate('/pagamentos/registrar')}
                  className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">payments</span>
                  <span className="text-sm font-medium">Payments</span>
                </a>
                <a
                  onClick={() => navigate('/planos')}
                  className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-sm font-medium">Plans</span>
                </a>
              </nav>
            </div>
            <div className="px-2 pb-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-light dark:bg-[#2e2d1a]">
                <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 flex-shrink-0 bg-primary"></div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate dark:text-white">Admin</p>
                  <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] truncate">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full min-h-screen relative overflow-hidden">
          {/* Top Header */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">Dashboard Overview</h2>
            </div>
          </header>
          
          <div className="p-6 md:p-10 flex flex-col gap-8 max-w-[1400px] mx-auto w-full">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/clientes/buscar')}
                className="flex items-center gap-2 h-12 px-6 bg-primary text-neutral-dark rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="material-symbols-outlined">person_search</span>
                <span>Search Client</span>
              </button>
              <button
                onClick={() => navigate('/pagamentos/registrar')}
                className="flex items-center gap-2 h-12 px-6 bg-white dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white rounded-full font-semibold hover:bg-neutral-light dark:hover:bg-[#3a3928] transition-colors"
              >
                <span className="material-symbols-outlined text-neutral-dark dark:text-white">add_card</span>
                <span>Register Payment</span>
              </button>
              <button
                onClick={() => navigate('/assinaturas')}
                className="flex items-center gap-2 h-12 px-6 bg-white dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white rounded-full font-semibold hover:bg-neutral-light dark:hover:bg-[#3a3928] transition-colors"
              >
                <span className="material-symbols-outlined text-neutral-dark dark:text-white">visibility</span>
                <span>View Subscriptions</span>
              </button>
            </div>
            
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
                  <p className="text-3xl font-bold text-white dark:text-neutral-dark tracking-tight">R$ {(stats.receitaMes || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

