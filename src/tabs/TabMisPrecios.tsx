import React, { useState, useCallback } from 'react';
import { AppData, MiProducto } from '../types';
import { Icon } from '../components/Icon';
import { Scanner } from '../components/Scanner';
import { calcPrecioVenta, fmtPeso } from '../lib/utils';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  pendingCodProv?: string;
  onClearPending?: () => void;
}

const MARGEN_LABELS: Record<string, string> = { p1: 'p1', p2: 'p2', p3: 'p3', p4: 'p4' };


// Muestra la foto con delay para evitar el glitch de GPU en Android
function FotoDelayada({ src, style }: { src: string; style: React.CSSProperties }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return <div style={{ ...style, background: '#111827', borderRadius: (style.borderRadius as any) || 8 }} />;
  return <img src={src} alt="" style={style} />;
}

function ProductoAcciones({ onEditar, onFoto, onEliminar }: {
  onEditar: () => void;
  onFoto: () => void;
  onEliminar: () => void;
}) {
  return (
    <div style={{ margin: '0 10px 10px', borderRadius: 10, padding: '8px', display: 'flex', gap: 8, background: '#111827', transform: 'translate3d(0,0,0)', position: 'relative', zIndex: 2 }}>
      <button onClick={onEditar}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 10, padding: '9px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
        <Icon name="settings" size={14} /> Editar
      </button>
      <button onClick={onFoto}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 10, padding: '9px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
        <Icon name="camera" size={14} /> Foto
      </button>
      <button onClick={onEliminar}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10, padding: '9px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
        <Icon name="trash" size={14} /> Eliminar
      </button>
    </div>
  );
}

