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
                await w.login(email.trim(), password);
            else
                await w.register(email.trim(), password);
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


// ── src/tabs/TabProveedores.tsx ──
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0)
        return [];
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
function parseXLSX(buffer) {
    const w = window;
    if (!w.XLSX)
        return [];
    const wb = w.XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = w.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const start = isNaN(parseArgentino(String(rows[0]?.[2] || ''))) ? 1 : 0;
    return rows.slice(start).map((cols) => ({
        codigo: String(cols[0] || '').toUpperCase().trim(),
        descripcion: String(cols[1] || '').trim(),
        precio: parseArgentino(String(cols[2] || '0')),
    })).filter(p => p.codigo && p.descripcion);
}
function TabProveedores({ data, setData, showToast }) {
    const [activeTab, setActiveTab] = React.useState(0);
    const [busqueda, setBusqueda] = React.useState('');
    const fileRef = React.useRef(null);
    const [loading, setLoading] = React.useState(false);
    const prov = data.proveedores[activeTab];
    const productos = busqueda
        ? prov.productos.filter(p => p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
        : prov.productos;
    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setLoading(true);
        try {
            const isXls = /\.(xlsx|xls)$/i.test(file.name);
            const productos = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        if (isXls)
                            resolve(parseXLSX(ev.target.result));
                        else
                            resolve(parseCSV(ev.target.result));
                    }
                    catch (err) {
                        reject(err);
                    }
                };
                if (isXls)
                    reader.readAsArrayBuffer(file);
                else
                    reader.readAsText(file);
            });
            if (productos.length === 0) {
                showToast('No se encontraron productos', 'error');
                return;
            }
            setData(d => {
                const provs = [...d.proveedores];
                provs[activeTab] = { ...provs[activeTab], productos };
                return { ...d, proveedores: provs };
            });
            showToast(`${productos.length} productos cargados`, 'success');
        }
        catch {
            showToast('Error al leer el archivo', 'error');
        }
        finally {
            setLoading(false);
            e.target.value = '';
        }
    };
    const limpiar = () => {
        if (!window.confirm(`Limpiar todos los productos de ${prov.nombre}?`))
            return;
        setData(d => {
            const provs = [...d.proveedores];
            provs[activeTab] = { ...provs[activeTab], productos: [] };
            return { ...d, proveedores: provs };
        });
        showToast('Lista limpiada', 'info');
    };
    const updateNombre = (nombre) => {
        setData(d => {
            const provs = [...d.proveedores];
            provs[activeTab] = { ...provs[activeTab], nombre };
            return { ...d, proveedores: provs };
        });
    };
    return (React.createElement("div", null,
        React.createElement("div", { style: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 } }, data.proveedores.map((p, i) => (React.createElement("button", { key: i, onClick: () => { setActiveTab(i); setBusqueda(''); }, style: {
                flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: '1px solid',
                borderColor: activeTab === i ? '#6366f1' : '#374151',
                background: activeTab === i ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeTab === i ? '#818cf8' : '#6b7280',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === i ? 600 : 400,
            } }, i + 1)))),
        React.createElement("div", { className: "card" },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } },
                React.createElement("input", { className: "input-field", value: prov.nombre, onChange: e => updateNombre(e.target.value), style: { flex: 1, fontWeight: 600 }, placeholder: "Nombre del proveedor" }),
                React.createElement("span", { style: { fontSize: 12, color: '#4b5563', flexShrink: 0 } },
                    prov.productos.length,
                    " productos")),
            React.createElement("div", { style: { display: 'flex', gap: 8, marginBottom: 14 } },
                React.createElement("label", { style: {
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                        borderRadius: 12, padding: '11px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
                    } },
                    React.createElement(Icon, { name: "upload", size: 16 }),
                    loading ? 'Cargando...' : 'Cargar lista',
                    React.createElement("input", { ref: fileRef, type: "file", accept: ".csv,.txt,.xlsx,.xls", style: { display: 'none' }, onChange: handleFile })),
                prov.productos.length > 0 && (React.createElement("button", { className: "btn-danger", onClick: limpiar, style: { padding: '11px 14px' } },
                    React.createElement(Icon, { name: "trash", size: 16 })))),
            React.createElement("div", { style: { fontSize: 11, color: '#4b5563', marginBottom: 14, padding: '8px 12px', background: '#111827', borderRadius: 8 } }, "Formato: C\u00F3digo | Descripci\u00F3n | Precio \u2014 CSV o Excel"),
            prov.productos.length > 0 && (React.createElement("div", { style: { position: 'relative', marginBottom: 12 } },
                React.createElement("div", { style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' } },
                    React.createElement(Icon, { name: "search", size: 16 })),
                React.createElement("input", { className: "input-field", style: { paddingLeft: 38 }, placeholder: "Buscar producto...", value: busqueda, onChange: e => setBusqueda(e.target.value) }))),
            prov.productos.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '40px 20px', color: '#374151' } },
                React.createElement(Icon, { name: "upload", size: 40 }),
                React.createElement("div", { style: { marginTop: 12, fontSize: 14, color: '#6b7280' } }, "Carg\u00E1 la lista de precios del proveedor"))) : (React.createElement("div", { style: { maxHeight: 400, overflowY: 'auto' } },
                productos.slice200.map((p, i) => (React.createElement("div", { key: i, style: {
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0', borderBottom: i < productos.length - 1 ? '1px solid #1e2535' : 'none',
                        gap: 10,
                    } },
                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                        React.createElement("span", { style: { fontSize: 11, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700, marginRight: 8 } }, p.codigo),
                        React.createElement("span", { style: { fontSize: 13, color: '#cbd5e1' } }, p.descripcion)),
                    React.createElement("span", { style: { fontSize: 13, color: '#22c55e', fontWeight: 600, flexShrink: 0 } },
                        "$",
                        p.precio.toFixed(2))))),
                productos.length > 200 && (React.createElement("div", { style: { textAlign: 'center', padding: 8, fontSize: 12, color: '#6b7280' } },
                    "Mostrando 200 de ",
                    productos.length,
                    ". Us\u00E1 el buscador para filtrar.")))))));
}


