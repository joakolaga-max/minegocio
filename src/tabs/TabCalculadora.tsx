import React, { useState, useCallback } from 'react';
import { AppData, VentaItem } from '../types';
import { calcPrecioVenta, fmtPeso, fmtPesoInt, todayStr, nowStr, genId } from '../lib/utils';
import { Icon } from '../components/Icon';
import { Scanner } from '../components/Scanner';
import { Presupuesto } from '../components/Presupuesto';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface CartItem {
  codigoRef: string;
  descripcion: string;
  precioVenta: number;
  cantidad: number;
  divisor: number;
}

export function TabCalculadora({ data, setData, showToast }: Props) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showPresupuesto, setShowPresupuesto] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const sugerencias = busqueda.length > 0
    ? (data.misProductos || []).filter(p =>
        p.codigoRef.toUpperCase().includes(busqueda.toUpperCase()) ||
        (p.codigoProv || '').toUpperCase().includes(busqueda.toUpperCase()) ||
        ((p as any).codigoBarras || '').toUpperCase().includes(busqueda.toUpperCase()) ||
        (p.descripcion || '').toUpperCase().includes(busqueda.toUpperCase())
      ).slice(0, 8)
    : [];

  const total = items.reduce((s, i) => s + i.precioVenta * i.cantidad, 0);

  const agregarProducto = useCallback((codigoRef: string) => {
    const prod = (data.misProductos || []).find(p =>
      p.codigoRef === codigoRef.toUpperCase() ||
      p.codigoProv === codigoRef.toUpperCase() ||
      ((p as any).codigoBarras || '').toUpperCase() === codigoRef.toUpperCase()
    );
    if (!prod) {
      showToast('Código no encontrado', 'error');
      return;
    }
    const pvTotal = calcPrecioVenta(prod.precioCosto, prod.margen, data.margenes);
    const div = (prod.divisor && prod.divisor > 1) ? prod.divisor : 1;
    const pv = pvTotal / div;
    const desc = div > 1 ? `${prod.descripcion} (÷${div})` : prod.descripcion;

    setItems(its => {
      const idx = its.findIndex(i => i.codigoRef === prod.codigoRef);
      if (idx >= 0) {
        const n = [...its];
        n[idx] = { ...n[idx], cantidad: n[idx].cantidad + 1 };
        return n;
      }
      return [...its, { codigoRef: prod.codigoRef, descripcion: desc, precioVenta: pv, cantidad: 1, divisor: div }];
    });
    setBusqueda('');
    setShowSuggestions(false);
  }, [data, showToast]);

  const confirmarVenta = () => {
    if (items.length === 0) { showToast('No hay productos', 'error'); return; }
    if (!window.confirm(`Confirmar venta por ${fmtPeso(total)}?`)) return;

    setData(d => {
      // Discount stock
      const newStock = { ...d.stock };
      items.forEach(item => {
        if (item.codigoRef) {
          const cur = newStock[item.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
          newStock[item.codigoRef] = { ...cur, salidas: (cur.salidas || 0) + item.cantidad * item.divisor };
        }
      });
      // Register sale
      const venta = {
        id: genId(),
        fecha: todayStr(),
        hora: nowStr(),
        items: items.map(i => ({
          codigoRef: i.codigoRef,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioVenta: i.precioVenta,
        })),
        total,
      };
      return { ...d, stock: newStock, ventas: [...d.ventas, venta] };
    });
    setItems([]);
    showToast('Venta confirmada', 'success');
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
              className="input-field"
              style={{ paddingLeft: 38, background: '#1e2230', color: '#f1f5f9' }}
              placeholder="Buscar por REF, cod proveedor o descripción..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value.toUpperCase()); setShowSuggestions(true); }}
              onKeyDown={e => { if (e.key === 'Enter') agregarProducto(busqueda); if (e.key === 'Escape') setShowSuggestions(false); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
          </div>
          <button className="btn-ghost" onClick={() => setScanning(true)} style={{ padding: '10px 14px' }}>
            <Icon name="camera" size={20} />
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && sugerencias.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#1e2230', border: '1px solid #374151', borderRadius: 12,
            zIndex: 200, maxHeight: 300, overflowY: 'auto', marginTop: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {sugerencias.map((p, i) => {
              const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
              const div = p.divisor && p.divisor > 1 ? p.divisor : 1;
              const foto = data.fotos[p.codigoRef];
              return (
                <div
                  key={i}
                  onClick={() => agregarProducto(p.codigoRef)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: i < sugerencias.length - 1 ? '1px solid #111827' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {foto && <img src={foto} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef}</span>
                      {p.codigoProv && <span style={{ fontSize: 11, color: '#4b5563' }}>{p.codigoProv}</span>}
                    </div>
                    <div style={{ fontSize: 15, color: '#f1f5f9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>
                    {fmtPesoInt(pv / div)}{div > 1 ? ' c/u' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>
          <Icon name="store" size={44} />
          <div style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>Buscá un producto para agregar</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: '#111827', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{fmtPeso(item.precioVenta)} c/u</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setItems(its => its.map((x, j) => j === i ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x))}
                    style={{ width: 28, height: 28, borderRadius: 6, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <input
                    type="number" min={1} value={item.cantidad}
                    onChange={e => setItems(its => its.map((x, j) => j === i ? { ...x, cantidad: Math.max(1, parseInt(e.target.value) || 1) } : x))}
                    style={{ width: 44, height: 28, borderRadius: 6, background: '#1e2230', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}
                  />
                  <button onClick={() => setItems(its => its.map((x, j) => j === i ? { ...x, cantidad: x.cantidad + 1 } : x))}
                    style={{ width: 28, height: 28, borderRadius: 6, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  <div style={{ width: 70, textAlign: 'right', fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{fmtPesoInt(item.precioVenta * item.cantidad)}</div>
                  <button onClick={() => setItems(its => its.filter((_, j) => j !== i))}
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total + actions */}
          <div style={{ background: 'linear-gradient(135deg,#1e3a2e,#1a3025)', borderRadius: 14, border: '1px solid #166534', padding: '14px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#86efac', fontWeight: 600 }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{fmtPeso(total)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ padding: '12px 14px' }}
              onClick={() => { if (window.confirm('Limpiar calculadora?')) setItems([]); }}>
              <Icon name="trash" size={16} />
            </button>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setShowPresupuesto(true)}>
              <Icon name="download" size={16} /> Presupuesto
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={confirmarVenta}>
              <Icon name="check" size={16} /> Venta
            </button>
          </div>
        </>
      )}

      {showPresupuesto && (
        <Presupuesto
          items={items}
          total={total}
          onClose={() => setShowPresupuesto(false)}
        />
      )}

      {scanning && (
        <Scanner
          onResult={code => { setScanning(false); agregarProducto(code); }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}
