import React, { useState, useRef, useCallback } from 'react';
import { AppData } from '../types';
import { calcPrecioVenta, fmtPeso } from '../lib/utils';
import { Icon } from '../components/Icon';
import { Scanner } from '../components/Scanner';
import { Presupuesto } from '../components/Presupuesto';

interface CartItem {
  codigoRef: string;
  descripcion: string;
  codigoProv: string;
  precioCosto: number;
  precioVenta: number;
  cantidad: number;
  margen: number | string;
  proveedor: string;
  divisor: number;
}

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabCalculadora({ data, setData, showToast }: Props) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showPresupuesto, setShowPresupuesto] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = items.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0);

  const sugerencias = busqueda.length > 0
    ? (data.misProductos || []).filter(p =>
        p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        ((p as any).codigoBarras || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
      ).slice(0, 8)
    : [];

  const agregarProducto = useCallback((ref: string) => {
    const p = (data.misProductos || []).find(x =>
      x.codigoRef.toLowerCase() === ref.toLowerCase() ||
      (x.codigoProv || '').toLowerCase() === ref.toLowerCase() ||
      ((x as any).codigoBarras || '').toLowerCase() === ref.toLowerCase()
    );
    if (!p) { showToast('Producto no encontrado', 'error'); return; }
    const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
    setItems(prev => {
      const idx = prev.findIndex(i => i.codigoRef === p.codigoRef);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [...prev, {
        codigoRef: p.codigoRef,
        descripcion: p.descripcion,
        codigoProv: p.codigoProv || '',
        precioCosto: p.precioCosto,
        precioVenta: pv,
        cantidad: 1,
        margen: p.margen,
        proveedor: p.proveedor || '',
        divisor: p.divisor || 1,
      }];
    });
    setBusqueda('');
    setShowSuggestions(false);
    showToast(`${p.codigoRef} agregado`, 'success');
  }, [data.misProductos, data.margenes, showToast]);

  const updateQty = (idx: number, delta: number) => {
    setItems(prev => {
      const next = [...prev];
      const newQty = next[idx].cantidad + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], cantidad: newQty };
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const registrarVenta = () => {
    if (items.length === 0) return;
    const venta = {
      id: Date.now().toString(36),
      fecha: new Date().toLocaleDateString('es-AR'),
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      items: items.map(i => ({ codigoRef: i.codigoRef, descripcion: i.descripcion, cantidad: i.cantidad, precioVenta: i.precioVenta })),
      total,
    };
    setData(d => ({ ...d, ventas: [venta, ...(d.ventas || [])] }));
    setItems([]);
    showToast('Venta registrada', 'success');
  };

  return (
    <div className="card">
      <div className="section-title">Calculadora</div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
              <Icon name="search" size={16} />
            </div>
            <input
              ref={inputRef}
              className="input-field"
              style={{ paddingLeft: 38 }}
              placeholder="Buscar por REF, cod proveedor o código de barras..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e => { if (e.key === 'Enter' && sugerencias.length > 0) agregarProducto(sugerencias[0].codigoRef); }}
            />
          </div>
          <button className="btn-ghost" style={{ padding: '8px 12px', flexShrink: 0 }} onClick={() => setScanning(true)}>
            <Icon name="camera" size={18} />
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && sugerencias.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e2230', border: '1px solid #374151', borderRadius: 12, zIndex: 50, maxHeight: 300, overflowY: 'auto', marginTop: 4 }}>
            {sugerencias.map((p, i) => {
              const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
              const s = (data.stock || {})[p.codigoRef];
              const actual = s ? (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0) : 0;
              const inPedido = (data.pedidos || []).find(x => x.codigoRef === p.codigoRef);
              return (
                <div key={i} onClick={() => agregarProducto(p.codigoRef)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                    {actual <= 0 && (
                      <span style={{ fontSize: 10, color: inPedido ? '#fbbf24' : '#ef4444', fontWeight: 700 }}>
                        {inPedido ? '● En pedido' : '● Sin stock'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 13, flexShrink: 0 }}>{fmtPeso(pv)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
          <Icon name="cart" size={40} />
          <div style={{ marginTop: 12, fontSize: 14 }}>Buscá un producto para agregar</div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {items.map((item, i) => {
              const s = (data.stock || {})[item.codigoRef || ''];
              const actual = s ? (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0) : 0;
              const inPedido = (data.pedidos || []).find(p => p.codigoRef === item.codigoRef);
              return (
                <div key={i} style={{ background: '#111827', borderRadius: 12, padding: '10px 12px' }}>
                  {/* Row 1: name + stock */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.codigoRef || item.descripcion}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{fmtPeso(item.precioVenta)} c/u</span>
                      {actual <= 0 && inPedido && (
                        <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700 }}>● En pedido</span>
                      )}
                      {actual <= 0 && !inPedido && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>● Sin stock</span>
                          <button onClick={() => {
                            const prod = (data.misProductos || []).find(p => p.codigoRef === item.codigoRef);
                            if (!prod) return;
                            setData(d => ({ ...d, pedidos: [...(d.pedidos || []), { codigoRef: prod.codigoRef, codigoProv: prod.codigoProv || '', descripcion: prod.descripcion, cantidad: 1, proveedor: prod.proveedor || '', precioCosto: prod.precioCosto || 0 }] }));
                            showToast('Agregado a pedidos', 'success');
                          }} style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 6, padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            +Pedir
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Row 2: delete | - qty + | total */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => removeItem(i)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="trash" size={14} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
                      <button onClick={() => updateQty(i, -1)} style={{ width: 32, height: 32, borderRadius: 8, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{item.cantidad}</span>
                      <button onClick={() => updateQty(i, 1)} style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 14, flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
                      {fmtPeso(item.precioVenta * item.cantidad)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div style={{ background: 'linear-gradient(135deg,#1e3a2e,#1a3025)', borderRadius: 14, border: '1px solid #166534', padding: '14px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#86efac', fontWeight: 600 }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{fmtPeso(total)}</div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ padding: '12px 14px' }} onClick={() => setItems([])}>
              <Icon name="trash" size={16} />
            </button>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowPresupuesto(true)}>
              <Icon name="download" size={16} /> Presupuesto
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={registrarVenta}>
              <Icon name="check" size={16} /> Venta
            </button>
          </div>
        </div>
      )}

      {showPresupuesto && (
        <Presupuesto
          items={items}
          total={total}
          onClose={() => setShowPresupuesto(false)}
          onGuardar={(cliente, nota, descuento) => {
            const pres = {
              id: Date.now().toString(36),
              fecha: new Date().toLocaleDateString('es-AR'),
              hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
              cliente,
              items: items.map(i => ({ codigoRef: i.codigoRef, descripcion: i.descripcion, cantidad: i.cantidad, precioVenta: i.precioVenta })),
              total,
            };
            setData(d => ({ ...d, presupuestos: [...(d.presupuestos || []), pres] }));
            showToast('Presupuesto guardado', 'success');
            setShowPresupuesto(false);
          }}
          data={data}
        />
      )}

      {scanning && (
        <Scanner
          onResult={code => { setScanning(false); agregarProducto(code.toUpperCase()); }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}