// ── src/tabs/TabMisPrecios.tsx ──
const MARGEN_LABELS = { p1: '% 1', p2: '% 2', p3: '% 3', p4: '% 4' };
function TabMisPrecios({ data, setData, showToast }) {
    const [busqueda, setBusqueda] = React.useState('');
    const [codigoRef, setCodigoRef] = React.useState('');
    const [codigoProv, setCodigoProv] = React.useState('');
    const [margenSel, setMargenSel] = React.useState('p1');
    const [margenCustom, setMargenCustom] = React.useState(false);
    const [margenCustomVal, setMargenCustomVal] = React.useState('');
    const [divisor, setDivisor] = React.useState(1);
    const [editIdx, setEditIdx] = React.useState(null);
    const [scanBarcode, setScanBarcode] = React.useState(false);
    const [photoModal, setPhotoModal] = React.useState(null);
    const margenFinal = margenCustom ? (parseFloat(margenCustomVal) || 50) : margenSel;
    const buscarEnProveedores = React.useCallback((codigo) => {
        for (const prov of data.proveedores) {
            const p = prov.productos.find(x => x.codigo === codigo.toUpperCase());
            if (p)
                return { ...p, proveedor: prov.nombre };
        }
        return null;
    }, [data.proveedores]);
    const agregarProducto = () => {
        if (!codigoRef.trim() || !codigoProv.trim()) {
            showToast('Completá REF y código proveedor', 'error');
            return;
        }
        const encontrado = buscarEnProveedores(codigoProv.trim());
        if (!encontrado) {
            showToast('Código no encontrado en proveedores', 'error');
            return;
        }
        if (editIdx === null && data.misProductos.find(p => p.codigoRef === codigoRef.trim().toUpperCase())) {
            showToast('El código REF ya existe', 'error');
            return;
        }
        const nuevo = {
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
        setCodigoRef('');
        setCodigoProv('');
        setMargenSel('p1');
        setMargenCustom(false);
        setMargenCustomVal('');
        setDivisor(1);
        setEditIdx(null);
    };
    const editar = (i) => {
        const p = data.misProductos[i];
        setCodigoRef(p.codigoRef);
        setCodigoProv(p.codigoProv);
        if (typeof p.margen === 'number') {
            setMargenCustom(true);
            setMargenCustomVal(String(p.margen));
            setMargenSel(p.margen);
        }
        else {
            setMargenCustom(false);
            setMargenSel(p.margen);
        }
        setDivisor(p.divisor || 1);
        setEditIdx(i);
    };
    const eliminar = (i) => {
        if (!window.confirm('Eliminar este producto?'))
            return;
        setData(d => ({ ...d, misProductos: d.misProductos.filter((_, j) => j !== i) }));
        showToast('Producto eliminado', 'info');
    };
    const exportar = () => {
        const w = window;
        if (!w.XLSX) {
            showToast('XLSX no disponible', 'error');
            return;
        }
        const wsData = [['Ref', 'Cod Proveedor', 'Descripcion', 'Precio Compra', 'Precio Venta', 'Margen %']];
        data.misProductos.forEach(p => {
            const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
            const m = typeof p.margen === 'number' ? p.margen : (data.margenes[p.margen] || 50);
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
        ? data.misProductos.filter(p => p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()))
        : data.misProductos;
    const fmt = (n) => '$' + Math.round(n).toLocaleString('es-AR');
    return (React.createElement("div", null,
        React.createElement("div", { className: "card" },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } },
                React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, editIdx !== null ? 'Editar producto' : 'Agregar producto'),
                editIdx !== null && (React.createElement("button", { className: "btn-ghost", style: { padding: '6px 12px', fontSize: 12 }, onClick: () => { setEditIdx(null); setCodigoRef(''); setCodigoProv(''); setMargenSel('p1'); setMargenCustom(false); setDivisor(1); } }, "Cancelar"))),
            React.createElement("div", { style: { marginBottom: 10 } },
                React.createElement("label", { style: { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 } }, "C\u00F3digo REF (tu descripci\u00F3n interna)"),
                React.createElement("input", { className: "input-field", value: codigoRef, onChange: e => setCodigoRef(e.target.value.toUpperCase()), placeholder: "Ej: CABLE-MANG-16" })),
            React.createElement("div", { style: { marginBottom: 10 } },
                React.createElement("label", { style: { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 } }, "C\u00F3digo de barras"),
                React.createElement("div", { style: { display: 'flex', gap: 8 } },
                    React.createElement("input", { className: "input-field", style: { flex: 1 }, value: codigoProv, onChange: e => setCodigoProv(e.target.value.toUpperCase()), placeholder: "Escane\u00E1 o escrib\u00ED el c\u00F3digo" }),
                    React.createElement("button", { className: "btn-ghost", style: { padding: '10px 14px' }, onClick: () => setScanBarcode(true) },
                        React.createElement(Icon, { name: "camera", size: 18 }))),
                codigoProv && (() => {
                    const found = buscarEnProveedores(codigoProv);
                    return found ? (React.createElement("div", { style: { fontSize: 12, color: '#22c55e', marginTop: 4 } },
                        "\u2713 ",
                        found.descripcion,
                        " \u2014 $",
                        found.precio.toFixed(2))) : (React.createElement("div", { style: { fontSize: 12, color: '#ef4444', marginTop: 4 } }, "No encontrado en proveedores"));
                })()),
            React.createElement("div", { style: { marginBottom: 10 } },
                React.createElement("label", { style: { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 } }, "Margen"),
                React.createElement("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                    Object.entries(MARGEN_LABELS).map(([k, v]) => (React.createElement("button", { key: k, onClick: () => { setMargenSel(k); setMargenCustom(false); }, style: {
                            flex: 1, minWidth: 60, padding: '8px 4px', borderRadius: 10, border: '1px solid',
                            borderColor: margenSel === k && !margenCustom ? '#6366f1' : '#374151',
                            background: margenSel === k && !margenCustom ? 'rgba(99,102,241,0.2)' : 'transparent',
                            color: margenSel === k && !margenCustom ? '#818cf8' : '#6b7280',
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
                        } },
                        v,
                        " (",
                        data.margenes[k],
                        "%)"))),
                    React.createElement("button", { onClick: () => setMargenCustom(!margenCustom), style: {
                            flex: 1, minWidth: 60, padding: '8px 4px', borderRadius: 10, border: '1px solid',
                            borderColor: margenCustom ? '#6366f1' : '#374151',
                            background: margenCustom ? 'rgba(99,102,241,0.2)' : 'transparent',
                            color: margenCustom ? '#818cf8' : '#6b7280',
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
                        } }, "Otro %")),
                margenCustom && (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 } },
                    React.createElement("input", { type: "number", className: "input-field", style: { width: 100 }, value: margenCustomVal, onChange: e => setMargenCustomVal(e.target.value), placeholder: "%", min: 0, max: 99 }),
                    margenCustomVal && (React.createElement("span", { style: { fontSize: 12, color: '#22c55e' } },
                        "\u2192 ",
                        (100 / (1 - parseFloat(margenCustomVal) / 100)).toFixed(2),
                        "x"))))),
            React.createElement("div", { style: { marginBottom: 14 } },
                React.createElement("label", { style: { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 } }, "Dividir precio por (ej: 100 para precio por metro)"),
                React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                    React.createElement("input", { type: "number", min: 1, className: "input-field", style: { width: 100 }, value: divisor, onChange: e => setDivisor(Math.max(1, parseInt(e.target.value) || 1)) }),
                    divisor > 1 && React.createElement("span", { style: { fontSize: 12, color: '#22c55e' } },
                        "\u00F7 ",
                        divisor,
                        " = precio unitario"))),
            codigoProv && (() => {
                const found = buscarEnProveedores(codigoProv);
                if (!found)
                    return null;
                const pv = calcPrecioVenta(found.precio, margenFinal, data.margenes);
                return (React.createElement("div", { style: { background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between' } },
                    React.createElement("span", { style: { fontSize: 13, color: '#6b7280' } }, "Precio venta:"),
                    React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: '#22c55e' } },
                        fmt(pv),
                        divisor > 1 ? ` (${fmt(pv / divisor)} c/u)` : '')));
            })(),
            React.createElement("button", { className: "btn-primary", style: { width: '100%', justifyContent: 'center' }, onClick: agregarProducto },
                React.createElement(Icon, { name: editIdx !== null ? 'check' : 'plus', size: 16 }),
                editIdx !== null ? 'Guardar cambios' : 'Agregar producto')),
        React.createElement("div", { className: "card" },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } },
                React.createElement("div", null,
                    React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, "Mis Precios"),
                    React.createElement("div", { style: { fontSize: 12, color: '#6b7280', marginTop: 2 } },
                        data.misProductos.length,
                        " productos")),
                data.misProductos.length > 0 && (React.createElement("button", { className: "btn-ghost", style: { padding: '8px 12px', fontSize: 13 }, onClick: exportar },
                    React.createElement(Icon, { name: "download", size: 14 }),
                    " Excel"))),
            data.misProductos.length > 0 && (React.createElement("div", { style: { position: 'relative', marginBottom: 12 } },
                React.createElement("div", { style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' } },
                    React.createElement(Icon, { name: "search", size: 16 })),
                React.createElement("input", { className: "input-field", style: { paddingLeft: 38 }, placeholder: "Buscar por REF, cod proveedor o descripci\u00F3n...", value: busqueda, onChange: e => setBusqueda(e.target.value) }))),
            filtrados.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '40px 20px', color: '#374151' } },
                React.createElement(Icon, { name: "tag", size: 40 }),
                React.createElement("div", { style: { marginTop: 12, fontSize: 14, color: '#6b7280' } }, data.misProductos.length === 0 ? 'Todavía no agregaste productos' : 'Sin resultados'))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, filtrados.map((p, i) => {
                const pv = calcPrecioVenta(p.precioCosto, p.margen, data.margenes);
                const foto = data.fotos[p.codigoRef];
                const margenLabel = typeof p.margen === 'number'
                    ? `${p.margen}% ✎`
                    : `${MARGEN_LABELS[p.margen] || p.margen} (${data.margenes[p.margen]}%)`;
                return (React.createElement("div", { key: i, onClick: () => setPhotoModal({ codigoRef: p.codigoRef, descripcion: p.descripcion }), style: { background: '#1e2230', borderRadius: 12, border: '1px solid #1e2535', padding: '12px 14px', cursor: 'pointer' } },
                    React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                        foto && React.createElement("img", { src: foto, alt: "", style: { width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 } }),
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
                                React.createElement("span", { style: { fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 } }, p.codigoRef),
                                React.createElement("span", { style: { fontSize: 11, color: '#4b5563' } }, p.codigoProv),
                                React.createElement("span", { className: "badge", style: { background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: 10 } }, margenLabel)),
                            React.createElement("div", { style: { fontSize: 13, color: '#cbd5e1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.descripcion),
                            React.createElement("div", { style: { fontSize: 12, color: '#6b7280', marginTop: 2 } },
                                "Costo: ",
                                fmt(p.precioCosto),
                                " \u2192",
                                ' ',
                                React.createElement("span", { style: { color: '#22c55e', fontWeight: 700 } },
                                    fmt(pv),
                                    p.divisor && p.divisor > 1 ? ` (${fmt(pv / p.divisor)} c/u)` : ''))),
                        React.createElement("div", { style: { display: 'flex', gap: 6 }, onClick: e => e.stopPropagation() },
                            React.createElement("button", { onClick: () => editar(data.misProductos.indexOf(p)), style: { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' } },
                                React.createElement(Icon, { name: "settings", size: 14 })),
                            React.createElement("button", { onClick: () => eliminar(data.misProductos.indexOf(p)), style: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' } },
                                React.createElement(Icon, { name: "trash", size: 14 }))))));
            })))),
        scanBarcode && (React.createElement(Scanner, { onResult: code => { setScanBarcode(false); setCodigoProv(code.toUpperCase()); }, onClose: () => setScanBarcode(false) })),
        photoModal && (React.createElement("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }, onClick: () => setPhotoModal(null) },
            React.createElement("div", { style: { background: '#1e2230', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 }, onClick: e => e.stopPropagation() },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 4 } }, photoModal.descripcion),
                React.createElement("div", { style: { fontSize: 12, color: '#818cf8', fontFamily: 'monospace', marginBottom: 16 } }, photoModal.codigoRef),
                data.fotos[photoModal.codigoRef] ? (React.createElement("img", { src: data.fotos[photoModal.codigoRef], alt: "", style: { width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 280, objectFit: 'contain', background: '#111' } })) : (React.createElement("div", { style: { background: '#111827', borderRadius: 12, height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#6b7280', gap: 8 } },
                    React.createElement(Icon, { name: "camera", size: 40 }),
                    React.createElement("div", { style: { fontSize: 13 } }, "Sin foto cargada"))),
                React.createElement("label", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 8 } },
                    React.createElement(Icon, { name: "camera", size: 16 }),
                    data.fotos[photoModal.codigoRef] ? 'Cambiar foto' : 'Cargar foto',
                    React.createElement("input", { type: "file", accept: "image/*", capture: "environment", style: { display: 'none' }, onChange: e => {
                            const file = e.target.files?.[0];
                            if (!file)
                                return;
                            const reader = new FileReader();
                            reader.onload = ev => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const max = 700;
                                    const ratio = Math.min(max / img.width, max / img.height, 1);
                                    canvas.width = img.width * ratio;
                                    canvas.height = img.height * ratio;
                                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                                    const compressed = canvas.toDataURL('image/jpeg', 0.75);
                                    setData(d => ({ ...d, fotos: { ...d.fotos, [photoModal.codigoRef]: compressed } }));
                                    showToast('Foto guardada', 'success');
                                };
                                img.src = ev.target.result;
                            };
                            reader.readAsDataURL(file);
                        } })),
                data.fotos[photoModal.codigoRef] && (React.createElement("button", { className: "btn-danger", style: { width: '100%', justifyContent: 'center', marginBottom: 8 }, onClick: () => { if (!window.confirm('Eliminar foto?'))
                        return; setData(d => { const f = { ...d.fotos }; delete f[photoModal.codigoRef]; return { ...d, fotos: f }; }); showToast('Foto eliminada', 'info'); } }, "Eliminar foto")),
                React.createElement("button", { className: "btn-ghost", style: { width: '100%', justifyContent: 'center' }, onClick: () => setPhotoModal(null) }, "Cerrar"))))));
}


