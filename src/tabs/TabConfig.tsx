import React, { useState } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';
import { useTheme } from '../ThemeContext';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabConfig({ data, setData, showToast }: Props) {
  const { theme: T } = useTheme();
  const [openSection, setOpenSection] = useState<string | null>('margenes');

  // Márgenes
  const [m1, setM1] = useState(String(data.margenes.p1));
  const [m2, setM2] = useState(String(data.margenes.p2));
  const [m3, setM3] = useState(String(data.margenes.p3));
  const [m4, setM4] = useState(String(data.margenes.p4));

  // Proveedores
  const [nombres, setNombres] = useState((data.proveedores || []).map(p => p.nombre));

  // Presupuesto - read from data (Firebase synced)
  const [empresa, setEmpresa] = useState(() => (data as any).empresa || localStorage.getItem('mn_empresa') || '');
  const [telefono, setTelefono] = useState(() => (data as any).telefono || localStorage.getItem('mn_telefono') || '');
  const [direccion, setDireccion] = useState(() => (data as any).direccion || localStorage.getItem('mn_direccion') || '');

  const mult = (pct: number) => pct >= 100 ? '∞' : (100 / (100 - pct)).toFixed(2) + 'x';
  const pct = (s: string) => Math.min(99, Math.max(1, parseFloat(s) || 1));

  const guardarMargenes = () => {
    setData(d => ({ ...d, margenes: { p1: pct(m1), p2: pct(m2), p3: pct(m3), p4: pct(m4) } }));
    showToast('Márgenes guardados', 'success');
  };

  const guardarProveedores = () => {
    setData(d => ({
      ...d,
      proveedores: (d.proveedores || []).map((p, i) => ({ ...p, nombre: nombres[i] || p.nombre }))
    }));
    showToast('Proveedores guardados', 'success');
  };

  const guardarPresupuesto = () => {
    // Save to Firebase via data
    setData(d => ({ ...d, empresa, telefono, direccion } as any));
    // Also save to localStorage as fallback
    localStorage.setItem('mn_empresa', empresa);
    localStorage.setItem('mn_telefono', telefono);
    localStorage.setItem('mn_direccion', direccion);
    showToast('Datos guardados y sincronizados', 'success');
  };

  const SectionHeader = ({ id, label, icon }: { id: string; label: string; icon: string }) => (
    <button
      onClick={() => setOpenSection(openSection === id ? null : id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: openSection === id ? 'rgba(99,102,241,0.1)' : T.sectionBg,
        border: 'none', borderRadius: openSection === id ? '12px 12px 0 0' : 12,
        cursor: 'pointer', fontFamily: 'inherit', marginBottom: openSection === id ? 0 : 8,
        borderBottom: openSection === id ? `1px solid ${T.divider}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={18} />
        <span style={{ fontSize: 15, fontWeight: 700, color: openSection === id ? '#818cf8' : T.text }}>{label}</span>
      </div>
      <span style={{ color: T.textMuted, fontSize: 18 }}>{openSection === id ? '▲' : '▼'}</span>
    </button>
  );

  return (
    <div>
      {/* MÁRGENES */}
      <SectionHeader id="margenes" label="Márgenes de ganancia" icon="tag" />
      {openSection === 'margenes' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[['% 1', m1, setM1], ['% 2', m2, setM2], ['% 3', m3, setM3], ['% 4', m4, setM4]].map(([label, val, set]) => (
              <div key={label as string} style={{ background: T.sectionBg, borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted }}>{label as string}</span>
                <input
                  type="number" min={1} max={99}
                  value={val as string}
                  onChange={e => (set as Function)(e.target.value)}
                  onBlur={e => (set as Function)(String(Math.min(99, Math.max(1, parseFloat(e.target.value) || 1))))}
                  style={{ width: '100%', background: T.card, border: `1px solid ${T.inputBorder}`, borderRadius: 10, padding: '10px 6px', color: T.text, fontSize: 22, fontWeight: 700, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
                />
                <span style={{ fontSize: 11, color: '#818cf8' }}>{pct(val as string)}% → {mult(pct(val as string))}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={guardarMargenes}>
            <Icon name="check" size={16} /> Guardar márgenes
          </button>
        </div>
      )}

      {/* PROVEEDORES */}
      <SectionHeader id="proveedores" label="Nombres de proveedores" icon="store" />
      {openSection === 'proveedores' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          {(data.proveedores || []).map((p, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4 }}>
                Proveedor {i + 1}
                {p.productos.length > 0 && <span style={{ marginLeft: 8, color: '#22c55e', fontSize: 11 }}>({p.productos.length} productos)</span>}
              </label>
              <input className="input-field"
                value={nombres[i] ?? p.nombre}
                onChange={e => { const n = [...nombres]; n[i] = e.target.value; setNombres(n); }}
                placeholder={`Proveedor ${i + 1}`}
              />
            </div>
          ))}
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={guardarProveedores}>
            <Icon name="check" size={16} /> Guardar nombres
          </button>
        </div>
      )}

      {/* PRESUPUESTO */}
      <SectionHeader id="presupuesto" label="Datos del presupuesto" icon="download" />
      {openSection === 'presupuesto' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 6 }}>Nombre del negocio</label>
            <input className="input-field" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Mi Negocio" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 6 }}>Teléfono</label>
              <input className="input-field" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="381 4..." />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 6 }}>Dirección</label>
            <input className="input-field" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle 123, Ciudad" />
          </div>
          <div style={{ background: T.sectionBg, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: T.textMuted }}>
            Estos datos aparecen en todos los presupuestos que generes.
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={guardarPresupuesto}>
            <Icon name="check" size={16} /> Guardar datos
          </button>
        </div>
      )}
    </div>
  );
}
