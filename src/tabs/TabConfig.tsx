import React, { useState } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabConfig({ data, setData, showToast }: Props) {
  const [m1, setM1] = useState(String(data.margenes.p1));
  const [m2, setM2] = useState(String(data.margenes.p2));
  const [m3, setM3] = useState(String(data.margenes.p3));
  const [m4, setM4] = useState(String(data.margenes.p4));
  const [nombres, setNombres] = useState(
    (data.proveedores || []).map(p => p.nombre)
  );

  const mult = (pct: number) => pct >= 100 ? '∞' : (100 / (100 - pct)).toFixed(2) + 'x';
  const pct = (s: string) => Math.min(99, Math.max(1, parseFloat(s) || 0));

  const guardarMargenes = () => {
    setData(d => ({
      ...d,
      margenes: { p1: pct(m1), p2: pct(m2), p3: pct(m3), p4: pct(m4) }
    }));
    showToast('Márgenes guardados', 'success');
  };

  const guardarProveedores = () => {
    setData(d => ({
      ...d,
      proveedores: (d.proveedores || []).map((p, i) => ({
        ...p,
        nombre: nombres[i] || p.nombre
      }))
    }));
    showToast('Proveedores guardados', 'success');
  };

  const updateNombre = (i: number, val: string) => {
    const n = [...nombres];
    n[i] = val;
    setNombres(n);
  };

  const MargenRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
    const num = pct(value);
    return (
      <div style={{ background: '#111827', borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{label}</span>
        <input
          type="number"
          min={1} max={99}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={e => onChange(String(Math.min(99, Math.max(1, parseFloat(e.target.value) || 1))))}
          style={{
            width: '100%', background: '#1e2230', border: '1px solid #374151',
            borderRadius: 10, padding: '10px 6px', color: '#f1f5f9',
            fontSize: 22, fontWeight: 700, fontFamily: 'inherit', outline: 'none',
            textAlign: 'center',
          }}
          placeholder="50"
        />
        <span style={{ fontSize: 11, color: '#818cf8' }}>{num}% → {mult(num)}</span>
      </div>
    );
  };

  return (
    <div>
      {/* Márgenes */}
      <div className="card">
        <div className="section-title">Márgenes de ganancia</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
          Escribí el porcentaje o usá el deslizador
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MargenRow label="% 1" value={m1} onChange={setM1} />
          <MargenRow label="% 2" value={m2} onChange={setM2} />
          <MargenRow label="% 3" value={m3} onChange={setM3} />
          <MargenRow label="% 4" value={m4} onChange={setM4} />
        </div>

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={guardarMargenes}>
          <Icon name="check" size={16} /> Guardar márgenes
        </button>
      </div>

      {/* Nombres de proveedores */}
      <div className="card">
        <div className="section-title">Nombres de proveedores</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
          Editá el nombre de cada proveedor
        </div>

        {(data.proveedores || []).map((p, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>
              Proveedor {i + 1}
              {p.productos.length > 0 && (
                <span style={{ marginLeft: 8, color: '#22c55e', fontSize: 11 }}>
                  ({p.productos.length} productos)
                </span>
              )}
            </label>
            <input
              className="input-field"
              value={nombres[i] ?? p.nombre}
              onChange={e => updateNombre(i, e.target.value)}
              placeholder={`Proveedor ${i + 1}`}
            />
          </div>
        ))}

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={guardarProveedores}>
          <Icon name="check" size={16} /> Guardar nombres
        </button>
      </div>

      {/* Info */}
      <div className="card" style={{ background: '#111827' }}>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Ejemplo con 50%: costo $1.000 → venta $2.000 (2x multiplicador)
        </div>
      </div>
    </div>
  );
}
