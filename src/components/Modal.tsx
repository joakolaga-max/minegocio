import React from 'react';
import { Icon } from './Icon';

interface Props {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
}

export function Modal({ title, onClose, children, position = 'center' }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 400, display: 'flex', alignItems: position === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center', padding: position === 'bottom' ? 0 : 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1e2230', borderRadius: position === 'bottom' ? '20px 20px 0 0' : 20,
          padding: 20, width: '100%', maxWidth: 500,
          maxHeight: position === 'bottom' ? '85vh' : '90vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{title}</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
              <Icon name="x" size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
