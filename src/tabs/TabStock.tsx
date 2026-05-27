import React, { useState } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';
import { Scanner } from '../components/Scanner';
import { useTheme } from '../ThemeContext';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Subcomponente con estado local para los inputs
function StockEditor({ codigoRef, stock, onSave, onPedir, inPedido }: {
  codigoRef: string;
  stock: { inicial: number; entradas: number; salidas: number; minimo: number };
  onSave: (vals: typeof stock) => void;
  onPedir: () => void;
  inPedido: boolean;
}) {
  const { theme: T } = useTheme();
  // Use strings so user can type freely (including clearing the field)
  const [inicial, setInicial] = useState(String(stock.inicial || 0));
  const [entradas, setEntradas] = useState(String(stock.entradas || 0));
  const [salidas, setSalidas] = useState(String(stock.salidas || 0));
  const [minimo, setMinimo] = useState(String(stock.minimo || 0));

  const numVal = (s: string) => parseInt(s) || 0;
  const actual = numVal(inicial) + numVal(entradas) - numVal(salidas);

  const guardar = () => {
    onSave({
      inicial: numVal(inicial),
      entradas: numVal(entradas),
      salidas: numVal(salidas),
      minimo: numVal(minimo),
    });
  };

  const campos = [
    { label: 'Inicial', value: inicial, set: setInicial },
    { label: 'Entradas', value: entradas, set: setEntradas },
    { label: 'Salidas', value: salidas, set: setSalidas },
    { label: 'Mínimo', value: minimo, set: setMinimo },
  ];

  return (
    <div style={{ borderTop: `1px solid ${T.divider}`, padding: '12px 14px', background: T.card }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {campos.map(({ label, value, set }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <label style={{ fontSize: 10, color: T.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
            <input
              type="number" min={0}
              value={value}
              onChange={e => set(e.target.value)}
              style={{
                width: '100%', height: 44, borderRadius: 8,
                background: T.card, border: '1px solid #6366f1',
                color: T.text, textAlign: 'center',
                fontSize: 18, fontWeight: 700, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 13, color: T.textSecondary }}>
        Actual: <strong style={{ fontSize: 18, color: actual < numVal(minimo) && numVal(minimo) > 0 ? '#ef4444' : '#22c55e' }}>{actual}</strong>
      </div>
      <button onClick={guardar}
        style={{ width: '100%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name="check" size={16} /> Guardar cambios
      </button>
      <button onClick={onPedir}
        style={{ width: '100%', background: inPedido ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.08)', border: `1px solid ${inPedido ? '#22c55e' : T.inputBorder}`, color: inPedido ? '#22c55e' : T.textMuted, borderRadius: 10, padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>
        {inPedido ? '✓ Ya está en pedidos' : '+ Agregar a pedidos'}
      </button>
    </div>
  );
}

export function TabStock({ data, setData, showToast }: Props) {
  const { theme: T } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [scanning, setScanning] = useState(false);
  const [editRef, setEditRef] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState<string | null>(null);

  const productos = (data.misProductos || []).map(p => {
    const s = (data.stock || {})[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
    const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
    return { ...p, stock: s, actual };
  }).filter(p => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return (
      (p.codigoRef || '').toLowerCase().includes(q) ||
      (p.codigoProv || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q) ||
      (p.proveedor || '').toLowerCase().includes(q) ||
      ((p as any).codigoBarras || '').toLowerCase().includes(q)
    );
  });

  const bajoMinimo = productos.filter(p => p.stock.minimo > 0 && p.actual < p.stock.minimo);

  const saveStock = (ref: string, vals: { inicial: number; entradas: number; salidas: number; minimo: number }) => {
    setData(d => ({ ...d, stock: { ...d.stock, [ref]: vals } }));
    showToast('Stock guardado', 'success');
    setEditRef(null);
  };

  const agregarAPedido = (p: typeof productos[0]) => {
    if ((data.pedidos || []).find(x => x.codigoRef === p.codigoRef)) {
      showToast('Ya está en pedidos', 'info'); return;
    }
    setData(d => ({
      ...d,
      pedidos: [...(d.pedidos || []), {
        codigoRef: p.codigoRef, codigoProv: p.codigoProv || '',
        descripcion: p.descripcion, cantidad: 1,
        proveedor: p.proveedor || '', precioCosto: p.precioCosto || 0,
      }]
    }));
    showToast('Agregado a pedidos', 'success');
  };

  return (
    <div>
      {bajoMinimo.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            <Icon name="alert" size={16} /> {bajoMinimo.length} producto(s) bajo mínimo
          </div>
          {bajoMinimo.map(p => (
            <div key={p.codigoRef} style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>
              • {p.codigoRef} — {p.descripcion} ({p.actual}/{p.stock.minimo})
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>Stock</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{data.misProductos.length} productos</div>
          </div>
          <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setScanning(true)}>
            <Icon name="camera" size={18} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }}>
            <Icon name="search" size={16} />
          </div>
          <input className="input-field" style={{ paddingLeft: 38 }}
            placeholder="Buscar producto..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} />
        </div>

        {productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textMuted }}>
            <Icon name="box" size={40} />
            <div style={{ marginTop: 12, fontSize: 14 }}>Sin productos</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {productos.map(p => {
              const bajo = p.stock.minimo > 0 && p.actual < p.stock.minimo;
              const foto = data.fotos[p.codigoRef];
              const inPedido = !!(data.pedidos || []).find(x => x.codigoRef === p.codigoRef);
              const isEdit = editRef === p.codigoRef;

              return (
                <div key={p.codigoRef} style={{ background: T.card, borderRadius: 12, border: `1px solid ${bajo ? 'rgba(239,68,68,0.4)' : T.divider}` }}>
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => setEditRef(isEdit ? null : p.codigoRef)}>
                    {foto
                      ? <img src={foto} alt="" onClick={e => { e.stopPropagation(); setPhotoZoom(foto); }}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in' }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 8, background: T.sectionBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inputBorder, fontSize: 20 }}>📦</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef}</span>
                        {p.codigoProv && <span style={{ fontSize: 11, color: T.textMuted }}>{p.codigoProv}</span>}
                        {bajo && <span className="badge" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>⚠ Bajo mín.</span>}
                      </div>
                      <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: bajo ? '#ef4444' : T.text }}>{p.actual}</div>
                      {p.stock.minimo > 0 && <div style={{ fontSize: 11, color: T.textMuted }}>mín: {p.stock.minimo}</div>}
                    </div>
                  </div>

                  {isEdit && (
                    <StockEditor
                      key={p.codigoRef + '-editor'}
                      codigoRef={p.codigoRef}
                      stock={p.stock}
                      onSave={vals => saveStock(p.codigoRef, vals)}
                      onPedir={() => agregarAPedido(p)}
                      inPedido={inPedido}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {photoZoom && (
        <div onClick={() => setPhotoZoom(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={photoZoom} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain' }} />
        </div>
      )}

      {scanning && (
        <Scanner
          onResult={code => { setScanning(false); setBusqueda(code.toUpperCase()); }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}
