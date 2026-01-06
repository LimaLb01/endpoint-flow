import { useNavigate, useLocation } from 'react-router-dom';
import Notifications from './Notifications';
import KeyboardShortcuts from './KeyboardShortcuts';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <KeyboardShortcuts />
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
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/dashboard')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/dashboard') ? "'FILL' 1" : "'FILL' 0" }}>
                    dashboard
                  </span>
                  <span className={`text-sm ${isActive('/dashboard') ? 'font-semibold' : 'font-medium'}`}>Dashboard</span>
                </button>
                <button
                  onClick={() => navigate('/flow/acompanhamento')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/flow')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/flow') ? "'FILL' 1" : "'FILL' 0" }}>
                    alt_route
                  </span>
                  <span className={`text-sm ${isActive('/flow') ? 'font-semibold' : 'font-medium'}`}>Flow Tracking</span>
                </button>
                <button
                  onClick={() => navigate('/clientes/buscar')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/clientes')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined">groups</span>
                  <span className={`text-sm ${isActive('/clientes') ? 'font-semibold' : 'font-medium'}`}>Clients</span>
                </button>
                <button
                  onClick={() => navigate('/assinaturas')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/assinaturas')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined">credit_card</span>
                  <span className={`text-sm ${isActive('/assinaturas') ? 'font-semibold' : 'font-medium'}`}>Subscriptions</span>
                </button>
                <button
                  onClick={() => navigate('/pagamentos/registrar')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/pagamentos')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined">payments</span>
                  <span className={`text-sm ${isActive('/pagamentos') ? 'font-semibold' : 'font-medium'}`}>Payments</span>
                </button>
                <button
                  onClick={() => navigate('/planos')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/planos')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined">settings</span>
                  <span className={`text-sm ${isActive('/planos') ? 'font-semibold' : 'font-medium'}`}>Plans</span>
                </button>
                <button
                  onClick={() => navigate('/agendamentos')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/agendamentos')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined">event</span>
                  <span className={`text-sm ${isActive('/agendamentos') ? 'font-semibold' : 'font-medium'}`}>Appointments</span>
                </button>
                <button
                  onClick={() => navigate('/relatorios')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors cursor-pointer ${
                    isActive('/relatorios')
                      ? 'bg-primary text-neutral-dark shadow-sm'
                      : 'hover:bg-neutral-light dark:hover:bg-[#2e2d1a] text-neutral-dark dark:text-[#d1d0c5]'
                  }`}
                >
                  <span className="material-symbols-outlined">assessment</span>
                  <span className={`text-sm ${isActive('/relatorios') ? 'font-semibold' : 'font-medium'}`}>Relatórios</span>
                </button>
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
        <main className="flex-1 flex flex-col h-full min-h-screen relative overflow-hidden bg-background-light dark:bg-background-dark">
          {location.pathname === '/flow/acompanhamento' ? (
            <>
              <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button className="md:hidden p-2 -ml-2 text-neutral-dark dark:text-white">
                    <span className="material-symbols-outlined">menu</span>
                  </button>
                  <div>
                    <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">Acompanhamento do Flow</h2>
                    <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] hidden sm:block">Funnel management &amp; tracking</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                  <div className="relative hidden sm:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8b5f] text-xl">search</span>
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      className="h-10 pl-10 pr-4 rounded-full bg-neutral-light dark:bg-[#2e2d1a] border-none text-sm w-64 focus:ring-2 focus:ring-primary placeholder-[#8c8b5f]"
                    />
                  </div>
                  <Notifications />
                </div>
              </header>
              {children}
            </>
          ) : (
            <>
              <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm px-6 py-4 md:px-10 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-neutral-dark dark:text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">
                      {location.pathname === '/clientes/buscar' ? 'Buscar Cliente' :
                       location.pathname === '/assinaturas' ? 'Assinaturas' :
                       location.pathname === '/pagamentos/registrar' ? 'Registrar Pagamento' :
                       location.pathname === '/planos' ? 'Planos' :
                       location.pathname === '/agendamentos' ? 'Agendamentos' :
                       location.pathname === '/relatorios' ? 'Relatórios' :
                       'Dashboard'}
                    </h2>
                    <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] hidden sm:block">Management Panel</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Notifications />
                  {/* Toggle de modo escuro - pode ser adicionado depois se necessário */}
                </div>
              </header>
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