export function TabMisPrecios({ data, setData, showToast, pendingCodProv, onClearPending }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [codigoRef, setCodigoRef] = useState('');
  const [codigoProv, setCodigoProv] = useState('');
  const [margenSel, setMargenSel] = useState<string | number>('p1');
  const [margenCustom, setMargenCustom] = useState(false);
  const [margenCustomVal, setMargenCustomVal] = useState('');
  const [divisor, setDivisor] = useState(1);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [scanBarcode, setScanBarcode] = useState(false);
  const [scanSearch, setScanSearch] = useState(false);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [photoModal, setPhotoModal] = useState<{ codigoRef: string; descripcion: string } | null>(null);
  const [paginaSize, setPaginaSize] = useState(30);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [showActualizar, setShowActualizar] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState<{codigoRef: string; descripcion: string; anterior: number; nuevo: number}[]>([]);

  const margenFinal = margenCustom ? (parseFloat(margenCustomVal) || 50) : margenSel;

  // Auto-fill codigoProv when navigating from Proveedores
  React.useEffect(() => {
    if (pendingCodProv) {
      setCodigoProv(pendingCodProv.toUpperCase());
      onClearPending?.();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pendingCodProv]);

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
    if (editIdx === null && (data.misProductos || []).find(p => p.codigoRef === codigoRef.trim().toUpperCase())) {
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
      codigoBarras: codigoBarras.trim() || undefined,
    };

    setData(d => {
      const lista = editIdx !== null
        ? d.misProductos.map((p, i) => i === editIdx ? nuevo : p)
        : [...d.misProductos, nuevo];
      // Migrate foto if codigoRef changed
      let fotos = { ...d.fotos };
      if (editIdx !== null) {
        const oldRef = d.misProductos[editIdx]?.codigoRef;
        const newRef = nuevo.codigoRef;
        if (oldRef && oldRef !== newRef && fotos[oldRef]) {
          fotos[newRef] = fotos[oldRef];
          delete fotos[oldRef];
        }
      }
      return { ...d, misProductos: lista, fotos };
    });

    showToast(editIdx !== null ? 'Producto actualizado' : 'Producto agregado', 'success');
    setCodigoRef(''); setCodigoProv(''); setMargenSel('p1');
    setMargenCustom(false); setMargenCustomVal(''); setDivisor(1); setCodigoBarras(''); setEditIdx(null);
  };

  const formRef = React.useRef<HTMLDivElement>(null);

  const calcularCambios = () => {
    const cambios: {codigoRef: string; descripcion: string; anterior: number; nuevo: number}[] = [];
    (data.misProductos || []).forEach(p => {
      // Find matching product in any proveedor by codigoProv
      let nuevoPrecio: number | null = null;
      for (const prov of (data.proveedores || [])) {
        const prod = (prov.productos || []).find((x: any) => x.codigo === p.codigoProv);
        if (prod && prod.precio > 0) {
          nuevoPrecio = prod.precio / (p.divisor || 1);
          break;
        }
      }
      if (nuevoPrecio !== null && Math.abs(nuevoPrecio - p.precioCosto) > 0.01) {
        cambios.push({ codigoRef: p.codigoRef, descripcion: p.descripcion, anterior: p.precioCosto, nuevo: nuevoPrecio });
      }
    });
    setCambiosPendientes(cambios);
    setShowActualizar(true);
  };

  const confirmarActualizacion = () => {
    setData(d => {
      const nuevosProductos = (d.misProductos || []).map(p => {
        const cambio = cambiosPendientes.find(c => c.codigoRef === p.codigoRef);
        return cambio ? { ...p, precioCosto: cambio.nuevo } : p;
      });
      return { ...d, misProductos: nuevosProductos };
    });
    showToast(`${cambiosPendientes.length} precios actualizados`, 'success');
    setShowActualizar(false);
    setCambiosPendientes([]);
  };

  const editar = (i: number) => {
    const p = data.misProductos[i];
    setCodigoRef(p.codigoRef);
    setCodigoProv(p.codigoProv);
    setCodigoBarras((p as any).codigoBarras || '');
    if (typeof p.margen === 'number') {
      setMargenCustom(true); setMargenCustomVal(String(p.margen)); setMargenSel(p.margen);
    } else {
      setMargenCustom(false); setMargenSel(p.margen);
    }
    setDivisor(p.divisor || 1);
    setEditIdx(i);
    // Scroll form into view (only when actually editing)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const eliminar = (i: number) => {
    if (!window.confirm('Eliminar este producto?')) return;
    setData(d => ({ ...d, misProductos: d.misProductos.filter((_, j) => j !== i) }));
    showToast('Producto eliminado', 'info');
  };

  const exportar = () => {
    const w = window as any;
    if (!w.XLSX) { showToast('XLSX no disponible', 'error'); return; }
    const wsData = [['Cod Barras', 'Ref', 'Cod Proveedor', 'Descripcion', 'Precio Compra', 'Precio Venta', 'Margen %']];
    (data.misProductos || []).forEach(p => {
      const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
      const m = typeof p.margen === 'number' ? p.margen : (data.margenes[p.margen as string] || 50);
      wsData.push([(p as any).codigoBarras || '', p.codigoRef, p.codigoProv, p.descripcion,
        parseFloat(p.precioCosto.toFixed(2)), parseFloat(pv.toFixed(2)), m]);
    });
    const wb = w.XLSX.utils.book_new();
    const ws = w.XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 42 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
    w.XLSX.utils.book_append_sheet(wb, ws, 'Mis Precios');
    w.XLSX.writeFile(wb, 'mis_precios.xlsx');
    showToast('Excel exportado', 'success');
  };

  const importarExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const w = window as any;
    if (!w.XLSX) { showToast('XLSX no disponible', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = w.XLSX.read(new Uint8Array(ev.target!.result as ArrayBuffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = w.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        // Skip header row (Ref, Cod Proveedor, Descripcion, Precio Compra, Precio Venta, Margen %)
        const start = (String(rows[0]?.[0] || '').toLowerCase().includes('ref') || String(rows[0]?.[0] || '').toLowerCase().includes('cod') || String(rows[0]?.[1] || '').toLowerCase().includes('ref')) ? 1 : 0;
        const nuevos: any[] = [];
        rows.slice(start).forEach((cols: any[]) => {
          const ref = String(cols[0] || '').trim().toUpperCase();
          const codProv = String(cols[1] || '').trim().toUpperCase();
          const desc = String(cols[2] || '').trim();
          const costo = parseFloat(String(cols[3] || '0').replace(',', '.')) || 0;
          const margenVal = parseFloat(String(cols[5] || '50').replace(',', '.')) || 50;
          if (!ref || !codProv) return;
          nuevos.push({ codigoRef: ref, codigoProv: codProv, descripcion: desc, precioCosto: costo, margen: margenVal, proveedor: '', divisor: 1 });
        });
        if (nuevos.length === 0) { showToast('No se encontraron productos', 'error'); return; }
        if (!window.confirm(`Importar ${nuevos.length} productos? Esto reemplazará los existentes con el mismo REF.`)) return;
        setData(d => {
          const existingRefs = new Set(nuevos.map((p: any) => p.codigoRef));
          const filtered = (d.misProductos || []).filter((p: any) => !existingRefs.has(p.codigoRef));
          return { ...d, misProductos: [...filtered, ...nuevos] };
        });
        showToast(`${nuevos.length} productos importados`, 'success');
      } catch(err) {
        showToast('Error al leer el archivo', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const filtrados = busqueda
    ? (data.misProductos || []).filter(p =>
        p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        ((p as any).codigoBarras || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()))
    : (data.misProductos || []);

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

  return (
    <div>
      {/* Form card */}
      <div className="card" ref={formRef}>
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

        {/* Cód. Proveedor + Cód. Barras - dos columnas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Cód. proveedor</label>
            <input className="input-field" style={{ fontSize: 13 }} value={codigoProv}
              onChange={e => setCodigoProv(e.target.value.toUpperCase())} placeholder="Ej: FC1561" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Cód. de barras</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input-field" style={{ flex: 1, fontSize: 13 }} value={codigoBarras}
                onChange={e => setCodigoBarras(e.target.value)} placeholder="Para buscar en calculadora" />
              <button className="btn-ghost" style={{ padding: '10px 10px', flexShrink: 0 }} onClick={() => setScanBarcode(true)}>
                <Icon name="camera" size={16} />
              </button>
            </div>
          </div>
        </div>
        {codigoProv && (() => {
          const found = buscarEnProveedores(codigoProv);
          return found ? (
            <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 8 }}>
              ✓ {found.descripcion} — ${found.precio.toFixed(2)}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>No encontrado en proveedores</div>
          );
        })()}

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
            {Object.entries(MARGEN_LABELS).map(([k]) => (
              <button key={k} onClick={() => { setMargenSel(k); setMargenCustom(false); }} style={{
                flex: 1, minWidth: 50, padding: '8px 4px', borderRadius: 10, border: '1px solid',
                borderColor: margenSel === k && !margenCustom ? '#6366f1' : '#374151',
                background: margenSel === k && !margenCustom ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: margenSel === k && !margenCustom ? '#818cf8' : '#6b7280',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
              }}>
                {data.margenes[k as keyof typeof data.margenes]}%
              </button>
            ))}
            <button onClick={() => setMargenCustom(!margenCustom)} style={{
              flex: 1, minWidth: 50, padding: '8px 4px', borderRadius: 10, border: '1px solid',
              borderColor: margenCustom ? '#6366f1' : '#374151',
              background: margenCustom ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: margenCustom ? '#818cf8' : '#6b7280',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
            }}>
              Otro %
            </button>
          </div>

          {/* Otro%: margen + divisor lado a lado */}
          {margenCustom && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>% manual</label>
                <input type="number" className="input-field" style={{ textAlign: 'center', fontWeight: 700, padding: '10px' }}
                  value={margenCustomVal} onChange={e => setMargenCustomVal(e.target.value)}
                  placeholder="Ej: 45" min={0} max={99} />
                {margenCustomVal && (
                  <div style={{ fontSize: 11, color: '#22c55e', marginTop: 3 }}>→ {(100/(1-parseFloat(margenCustomVal)/100)).toFixed(2)}x</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Dividir por</label>
                <input type="number" min={1} className="input-field" style={{ textAlign: 'center', fontWeight: 700, padding: '10px' }}
                  value={divisor} onChange={e => setDivisor(Math.max(1, parseInt(e.target.value) || 1))} />
                {divisor > 1 && <div style={{ fontSize: 11, color: '#22c55e', marginTop: 3 }}>÷ {divisor} c/u</div>}
              </div>
            </div>
          )}


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

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-ghost"
            style={{ padding: '12px 14px', flexShrink: 0 }}
            title="Importar desde Excel"
            onClick={() => {
              const inp = document.createElement('input');
              inp.type = 'file'; inp.accept = '.xlsx,.xls';
              inp.onchange = (e: any) => {
                const file = e.target?.files?.[0];
                if (!file) return;
                const w = window as any;
                if (!w.XLSX) { showToast('XLSX no disponible', 'error'); return; }
                const reader = new FileReader();
                reader.onload = ev => {
                  try {
                    const wb = w.XLSX.read(new Uint8Array(ev.target!.result as ArrayBuffer), { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows: any[][] = w.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                    const start = String(rows[0]?.[0] || '').toLowerCase().includes('ref') ? 1 : 0;
                    const nuevos = rows.slice(start).map((cols: any[]) => {
                      // Format: CodBarras | REF | CodProveedor | Descripcion | PrecioCompra | PrecioVenta | Margen%
                      const codBarrasCol = String(cols[0] || '').trim();
                      const ref = String(cols[1] || '').trim().toUpperCase();
                      const codProv = String(cols[2] || '').trim().toUpperCase();
                      const desc = String(cols[3] || '').trim();
                      const costo = parseFloat(String(cols[4] || '0').replace(',', '.')) || 0;
                      const margenVal = parseFloat(String(cols[6] || '50').replace(',', '.')) || 50;
                      if (!ref || !codProv) return null;
                      return { codigoRef: ref, codigoProv: codProv, descripcion: desc, precioCosto: costo, margen: margenVal, proveedor: '', divisor: 1, codigoBarras: codBarrasCol || undefined };
                    }).filter(Boolean);
                    if (nuevos.length === 0) { showToast('Sin productos válidos', 'error'); return; }
                    if (!window.confirm(`Importar ${nuevos.length} productos?`)) return;
                    setData(d => {
                      const refs = new Set(nuevos.map((p: any) => p.codigoRef));
                      const filtered = (d.misProductos || []).filter((p: any) => !refs.has(p.codigoRef));
                      return { ...d, misProductos: [...filtered, ...nuevos as any] };
                    });
                    showToast(`${nuevos.length} productos importados`, 'success');
                  } catch(err) { showToast('Error al leer el archivo', 'error'); }
                };
                reader.readAsArrayBuffer(file);
              };
              inp.click();
            }}
          >
            <Icon name="upload" size={16} />
          </button>
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={agregarProducto}>
            <Icon name={editIdx !== null ? 'check' : 'plus'} size={16} />
            {editIdx !== null ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </div>
      </div>

      {/* Product list card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>Mis Precios</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{(data.misProductos || []).length} productos</div>
          </div>
          {(data.misProductos || []).length > 0 && (
            <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={exportar}>
              <Icon name="download" size={14} /> Excel
            </button>
          )}
        </div>

        {(data.misProductos || []).length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
                <Icon name="search" size={16} />
              </div>
              <input className="input-field" style={{ paddingLeft: 38 }}
                placeholder="Buscar por REF, cod, barras o descripción..."
                value={busqueda} onChange={e => { setBusqueda(e.target.value); setPaginaSize(30); }} />
            </div>
            <button className="btn-ghost" style={{ padding: '10px 14px', flexShrink: 0 }}
              onClick={() => setScanSearch(true)}>
              <Icon name="camera" size={18} />
            </button>
          </div>
        )}

        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>
            <Icon name="tag" size={40} />
            <div style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
              {(data.misProductos || []).length === 0 ? 'Todavía no agregaste productos' : 'Sin resultados'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {expandedRef ? (
              (() => {
                const p = filtrados.find(x => x.codigoRef === expandedRef);
                if (!p) return null;
                const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
                const foto = data.fotos[p.codigoRef];
                const margenLabel = typeof p.margen === 'number'
                  ? `${p.margen}%`
                  : `${data.margenes[p.margen as keyof typeof data.margenes]}%`;
                const codBarras = (p as any).codigoBarras;
                const idx2 = (data.misProductos || []).indexOf(p);
                return (
                  <div>
                    <button onClick={() => setExpandedRef(null)}
                      style={{ width: '100%', marginBottom: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: 10, padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                      ← Volver a la lista
                    </button>
                    <div style={{ background: '#1e2230', borderRadius: 12, border: '1px solid #6366f1', transform: 'translate3d(0,0,0)', position: 'relative', zIndex: 1 }}>
                      <div style={{ padding: '12px 14px' }}>
                        {foto && <img src={foto} alt="" style={{ width: 90, height: 90, borderRadius: 10, objectFit: 'cover', marginBottom: 10, display: 'block' }} />}
                        {codBarras && <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'monospace', marginBottom: 2 }}>{codBarras}</div>}
                        <div style={{ fontSize: 18, color: '#818cf8', fontFamily: 'monospace', fontWeight: 800 }}>{p.codigoRef}</div>
                        <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 4, wordBreak: 'break-word' }}>{p.descripcion}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                          {p.codigoProv && <span style={{ fontSize: 11, color: '#4b5563' }}>{p.codigoProv}</span>}
                          <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: 10 }}>{margenLabel}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                          {fmt(p.precioCosto)} <span style={{ color: '#22c55e', fontWeight: 700 }}>→ {fmt(pv)}</span>
                          {p.divisor && p.divisor > 1 ? <span> ({fmt(pv / p.divisor)} c/u)</span> : null}
                        </div>
                      </div>
                      <ProductoAcciones
                        key={p.codigoRef + '-actions'}
                        onEditar={() => { editar(idx2); setExpandedRef(null); }}
                        onFoto={() => setPhotoModal({ codigoRef: p.codigoRef, descripcion: p.descripcion })}
                        onEliminar={() => { eliminar(idx2); setExpandedRef(null); }}
                      />
                    </div>
                  </div>
                );
              })()
            ) : (
              filtrados.slice(0, paginaSize).map((p, i) => {
                const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
                const foto = data.fotos[p.codigoRef];
                const margenLabel = typeof p.margen === 'number'
                  ? `${p.margen}%`
                  : `${data.margenes[p.margen as keyof typeof data.margenes]}%`;
                const codBarras = (p as any).codigoBarras;
                return (
                  <div key={p.codigoRef} style={{ background: '#1e2230', borderRadius: 12, border: '1px solid #1e2535', marginBottom: 2 }}>
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      onClick={() => {
                      const scrollY = window.scrollY;
                      setExpandedRef(p.codigoRef);
                      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' })));
                    }}>
                      {foto && <img src={foto} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {codBarras && <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'monospace' }}>{codBarras}</div>}
                        <div style={{ fontSize: 15, color: '#818cf8', fontFamily: 'monospace', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.codigoRef}</div>
                        <div style={{ fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                          {p.codigoProv && <span style={{ fontSize: 10, color: '#4b5563' }}>{p.codigoProv}</span>}
                          <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '1px 6px', borderRadius: 10 }}>{margenLabel}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {fmt(p.precioCosto)} <span style={{ color: '#22c55e', fontWeight: 700 }}>→ {fmt(pv)}</span>
                          {p.divisor && p.divisor > 1 ? <span> ({fmt(pv / p.divisor)} c/u)</span> : null}
                        </div>
                      </div>
                      <span style={{ color: '#4b5563', fontSize: 14, flexShrink: 0 }}>▼</span>
                    </div>
                  </div>
                );
              })
            )}

            {filtrados.length > paginaSize && (
              <button onClick={() => setPaginaSize(prev => prev + 30)}
                style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14 }}>
                Ver más ({filtrados.length - paginaSize} restantes)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actualizar precios modal */}
      {showActualizar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowActualizar(false)}>
          <div style={{ background: '#1e2230', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Actualizar precios desde proveedor</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {cambiosPendientes.length === 0 ? 'Todos los precios están al día' : `${cambiosPendientes.length} producto(s) con precio diferente`}
                </div>
              </div>
              <button onClick={() => setShowActualizar(false)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            {cambiosPendientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#6b7280', fontSize: 14 }}>
                ✅ No hay cambios de precio para aplicar
              </div>
            ) : (
              <>
                <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16 }}>
                  {cambiosPendientes.map((c, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #111827', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{c.codigoRef}</div>
                        <div style={{ fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.descripcion}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: '#6b7280', textDecoration: 'line-through' }}>{fmt(c.anterior)}</div>
                        <div style={{ fontSize: 14, color: c.nuevo > c.anterior ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                          {fmt(c.nuevo)} {c.nuevo > c.anterior ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={confirmarActualizacion}
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', width: '100%', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  ✓ Confirmar actualización
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Scanner */}
      {scanSearch && (
        <Scanner onResult={scanned => { setScanSearch(false); setBusqueda(scanned); }} onClose={() => setScanSearch(false)} />
      )}
      {scanBarcode && (
        <Scanner onResult={scanned => { setScanBarcode(false); setCodigoBarras(scanned); }} onClose={() => setScanBarcode(false)} />
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
