import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDone: () => void;
}

export default function Toast({ message, type = 'success', onDone }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  const colors = {
    success: 'bg-emerald-500/90 border-emerald-400',
    error: 'bg-red-500/90 border-red-400',
    info: 'bg-violet-500/90 border-violet-400',
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border text-sm font-medium text-white shadow-lg animate-slide-up ${colors[type]}`}
      role="status"
    >
      {message}
    </div>
  );
}
