import React, { useEffect, useState } from 'react';

export default function Toast() {
  const [toast, setToast] = useState({ msg: '', type: 'info', show: false });

  useEffect(() => {
    const handleToast = (e) => {
      setToast({ msg: e.detail.msg, type: e.detail.type || 'info', show: true });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
    };

    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, []);

  if (!toast.show) return null;

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  const bgColor = bgColors[toast.type] || bgColors.info;

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg z-[10000] transition-all duration-300 ${bgColor}`}>
      {toast.msg}
    </div>
  );
}
