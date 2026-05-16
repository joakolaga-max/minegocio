import React, { useState } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabConfig({ data, setData, showToast }: Props) {
  const [margenes, setMargenes] = useState({ ...data.margenes });

  const guardar = () => {
    setData(d => ({ ...d, margenes }));
    showToast('Configuración guardada', 'success');
  };

  const m = data.margenes;
  const mult = (pct: number) => pct >= 100 ? '∞' : (100 / (100 - pct)).toFixed(2) + 'x';

  return (
    <div>
      <div className="card">
        <div className="section-title">Configuración de márgenes</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Estos porcentajes se usan para calcular el precio de venta.
        </div>

        {(['p1', 'p2', 'p3', 'p4'] as const).map((key, i) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>% {i + 1}</label>
              <span style={{ fontSize: 12, color: '#818cf8' }}>
                {margenes[key]}% → multiplicador {mult(margenes[key])}
              </span>
            </div>
            <input
              type="range" min={1} max={90} value={margenes[key]}
              onChange={e => setMargenes(m => ({ ...m, [key]: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4b5563', marginTop: 2 }}>
              <span>1%</span>
              <span>90%</span>
            </div>
          </div>
        ))}

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={guardar}>
          <Icon name="check" size={16} /> Guardar cambios
        </button>
      </div>

      <div className="card">
        <div className="section-title">Resumen actual</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['p1', 'p2', 'p3', 'p4'] as const).map((key, i) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#111827', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>% {i + 1}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{m[key]}% = {mult(m[key])}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#4b5563', marginTop: 12, padding: '10px 14px', background: '#111827', borderRadius: 10 }}>
          Ejemplo: costo $1.000 con 50% → venta $2.000 (2x)
        </div>
      </div>
    </div>
  );
}
