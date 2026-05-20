import React, { useEffect } from 'react';
import { Toast as ToastType } from '../types';

interface Props {
  toast: ToastType | null;
  onClose: () => void;
}

const colors = {
  success: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#22c55e' },
  error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' },
  info: { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#818cf8' },
};

export function Toast({ toast, onClose }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const c = colors[toast.type];
  return (
    <div style={{
      position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 500, background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 12, padding: '12px 20px', color: c.text,
      fontSize: 14, fontWeight: 600, maxWidth: '90vw', textAlign: 'center',
      backdropFilter: 'blur(10px)',
    }}>
      {toast.msg}
    </div>
  );
}
