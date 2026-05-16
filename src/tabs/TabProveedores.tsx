import React, { useState, useRef } from 'react';
import { AppData, Proveedor, Producto } from '../types';
import { Icon } from '../components/Icon';
import { parseArgentino } from '../lib/utils';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (tab: string, codigoProv?: string) => void;
}

function parseCSV(text: string): Producto[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect separator
  const sep = lines[0].includes(';') ? ';' : ',';
  const rows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));

  // Skip header if first row has no number in position 2
  const start = isNaN(parseArgentino(rows[0]?.[2] || '')) && rows.length > 1 ? 1 : 0;

  return rows.slice(start).map(cols => ({
    codigo: (cols[0] || '').toUpperCase(),
    descripcion: cols[1] || '',
    precio: parseArgentino(cols[2] || '0'),
  })).filter(p => p.codigo && p.descripcion);
}

function parseXLSX(buffer: ArrayBuffer): Producto[] {
  const w = window as any;
  if (!w.XLSX) return [];
  const wb = w.XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = w.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const start = isNaN(parseArgentino(String(rows[0]?.[2] || ''))) ? 1 : 0;
  return rows.slice(start).map((cols: any[]) => ({
    codigo: String(cols[0] || '').toUpperCase().trim(),
    descripcion: String(cols[1] || '').trim(),
    precio: parseArgentino(String(cols[2] || '0')),
  })).filter(p => p.codigo && p.descripcion);
}

export function TabProveedores({ data, setData, showToast, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const prov = (data.proveedores || [])[activeTab] || { id: activeTab, nombre: "", productos: [] };
  const productos = busqueda
    ? prov.productos.filter(p =>
        p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    : prov.productos;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const isXls = /\.(xlsx|xls)$/i.test(file.name);
      const productos = await new Promise<Producto[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            if (isXls) resolve(parseXLSX(ev.target!.result as ArrayBuffer));
            else resolve(parseCSV(ev.target!.result as string));
          } catch(err) { reject(err); }
        };
        if (isXls) reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
      });

      if (productos.length === 0) { showToast('No se encontraron productos', 'error'); return; }

      setData(d => {
        const provs = [...d.proveedores];
        provs[activeTab] = { ...provs[activeTab], productos };
        return { ...d, proveedores: provs };
      });
      showToast(`${productos.length} productos cargados`, 'success');
    } catch {
      showToast('Error al leer el archivo', 'error');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
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

  const updateNombre = (nombre: string) => {
    setData(d => {
      const provs = [...d.proveedores];
      provs[activeTab] = { ...provs[activeTab], nombre };
      return { ...d, proveedores: provs };
    });
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
        <div style={{ marginBottom: 16 }}>
          <input
            className="input-field"
            value={prov.nombre}
            onChange={e => updateNombre(e.target.value)}
            style={{ fontWeight: 600 }}
            placeholder="Nombre del proveedor"
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <label style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
            borderRadius: 12, padding: '11px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
          }}>
            <Icon name="upload" size={16} />
            {loading ? 'Cargando...' : 'Cargar lista'}
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />
          </label>
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
