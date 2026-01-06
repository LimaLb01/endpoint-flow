/**
 * Componente de Loading Skeleton reutilizável
 */
export default function LoadingSkeleton({ type = 'text', lines = 3, className = '' }) {
  if (type === 'card') {
    return (
      <div className={`bg-white dark:bg-[#1a190b] rounded-lg shadow-sm border border-[#e6e6db] dark:border-[#3a392a] p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-[#e6e6db] dark:bg-[#3a392a] rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-[#e6e6db] dark:bg-[#3a392a] rounded w-full"></div>
          <div className="h-3 bg-[#e6e6db] dark:bg-[#3a392a] rounded w-5/6"></div>
          <div className="h-3 bg-[#e6e6db] dark:bg-[#3a392a] rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          {[...Array(lines)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 bg-[#e6e6db] dark:bg-[#3a392a] rounded flex-1"></div>
              <div className="h-4 bg-[#e6e6db] dark:bg-[#3a392a] rounded w-24"></div>
              <div className="h-4 bg-[#e6e6db] dark:bg-[#3a392a] rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`bg-white dark:bg-[#1a190b] rounded-lg shadow-sm border border-[#e6e6db] dark:border-[#3a392a] p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-[#e6e6db] dark:bg-[#3a392a] rounded w-1/3 mb-6"></div>
        <div className="h-64 bg-[#e6e6db] dark:bg-[#3a392a] rounded"></div>
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-[#e6e6db] dark:bg-[#3a392a] rounded ${
            i === lines - 1 ? 'w-5/6' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}

