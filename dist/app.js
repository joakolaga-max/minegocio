// MiNegocio v2.0
const { useState, useEffect, useRef, useCallback, useMemo } = React;


// ── src/lib/utils.ts ──
void 0;
const fmtPeso = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0);

const fmtPesoInt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);

const calcPrecioVenta = (costo, margen, margenes) => {
    const pct = typeof margen === 'number' ? margen : (margenes[margen] ?? 50);
    const m = pct / 100;
    if (m >= 1)
        return costo;
    return costo / (1 - m);
};

const todayStr = () => new Date().toLocaleDateString('es-AR');

const nowStr = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);


// ── src/lib/firebase.ts ──
void 0;
const saveToFirebase = async (path, data) => {
    const w = window;
    if (w.__fb)
        await w.__fb.save(path, data);
};

const loadFromFirebase = async (path) => {
    const w = window;
    if (w.__fb)
        return await w.__fb.load(path);
    return null;
};


// ── src/components/Icon.tsx ──
const icons = {
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    plus: 'M12 4v16m8-8H4',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    check: 'M5 13l4 4L19 7',
    x: 'M6 18L18 6M6 6l12 12',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    camera: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
    upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
    alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    menu: 'M4 6h16M4 12h16M4 18h16',
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z',
    store: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
};
function Icon({ name, size = 20, className = '' }) {
    const d = icons[name];
    if (!d)
        return null;
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: className, style: { flexShrink: 0 } }, d.split(' M').filter(Boolean).map((seg, i) => (React.createElement("path", { key: i, d: (i === 0 ? '' : 'M') + seg })))));
}


// ── src/components/Toast.tsx ──
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();

const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#22c55e' },
    error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' },
    info: { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#818cf8' },
};
function Toast({ toast, onClose }) {
    React.useEffect(() => {
        if (!toast)
            return;
        const t = setTimeout(onClose, 2800);
        return () => clearTimeout(t);
    }, [toast, onClose]);
    if (!toast)
        return null;
    const c = colors[toast.type];
    return (React.createElement("div", { style: {
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            zIndex: 500, background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 12, padding: '12px 20px', color: c.text,
            fontSize: 14, fontWeight: 600, maxWidth: '90vw', textAlign: 'center',
            backdropFilter: 'blur(10px)',
        } }, toast.msg));
}


// ── src/components/Modal.tsx ──
function Modal({ title, onClose, children, position = 'center' }) {
    return (React.createElement("div", { onClick: onClose, style: {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 400, display: 'flex', alignItems: position === 'bottom' ? 'flex-end' : 'center',
            justifyContent: 'center', padding: position === 'bottom' ? 0 : 20,
        } },
        React.createElement("div", { onClick: e => e.stopPropagation(), style: {
                background: '#1e2230', borderRadius: position === 'bottom' ? '20px 20px 0 0' : 20,
                padding: 20, width: '100%', maxWidth: 500,
                maxHeight: position === 'bottom' ? '85vh' : '90vh',
                display: 'flex', flexDirection: 'column',
            } },
            title && (React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: '#f1f5f9' } }, title),
                React.createElement("button", { onClick: onClose, style: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' } },
                    React.createElement(Icon, { name: "x", size: 20 })))),
            children)));
}


// ── src/components/Scanner.tsx ──
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();

