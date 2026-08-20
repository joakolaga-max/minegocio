import React, { useState } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';
import { Presupuesto } from '../components/Presupuesto';
import { fmtPeso } from '../lib/utils';
import { useTheme } from '../ThemeContext';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Convierte "D/M/YYYY" (formato es-AR) en { key: "YYYY-MM", label: "Agosto 2026" }
const mesDeFecha = (fecha: string) => {
  const partes = (fecha || '').split('/');
  const dia = parseInt(partes[0]) || 1;
  const mes = parseInt(partes[1]) || 1;
  const anio = parseInt(partes[2]) || new Date().getFullYear();
  const key = `${anio}-${String(mes).padStart(2, '0')}`;
  const label = `${MESES[mes - 1] || 'Mes'} ${anio}`;
  return { key, label };
};

export function TabVentas({ data, setData, showToast }: Props) {
  const { theme: T, isDark } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [presupuestoVenta, setPresupuestoVenta] = useState<any>(null);

  // Orden por fecha de creación real (el id es un timestamp), así la última venta queda siempre arriba
  const ventas = [...(data.ventas || [])].sort((a, b) => parseInt(b.id, 36) - parseInt(a.id, 36));

  const hoy = new Date().toLocaleDateString('es-AR');
  const hoyMesKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set([hoyMesKey]));
  const toggleMes = (key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const ventasHoy = () => ventas.filter(v => v.fecha === hoy);
  const totalHoy = () => ventasHoy().reduce((s, v) => s + v.total, 0);

  // Costo de un item: usa el guardado en la venta; si es viejo y no lo tiene, busca el costo actual en Mis Precios
  const costoDeItem = (item: any) => {
    if (item.precioCosto !== undefined && item.precioCosto !== null) return item.precioCosto;
    const prod = (data.misProductos || []).find(p => p.codigoRef === item.codigoRef);
    return prod ? prod.precioCosto : 0;
  };

  const gananciaDeVenta = (venta: any) =>
    venta.items.reduce((s: number, i: any) => s + (i.precioVenta - costoDeItem(i)) * i.cantidad, 0);

  // Agrupar ventas por mes, en orden (más reciente primero, ya que `ventas` ya viene ordenada así)
  const meses: { key: string; label: string; ventas: typeof ventas }[] = [];
  const indexPorKey: Record<string, number> = {};
  ventas.forEach(v => {
    const { key, label } = mesDeFecha(v.fecha);
    if (indexPorKey[key] === undefined) {
      indexPorKey[key] = meses.length;
      meses.push({ key, label, ventas: [] });
    }
    meses[indexPorKey[key]].ventas.push(v);
  });

  const statsDeMes = (ventasMes: typeof ventas) => {
    const total = ventasMes.reduce((s, v) => s + v.total, 0);
    const ganancia = ventasMes.reduce((s, v) => s + gananciaDeVenta(v), 0);
    const transferencia = ventasMes.filter(v => (v as any).paymentMethod === 'transferencia');
    const efectivo = ventasMes.filter(v => (v as any).paymentMethod === 'efectivo');
    return {
      total, ganancia,
      transferencia: { total: transferencia.reduce((s, v) => s + v.total, 0), cant: transferencia.length },
      efectivo: { total: efectivo.reduce((s, v) => s + v.total, 0), cant: efectivo.length },
    };
  };

  const mesActual = meses.find(m => m.key === hoyMesKey);
  const statsMesActual = statsDeMes(mesActual ? mesActual.ventas : []);

  const borrarVenta = (id: string) => {
    if (!window.confirm('Borrar esta venta?')) return;
    setData(d => ({ ...d, ventas: (d.ventas || []).filter(v => v.id !== id) }));
    showToast('Venta eliminada', 'info');
  };

  const borrarTodo = () => {
    if (!window.confirm('Borrar TODAS las ventas? Esta acción no se puede deshacer.')) return;
    setData(d => ({ ...d, ventas: [] }));
    showToast('Historial limpiado', 'info');
  };

  const exportar = () => {
    const w = window as any;
    if (!w.XLSX) return;
    const wsData = [['Fecha', 'Hora', 'Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']];
    (data.ventas || []).forEach(v => {
      v.items.forEach(i => {
        wsData.push([v.fecha, v.hora, i.descripcion, i.cantidad,
          parseFloat(i.precioVenta.toFixed(2)),
          parseFloat((i.precioVenta * i.cantidad).toFixed(2))]);
      });
    });
    const wb = w.XLSX.utils.book_new();
    const ws = w.XLSX.utils.aoa_to_sheet(wsData);
    w.XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    w.XLSX.writeFile(wb, 'ventas.xlsx');
    showToast('Excel exportado', 'success');
  };

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

  return (
    <>
    <div>
      {/* Summary card: mes actual */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8 }}>
          <div style={{ flex: 1.2 }}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Total este mes</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{fmt(statsMesActual.total)}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Ventas hoy</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{fmt(totalHoy())}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Ganancia del mes</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: statsMesActual.ganancia >= 0 ? '#818cf8' : '#ef4444' }}>{fmt(statsMesActual.ganancia)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${T.divider}` }}>
          <div style={{ flex: 1, background: T.sectionBg, borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 11, color: T.textMuted }}>💳 Transferencia (mes)</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fmt(statsMesActual.transferencia.total)}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>{statsMesActual.transferencia.cant} venta(s)</div>
          </div>
          <div style={{ flex: 1, background: T.sectionBg, borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 11, color: T.textMuted }}>💵 Efectivo (mes)</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fmt(statsMesActual.efectivo.total)}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>{statsMesActual.efectivo.cant} venta(s)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Historial de ventas</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ventas.length > 0 && (
              <>
                <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={exportar}>
                  <Icon name="download" size={14} /> Excel
                </button>
                <button className="btn-danger" style={{ padding: '8px 12px', fontSize: 13 }} onClick={borrarTodo}>
                  <Icon name="trash" size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {ventas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: T.textMuted }}>
            <Icon name="download" size={44} />
            <div style={{ marginTop: 14, fontSize: 15 }}>No hay ventas registradas</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Las ventas de la Calculadora aparecen acá</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {meses.map(mes => {
              const abierto = expandedMonths.has(mes.key);
              const stats = statsDeMes(mes.ventas);
              return (
                <div key={mes.key}>
                  <div onClick={() => toggleMes(mes.key)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.sectionBg, border: abierto ? '1px solid #6366f1' : `1px solid ${T.divider}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', marginBottom: abierto ? 8 : 0 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                        {abierto ? '▼' : '▶'} {mes.label}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        Total: <strong style={{ color: '#22c55e' }}>{fmt(stats.total)}</strong>
                        {' · '}Ganancia: <span style={{ color: '#818cf8' }}>{fmt(stats.ganancia)}</span>
                        {' · '}{mes.ventas.length} venta(s)
                      </div>
                    </div>
                  </div>

                  {abierto && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 8, marginBottom: 12 }}>
                      {mes.ventas.map(v => (
                        <div key={v.id} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.divider}`, overflow: 'hidden' }}>
                          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                            onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: T.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {v.fecha} · {v.hora} · {v.items.length} producto(s)
                                {(v as any).paymentMethod && <span style={{ fontSize: 11 }}>{(v as any).paymentMethod === 'efectivo' ? '💵' : '💳'}</span>}
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginTop: 2 }}>{fmt(v.total)}</div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setPresupuestoVenta(v); }}
                              style={{ background: isDark ? '#1f2547' : '#e0e7ff', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', marginRight: 6, flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
                              <Icon name="download" size={13} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); borrarVenta(v.id); }}
                              style={{ background: isDark ? '#3a1f28' : '#fee2e2', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                          {expandedId === v.id && (
                            <div style={{ borderTop: `1px solid ${T.divider}`, padding: '8px 14px 12px' }}>
                              {v.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: `1px solid ${T.divider}` }}>
                                  <span style={{ color: T.textSecondary }}>{item.cantidad}x {item.descripcion}</span>
                                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{fmt(item.precioVenta * item.cantidad)}</span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingTop: 8, marginTop: 4 }}>
                                <span style={{ color: T.textMuted }}>Ganancia neta de esta venta</span>
                                <span style={{ color: gananciaDeVenta(v) >= 0 ? '#818cf8' : '#ef4444', fontWeight: 700 }}>{fmt(gananciaDeVenta(v))}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {presupuestoVenta && (
        <Presupuesto
          misProductos={data.misProductos}
          items={presupuestoVenta.items}
          total={presupuestoVenta.total}
          onClose={() => setPresupuestoVenta(null)}
          empresaData={data.empresa}
          telefonoData={data.telefono}
          direccionData={data.direccion}
        />
      )}
    </>
  );
}
