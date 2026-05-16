import React, { useState, useCallback } from 'react';
import { AppData, MiProducto } from '../types';
import { Icon } from '../components/Icon';
import { Scanner } from '../components/Scanner';
import { calcPrecioVenta, fmtPeso } from '../lib/utils';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const MARGEN_LABELS: Record<string, string> = { p1: '% 1', p2: '% 2', p3: '% 3', p4: '% 4' };

export function TabMisPrecios({ data, setData, showToast }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [codigoRef, setCodigoRef] = useState('');
  const [codigoProv, setCodigoProv] = useState('');
  const [margenSel, setMargenSel] = useState<string | number>('p1');
  const [margenCustom, setMargenCustom] = useState(false);
  const [margenCustomVal, setMargenCustomVal] = useState('');
  const [divisor, setDivisor] = useState(1);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [scanBarcode, setScanBarcode] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ codigoRef: string; descripcion: string } | null>(null);

  const margenFinal = margenCustom ? (parseFloat(margenCustomVal) || 50) : margenSel;

  const buscarEnProveedores = useCallback((codigo: string) => {
    for (const prov of data.proveedores) {
      const p = prov.productos.find(x => x.codigo === codigo.toUpperCase());
      if (p) return { ...p, proveedor: prov.nombre };
    }
    return null;
  }, [data.proveedores]);

  const agregarProducto = () => {
    if (!codigoRef.trim() || !codigoProv.trim()) {
      showToast('Completá REF y código proveedor', 'error'); return;
    }
    const encontrado = buscarEnProveedores(codigoProv.trim());
    if (!encontrado) { showToast('Código no encontrado en proveedores', 'error'); return; }
    if (editIdx === null && data.misProductos.find(p => p.codigoRef === codigoRef.trim().toUpperCase())) {
      showToast('El código REF ya existe', 'error'); return;
    }

    const nuevo: MiProducto = {
      codigoRef: codigoRef.trim().toUpperCase(),
      codigoProv: codigoProv.trim().toUpperCase(),
      descripcion: encontrado.descripcion,
      precioCosto: encontrado.precio,
      margen: margenFinal,
      proveedor: encontrado.proveedor,
      divisor: divisor > 1 ? divisor : 1,
    };

    setData(d => {
      const lista = editIdx !== null
        ? d.misProductos.map((p, i) => i === editIdx ? nuevo : p)
        : [...d.misProductos, nuevo];
      return { ...d, misProductos: lista };
    });

    showToast(editIdx !== null ? 'Producto actualizado' : 'Producto agregado', 'success');
    setCodigoRef(''); setCodigoProv(''); setMargenSel('p1');
    setMargenCustom(false); setMargenCustomVal(''); setDivisor(1); setEditIdx(null);
  };

  const editar = (i: number) => {
    const p = data.misProductos[i];
    setCodigoRef(p.codigoRef); setCodigoProv(p.codigoProv);
    if (typeof p.margen === 'number') {
      setMargenCustom(true); setMargenCustomVal(String(p.margen)); setMargenSel(p.margen);
    } else {
      setMargenCustom(false); setMargenSel(p.margen);
    }
    setDivisor(p.divisor || 1);
    setEditIdx(i);
  };

  const eliminar = (i: number) => {
    if (!window.confirm('Eliminar este producto?')) return;
    setData(d => ({ ...d, misProductos: d.misProductos.filter((_, j) => j !== i) }));
    showToast('Producto eliminado', 'info');
  };

  const exportar = () => {
    const w = window as any;
    if (!w.XLSX) { showToast('XLSX no disponible', 'error'); return; }
    const wsData = [['Ref', 'Cod Proveedor', 'Descripcion', 'Precio Compra', 'Precio Venta', 'Margen %']];
    data.misProductos.forEach(p => {
      const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
      const m = typeof p.margen === 'number' ? p.margen : (data.margenes[p.margen as string] || 50);
      wsData.push([p.codigoRef, p.codigoProv, p.descripcion,
        parseFloat(p.precioCosto.toFixed(2)), parseFloat(pv.toFixed(2)), m]);
    });
    const wb = w.XLSX.utils.book_new();
    const ws = w.XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 42 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
    w.XLSX.utils.book_append_sheet(wb, ws, 'Mis Precios');
    w.XLSX.writeFile(wb, 'mis_precios.xlsx');
    showToast('Excel exportado', 'success');
  };

  const filtrados = busqueda
    ? data.misProductos.filter(p =>
        p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()))
    : data.misProductos;

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

  return (
    <div>
      {/* Form card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            {editIdx !== null ? 'Editar producto' : 'Agregar producto'}
          </div>
          {editIdx !== null && (
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => { setEditIdx(null); setCodigoRef(''); setCodigoProv(''); setMargenSel('p1'); setMargenCustom(false); setDivisor(1); }}>
              Cancelar
            </button>
          )}
        </div>

        {/* Codigo de barras - with scanner, FIRST */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Código de barras</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-field" style={{ flex: 1 }} value={codigoProv}
              onChange={e => setCodigoProv(e.target.value.toUpperCase())} placeholder="Escaneá o escribí el código" />
            <button className="btn-ghost" style={{ padding: '10px 14px' }} onClick={() => setScanBarcode(true)}>
              <Icon name="camera" size={18} />
            </button>
          </div>
          {codigoProv && (() => {
            const found = buscarEnProveedores(codigoProv);
            return found ? (
              <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>
                ✓ {found.descripcion} — ${found.precio.toFixed(2)}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>No encontrado en proveedores</div>
            );
          })()}
        </div>

        {/* Descripcion - REF field, SECOND */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Descripción (tu nombre interno)</label>
          <input className="input-field" value={codigoRef}
            onChange={e => setCodigoRef(e.target.value)} placeholder="Ej: Cable manguera 16mm" />
        </div>

        {/* Margen */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Margen</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(MARGEN_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => { setMargenSel(k); setMargenCustom(false); }} style={{
                flex: 1, minWidth: 60, padding: '8px 4px', borderRadius: 10, border: '1px solid',
                borderColor: margenSel === k && !margenCustom ? '#6366f1' : '#374151',
                background: margenSel === k && !margenCustom ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: margenSel === k && !margenCustom ? '#818cf8' : '#6b7280',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
              }}>
                {v} ({data.margenes[k as keyof typeof data.margenes]}%)
              </button>
            ))}
            <button onClick={() => setMargenCustom(!margenCustom)} style={{
              flex: 1, minWidth: 60, padding: '8px 4px', borderRadius: 10, border: '1px solid',
              borderColor: margenCustom ? '#6366f1' : '#374151',
              background: margenCustom ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: margenCustom ? '#818cf8' : '#6b7280',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
            }}>
              Otro %
            </button>
          </div>
          {margenCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <input type="number" className="input-field" style={{ width: 100 }}
                value={margenCustomVal} onChange={e => setMargenCustomVal(e.target.value)}
                placeholder="%" min={0} max={99} />
              {margenCustomVal && (
                <span style={{ fontSize: 12, color: '#22c55e' }}>
                  → {(100 / (1 - parseFloat(margenCustomVal) / 100)).toFixed(2)}x
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divisor */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>
            Dividir precio por (ej: 100 para precio por metro)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="number" min={1} className="input-field" style={{ width: 100 }}
              value={divisor} onChange={e => setDivisor(Math.max(1, parseInt(e.target.value) || 1))} />
            {divisor > 1 && <span style={{ fontSize: 12, color: '#22c55e' }}>÷ {divisor} = precio unitario</span>}
          </div>
        </div>

        {/* Price preview */}
        {codigoProv && (() => {
          const found = buscarEnProveedores(codigoProv);
          if (!found) return null;
          const pv = calcPrecioVenta(found.precio, margenFinal, data.margenes);
          return (
            <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Precio venta:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                {fmt(pv)}{divisor > 1 ? ` (${fmt(pv / divisor)} c/u)` : ''}
              </span>
            </div>
          );
        })()}

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={agregarProducto}>
          <Icon name={editIdx !== null ? 'check' : 'plus'} size={16} />
          {editIdx !== null ? 'Guardar cambios' : 'Agregar producto'}
        </button>
      </div>

      {/* Product list card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>Mis Precios</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{data.misProductos.length} productos</div>
          </div>
          {data.misProductos.length > 0 && (
            <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={exportar}>
              <Icon name="download" size={14} /> Excel
            </button>
          )}
        </div>

        {data.misProductos.length > 0 && (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
              <Icon name="search" size={16} />
            </div>
            <input className="input-field" style={{ paddingLeft: 38 }}
              placeholder="Buscar por REF, cod proveedor o descripción..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        )}

        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>
            <Icon name="tag" size={40} />
            <div style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
              {data.misProductos.length === 0 ? 'Todavía no agregaste productos' : 'Sin resultados'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrados.map((p, i) => {
              const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
              const foto = data.fotos[p.codigoRef];
              const margenLabel = typeof p.margen === 'number'
                ? `${p.margen}% ✎`
                : `${MARGEN_LABELS[p.margen] || p.margen} (${data.margenes[p.margen as keyof typeof data.margenes]}%)`;

              return (
                <div key={i}
                  style={{ background: '#1e2230', borderRadius: 12, border: '1px solid #1e2535', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {foto && <img src={foto} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{p.codigoRef}</span>
                        <span style={{ fontSize: 11, color: '#4b5563' }}>{p.codigoProv}</span>
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: 10 }}>{margenLabel}</span>
                      </div>
                      <div style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 600, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        Costo: {fmt(p.precioCosto)} →{' '}
                        <span style={{ color: '#22c55e', fontWeight: 700 }}>
                          {fmt(pv)}{p.divisor && p.divisor > 1 ? ` (${fmt(pv / p.divisor)} c/u)` : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => eliminar(data.misProductos.indexOf(p))}
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                        <Icon name="trash" size={14} />
                      </button>
                      <button onClick={() => editar(data.misProductos.indexOf(p))}
                        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                        <Icon name="settings" size={14} />
                      </button>
                      <button onClick={() => setPhotoModal({ codigoRef: p.codigoRef, descripcion: p.descripcion })}
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                        <Icon name="camera" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scanner */}
      {scanBarcode && (
        <Scanner onResult={code => { setScanBarcode(false); setCodigoProv(code.toUpperCase()); }} onClose={() => setScanBarcode(false)} />
      )}

      {/* Photo modal */}
      {photoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setPhotoModal(null)}>
          <div style={{ background: '#1e2230', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 4 }}>{photoModal.descripcion}</div>
            <div style={{ fontSize: 12, color: '#818cf8', fontFamily: 'monospace', marginBottom: 16 }}>{photoModal.codigoRef}</div>
            {data.fotos[photoModal.codigoRef] ? (
              <img src={data.fotos[photoModal.codigoRef]} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 280, objectFit: 'contain', background: '#111' }} />
            ) : (
              <div style={{ background: '#111827', borderRadius: 12, height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#6b7280', gap: 8 }}>
                <Icon name="camera" size={40} />
                <div style={{ fontSize: 13 }}>Sin foto cargada</div>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 8 }}>
              <Icon name="camera" size={16} />
              {data.fotos[photoModal.codigoRef] ? 'Cambiar foto' : 'Cargar foto'}
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const max = 700; const ratio = Math.min(max / img.width, max / img.height, 1);
                    canvas.width = img.width * ratio; canvas.height = img.height * ratio;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const compressed = canvas.toDataURL('image/jpeg', 0.75);
                    setData(d => ({ ...d, fotos: { ...d.fotos, [photoModal.codigoRef]: compressed } }));
                    showToast('Foto guardada', 'success');
                  };
                  img.src = ev.target!.result as string;
                };
                reader.readAsDataURL(file);
              }} />
            </label>
            {data.fotos[photoModal.codigoRef] && (
              <button className="btn-danger" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
                onClick={() => { if (!window.confirm('Eliminar foto?')) return; setData(d => { const f = { ...d.fotos }; delete f[photoModal.codigoRef]; return { ...d, fotos: f }; }); showToast('Foto eliminada', 'info'); }}>
                Eliminar foto
              </button>
            )}
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPhotoModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
