import React, { useState } from 'react';
import { AppData, Orden, PedidoItem } from '../types';
import { Icon } from '../components/Icon';
import { fmtPesoInt, todayStr, nowStr } from '../lib/utils';
import { saveToFirebase } from '../lib/firebase';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabPedidos({ data, setData, showToast }: Props) {
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [busqAgregar, setBusqAgregar] = useState('');
  const [showAgregar, setShowAgregar] = useState(false);
  const [ordenActiva, setOrdenActiva] = useState<Orden | null>(null);

  const pedidos = data.pedidos || [];
  const historial = [...(data.pedidosHistorial || [])].reverse();
  const fmt = fmtPesoInt;
  const totalGeneral = pedidos.reduce((s, p) => s + (p.precioCosto || 0) * (p.cantidad || 1), 0);

  // Group by proveedor name
  const porProveedor: Record<string, PedidoItem[]> = {};
  pedidos.forEach(p => {
    let provName = p.proveedor;
    if (!provName && p.codigoProv) {
      const found = (data.proveedores || []).find(pv => pv.productos?.find(x => x.codigo === p.codigoProv));
      if (found) provName = found.nombre;
    }
    const key = provName || p.codigoProv || 'Sin proveedor';
    if (!porProveedor[key]) porProveedor[key] = [];
    porProveedor[key].push(p);
  });

  const bajoMinimo = (data.misProductos || []).filter(p => {
    const s = (data.stock || {})[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
    const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
    return s.minimo > 0 && actual < s.minimo && !pedidos.find(x => x.codigoRef === p.codigoRef);
  });

  const resultadosAgregar = busqAgregar.length > 1 ? (() => {
    const q = busqAgregar.toLowerCase();
    return (data.misProductos || []).filter(p =>
      (p.codigoRef || '').toLowerCase().includes(q) ||
      (p.codigoProv || '').toLowerCase().includes(q) ||
      ((p as any).codigoBarras || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q)
    ).slice(0, 30);
  })() : [];

  const quitar = (ref: string) => {
    if (!window.confirm('Quitar este producto del pedido?')) return;
    setData(d => ({ ...d, pedidos: (d.pedidos || []).filter(x => (x.codigoRef || x.codigoProv) !== ref) }));
  };
  const cambiarCant = (ref: string, delta: number) => setData(d => ({
    ...d, pedidos: (d.pedidos || []).map(x => (x.codigoRef || x.codigoProv) === ref ? { ...x, cantidad: Math.max(1, (x.cantidad || 1) + delta) } : x)
  }));

  const agregarBajoMinimo = () => {
    const nuevos = bajoMinimo.map(p => {
      const s = (data.stock || {})[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
      const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
      return { codigoRef: p.codigoRef, codigoProv: p.codigoProv || '', descripcion: p.descripcion, cantidad: Math.max(1, (s.minimo || 1) - actual), proveedor: p.proveedor || '', precioCosto: p.precioCosto || 0 };
    });
    setData(d => ({ ...d, pedidos: [...(d.pedidos || []), ...nuevos] }));
    showToast(`${nuevos.length} productos agregados`, 'success');
  };

  const exportarProveedor = (prov: string, items: PedidoItem[]) => {
    const w = window as any;
    if (!w.XLSX) return;
    const ws = w.XLSX.utils.aoa_to_sheet([
      ['Cod Proveedor', 'Descripcion', 'Cantidad', 'Precio Costo'],
      ...items.map(i => [i.codigoProv || i.codigoRef, i.descripcion, i.cantidad || 1, parseFloat((i.precioCosto || 0).toFixed(2))])
    ]);
    ws['!cols'] = [{ wch: 16 }, { wch: 42 }, { wch: 10 }, { wch: 14 }];
    const wb = w.XLSX.utils.book_new();
    w.XLSX.utils.book_append_sheet(wb, ws, 'Pedido');
    w.XLSX.writeFile(wb, `Pedido_${prov.replace(/\s+/g, '_')}.xlsx`);
  };

  const enviarWhatsApp = (prov: string, items: PedidoItem[]) => {
    const total = items.reduce((s, i) => s + (i.precioCosto || 0) * (i.cantidad || 1), 0);
    const msg = `Pedido para *${prov}*:\n\n${items.map(i => `• ${i.descripcion} — x${i.cantidad}`).join('\n')}\n\n_Total estimado: ${fmt(total)}_`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg));
  };

  const enviarPedido = (prov: string, items: PedidoItem[]) => {
    if (!window.confirm(`Marcar pedido a ${prov} como ENVIADO?`)) return;
    const orden: Orden = {
      id: Date.now(), proveedor: prov,
      items: items.map(i => ({ ...i, cantRecibida: null })),
      estado: 'enviado', fechaEnviado: todayStr(), horaEnviado: nowStr(),
      totalEstimado: items.reduce((s, i) => s + (i.precioCosto || 0) * (i.cantidad || 1), 0),
    };
    setData(d => {
      const newPedidos = (d.pedidos || []).filter(x => {
        const xProv = x.proveedor || (data.proveedores.find(pv => pv.productos?.find(pr => pr.codigo === x.codigoProv))?.nombre) || x.codigoProv || 'Sin proveedor';
        return xProv !== prov;
      });
      const newHist = [...(d.pedidosHistorial || []), orden];
      saveToFirebase('pedidosHistorial', newHist);
      return { ...d, pedidos: newPedidos, pedidosHistorial: newHist };
    });
    exportarProveedor(prov, items);
    showToast(`Pedido enviado a ${prov}`, 'success');
  };

  const RecepcionModal = ({ orden }: { orden: Orden }) => {
    const [cantidades, setCantidades] = useState<Record<string, number>>(
      Object.fromEntries(orden.items.map(i => [i.codigoRef || i.codigoProv, i.cantidad || 1]))
    );
    const confirmar = () => {
      if (!window.confirm('Confirmar recepción? Se actualizará el stock.')) return;
      setData(d => {
        const newStock = { ...d.stock };
        orden.items.forEach(item => {
          const cant = cantidades[item.codigoRef || item.codigoProv] || 0;
          if (cant > 0 && item.codigoRef) {
            const cur = newStock[item.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
            newStock[item.codigoRef] = { ...cur, entradas: (cur.entradas || 0) + cant };
          }
        });
        const newHist = (d.pedidosHistorial || []).map(o => o.id === orden.id
          ? { ...o, estado: 'recibido' as const, fechaRecibido: todayStr(), items: o.items.map(i => ({ ...i, cantRecibida: cantidades[i.codigoRef || i.codigoProv] || 0 })) }
          : o);
        saveToFirebase('pedidosHistorial', newHist);
        return { ...d, stock: newStock, pedidosHistorial: newHist };
      });
      showToast('Stock actualizado!', 'success');
      setOrdenActiva(null);
    };

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setOrdenActiva(null)}>
        <div style={{ background: '#1e2230', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Recepción — {orden.proveedor}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Ajustá las cantidades recibidas</div>
            </div>
            <button onClick={() => setOrdenActiva(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
              <Icon name="x" size={20} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16 }}>
            {orden.items.map((item, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #111827', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#818cf8', fontFamily: 'monospace' }}>{item.codigoRef || item.codigoProv}</div>
                  <div style={{ fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Ped: {item.cantidad}</span>
                  <button onClick={() => setCantidades(c => ({ ...c, [item.codigoRef || item.codigoProv]: Math.max(0, (c[item.codigoRef || item.codigoProv] || 0) - 1) }))}
                    style={{ width: 26, height: 26, borderRadius: 6, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <input type="number" min={0} value={cantidades[item.codigoRef || item.codigoProv] || 0}
                    onChange={e => setCantidades(c => ({ ...c, [item.codigoRef || item.codigoProv]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    style={{ width: 48, height: 26, borderRadius: 6, background: '#111827', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }} />
                  <button onClick={() => setCantidades(c => ({ ...c, [item.codigoRef || item.codigoProv]: (c[item.codigoRef || item.codigoProv] || 0) + 1 }))}
                    style={{ width: 26, height: 26, borderRadius: 6, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={confirmar} style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 12, padding: 13, width: '100%', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="check" size={16} /> Confirmar y actualizar stock
          </button>
        </div>
      </div>
    );
  };

  const filteredProvs = Object.keys(porProveedor).filter(prov =>
    !busqueda || porProveedor[prov].some(p =>
      (p.codigoRef || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())));

  return (
    <div>
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>Pedidos</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{pedidos.length} producto(s) en borrador</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setVistaHistorial(v => !v)} style={{ background: vistaHistorial ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', border: '1px solid #6366f1', color: '#818cf8', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 }}>
              {vistaHistorial ? 'Ver Borrador' : `Historial (${historial.length})`}
            </button>
            {!vistaHistorial && bajoMinimo.length > 0 && (
              <button onClick={agregarBajoMinimo} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="alert" size={13} /> {bajoMinimo.length} bajo mínimo
              </button>
            )}
            {!vistaHistorial && pedidos.length > 0 && (
              <button onClick={() => { if (window.confirm('Limpiar lista?')) setData(d => ({ ...d, pedidos: [] })); }} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 }}>
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* BORRADOR */}
        {!vistaHistorial && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><Icon name="search" size={16} /></div>
                <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Buscar en pedidos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
              <button className="btn-primary" style={{ flexShrink: 0, padding: '10px 14px' }} onClick={() => setShowAgregar(true)}>
                <Icon name="plus" size={18} />
              </button>
            </div>

            {pedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#374151' }}>
                <Icon name="box" size={44} />
                <div style={{ marginTop: 14, fontSize: 15, color: '#6b7280' }}>Lista vacía</div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>Usá + para agregar o el botón bajo mínimo</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                  {filteredProvs.map(prov => {
                    const items = porProveedor[prov];
                    const total = items.reduce((s, i) => s + (i.precioCosto || 0) * (i.cantidad || 1), 0);
                    return (
                      <div key={prov} style={{ background: '#161b27', borderRadius: 14, border: '1px solid #1e2535', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #111827', background: 'rgba(99,102,241,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#818cf8' }}>{prov}</div>
                            <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{fmt(total)}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => exportarProveedor(prov, items)} style={{ flex: 1, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid #6366f1', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                              <Icon name="download" size={12} /> Excel
                            </button>
                            <button onClick={() => enviarWhatsApp(prov, items)} style={{ flex: 1, background: 'rgba(37,211,102,0.15)', color: '#25d366', border: '1px solid #25d366', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                              WA
                            </button>
                            <button onClick={() => enviarPedido(prov, items)} style={{ flex: 2, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                              <Icon name="check" size={12} /> Enviado
                            </button>
                          </div>
                        </div>
                        {items.map((p, i) => (
                          <div key={p.codigoRef || p.codigoProv || i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < items.length - 1 ? '1px solid #111827' : 'none' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef || p.codigoProv}</span>
                                {p.codigoProv && p.codigoRef && <span style={{ fontSize: 11, color: '#4b5563' }}>{p.codigoProv}</span>}
                              </div>
                              <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button onClick={() => cambiarCant(p.codigoRef || p.codigoProv, -1)} style={{ width: 28, height: 28, borderRadius: 6, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                              <input type="number" min={1} value={p.cantidad || 1}
                                onChange={e => { const ref = p.codigoRef || p.codigoProv; setData(d => ({ ...d, pedidos: (d.pedidos || []).map(x => (x.codigoRef || x.codigoProv) === ref ? { ...x, cantidad: Math.max(1, parseInt(e.target.value) || 1) } : x) })); }}
                                style={{ width: 44, height: 28, borderRadius: 6, background: '#1e2230', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }} />
                              <button onClick={() => cambiarCant(p.codigoRef || p.codigoProv, 1)} style={{ width: 28, height: 28, borderRadius: 6, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                              <button onClick={() => quitar(p.codigoRef || p.codigoProv)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
                                <Icon name="trash" size={13} /> Quitar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: 'linear-gradient(135deg,#1e3a2e,#1a3025)', borderRadius: 14, border: '1px solid #166534', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: '#86efac', fontWeight: 600 }}>Total estimado</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{fmt(totalGeneral)}</div>
                </div>
              </>
            )}
          </>
        )}

        {/* HISTORIAL */}
        {vistaHistorial && (historial.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#374151' }}>
            <Icon name="download" size={44} />
            <div style={{ marginTop: 14, fontSize: 15, color: '#6b7280' }}>No hay pedidos enviados aún</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historial.map((orden, i) => (
              <div key={orden.id || i} style={{ background: '#161b27', borderRadius: 14, border: '1px solid #1e2535', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{orden.proveedor}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      {orden.estado === 'recibido' ? `Recibido: ${orden.fechaRecibido}` : `Enviado: ${orden.fechaEnviado} ${orden.horaEnviado}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: orden.estado === 'recibido' ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)', color: orden.estado === 'recibido' ? '#22c55e' : '#fbbf24' }}>
                      {orden.estado === 'recibido' ? '✓ Recibido' : 'Enviado'}
                    </span>
                    {orden.estado === 'enviado' && (
                      <button onClick={() => setOrdenActiva(orden)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 }}>Recibir</button>
                    )}
                    <button
                      onClick={() => {
                        if (!window.confirm(`Eliminar pedido de ${orden.proveedor}?`)) return;
                        setData(d => ({ ...d, pedidosHistorial: (d.pedidosHistorial || []).filter((o: any) => o.id !== orden.id) } as any));
                        showToast('Pedido eliminado', 'info');
                      }}
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ padding: '8px 16px 12px' }}>
                  {orden.items.slice(0, 3).map((item, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', padding: '2px 0' }}>
                      <span>{item.cantRecibida != null ? `${item.cantRecibida}/` : ''}{item.cantidad}x {item.descripcion}</span>
                      {item.cantRecibida != null && item.cantRecibida < item.cantidad && (
                        <span style={{ color: '#ef4444', fontSize: 11 }}>Faltó {item.cantidad - item.cantRecibida}</span>
                      )}
                    </div>
                  ))}
                  {orden.items.length > 3 && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>+ {orden.items.length - 3} más</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Recepcion modal */}
      {ordenActiva && <RecepcionModal orden={ordenActiva} />}

      {/* Agregar modal */}
      {showAgregar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setShowAgregar(false); setBusqAgregar(''); }}>
          <div style={{ background: '#1e2230', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 12 }}>Agregar producto al pedido</div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><Icon name="search" size={16} /></div>
              <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Buscar en Mis Precios..." value={busqAgregar} onChange={e => setBusqAgregar(e.target.value)} autoFocus />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {busqAgregar.length < 2 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#4b5563', fontSize: 13 }}>Escribí al menos 2 caracteres</div>
              ) : resultadosAgregar.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#4b5563', fontSize: 13 }}>Sin resultados</div>
              ) : resultadosAgregar.map((p, i) => (
                <div key={i} onClick={() => {
                  if ((data.pedidos || []).find(x => x.codigoRef === p.codigoRef)) { showToast('Ya está en pedidos', 'info'); return; }
                  setData(d => ({ ...d, pedidos: [...(d.pedidos || []), { codigoRef: p.codigoRef, codigoProv: p.codigoProv || '', descripcion: p.descripcion, cantidad: 1, proveedor: p.proveedor || '', precioCosto: p.precioCosto || 0 }] }));
                  showToast('Agregado: ' + p.descripcion, 'success');
                  setBusqAgregar('');
                }} style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 6, background: '#111827', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef}</span>
                      <span style={{ fontSize: 11, color: '#4b5563' }}>{p.codigoProv}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>${(p.precioCosto || 0).toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
