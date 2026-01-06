import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente para gerenciar atalhos de teclado globais
 */
export default function KeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K ou Cmd+K para busca global
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/clientes/buscar');
        // Focar no campo de busca após um pequeno delay
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="Buscar"], input[placeholder*="buscar"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 100);
      }

      // Esc para fechar modais/dropdowns
      if (e.key === 'Escape') {
        // Fechar dropdowns abertos
        const dropdowns = document.querySelectorAll('[data-dropdown-open="true"]');
        dropdowns.forEach(dropdown => {
          dropdown.setAttribute('data-dropdown-open', 'false');
        });
      }

      // Ctrl+/ ou Cmd+/ para mostrar ajuda
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        // Mostrar modal de ajuda (pode ser implementado depois)
        console.log('Atalhos disponíveis:\nCtrl+K: Buscar\nEsc: Fechar modais\nCtrl+/: Ajuda');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return null; // Componente não renderiza nada
}

