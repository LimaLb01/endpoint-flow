/**
 * Sistema de Toast/Notificações para feedback visual
 */

let toastContainer = null;

const createToastContainer = () => {
  if (toastContainer) return toastContainer;
  
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md';
  document.body.appendChild(container);
  toastContainer = container;
  return container;
};

const removeToast = (toastElement) => {
  toastElement.style.opacity = '0';
  toastElement.style.transform = 'translateX(100%)';
  setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  }, 300);
};

const showToast = (message, type = 'info', duration = 3000) => {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 transform translate-x-full opacity-0 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    type === 'warning' ? 'bg-yellow-500 text-white' :
    'bg-[#1a190b] dark:bg-[#3a392a] text-white dark:text-white border border-[#e6e6db] dark:border-[#3a392a]'
  }`;
  
  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  
  toast.innerHTML = `
    <span class="material-symbols-outlined text-lg">${iconMap[type] || 'info'}</span>
    <span class="flex-1 text-sm font-medium">${message}</span>
    <button onclick="this.parentElement.style.opacity='0'; this.parentElement.style.transform='translateX(100%)'; setTimeout(() => this.parentElement.remove(), 300)" class="text-white/80 hover:text-white">
      <span class="material-symbols-outlined text-lg">close</span>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Remover automaticamente
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
  
  return toast;
};

export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),
};

