import { useNavigate, useLocation } from 'react-router-dom';

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
          {children}
        </main>
      </div>
    </div>
  );
}

