import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../ThemeContext';
import { AppData } from '../types';
import { calcPrecioVenta, fmtPeso } from '../lib/utils';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
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
  pendingItems?: any[];
  onClearPending?: () => void;
}

export function TabCalculadora({ data, setData, showToast, pendingItems, onClearPending }: Props) {
  const { theme: T } = useTheme();
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [showModalEfectivo, setShowModalEfectivo] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [showModalTransferencia, setShowModalTransferencia] = useState(false);
  const [refNombre, setRefNombre] = useState(() => localStorage.getItem('mn_ref_nombre') || '');
  const [refCelular, setRefCelular] = useState(() => localStorage.getItem('mn_ref_celular') || '');
  const [refDireccion, setRefDireccion] = useState(() => localStorage.getItem('mn_ref_direccion') || '');

  // Cargar items desde presupuestos
  useEffect(() => {
    if (pendingItems && pendingItems.length > 0) {
      setItems(pendingItems.map((p: any) => ({
        codigoRef: p.codigoRef || '',
        descripcion: p.descripcion || '',
        precioCosto: p.precioCosto || 0,
        precioVenta: p.precioVenta || 0,
        margen: p.margen || 0,
        cantidad: p.cantidad || 1,
        proveedor: p.proveedor || '',
      })));
      onClearPending && onClearPending();
    }
  }, [pendingItems]);
  const [busqueda, setBusqueda] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showPresupuesto, setShowPresupuesto] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
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
      )
      .sort((a, b) => {
        const q = busqueda.toLowerCase();
        const aDesc = (a.descripcion || '').toLowerCase();
        const bDesc = (b.descripcion || '').toLowerCase();
        // Prioridad: la descripción EMPIEZA con la búsqueda
        const aStarts = aDesc.startsWith(q) ? 0 : 1;
        const bStarts = bDesc.startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        // Luego alfabético
        return aDesc.localeCompare(bDesc, 'es');
      })
      .slice(0, 12)
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
      if (newQty <= 0) {
        if (!window.confirm(`¿Quitar "${next[idx].descripcion}" del carrito?`)) return prev;
        return next.filter((_, i) => i !== idx);
      }
      next[idx] = { ...next[idx], cantidad: newQty };
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const registrarVenta = (monto?: number) => {
    if (items.length === 0) return;
    const venta = {
      id: Date.now().toString(36),
      fecha: new Date().toLocaleDateString('es-AR'),
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      items: items.map(i => ({ codigoRef: i.codigoRef, descripcion: i.descripcion, cantidad: i.cantidad, precioVenta: i.precioVenta })),
      total,
      paymentMethod,
      amountReceived: monto,
      change: monto !== undefined ? monto - total : undefined,
      clienteNombre: paymentMethod === 'transferencia' ? refNombre : undefined,
      clienteCelular: paymentMethod === 'transferencia' ? refCelular : undefined,
      clienteDireccion: paymentMethod === 'transferencia' ? refDireccion : undefined,
    };
    setData(d => ({ ...d, ventas: [venta, ...(d.ventas || [])] }));
    setItems([]);
    setShowModalEfectivo(false);
    setShowModalTransferencia(false);
    setMontoEfectivo('');
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
              onChange={e => { setBusqueda(e.target.value); setShowSuggestions(true); setSelectedIdx(-1); }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (sugerencias.length > 0) { setShowSuggestions(true); setSelectedIdx(i => (i + 1) % sugerencias.length); }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (sugerencias.length > 0) { setShowSuggestions(true); setSelectedIdx(i => (i <= 0 ? sugerencias.length - 1 : i - 1)); }
                } else if (e.key === 'Enter') {
                  if (sugerencias.length > 0) {
                    const idx = selectedIdx >= 0 && selectedIdx < sugerencias.length ? selectedIdx : 0;
                    agregarProducto(sugerencias[idx].codigoRef);
                    setSelectedIdx(-1);
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setSelectedIdx(-1);
                }
              }}
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
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.card, border: `1px solid ${T.inputBorder}`, borderRadius: 12, zIndex: 50, maxHeight: 300, overflowY: 'auto', marginTop: 4 }}>
            {sugerencias.map((p, i) => {
              const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
              const s = (data.stock || {})[p.codigoRef];
              const actual = s ? (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0) : 0;
              const inPedido = (data.pedidos || []).find(x => x.codigoRef === p.codigoRef);
              return (
                <div key={i} onClick={() => agregarProducto(p.codigoRef)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  ref={el => { if (el && i === selectedIdx) el.scrollIntoView({ block: 'nearest' }); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: i === selectedIdx ? T.cardHover : 'transparent' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
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
                <div key={i} style={{ background: T.sectionBg, borderRadius: 12, padding: '10px 12px' }}>
                  {/* Row 1: name + delete button */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: T.text, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.codigoRef || item.descripcion}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{fmtPeso(item.precioVenta)} c/u
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
                      <button onClick={() => updateQty(i, -1)} style={{ width: 32, height: 32, borderRadius: 8, background: T.inputBorder, border: 'none', color: T.text, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <input type="number" min={1} value={item.cantidad} onChange={e => { const v = parseInt(e.target.value) || 1; setItems(next => { const n = [...next]; n[i] = { ...n[i], cantidad: Math.max(1, v) }; return n; }); }} style={{ width: 44, textAlign: "center", fontWeight: 700, fontSize: 16, color: "#f1f5f9", background: "#1e2230", border: "1px solid #374151", borderRadius: 8, padding: "4px 2px", fontFamily: "inherit", outline: "none" }} />
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

          {/* Método de pago */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => { setPaymentMethod('transferencia'); setShowModalTransferencia(true); }}
              style={{
                flex: 1,
                padding: 12,
                background: paymentMethod === 'transferencia' ? '#818cf8' : T.inputBg,
                color: paymentMethod === 'transferencia' ? 'white' : T.textSecondary,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              💳 Transferencia
            </button>
            <button
              onClick={() => { setPaymentMethod('efectivo'); setShowModalEfectivo(true); }}
              style={{
                flex: 1,
                padding: 12,
                background: paymentMethod === 'efectivo' ? '#22c55e' : T.inputBg,
                color: paymentMethod === 'efectivo' ? 'white' : T.textSecondary,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              💵 Efectivo
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ padding: '12px 14px' }} onClick={() => { if (window.confirm(`¿Vaciar el carrito? Se borrarán ${items.length} item(s).`)) setItems([]); }}>
              <Icon name="trash" size={16} />
            </button>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowPresupuesto(true)}>
              <Icon name="download" size={16} /> Presupuesto
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { if (paymentMethod === 'efectivo') { setShowModalEfectivo(true); } else { setShowModalTransferencia(true); } }}>
              <Icon name="check" size={16} /> Venta
            </button>
          </div>
        </div>
      )}

      {showModalTransferencia && (
        <Modal onClose={() => setShowModalTransferencia(false)}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: T.text }}>💳 Referencia de transferencia</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Datos opcionales para guardar como referencia del cliente</div>
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={refNombre}
              onChange={e => setRefNombre(e.target.value)}
              className="input-field"
              style={{ marginBottom: 8, fontSize: 14 }}
            />
            <input
              type="tel"
              placeholder="Celular"
              value={refCelular}
              onChange={e => setRefCelular(e.target.value)}
              className="input-field"
              style={{ marginBottom: 8, fontSize: 14 }}
            />
            <input
              type="text"
              placeholder="Dirección"
              value={refDireccion}
              onChange={e => setRefDireccion(e.target.value)}
              className="input-field"
              style={{ marginBottom: 14, fontSize: 14 }}
            />
            <div style={{ background: T.cardHover, padding: 10, borderRadius: 8, marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>Total a confirmar</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 4 }}>{fmtPeso(total)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setShowModalTransferencia(false)} className="btn-ghost" style={{ justifyContent: 'center' }}>Cancelar</button>
              <button
                onClick={() => {
                  if (!window.confirm(`¿Confirmar venta de ${fmtPeso(total)} por transferencia?`)) return;
                  try {
                    localStorage.setItem('mn_ref_nombre', refNombre);
                    localStorage.setItem('mn_ref_celular', refCelular);
                    localStorage.setItem('mn_ref_direccion', refDireccion);
                  } catch (e) {}
                  registrarVenta();
                }}
                className="btn-primary"
                style={{ justifyContent: 'center' }}
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showModalEfectivo && (
        <Modal onClose={() => setShowModalEfectivo(false)}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: T.text }}>💵 Pago en efectivo</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>¿Con cuánto abona el cliente?</div>
            <input
              type="number"
              placeholder="Ej: 7000"
              value={montoEfectivo}
              onChange={e => setMontoEfectivo(e.target.value)}
              className="input-field"
              style={{ marginBottom: 12, fontSize: 14 }}
              autoFocus
            />
            <div style={{ background: T.cardHover, padding: 10, borderRadius: 8, marginBottom: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>Total a pagar</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 4 }}>{fmtPeso(total)}</div>
            </div>
            <div style={{ background: T.cardHover, padding: 10, borderRadius: 8, marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>Vuelto</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: (montoEfectivo && (parseFloat(montoEfectivo) - total) >= 0) ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                {fmtPeso(montoEfectivo ? parseFloat(montoEfectivo) - total : 0)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setShowModalEfectivo(false)} className="btn-ghost" style={{ justifyContent: 'center' }}>Cancelar</button>
              <button
                onClick={() => {
                  const monto = parseFloat(montoEfectivo) || 0;
                  if (!window.confirm(`¿Confirmar venta de ${fmtPeso(total)} en efectivo?`)) return;
                  registrarVenta(monto);
                }}
                disabled={!montoEfectivo}
                className="btn-primary"
                style={{ justifyContent: 'center', opacity: montoEfectivo ? 1 : 0.5, cursor: montoEfectivo ? 'pointer' : 'not-allowed' }}
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showPresupuesto && (
        <Presupuesto
          misProductos={data.misProductos}
          items={items}
          total={total}
          onClose={() => setShowPresupuesto(false)}
          empresaData={(data as any).empresa}
          telefonoData={(data as any).telefono}
          direccionData={(data as any).direccion}
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
        />
      )}

      {/* Custom item modal */}
      {showCustom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowCustom(false)}>
          <div style={{ background: T.card, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 16 }}>Agregar importe libre</div>
            <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4 }}>Descripción</label>
            <input className="input-field" style={{ marginBottom: 12 }}
              placeholder="Ej: Mano de obra, Flete..."
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              autoFocus
            />
            <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4 }}>Precio</label>
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
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'none', border: `1px solid ${T.inputBorder}`, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
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
