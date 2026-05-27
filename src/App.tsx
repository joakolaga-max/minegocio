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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: !isOnline ? '#ef4444' : syncing ? '#fbbf24' : '#22c55e' }} />
            <span style={{ color: T.textMuted }}>{!isOnline ? 'Sin conexión' : syncing ? 'Guardando...' : 'Sincronizado'}</span>
          </div>
          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 4, fontSize: 18 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 4 }}>
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '76px 12px 80px', maxWidth: 640, margin: '0 auto' }}>
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

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.bottomNav, borderTop: `1px solid ${T.headerBorder}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px' }}>
        <button onClick={() => switchTab('calc')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tab === 'calc' ? '#818cf8' : T.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: 'inherit' }}>
          <Icon name="store" size={20} /> Calculadora
        </button>
        <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: 'inherit' }}>
          <Icon name="menu" size={20} /> Menú
        </button>
      </div>

      {/* Menu */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.menu, borderRadius: '20px 20px 0 0', zIndex: 200, padding: '8px 0 8px', borderTop: `1px solid ${T.menuBorder}` }}>
            <div style={{ width: 40, height: 4, background: T.inputBorder, borderRadius: 2, margin: '8px auto 12px' }} />
            {NAV.map(item => (
              <button key={item.id} onClick={() => switchTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 20px', background: tab === item.id ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', color: tab === item.id ? '#818cf8' : T.textSecondary, fontFamily: 'inherit', fontSize: 15, fontWeight: tab === item.id ? 600 : 400 }}>
                <Icon name={item.icon} size={20} />
                {item.label}
                {tab === item.id && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>✓</span>}
              </button>
            ))}
            <div style={{ height: 1, background: T.divider, margin: '8px 0' }} />
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit', fontSize: 15 }}>
              <Icon name="x" size={20} /> Salir
            </button>
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