function Scanner({ onResult, onClose }) {
    const videoRef = React.useRef(null);
    const cleanupRef = React.useRef(null);
    const startScan = React.useCallback(async () => {
        const video = videoRef.current;
        if (!video)
            return;
        // Try native BarcodeDetector first
        if ('BarcodeDetector' in window) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { exact: 'environment' } }
                });
                video.srcObject = stream;
                await video.play();
                const detector = new window.BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e', 'itf'],
                });
                let active = true;
                const scan = async () => {
                    if (!active)
                        return;
                    try {
                        const barcodes = await detector.detect(video);
                        if (barcodes.length > 0) {
                            active = false;
                            onResult(barcodes[0].rawValue);
                            return;
                        }
                    }
                    catch { }
                    if (active)
                        requestAnimationFrame(scan);
                };
                scan();
                cleanupRef.current = () => {
                    active = false;
                    stream.getTracks().forEach(t => t.stop());
                };
                return;
            }
            catch { }
        }
        // Fallback to ZXing
        if (!window.ZXing) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js';
            script.onload = () => startScan();
            document.head.appendChild(script);
            return;
        }
        try {
            const hints = new Map();
            hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
            const reader = new window.ZXing.BrowserMultiFormatReader(hints, 200);
            reader.decodeFromConstraints({ video: { facingMode: { exact: 'environment' } } }, video, (result, err) => {
                if (result) {
                    onResult(result.getText());
                }
            });
            cleanupRef.current = () => reader.reset();
        }
        catch (e) {
            console.error('Scanner error:', e);
        }
    }, [onResult]);
    React.useEffect(() => {
        startScan();
        return () => { cleanupRef.current?.(); };
    }, [startScan]);
    return (React.createElement("div", { style: {
            position: 'fixed', inset: 0, background: '#000', zIndex: 500,
            display: 'flex', flexDirection: 'column',
        } },
        React.createElement("video", { ref: videoRef, style: { flex: 1, objectFit: 'cover', width: '100%' }, muted: true, playsInline: true, autoPlay: true }),
        React.createElement("div", { style: {
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 260, height: 160, border: '2px solid #6366f1',
                borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            } }),
        React.createElement("div", { style: { position: 'absolute', top: 20, right: 20 } },
            React.createElement("button", { onClick: () => { cleanupRef.current?.(); onClose(); }, style: {
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                    width: 44, height: 44, cursor: 'pointer', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                } },
                React.createElement(Icon, { name: "x", size: 22 }))),
        React.createElement("div", { style: {
                position: 'absolute', bottom: 80, width: '100%',
                textAlign: 'center', color: '#94a3b8', fontSize: 14,
            } }, "Apunt\u00E1 la c\u00E1mara al c\u00F3digo de barras")));
}


// ── src/components/LoginScreen.tsx ──
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();

