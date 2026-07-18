import React, { useState, useEffect } from 'react';
import { AppData } from '../types';
import { Icon } from '../components/Icon';
import { useTheme } from '../ThemeContext';
import { darkTheme, lightTheme } from '../theme';
import { loadFotos, saveFoto } from '../lib/firebase';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TabConfig({ data, setData, showToast }: Props) {
  const { theme: T, isDark, customColors, saveCustomColors, resetCustomColors } = useTheme();
  const [openSection, setOpenSection] = useState<string | null>('margenes');

  // ── Colores personalizados ──
  const colorLabels: { key: keyof import('../theme').Theme; label: string }[] = [
    { key: 'bg', label: 'Fondo general' },
    { key: 'card', label: 'Fondo de tarjetas' },
    { key: 'cardBorder', label: 'Borde de tarjetas' },
    { key: 'header', label: 'Fondo del encabezado' },
    { key: 'menu', label: 'Fondo del menú' },
    { key: 'text', label: 'Texto principal' },
    { key: 'textSecondary', label: 'Texto secundario' },
    { key: 'textMuted', label: 'Texto tenue' },
    { key: 'inputBg', label: 'Fondo de campos' },
    { key: 'inputBorder', label: 'Borde de campos' },
    { key: 'inputBorderFocus', label: 'Borde de campo activo' },
    { key: 'divider', label: 'Líneas divisorias' },
    { key: 'sectionBg', label: 'Fondo de secciones' },
  ];

  const toHex = (c: string): string => {
    if (!c) return '#000000';
    if (c.startsWith('#')) return c.length === 7 ? c : '#000000';
    const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
      const toH = (n: string) => parseInt(n).toString(16).padStart(2, '0');
      return `#${toH(m[1])}${toH(m[2])}${toH(m[3])}`;
    }
    return '#000000';
  };

  const [draftColors, setDraftColors] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    colorLabels.forEach(({ key }) => { initial[key] = toHex((customColors as any)[key] || (T as any)[key]); });
    return initial;
  });

  useEffect(() => {
    const initial: Record<string, string> = {};
    colorLabels.forEach(({ key }) => { initial[key] = toHex((customColors as any)[key] || (T as any)[key]); });
    setDraftColors(initial);
    // eslint-disable-next-line
  }, [isDark]);

  const guardarColores = () => {
    saveCustomColors(draftColors as any);
    showToast('Colores guardados', 'success');
  };

  const restablecerColores = () => {
    resetCustomColors();
    const base = isDark ? darkTheme : lightTheme;
    const initial: Record<string, string> = {};
    colorLabels.forEach(({ key }) => { initial[key] = toHex((base as any)[key]); });
    setDraftColors(initial);
    showToast('Colores restablecidos', 'info');
  };

  // Márgenes
  const [m1, setM1] = useState(String(data.margenes.p1));
  const [m2, setM2] = useState(String(data.margenes.p2));
  const [m3, setM3] = useState(String(data.margenes.p3));
  const [m4, setM4] = useState(String(data.margenes.p4));

  // Proveedores
  const [nombres, setNombres] = useState((data.proveedores || []).map(p => p.nombre));

  // Presupuesto - read from data (Firebase synced)
  const [empresa, setEmpresa] = useState(() => (data as any).empresa || localStorage.getItem('mn_empresa') || '');
  const [telefono, setTelefono] = useState(() => (data as any).telefono || localStorage.getItem('mn_telefono') || '');
  const [direccion, setDireccion] = useState(() => (data as any).direccion || localStorage.getItem('mn_direccion') || '');

  const mult = (pct: number) => pct >= 100 ? '∞' : (100 / (100 - pct)).toFixed(2) + 'x';
  const pct = (s: string) => Math.min(99, Math.max(1, parseFloat(s) || 1));

  const guardarMargenes = () => {
    setData(d => ({ ...d, margenes: { p1: pct(m1), p2: pct(m2), p3: pct(m3), p4: pct(m4) } }));
    showToast('Márgenes guardados', 'success');
  };

  const guardarProveedores = () => {
    setData(d => ({
      ...d,
      proveedores: (d.proveedores || []).map((p, i) => ({ ...p, nombre: nombres[i] || p.nombre }))
    }));
    showToast('Proveedores guardados', 'success');
  };

  // ── Backup completo (datos + fotos) ──
  const descargarBackup = async () => {
    showToast('Preparando backup...', 'info');
    try {
      const fotos = await loadFotos();
      const backup = {
        version: 2,
        fecha: new Date().toISOString(),
        datos: {
          proveedores: data.proveedores,
          misProductos: data.misProductos,
          margenes: data.margenes,
          stock: data.stock,
          ventas: data.ventas,
          pedidos: data.pedidos,
          pedidosHistorial: data.pedidosHistorial,
          presupuestos: (data as any).presupuestos || [],
          empresa: (data as any).empresa || '',
          telefono: (data as any).telefono || '',
          direccion: (data as any).direccion || '',
        },
        fotos: fotos,
      };
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
      a.href = url;
      a.download = `backup_minegocio_${fecha}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const cant = Object.keys(fotos).length;
      showToast(`Backup descargado (${data.misProductos.length} productos, ${cant} fotos)`, 'success');
    } catch (e) {
      showToast('Error al crear backup', 'error');
    }
  };

  const restaurarBackup = (file: File) => {
    if (!file) return;
    if (!window.confirm('Esto va a REEMPLAZAR todos los datos actuales con los del backup. ¿Continuar?')) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const backup = JSON.parse(ev.target!.result as string);
        if (!backup.datos) { showToast('Archivo de backup inválido', 'error'); return; }
        showToast('Restaurando...', 'info');
        // Restaurar datos principales
        setData(d => ({
          ...d,
          ...backup.datos,
          fotos: backup.fotos || {},
        }));
        // Restaurar fotos una por una en Firebase
        if (backup.fotos) {
          for (const [ref, b64] of Object.entries(backup.fotos)) {
            await saveFoto(ref, b64 as string);
          }
        }
        showToast('Backup restaurado correctamente', 'success');
      } catch (e) {
        showToast('Error al leer el backup', 'error');
      }
    };
    reader.readAsText(file);
  };

  const guardarPresupuesto = () => {
    // Save to Firebase via data
    setData(d => ({ ...d, empresa, telefono, direccion } as any));
    // Also save to localStorage as fallback
    localStorage.setItem('mn_empresa', empresa);
    localStorage.setItem('mn_telefono', telefono);
    localStorage.setItem('mn_direccion', direccion);
    showToast('Datos guardados y sincronizados', 'success');
  };

  const SectionHeader = ({ id, label, icon }: { id: string; label: string; icon: string }) => { const { theme: T } = useTheme(); return (
    <button
      onClick={() => setOpenSection(openSection === id ? null : id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: openSection === id ? 'rgba(99,102,241,0.1)' : T.sectionBg,
        border: 'none', borderRadius: openSection === id ? '12px 12px 0 0' : 12,
        cursor: 'pointer', fontFamily: 'inherit', marginBottom: openSection === id ? 0 : 8,
        borderBottom: openSection === id ? `1px solid ${T.divider}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={18} />
        <span style={{ fontSize: 15, fontWeight: 700, color: openSection === id ? '#818cf8' : T.text }}>{label}</span>
      </div>
      <span style={{ color: T.textMuted, fontSize: 18 }}>{openSection === id ? '▲' : '▼'}</span>
    </button>
  ); };

  return (
    <div>
      {/* MÁRGENES */}
      <SectionHeader id="margenes" label="Márgenes de ganancia" icon="tag" />
      {openSection === 'margenes' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[['% 1', m1, setM1], ['% 2', m2, setM2], ['% 3', m3, setM3], ['% 4', m4, setM4]].map(([label, val, set]) => (
              <div key={label as string} style={{ background: T.sectionBg, borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted }}>{label as string}</span>
                <input
                  type="number" min={1} max={99}
                  value={val as string}
                  onChange={e => (set as Function)(e.target.value)}
                  onBlur={e => (set as Function)(String(Math.min(99, Math.max(1, parseFloat(e.target.value) || 1))))}
                  style={{ width: '100%', background: T.card, border: `1px solid ${T.inputBorder}`, borderRadius: 10, padding: '10px 6px', color: T.text, fontSize: 22, fontWeight: 700, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
                />
                <span style={{ fontSize: 11, color: '#818cf8' }}>{pct(val as string)}% → {mult(pct(val as string))}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={guardarMargenes}>
            <Icon name="check" size={16} /> Guardar márgenes
          </button>
        </div>
      )}

      {/* PROVEEDORES */}
      <SectionHeader id="proveedores" label="Nombres de proveedores" icon="store" />
      {openSection === 'proveedores' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          {(data.proveedores || []).map((p, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4 }}>
                Proveedor {i + 1}
                {p.productos.length > 0 && <span style={{ marginLeft: 8, color: '#22c55e', fontSize: 11 }}>({p.productos.length} productos)</span>}
              </label>
              <input className="input-field"
                value={nombres[i] ?? p.nombre}
                onChange={e => { const n = [...nombres]; n[i] = e.target.value; setNombres(n); }}
                placeholder={`Proveedor ${i + 1}`}
              />
            </div>
          ))}
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={guardarProveedores}>
            <Icon name="check" size={16} /> Guardar nombres
          </button>
        </div>
      )}

      {/* PRESUPUESTO */}
      <SectionHeader id="presupuesto" label="Datos del presupuesto" icon="download" />
      {openSection === 'presupuesto' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 6 }}>Nombre del negocio</label>
            <input className="input-field" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Mi Negocio" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 6 }}>Teléfono</label>
              <input className="input-field" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="381 4..." />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 6 }}>Dirección</label>
            <input className="input-field" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle 123, Ciudad" />
          </div>
          <div style={{ background: T.sectionBg, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: T.textMuted }}>
            Estos datos aparecen en todos los presupuestos que generes.
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={guardarPresupuesto}>
            <Icon name="check" size={16} /> Guardar datos
          </button>
        </div>
      )}

      {/* BACKUP */}
      <SectionHeader id="backup" label="Copia de seguridad" icon="download" />
      {openSection === 'backup' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          <div style={{ background: T.sectionBg, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: T.textMuted }}>
            Descargá un archivo con TODOS tus datos y fotos. Guardalo en un lugar seguro (Drive, mail, USB). Si pasa algo, lo restaurás en segundos.
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={descargarBackup}>
            <Icon name="download" size={16} /> Descargar backup completo
          </button>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'transparent', border: `1px solid ${T.inputBorder}`, color: T.textSecondary, borderRadius: 12, padding: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, fontSize: 14 }}>
            <Icon name="upload" size={16} /> Restaurar desde backup
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) restaurarBackup(f); e.target.value = ''; }} />
          </label>
          <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted, textAlign: 'center' }}>
            Recomendado: hacé un backup una vez por semana.
          </div>
        </div>
      )}

      {/* COLORES */}
      <SectionHeader id="colores" label="Colores de la app" icon="settings" />
      {openSection === 'colores' && (
        <div style={{ background: T.card, borderRadius: '0 0 12px 12px', padding: 16, marginBottom: 8 }}>
          <div style={{ background: T.sectionBg, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: T.textMuted }}>
            Ajustá los colores del modo {isDark ? 'oscuro' : 'claro'} si la luz del día no te deja ver bien. Tocá el cuadrado de color para cambiarlo.
          </div>

          {colorLabels.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.divider}` }}>
              <div style={{ fontSize: 13, color: T.text }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace' }}>{draftColors[key]}</span>
                <input
                  type="color"
                  value={draftColors[key] || '#000000'}
                  onChange={e => setDraftColors(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: 40, height: 32, border: `1px solid ${T.inputBorder}`, borderRadius: 8, padding: 0, cursor: 'pointer', background: 'none' }}
                />
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={restablecerColores}>
              <Icon name="x" size={16} /> Restablecer
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={guardarColores}>
              <Icon name="check" size={16} /> Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
