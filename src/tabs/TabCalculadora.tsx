import React, { useState, useEffect } from 'react';
import { AppData, CartItem, Venta } from '../types';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Scanner } from '../components/Scanner';
import { calcPrecioVenta, fmtPeso, genId, todayStr, nowStr } from '../lib/utils';
import { useTheme } from '../ThemeContext';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabCalculadora({ data, setData, showToast }: Props) {
  const { theme: T } = useTheme();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [showConfirmVacio, setShowConfirmVacio] = useState(false);
  const [showConfirmVenta, setShowConfirmVenta] = useState(false);
  const [showModalEfectivo, setShowModalEfectivo] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showAgregar, setShowAgregar] = useState(false);
  const [agregarDesc, setAgregarDesc] = useState('');
  const [agregarPrecio, setAgregarPrecio] = useState('');

  const calcTotal = () => cart.reduce((sum, c) => sum + (c.precioVenta * c.cantidad), 0);
  const vuelto = montoEfectivo ? parseFloat(montoEfectivo) - calcTotal() : 0;

  const agregarAlCarrito = (prod: any) => {
    // Calcular precioVenta si no lo tiene (viene de misProductos)
    const precioVenta = prod.precioVenta || calcPrecioVenta(prod.precioCosto, prod.margen, data.margenes);
    const cartItem: CartItem = {
      ...prod,
      precioVenta: precioVenta
    };
    
    const existe = cart.findIndex(c => c.codigoRef === cartItem.codigoRef);
    if (existe !== -1) {
      const newCart = [...cart];
      newCart[existe].cantidad += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...cartItem, cantidad: 1 }]);
    }
    setSearch('');
  };

  const cambiarCantidad = (idx: number, qty: number) => {
    if (qty <= 0) { quitar(idx); return; }
    const newCart = [...cart];
    newCart[idx].cantidad = qty;
    setCart(newCart);
  };

  const quitar = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const registrarVenta = (monto?: number) => {
    if (!cart.length) return;
    const ventaId = genId();
    const total = calcTotal();
    const venta: Venta = {
      id: ventaId,
      fecha: todayStr(),
      hora: nowStr(),
      items: cart.map(c => ({ codigoRef: c.codigoRef, descripcion: c.descripcion, cantidad: c.cantidad, precioVenta: c.precioVenta })),
      total: total,
      paymentMethod: paymentMethod,
      amountReceived: monto,
      change: monto ? monto - total : undefined,
    };
    setData(d => ({ ...d, ventas: [...d.ventas, venta] }));
    showToast('Venta registrada', 'success');
    setCart([]);
    setShowConfirmVenta(false);
    setShowModalEfectivo(false);
    setMontoEfectivo('');
  };

  const suggestions = search.trim()
    ? data.misProductos.filter(p =>
        p.codigoRef.toUpperCase().includes(search.toUpperCase()) ||
        p.codigoProv.toUpperCase().includes(search.toUpperCase()) ||
        (p.codigoBarras && p.codigoBarras.includes(search)) ||
        p.descripcion.toUpperCase().includes(search.toUpperCase())
      ).sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'))
      .slice(0, 8)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* BÚSQUEDA */}
      <div style={{ padding: 12, background: T.card, borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Código, descripción o barras"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && suggestions.length) agregarAlCarrito(suggestions[0] as any); }}
            className="input-field"
            style={{ flex: 1, fontSize: 13 }}
          />
          <button onClick={() => setScanning(true)} className="btn-ghost" style={{ padding: 8, minWidth: 40 }}>
            <Icon name="camera" size={14} />
          </button>
          <button onClick={() => setShowAgregar(!showAgregar)} className="btn-ghost" style={{ padding: 8, minWidth: 40 }}>
            <Icon name="plus" size={14} />
          </button>
        </div>
        {suggestions.length > 0 && (
          <div style={{ marginTop: 8, background: T.cardHover, borderRadius: 8, overflow: 'hidden' }}>
            {suggestions.map((p, i) => (
              <button
                key={i}
                onClick={() => agregarAlCarrito(p as any)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < suggestions.length - 1 ? `1px solid ${T.divider}` : 'none',
                  color: T.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: T.text }}>{p.codigoRef}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{p.descripcion}</div>
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ color: '#22c55e', fontWeight: 600 }}>{fmtPeso(calcPrecioVenta(p.precioCosto, p.margen, data.margenes))}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    {data.stock?.[p.codigoRef]?.actual > 0 ? `Stock: ${data.stock[p.codigoRef].actual}` : 'Sin stock'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AGREGAR IMPORTE LIBRE */}
      {showAgregar && (
        <div style={{ padding: 12, background: T.card, borderRadius: 12, marginBottom: 12 }}>
          <input type="text" placeholder="Descripción" value={agregarDesc} onChange={e => setAgregarDesc(e.target.value)} className="input-field" style={{ fontSize: 13, marginBottom: 8 }} />
          <input type="number" placeholder="Precio" value={agregarPrecio} onChange={e => setAgregarPrecio(e.target.value)} className="input-field" style={{ fontSize: 13, marginBottom: 8 }} />
          <button
            className="btn-primary"
            onClick={() => {
              if (agregarDesc && agregarPrecio) {
                agregarAlCarrito({ codigoRef: 'LIBRE', codigoProv: '', descripcion: agregarDesc, precioCosto: 0, margen: 0, precioVenta: parseFloat(agregarPrecio), cantidad: 1 });
                setAgregarDesc('');
                setAgregarPrecio('');
                setShowAgregar(false);
              }
            }}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Icon name="check" size={14} /> Agregar
          </button>
        </div>
      )}

      {/* CARRITO */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: T.textMuted, fontSize: 13 }}>Carrito vacío</div>
        ) : (
          cart.map((item, idx) => (
            <div key={idx} style={{ background: T.card, borderRadius: 12, padding: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{item.descripcion}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{fmtPeso(item.precioVenta)}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={() => cambiarCantidad(idx, item.cantidad - 1)} className="btn-ghost" style={{ padding: 6, minWidth: 28, fontSize: 12 }}>−</button>
                <input type="number" value={item.cantidad} onChange={e => cambiarCantidad(idx, parseInt(e.target.value) || 1)} style={{ width: 40, padding: 6, textAlign: 'center', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 8, color: T.text, fontSize: 12 }} />
                <button onClick={() => cambiarCantidad(idx, item.cantidad + 1)} className="btn-ghost" style={{ padding: 6, minWidth: 28, fontSize: 12 }}>+</button>
                <button onClick={() => quitar(idx)} className="btn-danger" style={{ padding: 6, minWidth: 30 }}>
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TOTAL */}
      {cart.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: 14, borderRadius: 12, marginBottom: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>TOTAL</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{fmtPeso(calcTotal())}</div>
        </div>
      )}

      {/* MÉTODO DE PAGO */}
      {cart.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Método de pago</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => setPaymentMethod('transferencia')}
              style={{
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
        </div>
      )}

      {/* BOTONES ACCIÓN */}
      {cart.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button onClick={() => setShowConfirmVacio(true)} className="btn-danger" style={{ justifyContent: 'center' }}>
            <Icon name="trash" size={14} /> Vaciar
          </button>
          <button onClick={() => setShowConfirmVenta(true)} className="btn-primary" style={{ justifyContent: 'center' }}>
            <Icon name="check" size={14} /> VENTA
          </button>
        </div>
      )}

      {/* MODAL: CONFIRMAR VACIAR */}
      {showConfirmVacio && (
        <Modal onClose={() => setShowConfirmVacio(false)}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: T.text }}>🗑 ¿Vaciar carrito?</div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Se borrarán los {cart.length} item{cart.length > 1 ? 's' : ''}. ¿Continuar?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setShowConfirmVacio(false)} className="btn-ghost" style={{ justifyContent: 'center' }}>Cancelar</button>
              <button onClick={() => { setCart([]); setShowConfirmVacio(false); showToast('Carrito vaciado', 'info'); }} className="btn-danger" style={{ justifyContent: 'center' }}>Vaciar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CONFIRMAR VENTA */}
      {showConfirmVenta && (
        <Modal onClose={() => setShowConfirmVenta(false)}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: T.text }}>✓ Registrar venta</div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 4 }}>Total: <strong style={{ color: '#22c55e' }}>{fmtPeso(calcTotal())}</strong></div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Método: <strong>{paymentMethod === 'transferencia' ? 'Transferencia' : 'Efectivo'}</strong></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setShowConfirmVenta(false)} className="btn-ghost" style={{ justifyContent: 'center' }}>Cancelar</button>
              <button
                onClick={() => {
                  if (paymentMethod === 'efectivo') {
                    setShowConfirmVenta(false);
                    setShowModalEfectivo(true);
                  } else {
                    registrarVenta();
                  }
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

      {/* MODAL: EFECTIVO */}
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
            />
            <div style={{ background: T.cardHover, padding: 10, borderRadius: 8, marginBottom: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>Total a pagar</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 4 }}>{fmtPeso(calcTotal())}</div>
            </div>
            <div style={{ background: T.cardHover, padding: 10, borderRadius: 8, marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>Vuelto</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: vuelto >= 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>{fmtPeso(vuelto)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setShowModalEfectivo(false)} className="btn-ghost" style={{ justifyContent: 'center' }}>Cancelar</button>
              <button
                onClick={() => registrarVenta(parseFloat(montoEfectivo) || 0)}
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

      {/* SCANNER */}
      {scanning && <Scanner onDetect={code => { const p = data.misProductos.find(x => x.codigoBarras === code); if (p) agregarAlCarrito(p as any); setScanning(false); }} onClose={() => setScanning(false)} />}
    </div>
  );
}
