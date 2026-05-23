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
  const [showCustom, setShowCustom] = useState(false);
  const [customDesc, setCustomDesc] = useState('');
  const [customPrecio, setCustomPrecio] = useState('');
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
          <button className="btn-ghost" style={{ padding: '8px 12px', flexShrink: 0, color: '#818cf8' }} onClick={() => { setCustomDesc(''); setCustomPrecio(''); setShowCustom(true); }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>$+</span>
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
                  {/* Row 1: name + delete button */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.codigoRef || item.descripcion}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{fmtPeso(item.precioVenta)} c/u
                        {actual <= 0 && inPedido && <span style={{ color: '#fbbf24', fontWeight: 700, marginLeft: 6 }}>● En pedido</span>}
                        {actual <= 0 && !inPedido && <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: 6 }}>● Sin stock</span>}
                      </div>
                    </div>
                    <button onClick={() => removeItem(i)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                  {/* Row 2: +Pedir | - qty + | total */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {actual <= 0 && !inPedido ? (
                      <button onClick={() => {
                        const prod = (data.misProductos || []).find(p => p.codigoRef === item.codigoRef);
                        if (!prod) return;
                        setData(d => ({ ...d, pedidos: [...(d.pedidos || []), { codigoRef: prod.codigoRef, codigoProv: prod.codigoProv || '', descripcion: prod.descripcion, cantidad: 1, proveedor: prod.proveedor || '', precioCosto: prod.precioCosto || 0 }] }));
                        showToast('Agregado a pedidos', 'success');
                      }} style={{ fontSize: 11, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
                        + Pedir
                      </button>
                    ) : (
                      <div style={{ width: 60, flexShrink: 0 }} />
                    )}
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
          empresaData={data.empresa}
          telefonoData={data.telefono}
          direccionData={data.direccion}
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

      {/* Custom item modal */}
      {showCustom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowCustom(false)}>
          <div style={{ background: '#1e2230', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 16 }}>Agregar importe libre</div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Descripción</label>
            <input className="input-field" style={{ marginBottom: 12 }}
              placeholder="Ej: Mano de obra, Flete..."
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              autoFocus
            />
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Precio</label>
            <input className="input-field" style={{ marginBottom: 20 }}
              type="number" placeholder="0"
              value={customPrecio}
              onChange={e => setCustomPrecio(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const precio = parseFloat(customPrecio.replace(',', '.')) || 0;
                  if (!customDesc.trim() || precio <= 0) return;
                  setItems(prev => [...prev, {
                    codigoRef: customDesc.trim(),
                    descripcion: customDesc.trim(),
                    codigoProv: '',
                    precioCosto: precio,
                    precioVenta: precio,
                    cantidad: 1,
                    margen: 0,
                    proveedor: '',
                    divisor: 1,
                  }]);
                  setShowCustom(false);
                }
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCustom(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'none', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                Cancelar
              </button>
              <button onClick={() => {
                const precio = parseFloat(customPrecio.replace(',', '.')) || 0;
                if (!customDesc.trim() || precio <= 0) return;
                setItems(prev => [...prev, {
                  codigoRef: customDesc.trim(),
                  descripcion: customDesc.trim(),
                  codigoProv: '',
                  precioCosto: precio,
                  precioVenta: precio,
                  cantidad: 1,
                  margen: 0,
                  proveedor: '',
                  divisor: 1,
                }]);
                setShowCustom(false);
              }} style={{ flex: 2, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
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
