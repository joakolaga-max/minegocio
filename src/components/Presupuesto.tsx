import React, { useState } from 'react';
import { Icon } from './Icon';

interface Item {
  descripcion: string;
  cantidad: number;
  precioVenta: number;
}

interface Props {
  items: Item[];
  total: number;
  onClose: () => void;
  onGuardar?: (cliente: string) => void;
}

export function Presupuesto({ items, total, onClose, onGuardar }: Props) {
  const [nombreEmpresa, setNombreEmpresa] = useState(() => localStorage.getItem('mn_empresa') || '');
  const [telefono, setTelefono] = useState(() => localStorage.getItem('mn_telefono') || '');
  const [direccion, setDireccion] = useState(() => localStorage.getItem('mn_direccion') || '');
  const [cliente, setCliente] = useState('');
  const [nota, setNota] = useState('');
  const [descuento, setDescuento] = useState(0);

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
  const totalConDesc = total * (1 - descuento / 100);
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const guardarConfig = () => {
    localStorage.setItem('mn_empresa', nombreEmpresa);
    localStorage.setItem('mn_telefono', telefono);
  };

  const imprimir = () => {
    guardarConfig();
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Presupuesto</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; padding: 20px; color: #111; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #333; }
    .empresa { font-size: 22px; font-weight: 700; }
    .tel { font-size: 13px; color: #555; margin-top: 4px; }
    .titulo { font-size: 20px; font-weight: 700; text-align: right; }
    .fecha { font-size: 12px; color: #555; text-align: right; margin-top: 4px; }
    .cliente-row { margin-bottom: 20px; font-size: 14px; }
    .cliente-row span { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #222; color: #fff; padding: 8px 10px; text-align: left; font-size: 13px; }
    th:last-child, td:last-child { text-align: right; }
    th:nth-child(2), td:nth-child(2) { text-align: center; }
    td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 13px; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .totals { margin-left: auto; width: 240px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
    .total-final { font-size: 18px; font-weight: 700; border-top: 2px solid #222; padding-top: 8px; margin-top: 4px; }
    .nota { margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 13px; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="empresa">${nombreEmpresa || 'Mi Negocio'}</div>
      ${telefono ? `<div class="tel">📞 ${telefono}</div>` : ''}
      ${direccion ? `<div class="tel">📍 ${direccion}</div>` : ''}
    </div>
    <div>
      <div class="titulo">PRESUPUESTO</div>
      <div class="fecha">Fecha: ${fecha}</div>
    </div>
  </div>
  ${cliente ? `<div class="cliente-row"><span>Cliente:</span> ${cliente}</div>` : ''}
  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cant.</th>
        <th>Precio unit.</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(i => `
      <tr>
        <td>${i.descripcion}</td>
        <td style="text-align:center">${i.cantidad}</td>
        <td style="text-align:right">${fmt(i.precioVenta)}</td>
        <td style="text-align:right">${fmt(i.precioVenta * i.cantidad)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="total-row"><span>Subtotal:</span><span>${fmt(total)}</span></div>
    ${descuento > 0 ? `<div class="total-row"><span>Descuento (${descuento}%):</span><span>-${fmt(total * descuento / 100)}</span></div>` : ''}
    <div class="total-row total-final"><span>TOTAL:</span><span>${fmt(totalConDesc)}</span></div>
  </div>
  ${nota ? `<div class="nota"><strong>Nota:</strong> ${nota}</div>` : ''}
  <div class="footer">Presupuesto válido por 48 horas · ${nombreEmpresa || 'Mi Negocio'}</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const compartirWhatsApp = () => {
    guardarConfig();
    const msg = `*PRESUPUESTO${nombreEmpresa ? ' - ' + nombreEmpresa : ''}*\n` +
      `Fecha: ${fecha}\n${cliente ? `Cliente: ${cliente}\n` : ''}\n` +
      items.map(i => `• ${i.descripcion} x${i.cantidad} → ${fmt(i.precioVenta * i.cantidad)}`).join('\n') +
      `\n\n*TOTAL: ${fmt(totalConDesc)}*` +
      (descuento > 0 ? ` _(${descuento}% desc. aplicado)_` : '') +
      (nota ? `\n\n_${nota}_` : '');
    window.open('https://wa.me/?text=' + encodeURIComponent(msg));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#1e2230', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Presupuesto</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Datos del negocio - compact */}
        {(nombreEmpresa || telefono || direccion) && (
          <div style={{ background: '#111827', borderRadius: 10, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#6b7280' }}>
            {nombreEmpresa && <div style={{ fontWeight: 700, color: '#818cf8' }}>{nombreEmpresa}</div>}
            {telefono && <div>📞 {telefono}</div>}
            {direccion && <div>📍 {direccion}</div>}
            <div style={{ marginTop: 4, fontSize: 11, color: '#4b5563' }}>Editá estos datos en Configuración</div>
          </div>
        )}

        {/* Cliente */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Cliente (opcional)</label>
          <input className="input-field" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre del cliente" />
        </div>

        {/* Items preview */}
        <div style={{ background: '#111827', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: i < items.length - 1 ? '1px solid #1e2535' : 'none' }}>
              <span style={{ color: '#94a3b8' }}>{item.cantidad}x {item.descripcion}</span>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>{fmt(item.precioVenta * item.cantidad)}</span>
            </div>
          ))}
        </div>

        {/* Descuento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>Descuento %</label>
          <input type="number" min={0} max={99} className="input-field" style={{ width: 80, textAlign: 'center' }}
            value={descuento || ''} onChange={e => setDescuento(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
            placeholder="0" />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginLeft: 'auto' }}>
            TOTAL: {fmt(totalConDesc)}
          </div>
        </div>

        {/* Nota */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nota (opcional)</label>
          <input className="input-field" value={nota} onChange={e => setNota(e.target.value)} placeholder="Condiciones, validez, etc." />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {onGuardar && (
            <button onClick={() => { guardarConfig(); onGuardar(cliente); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', color: '#22c55e', borderRadius: 12, padding: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, marginBottom: 0 }}>
              <Icon name="check" size={16} /> Guardar presupuesto
            </button>
          )}
          <button onClick={compartirWhatsApp}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(37,211,102,0.15)', border: '1px solid #25d366', color: '#25d366', borderRadius: 12, padding: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>
            <Icon name="whatsapp" size={16} /> WA
          </button>
          <button onClick={imprimir}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>
            <Icon name="download" size={16} /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