function LoginScreen({ onLogin }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [mode, setMode] = React.useState('login');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [resetSent, setResetSent] = React.useState(false);
    const w = window;
    const handle = async (action) => {
        if (!email.trim() || !password) {
            setError('Completá email y contraseña');
            return;
        }
        setError('');
        setLoading(true);
        try {
            if (action === 'login')
                await w.loginUser(email.trim(), password);
            else
                await w.registerUser(email.trim(), password);
            onLogin();
        }
        catch (e) {
            const msgs = {
                'auth/invalid-credential': 'Email o contraseña incorrectos',
                'auth/email-already-in-use': 'El email ya está registrado',
                'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
                'auth/invalid-email': 'Email inválido',
            };
            setError(msgs[e.code] || e.message || 'Error desconocido');
        }
        setLoading(false);
    };
    const resetPassword = async () => {
        if (!email.trim()) {
            setError('Ingresá tu email primero');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await w.resetPassword(email.trim());
            setResetSent(true);
        }
        catch (e) {
            setError('No se pudo enviar el email de recuperación');
        }
        setLoading(false);
    };
    return (React.createElement("div", { style: {
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0d1117', padding: 20,
        } },
        React.createElement("div", { style: { width: '100%', maxWidth: 400 } },
            React.createElement("div", { style: { textAlign: 'center', marginBottom: 32 } },
                React.createElement("div", { style: {
                        width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32,
                    } }, "\uD83C\uDFEA"),
                React.createElement("div", { style: { fontSize: 28, fontWeight: 700, color: '#f1f5f9' } }, "MiNegocio"),
                React.createElement("div", { style: { fontSize: 14, color: '#6b7280', marginTop: 4 } }, "Sistema de Precios")),
            React.createElement("div", { style: { background: '#161b27', borderRadius: 20, border: '1px solid #1e2535', padding: 28 } },
                React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 } }, mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'),
                resetSent ? (React.createElement("div", { style: { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 16, color: '#22c55e', fontSize: 14, textAlign: 'center', marginBottom: 16 } }, "\u2705 Te enviamos un email para restablecer tu contrase\u00F1a.")) : (React.createElement(React.Fragment, null,
                    React.createElement("input", { className: "input-field", type: "email", placeholder: "Email", value: email, onChange: e => setEmail(e.target.value), style: { marginBottom: 12 } }),
                    React.createElement("input", { className: "input-field", type: "password", placeholder: "Contrase\u00F1a", value: password, onChange: e => setPassword(e.target.value), onKeyDown: e => e.key === 'Enter' && handle(mode), style: { marginBottom: 16 } }),
                    error && (React.createElement("div", { style: { color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 } }, error)),
                    React.createElement("button", { className: "btn-primary", style: { width: '100%', justifyContent: 'center', marginBottom: 12, opacity: loading ? 0.7 : 1 }, onClick: () => handle(mode), disabled: loading }, loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarse'),
                    mode === 'login' && (React.createElement("div", { style: { textAlign: 'center', marginBottom: 12 } },
                        React.createElement("span", { onClick: resetPassword, style: { fontSize: 12, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' } }, "\u00BFOlvidaste tu contrase\u00F1a?"))))),
                React.createElement("div", { style: { textAlign: 'center', fontSize: 13, color: '#6b7280' } },
                    mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? ',
                    React.createElement("span", { onClick: () => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setResetSent(false); }, style: { color: '#818cf8', fontWeight: 600, cursor: 'pointer' } }, mode === 'login' ? 'Registrate' : 'Iniciá sesión'))))));
}


// ── src/hooks/useAppData.ts ──
const DEFAULT_MARGENES = { p1: 50, p2: 40, p3: 30, p4: 20 };
const DEFAULT_DATA = {
    proveedores: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, nombre: `Proveedor ${i + 1}`, productos: [] })),
    misProductos: [],
    margenes: DEFAULT_MARGENES,
    stock: {},
    ventas: [],
    fotos: {},
    pedidos: [],
    pedidosHistorial: [],
};
const PATHS = ['proveedores', 'misProductos', 'config', 'stock', 'ventas', 'fotos', 'pedidos', 'pedidosHistorial'];
function useAppData(user) {
    const [data, setData] = React.useState(DEFAULT_DATA);
    const [loaded, setLoaded] = React.useState(false);
    const [syncing, setSyncing] = React.useState(false);
    const prevRef = React.useRef(null);
    const loadAll = React.useCallback(async () => {
        setSyncing(true);
        try {
            const [provData, misData, config, stockData, ventasData, fotosData, pedidosData, pedHistData] = await Promise.all(PATHS.map(p => loadFromFirebase(p)));
            setData(d => {
                const newData = {
                    ...d,
                    proveedores: provData?.length ? provData : d.proveedores,
                    misProductos: misData ?? d.misProductos,
                    margenes: config?.margenes ?? d.margenes,
                    stock: stockData ?? d.stock,
                    ventas: ventasData ?? d.ventas,
                    fotos: fotosData ?? d.fotos,
                    pedidos: pedidosData ?? d.pedidos,
                    pedidosHistorial: pedHistData ?? d.pedidosHistorial,
                };
                prevRef.current = newData;
                return newData;
            });
        }
        catch (e) {
            console.error('Load error:', e);
        }
        setSyncing(false);
        setLoaded(true);
    }, []);
    // Load when user is authenticated
    React.useEffect(() => {
        if (user) {
            setLoaded(false);
            loadAll();
        }
        else {
            setLoaded(false);
        }
    }, [user, loadAll]);
    // Save changes (debounced)
    React.useEffect(() => {
        if (!loaded || !user)
            return;
        const t = setTimeout(async () => {
            const prev = prevRef.current;
            if (!prev)
                return;
            setSyncing(true);
            const s = (key) => JSON.stringify(data[key]) !== JSON.stringify(prev[key]);
            const saves = [];
            if (s('proveedores'))
                saves.push(saveToFirebase('proveedores', data.proveedores));
            if (s('misProductos'))
                saves.push(saveToFirebase('misProductos', data.misProductos));
            if (s('margenes') || s('misProductos'))
                saves.push(saveToFirebase('config', { margenes: data.margenes }));
            if (s('stock'))
                saves.push(saveToFirebase('stock', data.stock));
            if (s('ventas'))
                saves.push(saveToFirebase('ventas', data.ventas));
            if (s('fotos'))
                saves.push(saveToFirebase('fotos', data.fotos));
            if (s('pedidos'))
                saves.push(saveToFirebase('pedidos', data.pedidos));
            if (s('pedidosHistorial'))
                saves.push(saveToFirebase('pedidosHistorial', data.pedidosHistorial));
            if (saves.length > 0)
                await Promise.all(saves);
            prevRef.current = data;
            setSyncing(false);
        }, 1200);
        return () => clearTimeout(t);
    }, [data, loaded, user]);
    return { data, setData, loaded, syncing };
}


// ── src/tabs/TabCalculadora.tsx ──
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();

function TabCalculadora({ data, setData, showToast }) {
    const [items, setItems] = React.useState([]);
    const [busqueda, setBusqueda] = React.useState('');
    const [scanning, setScanning] = React.useState(false);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const sugerencias = busqueda.length > 0
        ? data.misProductos.filter(p => p.codigoRef.toUpperCase().includes(busqueda.toUpperCase()) ||
            (p.codigoProv || '').toUpperCase().includes(busqueda.toUpperCase()) ||
            (p.descripcion || '').toUpperCase().includes(busqueda.toUpperCase())).slice8
        : [];
    const total = items.reduce((s, i) => s + i.precioVenta * i.cantidad, 0);
    const agregarProducto = React.useCallback((codigoRef) => {
        const prod = data.misProductos.find(p => p.codigoRef === codigoRef.toUpperCase() || p.codigoProv === codigoRef.toUpperCase());
        if (!prod) {
            showToast('Código no encontrado', 'error');
            return;
        }
        const pvTotal = calcPrecioVenta(prod.precioCosto, prod.margen, data.margenes);
        const div = (prod.divisor && prod.divisor > 1) ? prod.divisor : 1;
        const pv = pvTotal / div;
        const desc = div > 1 ? `${prod.descripcion} (÷${div})` : prod.descripcion;
        setItems(its => {
            const idx = its.findIndex(i => i.codigoRef === prod.codigoRef);
            if (idx >= 0) {
                const n = [...its];
                n[idx] = { ...n[idx], cantidad: n[idx].cantidad + 1 };
                return n;
            }
            return [...its, { codigoRef: prod.codigoRef, descripcion: desc, precioVenta: pv, cantidad: 1, divisor: div }];
        });
        setBusqueda('');
        setShowSuggestions(false);
    }, [data, showToast]);
    const confirmarVenta = () => {
        if (items.length === 0) {
            showToast('No hay productos', 'error');
            return;
        }
        if (!window.confirm(`Confirmar venta por ${fmtPeso(total)}?`))
            return;
        setData(d => {
            // Discount stock
            const newStock = { ...d.stock };
            items.forEach(item => {
                if (item.codigoRef) {
                    const cur = newStock[item.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
                    newStock[item.codigoRef] = { ...cur, salidas: (cur.salidas || 0) + item.cantidad * item.divisor };
                }
            });
            // Register sale
            const venta = {
                id: genId(),
                fecha: todayStr(),
                hora: nowStr(),
                items: items.map(i => ({
                    codigoRef: i.codigoRef,
                    descripcion: i.descripcion,
                    cantidad: i.cantidad,
                    precioVenta: i.precioVenta,
                })),
                total,
            };
            return { ...d, stock: newStock, ventas: [...d.ventas, venta] };
        });
        setItems([]);
        showToast('Venta confirmada', 'success');
    };
    return (React.createElement("div", { className: "card" },
        React.createElement("div", { className: "section-title" }, "Calculadora"),
        React.createElement("div", { style: { position: 'relative', marginBottom: 12 } },
            React.createElement("div", { style: { display: 'flex', gap: 8 } },
                React.createElement("div", { style: { position: 'relative', flex: 1 } },
                    React.createElement("div", { style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' } },
                        React.createElement(Icon, { name: "search", size: 16 })),
                    React.createElement("input", { className: "input-field", style: { paddingLeft: 38 }, placeholder: "Buscar por REF, cod proveedor o descripci\u00F3n...", value: busqueda, onChange: e => { setBusqueda(e.target.value.toUpperCase()); setShowSuggestions(true); }, onKeyDown: e => { if (e.key === 'Enter')
                            agregarProducto(busqueda); if (e.key === 'Escape')
                            setShowSuggestions(false); }, onFocus: () => setShowSuggestions(true) })),
                React.createElement("button", { className: "btn-ghost", onClick: () => setScanning(true), style: { padding: '10px 14px' } },
                    React.createElement(Icon, { name: "camera", size: 20 }))),
            showSuggestions && sugerencias.length > 0 && (React.createElement("div", { style: {
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#1e2230', border: '1px solid #374151', borderRadius: 12,
                    zIndex: 200, maxHeight: 300, overflowY: 'auto', marginTop: 4,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                } }, sugerencias.map((p, i) => {
                const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
                const div = p.divisor && p.divisor > 1 ? p.divisor : 1;
                const foto = data.fotos[p.codigoRef];
                return (React.createElement("div", { key: i, onClick: () => agregarProducto(p.codigoRef), style: {
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: i < sugerencias.length - 1 ? '1px solid #111827' : 'none',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }, onMouseEnter: e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)'), onMouseLeave: e => (e.currentTarget.style.background = 'transparent') },
                    foto && React.createElement("img", { src: foto, alt: "", style: { width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 } }),
                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                        React.createElement("div", { style: { display: 'flex', gap: 6, alignItems: 'center' } },
                            React.createElement("span", { style: { fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 } }, p.codigoRef),
                            p.codigoProv && React.createElement("span", { style: { fontSize: 11, color: '#4b5563' } }, p.codigoProv)),
                        React.createElement("div", { style: { fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.descripcion)),
                    React.createElement("div", { style: { fontSize: 13, color: '#22c55e', fontWeight: 700, flexShrink: 0 } },
                        fmtPesoInt(pv / div),
                        div > 1 ? ' c/u' : '')));
            })))),
        items.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '40px 20px', color: '#374151' } },
            React.createElement(Icon, { name: "store", size: 44 }),
            React.createElement("div", { style: { marginTop: 12, fontSize: 14, color: '#6b7280' } }, "Busc\u00E1 un producto para agregar"))) : (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 } }, items.map((item, i) => (React.createElement("div", { key: i, style: { background: '#111827', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 } },
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { fontSize: 13, color: '#f1f5f9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, item.descripcion),
                    React.createElement("div", { style: { fontSize: 12, color: '#6b7280', marginTop: 2 } },
                        fmtPeso(item.precioVenta),
                        " c/u")),
                React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                    React.createElement("button", { onClick: () => setItems(its => its.map((x, j) => j === i ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x)), style: { width: 28, height: 28, borderRadius: 6, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "\u2212"),
                    React.createElement("input", { type: "number", min: 1, value: item.cantidad, onChange: e => setItems(its => its.map((x, j) => j === i ? { ...x, cantidad: Math.max(1, parseInt(e.target.value) || 1) } : x)), style: { width: 44, height: 28, borderRadius: 6, background: '#1e2230', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' } }),
                    React.createElement("button", { onClick: () => setItems(its => its.map((x, j) => j === i ? { ...x, cantidad: x.cantidad + 1 } : x)), style: { width: 28, height: 28, borderRadius: 6, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "+"),
                    React.createElement("div", { style: { width: 70, textAlign: 'right', fontSize: 13, color: '#22c55e', fontWeight: 700 } }, fmtPesoInt(item.precioVenta * item.cantidad)),
                    React.createElement("button", { onClick: () => setItems(its => its.filter((_, j) => j !== i)), style: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' } },
                        React.createElement(Icon, { name: "trash", size: 13 }))))))),
            React.createElement("div", { style: { background: 'linear-gradient(135deg,#1e3a2e,#1a3025)', borderRadius: 14, border: '1px solid #166534', padding: '14px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement("div", { style: { fontSize: 13, color: '#86efac', fontWeight: 600 } }, "Total"),
                React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: '#22c55e' } }, fmtPeso(total))),
            React.createElement("div", { style: { display: 'flex', gap: 8 } },
                React.createElement("button", { className: "btn-ghost", style: { flex: 1, justifyContent: 'center' }, onClick: () => { if (window.confirm('Limpiar calculadora?'))
                        setItems([]); } }, "Limpiar"),
                React.createElement("button", { className: "btn-primary", style: { flex: 2, justifyContent: 'center' }, onClick: confirmarVenta },
                    React.createElement(Icon, { name: "check", size: 16 }),
                    " Confirmar venta")))),
        scanning && (React.createElement(Scanner, { onResult: code => { setScanning(false); agregarProducto(code); }, onClose: () => setScanning(false) }))));
}


// ── src/App.tsx ──
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();

const NAV_ITEMS = [
    { id: 'proveedores', label: 'Proveedores', icon: 'upload' },
    { id: 'precios', label: 'Mis Precios', icon: 'tag' },
    { id: 'stock', label: 'Stock', icon: 'box' },
    { id: 'ventas', label: 'Ventas', icon: 'download' },
    { id: 'pedidos', label: 'Pedidos', icon: 'store' },
    { id: 'config', label: 'Configuración', icon: 'settings' },
];
function App() {
    const [user, setUser] = React.useState(() => window.__user || null);
    const { data, setData, loaded, syncing } = useAppData(user);
    const [tab, setTab] = React.useState(() => localStorage.getItem('mn_lastTab') || 'calc');
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [toast, setToast] = React.useState(null);
    // Track auth changes
    React.useEffect(() => {
        const onAuth = () => {
            const w = window;
            setUser(w.__user || null);
        };
        window.addEventListener('authReady', onAuth);
        return () => window.removeEventListener('authReady', onAuth);
    }, []);
    const showToast = React.useCallback((msg, type = 'success') => {
        setToast({ msg, type });
    }, []);
    const switchTab = (id) => {
        setTab(id);
        setMenuOpen(false);
        try {
            localStorage.setItem('mn_lastTab', id);
        }
        catch { }
    };
    const logout = async () => {
        try {
            await window.logout();
        }
        catch { }
        setUser(null);
    };
    // Show login if not authenticated
    if (!user) {
        return React.createElement(LoginScreen, { onLogin: () => setUser(window.__user) });
    }
    return (React.createElement("div", { style: { minHeight: '100vh', background: '#0d1117', color: '#f1f5f9', fontFamily: "'Space Grotesk', system-ui, sans-serif" } },
        React.createElement("div", { style: {
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #1e2535', padding: '0 16px',
                height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            } },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                React.createElement("div", { style: {
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    } }, "\uD83C\uDFEA"),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: '#f1f5f9' } }, "MiNegocio"),
                    React.createElement("div", { style: { fontSize: 10, color: '#6b7280' } }, "Sistema de Precios"))),
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 } },
                    React.createElement("div", { style: { width: 7, height: 7, borderRadius: '50%', background: syncing ? '#fbbf24' : '#22c55e' } }),
                    React.createElement("span", { style: { color: '#6b7280' } }, syncing ? 'Guardando...' : 'Sincronizado')),
                React.createElement("button", { onClick: () => setMenuOpen(v => !v), style: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 } },
                    React.createElement(Icon, { name: "menu", size: 22 })))),
        React.createElement("div", { style: { paddingTop: 60, maxWidth: 640, margin: '0 auto', padding: '76px 12px 80px' } }, !loaded ? (React.createElement("div", { style: { textAlign: 'center', padding: '80px 20px', color: '#6b7280' } },
            React.createElement("div", { style: { fontSize: 40, marginBottom: 16 } }, "\u26A1"),
            React.createElement("div", null, "Cargando datos..."))) : (React.createElement(React.Fragment, null,
            tab === 'calc' && React.createElement(TabCalculadora, { data: data, setData: setData, showToast: showToast }),
            tab !== 'calc' && (React.createElement("div", { style: { background: '#161b27', borderRadius: 16, border: '1px solid #1e2535', padding: '60px 20px', textAlign: 'center', color: '#6b7280' } },
                React.createElement("div", { style: { fontSize: 40, marginBottom: 16 } }, "\uD83D\uDEA7"),
                React.createElement("div", { style: { fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#f1f5f9' } }, "En construcci\u00F3n"),
                React.createElement("div", { style: { fontSize: 14 } }, "Esta pesta\u00F1a se est\u00E1 migrando")))))),
        React.createElement("div", { style: {
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'rgba(13,17,23,0.98)', borderTop: '1px solid #1e2535',
                display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px',
            } },
            React.createElement("button", { onClick: () => switchTab('calc'), style: {
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: tab === 'calc' ? '#818cf8' : '#4b5563',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    fontSize: 10, fontFamily: 'inherit',
                } },
                React.createElement(Icon, { name: "store", size: 20 }),
                "Calculadora"),
            React.createElement("button", { onClick: () => setMenuOpen(v => !v), style: {
                    background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    fontSize: 10, fontFamily: 'inherit',
                } },
                React.createElement(Icon, { name: "menu", size: 20 }),
                "Men\u00FA")),
        menuOpen && (React.createElement(React.Fragment, null,
            React.createElement("div", { onClick: () => setMenuOpen(false), style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 } }),
            React.createElement("div", { style: {
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: '#1e2230', borderRadius: '20px 20px 0 0',
                    zIndex: 200, padding: '8px 0 8px',
                } },
                React.createElement("div", { style: { width: 40, height: 4, background: '#374151', borderRadius: 2, margin: '8px auto 12px' } }),
                NAV_ITEMS.map(item => (React.createElement("button", { key: item.id, onClick: () => switchTab(item.id), style: {
                        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                        padding: '13px 20px',
                        background: tab === item.id ? 'rgba(99,102,241,0.1)' : 'none',
                        border: 'none', cursor: 'pointer',
                        color: tab === item.id ? '#818cf8' : '#94a3b8',
                        fontFamily: 'inherit', fontSize: 15, fontWeight: tab === item.id ? 600 : 400,
                    } },
                    React.createElement(Icon, { name: item.icon, size: 20 }),
                    item.label,
                    tab === item.id && React.createElement("span", { style: { marginLeft: 'auto', color: '#6366f1' } }, "\u2713")))),
                React.createElement("div", { style: { height: 1, background: '#1e2535', margin: '8px 0' } }),
                React.createElement("button", { onClick: logout, style: {
                        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                        padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', fontFamily: 'inherit', fontSize: 15,
                    } },
                    React.createElement(Icon, { name: "x", size: 20 }),
                    "Salir")))),
        React.createElement(Toast, { toast: toast, onClose: () => setToast(null) })));
}


// ── src/main.tsx ──
const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(React.createElement(App, null));
}
