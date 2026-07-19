import React, { useState, useCallback, useEffect } from 'react';
import { useAppData } from './hooks/useAppData';
import { Toast } from './components/Toast';
import { Icon } from './components/Icon';
import { LoginScreen } from './components/LoginScreen';
import { TabCalculadora } from './tabs/TabCalculadora';
import { TabProveedores } from './tabs/TabProveedores';
import { TabMisPrecios } from './tabs/TabMisPrecios';
import { TabStock } from './tabs/TabStock';
import { TabVentas } from './tabs/TabVentas';
import { TabPedidos } from './tabs/TabPedidos';
import { TabConfig } from './tabs/TabConfig';
import { TabPresupuestos } from './tabs/TabPresupuestos';
import { ThemeProvider, useTheme } from './ThemeContext';
import { Toast as ToastType, TabId } from './types';

const NAV: { id: TabId; label: string; icon: string }[] = [
  { id: 'proveedores', label: 'Proveedores', icon: 'upload' },
  { id: 'precios', label: 'Mis Precios', icon: 'tag' },
  { id: 'stock', label: 'Stock', icon: 'box' },
  { id: 'ventas', label: 'Ventas', icon: 'download' },
  { id: 'pedidos', label: 'Pedidos', icon: 'store' },
  { id: 'presupuestos', label: 'Presupuestos', icon: 'download' },
  { id: 'config', label: 'Configuración', icon: 'settings' },
];

function AppInner() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState<string | null>(() => (window as any).__user || null);
  const { data, setData, loaded, syncing } = useAppData(user);
  const [tab, setTab] = useState<TabId>(() => (localStorage.getItem('mn_lastTab') as TabId) || 'calc');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (window as any).__isOnline !== false);
  const [pendingCodProv, setPendingCodProv] = useState<string | undefined>();
  const [pendingCalcItems, setPendingCalcItems] = useState<any[] | undefined>();
  const [toast, setToast] = useState<ToastType | null>(null);

  useEffect(() => {
    const handler = () => setIsOnline((window as any).__isOnline !== false);
    window.addEventListener('connectivityChange', handler);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('connectivityChange', handler);
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);

  useEffect(() => {
    const onAuth = () => setUser((window as any).__user || null);
    window.addEventListener('authReady', onAuth);
    return () => window.removeEventListener('authReady', onAuth);
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
  }, []);

  const onNavigate = (tabId: string, codigoProv?: string) => {
    switchTab(tabId as TabId);
    if (codigoProv) setPendingCodProv(codigoProv);
  };

  const switchTab = (id: TabId) => {
    setTab(id); setMenuOpen(false);
    try { localStorage.setItem('mn_lastTab', id); } catch {}
  };

  const logout = async () => {
    try { await (window as any).logout(); } catch {}
    setUser(null);
  };

  if (!user) return <LoginScreen onLogin={() => setUser((window as any).__user)} />;

  const tabProps = { data, setData, showToast };
  const T = theme;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: T.header, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.headerBorder}`, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏪</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>MiNegocio</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>Sistema de Precios</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Acceso directo a Calculadora */}
          <button onClick={() => switchTab('calc')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: tab === 'calc' ? 'rgba(99,102,241,0.15)' : 'none', border: tab === 'calc' ? '1px solid #6366f1' : '1px solid transparent', color: tab === 'calc' ? '#818cf8' : T.textMuted, cursor: 'pointer', padding: '8px 14px', borderRadius: 10, minWidth: 44 }}>
            <Icon name="store" size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: !isOnline ? '#ef4444' : syncing ? '#fbbf24' : '#22c55e' }} />
            <span style={{ color: T.textMuted }}>{!isOnline ? 'Sin conexión' : syncing ? 'Guardando...' : 'Sincronizado'}</span>
          </div>
          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 4, fontSize: 18 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: menuOpen ? 'rgba(99,102,241,0.15)' : 'none', border: menuOpen ? '1px solid #6366f1' : 'none', color: menuOpen ? '#818cf8' : T.textMuted, cursor: 'pointer', padding: 4, borderRadius: 8 }}>
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '76px 12px 24px', maxWidth: 640, margin: '0 auto' }}>
        {!loaded ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: T.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <div>Cargando datos...</div>
          </div>
        ) : (
          <>
            {tab === 'calc' && <TabCalculadora {...tabProps} pendingItems={pendingCalcItems} onClearPending={() => setPendingCalcItems(undefined)} />}
            {tab === 'proveedores' && <TabProveedores {...tabProps} onNavigate={onNavigate} />}
            {tab === 'precios' && <TabMisPrecios {...tabProps} pendingCodProv={pendingCodProv} onClearPending={() => setPendingCodProv(undefined)} />}
            {tab === 'stock' && <TabStock {...tabProps} />}
            {tab === 'ventas' && <TabVentas {...tabProps} />}
            {tab === 'pedidos' && <TabPedidos {...tabProps} />}
            {tab === 'presupuestos' && <TabPresupuestos {...tabProps} onCargarEnCalculadora={(items) => { setPendingCalcItems(items); switchTab('calc'); }} />}
            {tab === 'config' && <TabConfig {...tabProps} />}
          </>
        )}
      </div>

      {/* Menu compacto, anclado arriba a la derecha */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'transparent' }} />
          <div style={{ position: 'fixed', top: 64, right: 12, width: 230, maxWidth: '70vw', background: T.menu, borderRadius: 14, zIndex: 200, padding: '6px 0', border: `1px solid ${T.menuBorder}`, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => { switchTab(item.id); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 16px', background: tab === item.id ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', color: tab === item.id ? '#818cf8' : T.textSecondary, fontFamily: 'inherit', fontSize: 13, fontWeight: tab === item.id ? 600 : 400, textAlign: 'left' }}>
                <Icon name={item.icon} size={17} />
                {item.label}
                {tab === item.id && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>✓</span>}
              </button>
            ))}
            <div style={{ height: 1, background: T.divider, margin: '4px 0' }} />
            <button onClick={() => { setMenuOpen(false); setShowConfirmLogout(true); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit', fontSize: 13, textAlign: 'left' }}>
              <Icon name="x" size={17} /> Salir
            </button>
          </div>
        </>
      )}

      {/* Confirmación al salir */}
      {showConfirmLogout && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 250 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', maxWidth: 320, background: T.card, borderRadius: 16, padding: 20, zIndex: 300, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: T.text }}>🚪 ¿Cerrar sesión?</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Vas a salir de MiNegocio. Tus datos ya están guardados en la nube.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setShowConfirmLogout(false)} className="btn-ghost" style={{ justifyContent: 'center' }}>Cancelar</button>
              <button onClick={() => { setShowConfirmLogout(false); logout(); }} style={{ padding: '10px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Salir</button>
            </div>
          </div>
        </>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
