import React, { useState } from 'react';
import { AppData, Proveedor, Producto } from '../types';
import { Icon } from '../components/Icon';


interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (tab: string, codigoProv?: string) => void;
}

const parsePrecio = (s: string): number => {
  const clean = String(s || '0').trim().replace(/\.(?=\d{3})/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

function parseCSV(text: string): Producto[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect separator
  const sep = lines[0].includes(';') ? ';' : ',';
  const rows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));

  // Skip header if first row has no number in position 2
  const start = isNaN(parsePrecio(rows[0]?.[2] || '')) && rows.length > 1 ? 1 : 0;

  return rows.slice(start).map(cols => ({
    codigo: (cols[0] || '').toUpperCase(),
    descripcion: cols[1] || '',
    precio: (() => { const s = String(cols[2] || '0').trim().replace(/\.(?=\d{3})/g,'').replace(',','.'); return parseFloat(s)||0; })(),
  })).filter(p => p.codigo && p.descripcion);
}

function parseXLSX(buffer: ArrayBuffer): Producto[] {
  const w = window as any;
  if (!w.XLSX) return [];
  const wb = w.XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = w.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const productos: Producto[] = [];
  for (const cols of rows) {
    const cod = String(cols[0] ?? '').trim();
    const desc = String(cols[1] ?? '').trim();
    const priceRaw = String(cols[2] ?? '0').trim();
    // Skip empty rows and header rows
    if (!cod || !desc) continue;
    if (cod.toUpperCase() === 'CODIGO' || cod.toUpperCase() === 'COD') continue;
    const precio = parsePrecio(priceRaw);
    productos.push({
      codigo: cod.toUpperCase(),
      descripcion: desc,
      precio: precio,
    });
  }
  return productos;
}

export function TabProveedores({ data, setData, showToast, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);

  const prov = (data.proveedores || [])[activeTab] || { id: activeTab, nombre: "", productos: [] };
  const productos = busqueda
    ? prov.productos.filter(p =>
        p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    : prov.productos;

  const cargarArchivo = (file: File) => {
    if (!file) return;
    setLoading(true);
    const isXls = /\.(xlsx|xls)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const result = ev.target?.result;
        let productos: Producto[];
        if (isXls) {
          const w = window as any;
          if (!w.XLSX) { showToast('XLSX no disponible', 'error'); setLoading(false); return; }
          const data = new Uint8Array(result as ArrayBuffer);
          const wb = w.XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: any[][] = w.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          productos = [];
          for (const cols of rows) {
            const cod = String(cols[0] ?? '').trim();
            const desc = String(cols[1] ?? '').trim();
            if (!cod || !desc) continue;
            if (cod.toUpperCase() === 'CODIGO' || cod.toUpperCase() === 'COD') continue;
            const priceStr = String(cols[2] ?? '0').trim().replace(/\.(?=\d{3})/g, '').replace(',', '.');
            const precio = parseFloat(priceStr) || 0;
            productos.push({ codigo: cod.toUpperCase(), descripcion: desc, precio });
          }
        } else {
          productos = parseCSV(result as string);
        }
        if (productos.length === 0) {
          showToast('No se encontraron productos válidos', 'error');
          setLoading(false);
          return;
        }
        setData(d => {
          const provs = [...d.proveedores];
          provs[activeTab] = { ...provs[activeTab], productos };
          return { ...d, proveedores: provs };
        });
        showToast(`${productos.length} productos cargados`, 'success');
      } catch(err) {
        console.error('Error parsing file:', err);
        showToast('Error al leer el archivo: ' + String(err).slice(0, 50), 'error');
      }
      setLoading(false);
    };
    reader.onerror = () => {
      showToast('Error al abrir el archivo', 'error');
      setLoading(false);
    };
    if (isXls) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) cargarArchivo(file);
    e.target.value = '';
  };

  const limpiar = () => {
    if (!window.confirm(`Limpiar todos los productos de ${prov.nombre}?`)) return;
    setData(d => {
      const provs = [...d.proveedores];
      provs[activeTab] = { ...provs[activeTab], productos: [] };
      return { ...d, proveedores: provs };
    });
    showToast('Lista limpiada', 'info');
  };



  return (
    <div>
      {/* Proveedor tabs - wrap, solo nombre */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {(data.proveedores || []).map((p, i) => (
          <button key={i} onClick={() => { setActiveTab(i); setBusqueda(''); }}
            style={{
              padding: '7px 14px', borderRadius: 20, border: '1px solid',
              borderColor: activeTab === i ? '#6366f1' : '#1e2535',
              background: activeTab === i ? 'rgba(99,102,241,0.15)' : '#161b27',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <span style={{ fontSize: 13, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? '#818cf8' : '#94a3b8' }}>
              {p.nombre || `Proveedor ${i + 1}`}
            </span>
          </button>
        ))}
      </div>

      {/* Active proveedor card */}
      <div className="card">
        {/* Header */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#111827', borderRadius: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{prov.nombre || `Proveedor ${activeTab + 1}`}</span>
          <span style={{ fontSize: 13, color: prov.productos.length > 0 ? '#22c55e' : '#4b5563', fontWeight: 600 }}>
            {prov.productos.length > 0 ? `${prov.productos.length} productos` : 'Sin cargar'}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>

          <button
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              const inp = document.createElement('input');
              inp.type = 'file';
              inp.accept = '.csv,.txt,.xlsx,.xls';
              inp.onchange = (e: any) => {
                const file = e.target?.files?.[0];
                if (file) cargarArchivo(file);
              };
              inp.click();
            }}
            disabled={loading}
          >
            <Icon name="upload" size={16} />
            {loading ? 'Cargando...' : 'Cargar lista'}
          </button>
          {prov.productos.length > 0 && (
            <button className="btn-danger" onClick={limpiar} style={{ padding: '11px 14px' }}>
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>

        {/* Format hint */}
        <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 14, padding: '8px 12px', background: '#111827', borderRadius: 8 }}>
          Formato: Código | Descripción | Precio — CSV o Excel
        </div>

        {/* Search */}
        {prov.productos.length > 0 && (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
              <Icon name="search" size={16} />
            </div>
            <input className="input-field" style={{ paddingLeft: 38 }}
              placeholder="Buscar producto..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        )}

        {/* Products list */}
        {prov.productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>
            <Icon name="upload" size={40} />
            <div style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
              Cargá la lista de precios del proveedor
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {productos.slice(0, 200).map((p, i) => (
              <div key={i}
                onClick={() => onNavigate && onNavigate('precios', p.codigo)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: i < productos.length - 1 ? '1px solid #1e2535' : 'none',
                  gap: 10, cursor: onNavigate ? 'pointer' : 'default',
                }}
                onMouseEnter={e => { if (onNavigate) (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700, marginRight: 8 }}>
                    {p.codigo}
                  </span>
                  <span style={{ fontSize: 13, color: '#cbd5e1' }}>{p.descripcion}</span>
                </div>
                <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, flexShrink: 0 }}>
                  ${p.precio.toFixed(2)}
                </span>
              </div>
            ))}
            {productos.length > 200 && (
              <div style={{ textAlign: 'center', padding: 8, fontSize: 12, color: '#6b7280' }}>
                Mostrando 200 de {productos.length}. Usá el buscador para filtrar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
