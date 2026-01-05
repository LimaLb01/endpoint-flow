import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.obterNotificacoes();
      
      if (data) {
        // Combinar todas as notificações em uma única lista
        const allNotifications = [
          ...(data.subscriptionsExpiring || []),
          ...(data.pendingPayments || []),
          ...(data.newCustomers || []),
          ...(data.canceledAppointments || [])
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    
    // Navegar para a página relevante baseado no tipo
    switch (notification.type) {
      case 'subscription_expiring':
        navigate('/assinaturas');
        break;
      case 'pending_payment':
        navigate('/pagamentos/registrar');
        break;
      case 'new_customer':
        navigate('/clientes/buscar');
        break;
      case 'canceled_appointment':
        navigate('/agendamentos');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'subscription_expiring':
        return 'schedule';
      case 'pending_payment':
        return 'payment';
      case 'new_customer':
        return 'person_add';
      case 'canceled_appointment':
        return 'event_busy';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays} dia(s) atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length || totalNotifications;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
        aria-label="Notificações"
      >
        <span className="material-symbols-outlined text-neutral-dark dark:text-white">
          notifications
        </span>
        {totalNotifications > 0 && (
          <span className="absolute top-0 right-0 size-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-[#1a190b] rounded-xl shadow-lg border border-[#e5e5dc] dark:border-[#3a3928] z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#f0f0eb] dark:border-[#2e2d1a] flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-dark dark:text-white">
              Notificações
            </h3>
            <button
              onClick={loadNotifications}
              className="p-1 rounded-full hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
              aria-label="Atualizar notificações"
            >
              <span className="material-symbols-outlined text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                refresh
              </span>
            </button>
          </div>

          {/* Lista de Notificações */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#8c8b5f] dark:text-[#a3a272]">
                <span className="material-symbols-outlined animate-spin">hourglass_empty</span>
                <p className="mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8c8b5f] dark:text-[#a3a272]">
                <span className="material-symbols-outlined text-4xl mb-2">notifications_none</span>
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0eb] dark:divide-[#2e2d1a]">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full p-4 text-left hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 size-10 rounded-full bg-neutral-light dark:bg-[#2e2d1a] flex items-center justify-center ${getNotificationColor(notification.priority)}`}>
                        <span className="material-symbols-outlined text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-neutral-dark dark:text-white">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-[#8c8b5f] dark:text-[#a3a272] flex-shrink-0">
                            {formatDate(notification.date)}
                          </span>
                        </div>
                        <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#f0f0eb] dark:border-[#2e2d1a] bg-neutral-light/30 dark:bg-[#1a190b]">
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setIsOpen(false);
                }}
                className="w-full text-xs font-medium text-primary hover:underline text-center"
              >
                Ver todas no Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

