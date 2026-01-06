import { useState } from 'react';

/**
 * Componente de Tooltip reutilizável
 */
export default function Tooltip({ children, text, position = 'top', className = '' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1a190b] dark:border-t-[#3a392a]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1a190b] dark:border-b-[#3a392a]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1a190b] dark:border-l-[#3a392a]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1a190b] dark:border-r-[#3a392a]',
  };

  if (!text) return children;

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-[#1a190b] dark:bg-[#3a392a] rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          role="tooltip"
        >
          {text}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
          ></div>
        </div>
      )}
    </div>
  );
}

