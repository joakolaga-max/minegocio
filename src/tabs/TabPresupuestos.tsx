import React, { useState } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';
import { Presupuesto } from '../components/Presupuesto';
import { fmtPeso } from '../lib/utils';

interface PresupuestoGuardado {
  id: string;
  fecha: string;
  hora: string;
  cliente: string;
  items: { descripcion: string; cantidad: number; precioVenta: number; codigoRef?: string }[];
  total: number;
}

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onCargarEnCalculadora: (items: PresupuestoGuardado['items']) => void;
}

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

export function TabPresupuestos({ data, setData, showToast, onCargarEnCalculadora }: Props) {
  const presupuestos: PresupuestoGuardado[] = (data as any).presupuestos || [];
  const [verPresupuesto, setVerPresupuesto] = useState<PresupuestoGuardado | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const eliminar = (id: string) => {
    if (!window.confirm('Eliminar este presupuesto?')) return;
    setData(d => ({ ...d, presupuestos: ((d as any).presupuestos || []).filter((p: any) => p.id !== id) } as any));
    showToast('Presupuesto eliminado', 'info');
  };

  const cargarEnCalc = (p: PresupuestoGuardado) => {
    onCargarEnCalculadora(p.items);
    showToast('Cargado en Calculadora', 'success');
  };

  if (presupuestos.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Icon name="download" size={48} />
        <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>Sin presupuestos guardados</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
          Los presupuestos se guardan desde la Calculadora
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="section-title">Presupuestos guardados</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...presupuestos].reverse().map(p => {
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} style={{ background: '#1e2230', borderRadius: 12, border: '1px solid #1e2535', overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                      {p.cliente || 'Sin nombre'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {p.fecha} · {p.hora} · {p.items.length} producto(s)
                    </div>
                    <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700, marginTop: 2 }}>
                      {fmt(p.total)}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #111827', background: '#161b27' }}>
                    {/* Items preview */}
                    <div style={{ padding: '10px 14px' }}>
                      {p.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: '#94a3b8' }}>
                          <span>{item.cantidad}x {item.descripcion}</span>
                          <span style={{ color: '#22c55e' }}>{fmt(item.precioVenta * item.cantidad)}</span>
                        </div>
                      ))}
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #111827' }}>
                      <button onClick={() => cargarEnCalc(p)}
                        style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13 }}>
                        <Icon name="store" size={14} /> Cargar en Calculadora
                      </button>
                      <button onClick={() => setVerPresupuesto(p)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 10, padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>
                        <Icon name="download" size={14} /> Ver
                      </button>
                      <button onClick={() => eliminar(p.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {verPresupuesto && (
        <Presupuesto
          items={verPresupuesto.items}
          total={verPresupuesto.total}
          onClose={() => setVerPresupuesto(null)}
        />
      )}
    </div>
  );
}
