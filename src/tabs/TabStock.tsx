import React, { useState, useRef } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';
import { Scanner } from '../components/Scanner';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabStock({ data, setData, showToast }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [scanning, setScanning] = useState(false);
  const [editRef, setEditRef] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState<string | null>(null);

  const productos = (data.misProductos || []).map(p => {
    const s = (data.stock || {})[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
    const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
    return { ...p, stock: s, actual };
  }).filter(p => !busqueda ||
    p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const bajoMinimo = productos.filter(p => p.stock.minimo > 0 && p.actual < p.stock.minimo);

  const updateStock = (ref: string, field: 'inicial' | 'entradas' | 'salidas' | 'minimo', val: number) => {
    setData(d => {
      const cur = (d.stock || {})[ref] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
      return { ...d, stock: { ...d.stock, [ref]: { ...cur, [field]: Math.max(0, val) } } };
    });
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
      {/* Alerts */}
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
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{data.misProductos.length} productos</div>
          </div>
          <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setScanning(true)}>
            <Icon name="camera" size={18} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            <Icon name="search" size={16} />
          </div>
          <input className="input-field" style={{ paddingLeft: 38 }}
            placeholder="Buscar producto..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} />
        </div>

        {productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
            <Icon name="box" size={40} />
            <div style={{ marginTop: 12, fontSize: 14 }}>Sin productos</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {productos.map(p => {
              const bajo = p.stock.minimo > 0 && p.actual < p.stock.minimo;
              const foto = data.fotos[p.codigoRef];
              const inPedido = (data.pedidos || []).find(x => x.codigoRef === p.codigoRef);
              const isEdit = editRef === p.codigoRef;

              return (
                <div key={p.codigoRef} style={{ background: '#1e2230', borderRadius: 12, border: `1px solid ${bajo ? 'rgba(239,68,68,0.4)' : '#1e2535'}`, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}
                    onClick={() => setEditRef(isEdit ? null : p.codigoRef)}>
                    {foto
                      ? <img src={foto} alt="" onClick={e => { e.stopPropagation(); setPhotoZoom(foto); }}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in' }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 8, background: '#111827', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 20 }}>📦</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef}</span>
                        {p.codigoProv && <span style={{ fontSize: 11, color: '#4b5563' }}>{p.codigoProv}</span>}
                        {bajo && <span className="badge" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>⚠ Bajo mín.</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: bajo ? '#ef4444' : '#f1f5f9' }}>{p.actual}</div>
                      {p.stock.minimo > 0 && <div style={{ fontSize: 11, color: '#6b7280' }}>mín: {p.stock.minimo}</div>}
                    </div>
                  </div>

                  {/* Edit panel */}
                  {isEdit && (
                    <div style={{ borderTop: '1px solid #111827', padding: '12px 14px', background: '#161b27' }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        {(['inicial', 'entradas', 'salidas', 'minimo'] as const).map(field => (
                          <div key={field} style={{ flex: 1, minWidth: 70 }}>
                            <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{field}</label>
                            <input type="number" min={0}
                              value={p.stock[field] || 0}
                              onChange={e => updateStock(p.codigoRef, field, parseInt(e.target.value) || 0)}
                              style={{ width: '100%', height: 36, borderRadius: 8, background: '#1e2230', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }} />
                          </div>
                        ))}
                      </div>
                      <button onClick={() => agregarAPedido(p)}
                        style={{ width: '100%', padding: '8px', borderRadius: 8, background: inPedido ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${inPedido ? '#22c55e' : '#6366f1'}`, color: inPedido ? '#22c55e' : '#818cf8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>
                        {inPedido ? '✓ En pedidos' : '+ Pedir'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo zoom modal */}
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