// ── src/tabs/TabStock.tsx ──
function TabStock({ data, setData, showToast }) {
    const [busqueda, setBusqueda] = React.useState('');
    const [scanning, setScanning] = React.useState(false);
    const [editRef, setEditRef] = React.useState(null);
    const productos = (data.misProductos || []).map(p => {
        const s = (data.stock || {})[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
        const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
        return { ...p, stock: s, actual };
    }).filter(p => !busqueda ||
        p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()));
    const bajoMinimo = productos.filter(p => p.stock.minimo > 0 && p.actual < p.stock.minimo);
    const updateStock = (ref, field, val) => {
        setData(d => {
            const cur = (d.stock || {})[ref] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
            return { ...d, stock: { ...d.stock, [ref]: { ...cur, [field]: Math.maxval } } };
        });
    };
    const agregarAPedido = (p) => {
        if ((data.pedidos || []).find(x => x.codigoRef === p.codigoRef)) {
            showToast('Ya está en pedidos', 'info');
            return;
        }
        setData(d => ({
            ...d,
            pedidos: [...(d.pedidos || []), {
                    codigoRef: p.codigoRef, codigoProv: p.codigoProv || '',
                    descripcion: p.descripcion, cantidad: 1,
                    proveedor: p.proveedor || '', precioCosto: p.precioCosto || 0,
                }]
        }));
        showToast('Agregado a pedidos', 'success');
    };
    return (React.createElement("div", null,
        bajoMinimo.length > 0 && (React.createElement("div", { style: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 } },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 6 } },
                React.createElement(Icon, { name: "alert", size: 16 }),
                " ",
                bajoMinimo.length,
                " producto(s) bajo m\u00EDnimo"),
            bajoMinimo.map(p => (React.createElement("div", { key: p.codigoRef, style: { fontSize: 12, color: '#fca5a5', marginTop: 4 } },
                "\u2022 ",
                p.codigoRef,
                " \u2014 ",
                p.descripcion,
                " (",
                p.actual,
                "/",
                p.stock.minimo,
                ")"))))),
        React.createElement("div", { className: "card" },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } },
                React.createElement("div", null,
                    React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, "Stock"),
                    React.createElement("div", { style: { fontSize: 12, color: '#6b7280', marginTop: 2 } },
                        data.misProductos.length,
                        " productos")),
                React.createElement("button", { className: "btn-ghost", style: { padding: '8px 12px' }, onClick: () => setScanning(true) },
                    React.createElement(Icon, { name: "camera", size: 18 }))),
            React.createElement("div", { style: { position: 'relative', marginBottom: 14 } },
                React.createElement("div", { style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' } },
                    React.createElement(Icon, { name: "search", size: 16 })),
                React.createElement("input", { className: "input-field", style: { paddingLeft: 38 }, placeholder: "Buscar producto...", value: busqueda, onChange: e => setBusqueda(e.target.value) })),
            productos.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '40px 20px', color: '#6b7280' } },
                React.createElement(Icon, { name: "box", size: 40 }),
                React.createElement("div", { style: { marginTop: 12, fontSize: 14 } }, "Sin productos"))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, productos.map(p => {
                const bajo = p.stock.minimo > 0 && p.actual < p.stock.minimo;
                const foto = data.fotos[p.codigoRef];
                const inPedido = (data.pedidos || []).find(x => x.codigoRef === p.codigoRef);
                const isEdit = editRef === p.codigoRef;
                return (React.createElement("div", { key: p.codigoRef, style: { background: '#1e2230', borderRadius: 12, border: `1px solid ${bajo ? 'rgba(239,68,68,0.4)' : '#1e2535'}`, overflow: 'hidden' } },
                    React.createElement("div", { style: { padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }, onClick: () => setEditRef(isEdit ? null : p.codigoRef) },
                        foto && React.createElement("img", { src: foto, alt: "", style: { width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 } }),
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { display: 'flex', gap: 6, alignItems: 'center' } },
                                React.createElement("span", { style: { fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 } }, p.codigoRef),
                                p.codigoProv && React.createElement("span", { style: { fontSize: 11, color: '#4b5563' } }, p.codigoProv),
                                bajo && React.createElement("span", { className: "badge", style: { background: 'rgba(239,68,68,0.2)', color: '#ef4444' } }, "\u26A0 Bajo m\u00EDn.")),
                            React.createElement("div", { style: { fontSize: 13, color: '#cbd5e1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.descripcion)),
                        React.createElement("div", { style: { textAlign: 'right', flexShrink: 0 } },
                            React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: bajo ? '#ef4444' : '#f1f5f9' } }, p.actual),
                            p.stock.minimo > 0 && React.createElement("div", { style: { fontSize: 11, color: '#6b7280' } },
                                "m\u00EDn: ",
                                p.stock.minimo))),
                    isEdit && (React.createElement("div", { style: { borderTop: '1px solid #111827', padding: '12px 14px', background: '#161b27' } },
                        React.createElement("div", { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 } }, ['inicial', 'entradas', 'salidas', 'minimo'].map(field => (React.createElement("div", { key: field, style: { flex: 1, minWidth: 70 } },
                            React.createElement("label", { style: { fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase' } }, field),
                            React.createElement("input", { type: "number", min: 0, value: p.stock[field] || 0, onChange: e => updateStock(p.codigoRef, field, parseInt(e.target.value) || 0), style: { width: '100%', height: 36, borderRadius: 8, background: '#1e2230', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' } }))))),
                        React.createElement("button", { onClick: () => agregarAPedido(p), style: { width: '100%', padding: '8px', borderRadius: 8, background: inPedido ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${inPedido ? '#22c55e' : '#6366f1'}`, color: inPedido ? '#22c55e' : '#818cf8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 } }, inPedido ? '✓ En pedidos' : '+ Pedir')))));
            })))),
        scanning && (React.createElement(Scanner, { onResult: code => { setScanning(false); setBusqueda(code.toUpperCase()); }, onClose: () => setScanning(false) }))));
}


// ── src/tabs/TabVentas.tsx ──
function TabVentas({ data, setData, showToast }) {
    const [expandedId, setExpandedId] = React.useState(null);
    const ventas = [...(data.ventas || [])].reverse();
    const totalHoy = () => {
        const hoy = new Date().toLocaleDateString('es-AR');
        return (data.ventas || []).filter(v => v.fecha === hoy).reduce((s, v) => s + v.total, 0);
    };
    const borrarVenta = (id) => {
        if (!window.confirm('Borrar esta venta?'))
            return;
        setData(d => ({ ...d, ventas: (d.ventas || []).filter(v => v.id !== id) }));
        showToast('Venta eliminada', 'info');
    };
    const borrarTodo = () => {
        if (!window.confirm('Borrar TODAS las ventas? Esta acción no se puede deshacer.'))
            return;
        setData(d => ({ ...d, ventas: [] }));
        showToast('Historial limpiado', 'info');
    };
    const exportar = () => {
        const w = window;
        if (!w.XLSX)
            return;
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
    const fmt = (n) => '$' + Math.round(n).toLocaleString('es-AR');
    return (React.createElement("div", null,
        React.createElement("div", { className: "card", style: { marginBottom: 12 } },
            React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 13, color: '#6b7280' } }, "Ventas hoy"),
                    React.createElement("div", { style: { fontSize: 28, fontWeight: 700, color: '#22c55e' } }, fmt(totalHoy()))),
                React.createElement("div", { style: { textAlign: 'right' } },
                    React.createElement("div", { style: { fontSize: 13, color: '#6b7280' } }, "Total registros"),
                    React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: '#f1f5f9' } }, data.ventas?.length || 0)))),
        React.createElement("div", { className: "card" },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } },
                React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, "Historial de ventas"),
                React.createElement("div", { style: { display: 'flex', gap: 8 } }, ventas.length > 0 && (React.createElement(React.Fragment, null,
                    React.createElement("button", { className: "btn-ghost", style: { padding: '8px 12px', fontSize: 13 }, onClick: exportar },
                        React.createElement(Icon, { name: "download", size: 14 }),
                        " Excel"),
                    React.createElement("button", { className: "btn-danger", style: { padding: '8px 12px', fontSize: 13 }, onClick: borrarTodo },
                        React.createElement(Icon, { name: "trash", size: 14 })))))),
            ventas.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '50px 20px', color: '#6b7280' } },
                React.createElement(Icon, { name: "download", size: 44 }),
                React.createElement("div", { style: { marginTop: 14, fontSize: 15 } }, "No hay ventas registradas"),
                React.createElement("div", { style: { fontSize: 13, marginTop: 6 } }, "Las ventas de la Calculadora aparecen ac\u00E1"))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, ventas.map(v => (React.createElement("div", { key: v.id, style: { background: '#1e2230', borderRadius: 12, border: '1px solid #1e2535', overflow: 'hidden' } },
                React.createElement("div", { style: { padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }, onClick: () => setExpandedId(expandedId === v.id ? null : v.id) },
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("div", { style: { fontSize: 13, color: '#94a3b8' } },
                            v.fecha,
                            " \u00B7 ",
                            v.hora,
                            " \u00B7 ",
                            v.items.length,
                            " producto(s)"),
                        React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: '#22c55e', marginTop: 2 } }, fmt(v.total))),
                    React.createElement("button", { onClick: e => { e.stopPropagation(); borrarVenta(v.id); }, style: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' } },
                        React.createElement(Icon, { name: "trash", size: 13 }))),
                expandedId === v.id && (React.createElement("div", { style: { borderTop: '1px solid #111827', padding: '8px 14px 12px' } }, v.items.map((item, i) => (React.createElement("div", { key: i, style: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: i < v.items.length - 1 ? '1px solid #1e2535' : 'none' } },
                    React.createElement("span", { style: { color: '#94a3b8' } },
                        item.cantidad,
                        "x ",
                        item.descripcion),
                    React.createElement("span", { style: { color: '#22c55e', fontWeight: 600 } }, fmt(item.precioVenta * item.cantidad)))))))))))))));
}


// ── src/tabs/TabPedidos.tsx ──
function TabPedidos({ data, setData, showToast }) {
    const [vistaHistorial, setVistaHistorial] = React.useState(false);
    const [busqueda, setBusqueda] = React.useState('');
    const [busqAgregar, setBusqAgregar] = React.useState('');
    const [showAgregar, setShowAgregar] = React.useState(false);
    const [ordenActiva, setOrdenActiva] = React.useState(null);
    const pedidos = data.pedidos || [];
    const historial = [...(data.pedidosHistorial || [])].reverse();
    const fmt = fmtPesoInt;
    const totalGeneral = pedidos.reduce((s, p) => s + (p.precioCosto || 0) * (p.cantidad || 1), 0);
    // Group by proveedor name
    const porProveedor = {};
    pedidos.forEach(p => {
        let provName = p.proveedor;
        if (!provName && p.codigoProv) {
            const found = (data.proveedores || []).find(pv => pv.productos?.find(x => x.codigo === p.codigoProv));
            if (found)
                provName = found.nombre;
        }
        const key = provName || p.codigoProv || 'Sin proveedor';
        if (!porProveedor[key])
            porProveedor[key] = [];
        porProveedor[key].push(p);
    });
    const bajoMinimo = (data.misProductos || []).filter(p => {
        const s = (data.stock || {})[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
        const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
        return s.minimo > 0 && actual < s.minimo && !pedidos.find(x => x.codigoRef === p.codigoRef);
    });
    const resultadosAgregar = busqAgregar.length > 1 ? (() => {
        const q = busqAgregar.toLowerCase();
        return (data.misProductos || []).filter(p => (p.codigoRef || '').toLowerCase().includes(q) ||
            (p.codigoProv || '').toLowerCase().includes(q) ||
            (p.descripcion || '').toLowerCase().includes(q)).slice30;
    })() : [];
    const quitar = (ref) => setData(d => ({ ...d, pedidos: (d.pedidos || []).filter(x => (x.codigoRef || x.codigoProv) !== ref) }));
    const cambiarCant = (ref, delta) => setData(d => ({
        ...d, pedidos: (d.pedidos || []).map(x => (x.codigoRef || x.codigoProv) === ref ? { ...x, cantidad: Math.max(1, (x.cantidad || 1) + delta) } : x)
    }));
    const agregarBajoMinimo = () => {
        const nuevos = bajoMinimo.map(p => {
            const s = (data.stock || {})[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
            const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
            return { codigoRef: p.codigoRef, codigoProv: p.codigoProv || '', descripcion: p.descripcion, cantidad: Math.max(1, (s.minimo || 1) - actual), proveedor: p.proveedor || '', precioCosto: p.precioCosto || 0 };
        });
        setData(d => ({ ...d, pedidos: [...(d.pedidos || []), ...nuevos] }));
        showToast(`${nuevos.length} productos agregados`, 'success');
    };
    const exportarProveedor = (prov, items) => {
        const w = window;
        if (!w.XLSX)
            return;
        const ws = w.XLSX.utils.aoa_to_sheet([
            ['Cod Proveedor', 'Descripcion', 'Cantidad', 'Precio Costo'],
            ...items.map(i => [i.codigoProv || i.codigoRef, i.descripcion, i.cantidad || 1, parseFloat((i.precioCosto || 0).toFixed(2))])
        ]);
        ws['!cols'] = [{ wch: 16 }, { wch: 42 }, { wch: 10 }, { wch: 14 }];
        const wb = w.XLSX.utils.book_new();
        w.XLSX.utils.book_append_sheet(wb, ws, 'Pedido');
        w.XLSX.writeFile(wb, `Pedido_${prov.replace(/\s+/g, '_')}.xlsx`);
    };
    const enviarWhatsApp = (prov, items) => {
        const total = items.reduce((s, i) => s + (i.precioCosto || 0) * (i.cantidad || 1), 0);
        const msg = `Pedido para *${prov}*:\n\n${items.map(i => `• ${i.descripcion} — x${i.cantidad}`).join('\n')}\n\n_Total estimado: ${fmt(total)}_`;
        window.open('https://wa.me/?text=' + encodeURIComponent(msg));
    };
    const enviarPedido = (prov, items) => {
        if (!window.confirm(`Marcar pedido a ${prov} como ENVIADO?`))
            return;
        const orden = {
            id: Date.now(), proveedor: prov,
            items: items.map(i => ({ ...i, cantRecibida: null })),
            estado: 'enviado', fechaEnviado: todayStr(), horaEnviado: nowStr(),
            totalEstimado: items.reduce((s, i) => s + (i.precioCosto || 0) * (i.cantidad || 1), 0),
        };
        setData(d => {
            const newPedidos = (d.pedidos || []).filter(x => {
                const xProv = x.proveedor || (data.proveedores.find(pv => pv.productos?.find(pr => pr.codigo === x.codigoProv))?.nombre) || x.codigoProv || 'Sin proveedor';
                return xProv !== prov;
            });
            const newHist = [...(d.pedidosHistorial || []), orden];
            saveToFirebase('pedidosHistorial', newHist);
            return { ...d, pedidos: newPedidos, pedidosHistorial: newHist };
        });
        exportarProveedor(prov, items);
        showToast(`Pedido enviado a ${prov}`, 'success');
    };
    const RecepcionModal = ({ orden }) => {
        const [cantidades, setCantidades] = React.useState(Object.fromEntries(orden.items.map(i => [i.codigoRef || i.codigoProv, i.cantidad || 1])));
        const confirmar = () => {
            if (!window.confirm('Confirmar recepción? Se actualizará el stock.'))
                return;
            setData(d => {
                const newStock = { ...d.stock };
                orden.items.forEach(item => {
                    const cant = cantidades[item.codigoRef || item.codigoProv] || 0;
                    if (cant > 0 && item.codigoRef) {
                        const cur = newStock[item.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
                        newStock[item.codigoRef] = { ...cur, entradas: (cur.entradas || 0) + cant };
                    }
                });
                const newHist = (d.pedidosHistorial || []).map(o => o.id === orden.id
                    ? { ...o, estado: 'recibido', fechaRecibido: todayStr(), items: o.items.map(i => ({ ...i, cantRecibida: cantidades[i.codigoRef || i.codigoProv] || 0 })) }
                    : o);
                saveToFirebase('pedidosHistorial', newHist);
                return { ...d, stock: newStock, pedidosHistorial: newHist };
            });
            showToast('Stock actualizado!', 'success');
            setOrdenActiva(null);
        };
        return (React.createElement("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }, onClick: () => setOrdenActiva(null) },
            React.createElement("div", { style: { background: '#1e2230', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }, onClick: e => e.stopPropagation() },
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: '#f1f5f9' } },
                            "Recepci\u00F3n \u2014 ",
                            orden.proveedor),
                        React.createElement("div", { style: { fontSize: 12, color: '#6b7280', marginTop: 2 } }, "Ajust\u00E1 las cantidades recibidas")),
                    React.createElement("button", { onClick: () => setOrdenActiva(null), style: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' } },
                        React.createElement(Icon, { name: "x", size: 20 }))),
                React.createElement("div", { style: { overflowY: 'auto', flex: 1, marginBottom: 16 } }, orden.items.map((item, i) => (React.createElement("div", { key: i, style: { padding: '10px 0', borderBottom: '1px solid #111827', display: 'flex', alignItems: 'center', gap: 10 } },
                    React.createElement("div", { style: { flex: 1 } },
                        React.createElement("div", { style: { fontSize: 12, color: '#818cf8', fontFamily: 'monospace' } }, item.codigoRef || item.codigoProv),
                        React.createElement("div", { style: { fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, item.descripcion)),
                    React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } },
                        React.createElement("span", { style: { fontSize: 11, color: '#6b7280' } },
                            "Ped: ",
                            item.cantidad),
                        React.createElement("button", { onClick: () => setCantidades(c => ({ ...c, [item.codigoRef || item.codigoProv]: Math.max(0, (c[item.codigoRef || item.codigoProv] || 0) - 1) })), style: { width: 26, height: 26, borderRadius: 6, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "\u2212"),
                        React.createElement("input", { type: "number", min: 0, value: cantidades[item.codigoRef || item.codigoProv] || 0, onChange: e => setCantidades(c => ({ ...c, [item.codigoRef || item.codigoProv]: Math.max(0, parseInt(e.target.value) || 0) })), style: { width: 48, height: 26, borderRadius: 6, background: '#111827', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' } }),
                        React.createElement("button", { onClick: () => setCantidades(c => ({ ...c, [item.codigoRef || item.codigoProv]: (c[item.codigoRef || item.codigoProv] || 0) + 1 })), style: { width: 26, height: 26, borderRadius: 6, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "+")))))),
                React.createElement("button", { onClick: confirmar, style: { background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 12, padding: 13, width: '100%', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } },
                    React.createElement(Icon, { name: "check", size: 16 }),
                    " Confirmar y actualizar stock"))));
    };
    const filteredProvs = Object.keys(porProveedor).filter(prov => !busqueda || porProveedor[prov].some(p => (p.codigoRef || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())));
    return (React.createElement("div", null,
        React.createElement("div", { className: "card" },
            React.createElement("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 } },
                React.createElement("div", null,
                    React.createElement("div", { className: "section-title", style: { marginBottom: 0 } }, "Pedidos"),
                    React.createElement("div", { style: { fontSize: 13, color: '#6b7280', marginTop: 4 } },
                        pedidos.length,
                        " producto(s) en borrador")),
                React.createElement("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
                    React.createElement("button", { onClick: () => setVistaHistorial(v => !v), style: { background: vistaHistorial ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', border: '1px solid #6366f1', color: '#818cf8', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 } }, vistaHistorial ? 'Ver Borrador' : `Historial (${historial.length})`),
                    !vistaHistorial && bajoMinimo.length > 0 && (React.createElement("button", { onClick: agregarBajoMinimo, style: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 } },
                        React.createElement(Icon, { name: "alert", size: 13 }),
                        " ",
                        bajoMinimo.length,
                        " bajo m\u00EDnimo")),
                    !vistaHistorial && pedidos.length > 0 && (React.createElement("button", { onClick: () => { if (window.confirm('Limpiar lista?'))
                            setData(d => ({ ...d, pedidos: [] })); }, style: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 } }, "Limpiar")))),
            !vistaHistorial && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: 'flex', gap: 8, marginBottom: 14 } },
                    React.createElement("div", { style: { position: 'relative', flex: 1 } },
                        React.createElement("div", { style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' } },
                            React.createElement(Icon, { name: "search", size: 16 })),
                        React.createElement("input", { className: "input-field", style: { paddingLeft: 38 }, placeholder: "Buscar en pedidos...", value: busqueda, onChange: e => setBusqueda(e.target.value) })),
                    React.createElement("button", { className: "btn-primary", style: { flexShrink: 0, padding: '10px 14px' }, onClick: () => setShowAgregar(true) },
                        React.createElement(Icon, { name: "plus", size: 18 }))),
                pedidos.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '50px 20px', color: '#374151' } },
                    React.createElement(Icon, { name: "box", size: 44 }),
                    React.createElement("div", { style: { marginTop: 14, fontSize: 15, color: '#6b7280' } }, "Lista vac\u00EDa"),
                    React.createElement("div", { style: { fontSize: 12, color: '#4b5563', marginTop: 6 } }, "Us\u00E1 + para agregar o el bot\u00F3n bajo m\u00EDnimo"))) : (React.createElement(React.Fragment, null,
                    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 } }, filteredProvs.map(prov => {
                        const items = porProveedor[prov];
                        const total = items.reduce((s, i) => s + (i.precioCosto || 0) * (i.cantidad || 1), 0);
                        return (React.createElement("div", { key: prov, style: { background: '#161b27', borderRadius: 14, border: '1px solid #1e2535', overflow: 'hidden' } },
                            React.createElement("div", { style: { padding: '12px 16px', borderBottom: '1px solid #111827', background: 'rgba(99,102,241,0.06)' } },
                                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
                                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: '#818cf8' } }, prov),
                                    React.createElement("div", { style: { fontSize: 13, color: '#22c55e', fontWeight: 700 } }, fmt(total))),
                                React.createElement("div", { style: { display: 'flex', gap: 8 } },
                                    React.createElement("button", { onClick: () => exportarProveedor(prov, items), style: { flex: 1, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid #6366f1', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 } },
                                        React.createElement(Icon, { name: "download", size: 12 }),
                                        " Excel"),
                                    React.createElement("button", { onClick: () => enviarWhatsApp(prov, items), style: { flex: 1, background: 'rgba(37,211,102,0.15)', color: '#25d366', border: '1px solid #25d366', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 } }, "WA"),
                                    React.createElement("button", { onClick: () => enviarPedido(prov, items), style: { flex: 2, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 } },
                                        React.createElement(Icon, { name: "check", size: 12 }),
                                        " Enviado"))),
                            items.map((p, i) => (React.createElement("div", { key: p.codigoRef || p.codigoProv || i, style: { padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < items.length - 1 ? '1px solid #111827' : 'none' } },
                                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                                    React.createElement("div", { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                                        React.createElement("span", { style: { fontSize: 12, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 } }, p.codigoRef || p.codigoProv),
                                        p.codigoProv && p.codigoRef && React.createElement("span", { style: { fontSize: 11, color: '#4b5563' } }, p.codigoProv)),
                                    React.createElement("div", { style: { fontSize: 13, color: '#cbd5e1', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.descripcion)),
                                React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                                    React.createElement("button", { onClick: () => cambiarCant(p.codigoRef || p.codigoProv, -1), style: { width: 28, height: 28, borderRadius: 6, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "\u2212"),
                                    React.createElement("input", { type: "number", min: 1, value: p.cantidad || 1, onChange: e => { const ref = p.codigoRef || p.codigoProv; setData(d => ({ ...d, pedidos: (d.pedidos || []).map(x => (x.codigoRef || x.codigoProv) === ref ? { ...x, cantidad: Math.max(1, parseInt(e.target.value) || 1) } : x) })); }, style: { width: 44, height: 28, borderRadius: 6, background: '#1e2230', border: '1px solid #374151', color: '#f1f5f9', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' } }),
                                    React.createElement("button", { onClick: () => cambiarCant(p.codigoRef || p.codigoProv, 1), style: { width: 28, height: 28, borderRadius: 6, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "+"),
                                    React.createElement("button", { onClick: () => quitar(p.codigoRef || p.codigoProv), style: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' } },
                                        React.createElement(Icon, { name: "trash", size: 13 }))))))));
                    })),
                    React.createElement("div", { style: { background: 'linear-gradient(135deg,#1e3a2e,#1a3025)', borderRadius: 14, border: '1px solid #166534', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                        React.createElement("div", { style: { fontSize: 13, color: '#86efac', fontWeight: 600 } }, "Total estimado"),
                        React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: '#22c55e' } }, fmt(totalGeneral))))))),
            vistaHistorial && (historial.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '50px 20px', color: '#374151' } },
                React.createElement(Icon, { name: "download", size: 44 }),
                React.createElement("div", { style: { marginTop: 14, fontSize: 15, color: '#6b7280' } }, "No hay pedidos enviados a\u00FAn"))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, historial.map((orden, i) => (React.createElement("div", { key: orden.id || i, style: { background: '#161b27', borderRadius: 14, border: '1px solid #1e2535', overflow: 'hidden' } },
                React.createElement("div", { style: { padding: '12px 16px', borderBottom: '1px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: '#f1f5f9' } }, orden.proveedor),
                        React.createElement("div", { style: { fontSize: 11, color: '#6b7280', marginTop: 2 } }, orden.estado === 'recibido' ? `Recibido: ${orden.fechaRecibido}` : `Enviado: ${orden.fechaEnviado} ${orden.horaEnviado}`)),
                    React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                        React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: orden.estado === 'recibido' ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)', color: orden.estado === 'recibido' ? '#22c55e' : '#fbbf24' } }, orden.estado === 'recibido' ? '✓ Recibido' : 'Enviado'),
                        orden.estado === 'enviado' && (React.createElement("button", { onClick: () => setOrdenActiva(orden), style: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 } }, "Recibir")))),
                React.createElement("div", { style: { padding: '8px 16px 12px' } },
                    orden.items.slice3.map((item, j) => (React.createElement("div", { key: j, style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', padding: '2px 0' } },
                        React.createElement("span", null,
                            item.cantRecibida != null ? `${item.cantRecibida}/` : '',
                            item.cantidad,
                            "x ",
                            item.descripcion),
                        item.cantRecibida != null && item.cantRecibida < item.cantidad && (React.createElement("span", { style: { color: '#ef4444', fontSize: 11 } },
                            "Falt\u00F3 ",
                            item.cantidad - item.cantRecibida))))),
                    orden.items.length > 3 && React.createElement("div", { style: { fontSize: 11, color: '#4b5563', marginTop: 4 } },
                        "+ ",
                        orden.items.length - 3,
                        " m\u00E1s"))))))))),
        ordenActiva && React.createElement(RecepcionModal, { orden: ordenActiva }),
        showAgregar && (React.createElement("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }, onClick: () => { setShowAgregar(false); setBusqAgregar(''); } },
            React.createElement("div", { style: { background: '#1e2230', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }, onClick: e => e.stopPropagation() },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 12 } }, "Agregar producto al pedido"),
                React.createElement("div", { style: { position: 'relative', marginBottom: 12 } },
                    React.createElement("div", { style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' } },
                        React.createElement(Icon, { name: "search", size: 16 })),
                    React.createElement("input", { className: "input-field", style: { paddingLeft: 38 }, placeholder: "Buscar en Mis Precios...", value: busqAgregar, onChange: e => setBusqAgregar(e.target.value), autoFocus: true })),
                React.createElement("div", { style: { overflowY: 'auto', flex: 1 } }, busqAgregar.length < 2 ? (React.createElement("div", { style: { textAlign: 'center', padding: '30px 20px', color: '#4b5563', fontSize: 13 } }, "Escrib\u00ED al menos 2 caracteres")) : resultadosAgregar.length === 0 ? (React.createElement("div", { style: { textAlign: 'center', padding: '30px 20px', color: '#4b5563', fontSize: 13 } }, "Sin resultados")) : resultadosAgregar.map((p, i) => (React.createElement("div", { key: i, onClick: () => {
                        if ((data.pedidos || []).find(x => x.codigoRef === p.codigoRef)) {
                            showToast('Ya está en pedidos', 'info');
                            return;
                        }
                        setData(d => ({ ...d, pedidos: [...(d.pedidos || []), { codigoRef: p.codigoRef, codigoProv: p.codigoProv || '', descripcion: p.descripcion, cantidad: 1, proveedor: p.proveedor || '', precioCosto: p.precioCosto || 0 }] }));
                        showToast('Agregado: ' + p.descripcion, 'success');
                        setBusqAgregar('');
                    }, style: { padding: '10px 12px', borderRadius: 10, marginBottom: 6, background: '#111827', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' } },
                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                        React.createElement("div", { style: { display: 'flex', gap: 6, alignItems: 'center' } },
                            React.createElement("span", { style: { fontSize: 11, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 } }, p.codigoRef),
                            React.createElement("span", { style: { fontSize: 11, color: '#4b5563' } }, p.codigoProv)),
                        React.createElement("div", { style: { fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.descripcion)),
                    React.createElement("div", { style: { fontSize: 13, color: '#22c55e', fontWeight: 700 } },
                        "$",
                        (p.precioCosto || 0).toFixed(0)))))))))));
}


// ── src/tabs/TabConfig.tsx ──
function TabConfig({ data, setData, showToast }) {
    const [margenes, setMargenes] = React.useState({ ...data.margenes });
    const guardar = () => {
        setData(d => ({ ...d, margenes }));
        showToast('Configuración guardada', 'success');
    };
    const m = data.margenes;
    const mult = (pct) => pct >= 100 ? '∞' : (100 / (100 - pct)).toFixed(2) + 'x';
    return (React.createElement("div", null,
        React.createElement("div", { className: "card" },
            React.createElement("div", { className: "section-title" }, "Configuraci\u00F3n de m\u00E1rgenes"),
            React.createElement("div", { style: { fontSize: 13, color: '#6b7280', marginBottom: 16 } }, "Estos porcentajes se usan para calcular el precio de venta."),
            ['p1', 'p2', 'p3', 'p4'].map((key, i) => (React.createElement("div", { key: key, style: { marginBottom: 16 } },
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
                    React.createElement("label", { style: { fontSize: 13, fontWeight: 600, color: '#f1f5f9' } },
                        "% ",
                        i + 1),
                    React.createElement("span", { style: { fontSize: 12, color: '#818cf8' } },
                        margenes[key],
                        "% \u2192 multiplicador ",
                        mult(margenes[key]))),
                React.createElement("input", { type: "range", min: 1, max: 90, value: margenes[key], onChange: e => setMargenes(m => ({ ...m, [key]: parseInt(e.target.value) })), style: { width: '100%', accentColor: '#6366f1' } }),
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4b5563', marginTop: 2 } },
                    React.createElement("span", null, "1%"),
                    React.createElement("span", null, "90%"))))),
            React.createElement("button", { className: "btn-primary", style: { width: '100%', justifyContent: 'center', marginTop: 8 }, onClick: guardar },
                React.createElement(Icon, { name: "check", size: 16 }),
                " Guardar cambios")),
        React.createElement("div", { className: "card" },
            React.createElement("div", { className: "section-title" }, "Resumen actual"),
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, ['p1', 'p2', 'p3', 'p4'].map((key, i) => (React.createElement("div", { key: key, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#111827', borderRadius: 10 } },
                React.createElement("span", { style: { fontSize: 13, color: '#94a3b8' } },
                    "% ",
                    i + 1),
                React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: '#818cf8' } },
                    m[key],
                    "% = ",
                    mult(m[key])))))),
            React.createElement("div", { style: { fontSize: 12, color: '#4b5563', marginTop: 12, padding: '10px 14px', background: '#111827', borderRadius: 10 } }, "Ejemplo: costo $1.000 con 50% \u2192 venta $2.000 (2x)"))));
}


// ── src/App.tsx ──
const NAV = [
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
    React.useEffect(() => {
        const onAuth = () => setUser(window.__user || null);
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
    if (!user)
        return React.createElement(LoginScreen, { onLogin: () => setUser(window.__user) });
    const tabProps = { data, setData, showToast };
    return (React.createElement("div", { style: { minHeight: '100vh', background: '#0d1117', color: '#f1f5f9', fontFamily: "'Space Grotesk', system-ui, sans-serif" } },
        React.createElement("div", { style: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e2535', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' } },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 } }, "\uD83C\uDFEA"),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: '#f1f5f9' } }, "MiNegocio"),
                    React.createElement("div", { style: { fontSize: 10, color: '#6b7280' } }, "Sistema de Precios"))),
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 } },
                    React.createElement("div", { style: { width: 7, height: 7, borderRadius: '50%', background: syncing ? '#fbbf24' : '#22c55e' } }),
                    React.createElement("span", { style: { color: '#6b7280' } }, syncing ? 'Guardando...' : 'Sincronizado')),
                React.createElement("button", { onClick: () => setMenuOpen(v => !v), style: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 } },
                    React.createElement(Icon, { name: "menu", size: 22 })))),
        React.createElement("div", { style: { padding: '76px 12px 80px', maxWidth: 640, margin: '0 auto' } }, !loaded ? (React.createElement("div", { style: { textAlign: 'center', padding: '80px 20px', color: '#6b7280' } },
            React.createElement("div", { style: { fontSize: 40, marginBottom: 16 } }, "\u26A1"),
            React.createElement("div", null, "Cargando datos..."))) : (React.createElement(React.Fragment, null,
            tab === 'calc' && React.createElement(TabCalculadora, { ...tabProps }),
            tab === 'proveedores' && React.createElement(TabProveedores, { ...tabProps }),
            tab === 'precios' && React.createElement(TabMisPrecios, { ...tabProps }),
            tab === 'stock' && React.createElement(TabStock, { ...tabProps }),
            tab === 'ventas' && React.createElement(TabVentas, { ...tabProps }),
            tab === 'pedidos' && React.createElement(TabPedidos, { ...tabProps }),
            tab === 'config' && React.createElement(TabConfig, { ...tabProps })))),
        React.createElement("div", { style: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(13,17,23,0.98)', borderTop: '1px solid #1e2535', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px' } },
            React.createElement("button", { onClick: () => switchTab('calc'), style: { background: 'none', border: 'none', cursor: 'pointer', color: tab === 'calc' ? '#818cf8' : '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: 'inherit' } },
                React.createElement(Icon, { name: "store", size: 20 }),
                " Calculadora"),
            React.createElement("button", { onClick: () => setMenuOpen(v => !v), style: { background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: 'inherit' } },
                React.createElement(Icon, { name: "menu", size: 20 }),
                " Men\u00FA")),
        menuOpen && (React.createElement(React.Fragment, null,
            React.createElement("div", { onClick: () => setMenuOpen(false), style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 } }),
            React.createElement("div", { style: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1e2230', borderRadius: '20px 20px 0 0', zIndex: 200, padding: '8px 0 8px' } },
                React.createElement("div", { style: { width: 40, height: 4, background: '#374151', borderRadius: 2, margin: '8px auto 12px' } }),
                NAV.map(item => (React.createElement("button", { key: item.id, onClick: () => switchTab(item.id), style: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 20px', background: tab === item.id ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', color: tab === item.id ? '#818cf8' : '#94a3b8', fontFamily: 'inherit', fontSize: 15, fontWeight: tab === item.id ? 600 : 400 } },
                    React.createElement(Icon, { name: item.icon, size: 20 }),
                    item.label,
                    tab === item.id && React.createElement("span", { style: { marginLeft: 'auto', color: '#6366f1' } }, "\u2713")))),
                React.createElement("div", { style: { height: 1, background: '#1e2535', margin: '8px 0' } }),
                React.createElement("button", { onClick: logout, style: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit', fontSize: 15 } },
                    React.createElement(Icon, { name: "x", size: 20 }),
                    " Salir")))),
        React.createElement(Toast, { toast: toast, onClose: () => setToast(null) })));
}


// ── src/main.tsx ──
const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(React.createElement(App, null));
}
