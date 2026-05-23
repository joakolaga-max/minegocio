
// MiNegocio v2.0 - Built 2026-05-23T05:04:36.643Z
const { useState, useEffect, useRef, useCallback } = React;
const { createRoot } = ReactDOM;


const __modules = {};
const __require = (name) => {
  if (name === 'react') return React;
  if (name === 'react-dom' || name === 'react-dom/client') return ReactDOM;
  const key = name.replace(/^\.\//,'').replace(/\.\.\/[^/]+\//g,'').replace(/\.(tsx?|jsx?)$/,'');
  if (__modules[key]) return __modules[key];
  for (const k of Object.keys(__modules)) {
    if (k === key || k.endsWith('/' + key) || k.endsWith(key)) return __modules[k];
  }
  return {};
};

// === src/types.ts ===
(function() {
const exports = {};
const module = { exports };

__modules['types'] = exports;
})();

// === src/lib/utils.ts ===
(function() {
const exports = {};
const module = { exports };
exports.genId = exports.nowStr = exports.todayStr = exports.calcPrecioVenta = exports.fmtPesoInt = exports.fmtPeso = void 0;
const fmtPeso = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0);
exports.fmtPeso = fmtPeso;
const fmtPesoInt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);
exports.fmtPesoInt = fmtPesoInt;
const calcPrecioVenta = (costo, margen, margenes) => {
    const pct = typeof margen === 'number' ? margen : (margenes[margen] ?? 50);
    const m = pct / 100;
    if (m >= 1)
        return costo;
    return costo / (1 - m);
};
exports.calcPrecioVenta = calcPrecioVenta;
const todayStr = () => new Date().toLocaleDateString('es-AR');
exports.todayStr = todayStr;
const nowStr = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
exports.nowStr = nowStr;
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
exports.genId = genId;

__modules['lib/utils'] = exports;
})();

// === src/lib/firebase.ts ===
(function() {
const exports = {};
const module = { exports };
exports.loadFromFirebase = exports.saveToFirebase = void 0;
const saveToFirebase = async (path, data) => {
    const w = window;
    if (w.__fb)
        await w.__fb.save(path, data);
};
exports.saveToFirebase = saveToFirebase;
const loadFromFirebase = async (path) => {
    const w = window;
    if (w.__fb)
        return await w.__fb.load(path);
    return null;
};
exports.loadFromFirebase = loadFromFirebase;

__modules['lib/firebase'] = exports;
})();

// === src/components/Icon.tsx ===
(function() {
const exports = {};
const module = { exports };
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.Icon = Icon;
const react_1 = __importDefault(require("react"));
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
    return (react_1.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: className, style: { flexShrink: 0 } }, d.split(' M').filter(Boolean).map((seg, i) => (react_1.default.createElement("path", { key: i, d: (i === 0 ? '' : 'M') + seg })))));
}

__modules['components/Icon'] = exports;
})();

// === src/components/Toast.tsx ===
(function() {
const exports = {};
const module = { exports };
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
exports.Toast = Toast;
const react_1 = __importStar(require("react"));
const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#22c55e' },
    error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' },
    info: { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#818cf8' },
};
function Toast({ toast, onClose }) {
    (0, react_1.useEffect)(() => {
        if (!toast)
            return;
        const t = setTimeout(onClose, 2800);
        return () => clearTimeout(t);
    }, [toast, onClose]);
    if (!toast)
        return null;
    const c = colors[toast.type];
    return (react_1.default.createElement("div", { style: {
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            zIndex: 500, background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 12, padding: '12px 20px', color: c.text,
            fontSize: 14, fontWeight: 600, maxWidth: '90vw', textAlign: 'center',
            backdropFilter: 'blur(10px)',
        } }, toast.msg));
}

__modules['components/Toast'] = exports;
})();

// === src/components/Modal.tsx ===
(function() {
const exports = {};
const module = { exports };
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.Modal = Modal;
const react_1 = __importDefault(require("react"));
const Icon_1 = __require('./Icon');
function Modal({ title, onClose, children, position = 'center' }) {
    return (react_1.default.createElement("div", { onClick: onClose, style: {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 400, display: 'flex', alignItems: position === 'bottom' ? 'flex-end' : 'center',
            justifyContent: 'center', padding: position === 'bottom' ? 0 : 20,
        } },
        react_1.default.createElement("div", { onClick: e => e.stopPropagation(), style: {
                background: '#1e2230', borderRadius: position === 'bottom' ? '20px 20px 0 0' : 20,
                padding: 20, width: '100%', maxWidth: 500,
                maxHeight: position === 'bottom' ? '85vh' : '90vh',
                display: 'flex', flexDirection: 'column',
            } },
            title && (react_1.default.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
                react_1.default.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: '#f1f5f9' } }, title),
                react_1.default.createElement("button", { onClick: onClose, style: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' } },
                    react_1.default.createElement(Icon_1.Icon, { name: "x", size: 20 })))),
            children)));
}

__modules['components/Modal'] = exports;
})();

// === src/components/Scanner.tsx ===
(function() {
const exports = {};
const module = { exports };
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
exports.Scanner = Scanner;
const react_1 = __importStar(require("react"));
const Icon_1 = __require('./Icon');
function Scanner({ onResult, onClose }) {
    const videoRef = (0, react_1.useRef)(null);
    const cleanupRef = (0, react_1.useRef)(null);
    const startScan = (0, react_1.useCallback)(async () => {
        const video = videoRef.current;
        if (!video)
            return;
        // Try native BarcodeDetector first
        if ('BarcodeDetector' in window) {
            try {
                // Try rear camera first, fall back to any camera
                let stream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { exact: 'environment' } }
                    });
                }
                catch {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' }
                    });
                }
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
        // Fallback to ZXing via cdnjs (allowed domain)
        if (!window.ZXing) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/zxing-js/0.20.0/zxing.min.js';
            script.onerror = () => {
                // Try alternative
                const s2 = document.createElement('script');
                s2.src = 'https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js';
                s2.onload = () => startScan();
                s2.onerror = () => console.warn('ZXing not available');
                document.head.appendChild(s2);
            };
            script.onload = () => startScan();
            document.head.appendChild(script);
            return;
        }
        try {
            const hints = new Map();
            hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
            const reader = new window.ZXing.BrowserMultiFormatReader(hints, 200);
            reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (result, err) => {
                if (result) {
                    onResult(result.getText());
                }
            }).catch((e) => console.warn('Scanner:', e));
            cleanupRef.current = () => { try {
                reader.reset();
            }
            catch (e) { } };
        }
        catch (e) {
            console.warn('Scanner error:', e);
        }
    }, [onResult]);
    react_1.default.useEffect(() => {
        startScan();
        return () => { cleanupRef.current?.(); };
    }, [startScan]);
    return (react_1.default.createElement("div", { style: {
            position: 'fixed', inset: 0, background: '#000', zIndex: 500,
            display: 'flex', flexDirection: 'column',
        } },
        react_1.default.createElement("video", { ref: videoRef, style: { flex: 1, objectFit: 'cover', width: '100%' }, muted: true, playsInline: true, autoPlay: true }),
        react_1.default.createElement("div", { style: {
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 260, height: 160, border: '2px solid #6366f1',
                borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            } }),
        react_1.default.createElement("div", { style: { position: 'absolute', top: 20, right: 20 } },
            react_1.default.createElement("button", { onClick: () => { cleanupRef.current?.(); onClose(); }, style: {
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                    width: 44, height: 44, cursor: 'pointer', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                } },
                react_1.default.createElement(Icon_1.Icon, { name: "x", size: 22 }))),
        react_1.default.createElement("div", { style: {
                position: 'absolute', bottom: 80, width: '100%',
                textAlign: 'center', color: '#94a3b8', fontSize: 14,
            } }, "Apunt\u00E1 la c\u00E1mara al c\u00F3digo de barras")));
}

__modules['components/Scanner'] = exports;
})();

// === src/hooks/useAppData.ts ===
(function() {
const exports = {};
const module = { exports };
exports.useAppData = useAppData;
const firebase_1 = __require('../lib/firebase');
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
const PATHS = ['proveedores', 'misProductos', 'config', 'stock', 'ventas', 'fotos', 'pedidos', 'pedidosHistorial', 'presupuestos'];
function useAppData(user) {
    const [data, setData] = (0, react_1.useState)(DEFAULT_DATA);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [syncing, setSyncing] = (0, react_1.useState)(false);
    const prevRef = (0, react_1.useRef)(null);
    const loadAll = (0, react_1.useCallback)(async () => {
        setSyncing(true);
        try {
            const [provData, misData, config, stockData, ventasData, fotosData, pedidosData, pedHistData, presupuestosData] = await Promise.all(PATHS.map(p => (0, firebase_1.loadFromFirebase)(p)));
            setData(d => {
                const newData = {
                    ...d,
                    proveedores: provData?.length ? provData : d.proveedores,
                    misProductos: misData ?? d.misProductos,
                    margenes: config?.margenes ?? d.margenes,
                    empresa: config?.empresa ?? d.empresa ?? '',
                    telefono: config?.telefono ?? d.telefono ?? '',
                    direccion: config?.direccion ?? d.direccion ?? '',
                    stock: stockData ?? d.stock,
                    ventas: ventasData ?? d.ventas,
                    fotos: fotosData ?? d.fotos,
                    pedidos: pedidosData ?? d.pedidos,
                    pedidosHistorial: pedHistData ?? d.pedidosHistorial,
                    presupuestos: presupuestosData ?? d.presupuestos,
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
    (0, react_1.useEffect)(() => {
        if (user) {
            setLoaded(false);
            loadAll();
        }
        else {
            setLoaded(false);
        }
    }, [user, loadAll]);
    // Save changes (debounced)
    (0, react_1.useEffect)(() => {
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
                saves.push((0, firebase_1.saveToFirebase)('proveedores', data.proveedores));
            if (s('misProductos'))
                saves.push((0, firebase_1.saveToFirebase)('misProductos', data.misProductos));
            const sAny = (key) => JSON.stringify(data[key]) !== JSON.stringify(prev[key]);
            if (s('margenes') || s('misProductos') || sAny('empresa') || sAny('telefono') || sAny('direccion'))
                saves.push((0, firebase_1.saveToFirebase)('config', {
                    margenes: data.margenes,
                    empresa: data.empresa ?? '',
                    telefono: data.telefono ?? '',
                    direccion: data.direccion ?? '',
                }));
            if (s('stock'))
                saves.push((0, firebase_1.saveToFirebase)('stock', data.stock));
            if (s('ventas'))
                saves.push((0, firebase_1.saveToFirebase)('ventas', data.ventas));
            if (s('fotos'))
                saves.push((0, firebase_1.saveToFirebase)('fotos', data.fotos));
            if (s('pedidos'))
                saves.push((0, firebase_1.saveToFirebase)('pedidos', data.pedidos));
            if (s('pedidosHistorial'))
                saves.push((0, firebase_1.saveToFirebase)('pedidosHistorial', data.pedidosHistorial));
            if (s('presupuestos'))
                saves.push((0, firebase_1.saveToFirebase)('presupuestos', data.presupuestos));
            if (saves.length > 0)
                await Promise.all(saves);
            prevRef.current = data;
            setSyncing(false);
        }, 1200);
        return () => clearTimeout(t);
    }, [data, loaded, user]);
    return { data, setData, loaded, syncing };
}

__modules['hooks/useAppData'] = exports;
})();

// === src/tabs/TabCalculadora.tsx ===
(function() {
const exports = {};
const module = { exports };
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
exports.TabCalculadora = TabCalculadora;
const react_1 = __importStar(require("react"));
const utils_1 = __require('../lib/utils');
const Icon_1 = __require('../components/Icon');
const Scanner_1 = __require('../components/Scanner');
const Presupuesto_1 = __require('../components/Presupuesto');
function TabCalculadora({ data, setData, showToast }) {
    const [items, setItems] = (0, react_1.useState)([]);
    const [busqueda, setBusqueda] = (0, react_1.useState)('');
    const [scanning, setScanning] = (0, react_1.useState)(false);
    const [showPresupuesto, setShowPresupuesto] = (0, react_1.useState)(false);
    const [showSuggestions, setShowSuggestions] = (0, react_1.useState)(false);
    const [showCustom, setShowCustom] = (0, react_1.useState)(false);
    const [customDesc, setCustomDesc] = (0, react_1.useState)('');
    const [customPrecio, setCustomPrecio] = (0, react_1.useState)('');
    const inputRef = (0, react_1.useRef)(null);
    const total = items.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0);
    const sugerencias = busqueda.length > 0
        ? (data.misProductos || []).filter(p => p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.codigoProv || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.codigoBarras || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())).slice(0, 8)
        : [];
    const agregarProducto = (0, react_1.useCallback)((ref) => {
        const p = (data.misProductos || []).find(x => x.codigoRef.toLowerCase() === ref.toLowerCase() ||
            (x.codigoProv || '').toLowerCase() === ref.toLowerCase() ||
            (x.codigoBarras || '').toLowerCase() === ref.toLowerCase());
        if (!p) {
            showToast('Producto no encontrado', 'error');
            return;
        }
        const pv = (0, utils_1.calcPrecioVenta)(p.precioCosto, p.margen, data.margenes);
        setItems(prev => {
            const idx = prev.findIndex(i => i.codigoRef === p.codigoRef);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
                return next;
            }
            return [...prev, {
                    codigoRef: p.codigoRef,
                    descripcion: p.descripcion,
                    codigoProv: p.codigoProv || '',
                    precioCosto: p.precioCosto,
                    precioVenta: pv,
                    cantidad: 1,
                    margen: p.margen,
                    proveedor: p.proveedor || '',
                    divisor: p.divisor || 1,
                }];
        });
        setBusqueda('');
        setShowSuggestions(false);
        showToast(`${p.codigoRef} agregado`, 'success');
    }, [data.misProductos, data.margenes, showToast]);
    const updateQty = (idx, delta) => {
        setItems(prev => {
            const next = [...prev];
            const newQty = next[idx].cantidad + delta;
            if (newQty <= 0)
                return next.filter((_, i) => i !== idx);
            next[idx] = { ...next[idx], cantidad: newQty };
            return next;
        });
    };
    const removeItem = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };
    const registrarVenta = () => {
        if (items.length === 0)
            return;
        const venta = {
            id: Date.now().toString(36),
            fecha: new Date().toLocaleDateString('es-AR'),
            hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            items: items.map(i => ({ codigoRef: i.codigoRef, descripcion: i.descripcion, cantidad: i.cantidad, precioVenta: i.precioVenta })),
            total,
        };
        setData(d => ({ ...d, ventas: [venta, ...(d.ventas || [])] }));
        setItems([]);
        showToast('Venta registrada', 'success');
    };
    return (react_1.default.createElement("div", { className: "card" },
        react_1.default.createElement("div", { className: "section-title" }, "Calculadora"),
        react_1.default.createElement("div", { style: { position: 'relative', marginBottom: 12 } },
            react_1.default.createElement("div", { style: { display: 'flex', gap: 8 } },
                react_1.default.createElement("div", { style: { position: 'relative', flex: 1 } },
                    react_1.default.createElement("div", { style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' } },
                        react_1.default.createElement(Icon_1.Icon, { name: "search", size: 16 })),
                    react_1.default.createElement("input", { ref: inputRef, className: "input-field", style: { paddingLeft: 38 }, placeholder: "Buscar por REF, cod proveedor o c\u00F3digo de barras...", value: busqueda, onChange: e => { setBusqueda(e.target.value); setShowSuggestions(true); }, onKeyDown: e => { if (e.key === 'Enter' && sugerencias.length > 0)
                            agregarProducto(sugerencias[0].codigoRef); } })),
                react_1.default.createElement("button", { className: "btn-ghost", style: { padding: '8px 12px', flexShrink: 0 }, onClick: () => setScanning(true) },
                    react_1.default.createElement(Icon_1.Icon, { name: "camera", size: 18 })),
                react_1.default.createElement("button", { className: "btn-ghost", style: { padding: '8px 12px', flexShrink: 0, color: '#818cf8' }, onClick: () => { setCustomDesc(''); setCustomPrecio(''); setShowCustom(true); } },
                    react_1.default.createElement("span", { style: { fontSize: 18, fontWeight: 700 } }, "$+"))),
            showSuggestions && sugerencias.length > 0 && (react_1.default.createElement("div", { style: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e2230', border: '1px solid #374151', borderRadius: 12, zIndex: 50, maxHeight: 300, overflowY: 'auto', marginTop: 4 } }, sugerencias.map((p, i) => {
                const pv = (0, utils_1.calcPrecioVenta)(p.precioCosto, p.margen, data.margenes);
                const s = (data.stock || {})[p.codigoRef];
                const actual = s ? (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0) : 0;
                const inPedido = (data.pedidos || []).find(x => x.codigoRef === p.codigoRef);
                return (react_1.default.createElement("div", { key: i, onClick: () => agregarProducto(p.codigoRef), style: { padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 } },
                    react_1.default.createElement("div", { style: { minWidth: 0 } },
                        react_1.default.createElement("div", { style: { fontSize: 13, color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 } }, p.codigoRef),
                        react_1.default.createElement("div", { style: { fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.descripcion),
                        actual <= 0 && (react_1.default.createElement("span", { style: { fontSize: 10, color: inPedido ? '#fbbf24' : '#ef4444', fontWeight: 700 } }, inPedido ? '● En pedido' : '● Sin stock'))),
                    react_1.default.createElement("div", { style: { fontWeight: 700, color: '#22c55e', fontSize: 13, flexShrink: 0 } }, (0, utils_1.fmtPeso)(pv))));
            })))),
        items.length === 0 ? (react_1.default.createElement("div", { style: { textAlign: 'center', padding: '40px 20px', color: '#6b7280' } },
            react_1.default.createElement(Icon_1.Icon, { name: "cart", size: 40 }),
            react_1.default.createElement("div", { style: { marginTop: 12, fontSize: 14 } }, "Busc\u00E1 un producto para agregar"))) : (react_1.default.createElement("div", null,
            react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 } }, items.map((item, i) => {
                const s = (data.stock || {})[item.codigoRef || ''];
                const actual = s ? (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0) : 0;
                const inPedido = (data.pedidos || []).find(p => p.codigoRef === item.codigoRef);
                return (react_1.default.createElement("div", { key: i, style: { background: '#111827', borderRadius: 12, padding: '10px 12px' } },
                    react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 } },
                        react_1.default.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            react_1.default.createElement("div", { style: { fontSize: 14, color: '#f1f5f9', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, item.codigoRef || item.descripcion),
                            react_1.default.createElement("div", { style: { fontSize: 11, color: '#6b7280', marginTop: 2 } },
                                (0, utils_1.fmtPeso)(item.precioVenta),
                                " c/u",
                                actual <= 0 && inPedido && react_1.default.createElement("span", { style: { color: '#fbbf24', fontWeight: 700, marginLeft: 6 } }, "\u25CF En pedido"),
                                actual <= 0 && !inPedido && react_1.default.createElement("span", { style: { color: '#ef4444', fontWeight: 700, marginLeft: 6 } }, "\u25CF Sin stock"))),
                        react_1.default.createElement("button", { onClick: () => removeItem(i), style: { width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
                            react_1.default.createElement(Icon_1.Icon, { name: "trash", size: 13 }))),
                    react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                        actual <= 0 && !inPedido ? (react_1.default.createElement("button", { onClick: () => {
                                const prod = (data.misProductos || []).find(p => p.codigoRef === item.codigoRef);
                                if (!prod)
                                    return;
                                setData(d => ({ ...d, pedidos: [...(d.pedidos || []), { codigoRef: prod.codigoRef, codigoProv: prod.codigoProv || '', descripcion: prod.descripcion, cantidad: 1, proveedor: prod.proveedor || '', precioCosto: prod.precioCosto || 0 }] }));
                                showToast('Agregado a pedidos', 'success');
                            }, style: { fontSize: 11, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 } }, "+ Pedir")) : (react_1.default.createElement("div", { style: { width: 60, flexShrink: 0 } })),
                        react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' } },
                            react_1.default.createElement("button", { onClick: () => updateQty(i, -1), style: { width: 32, height: 32, borderRadius: 8, background: '#374151', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "\u2212"),
                            react_1.default.createElement("span", { style: { minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#f1f5f9' } }, item.cantidad),
                            react_1.default.createElement("button", { onClick: () => updateQty(i, 1), style: { width: 32, height: 32, borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, "+")),
                        react_1.default.createElement("div", { style: { fontWeight: 700, color: '#22c55e', fontSize: 14, flexShrink: 0, minWidth: 70, textAlign: 'right' } }, (0, utils_1.fmtPeso)(item.precioVenta * item.cantidad)))));
            })),
            react_1.default.createElement("div", { style: { background: 'linear-gradient(135deg,#1e3a2e,#1a3025)', borderRadius: 14, border: '1px solid #166534', padding: '14px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                react_1.default.createElement("div", { style: { fontSize: 13, color: '#86efac', fontWeight: 600 } }, "Total"),
                react_1.default.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: '#22c55e' } }, (0, utils_1.fmtPeso)(total))),
            react_1.default.createElement("div", { style: { display: 'flex', gap: 8 } },
                react_1.default.createElement("button", { className: "btn-ghost", style: { padding: '12px 14px' }, onClick: () => setItems([]) },
                    react_1.default.createElement(Icon_1.Icon, { name: "trash", size: 16 })),
                react_1.default.createElement("button", { className: "btn-ghost", style: { flex: 1, justifyContent: 'center' }, onClick: () => setShowPresupuesto(true) },
                    react_1.default.createElement(Icon_1.Icon, { name: "download", size: 16 }),
                    " Presupuesto"),
                react_1.default.createElement("button", { className: "btn-primary", style: { flex: 1, justifyContent: 'center' }, onClick: registrarVenta },
                    react_1.default.createElement(Icon_1.Icon, { name: "check", size: 16 }),
                    " Venta")))),
        showPresupuesto && (react_1.default.createElement(Presupuesto_1.Presupuesto, { items: items, total: total, onClose: () => setShowPresupuesto(false), onGuardar: (cliente, nota, descuento) => {
                const pres = {
                    id: Date.now().toString(36),
                    fecha: new Date().toLocaleDateString('es-AR'),
                    hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    cliente,
                    items: items.map(i => ({ codigoRef: i.codigoRef, descripcion: i.descripcion, cantidad: i.cantidad, precioVenta: i.precioVenta })),
                    total,
                };
                setData(d => ({ ...d, presupuestos: [...(d.presupuestos || []), pres] }));
                showToast('Presupuesto guardado', 'success');
                setShowPresupuesto(false);
            }, data: data })),
        showCustom && (react_1.default.createElement("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }, onClick: () => setShowCustom(false) },
            react_1.default.createElement("div", { style: { background: '#1e2230', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }, onClick: e => e.stopPropagation() },
                react_1.default.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 16 } }, "Agregar importe libre"),
                react_1.default.createElement("label", { style: { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 } }, "Descripci\u00F3n"),
                react_1.default.createElement("input", { className: "input-field", style: { marginBottom: 12 }, placeholder: "Ej: Mano de obra, Flete...", value: customDesc, onChange: e => setCustomDesc(e.target.value), autoFocus: true }),
                react_1.default.createElement("label", { style: { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 } }, "Precio"),
                react_1.default.createElement("input", { className: "input-field", style: { marginBottom: 20 }, type: "number", placeholder: "0", value: customPrecio, onChange: e => setCustomPrecio(e.target.value), onKeyDown: e => {
                        if (e.key === 'Enter') {
                            const precio = parseFloat(customPrecio.replace(',', '.')) || 0;
                            if (!customDesc.trim() || precio <= 0)
                                return;
                            setItems(prev => [...prev, {
                                    codigoRef: customDesc.trim(),
                                    descripcion: customDesc.trim(),
                                    codigoProv: '',
                                    precioCosto: precio,
                                    precioVenta: precio,
                                    cantidad: 1,
                                    margen: 0,
                                    proveedor: '',
                                    divisor: 1,
                                }]);
                            setShowCustom(false);
                        }
                    } }),
                react_1.default.createElement("div", { style: { display: 'flex', gap: 8 } },
                    react_1.default.createElement("button", { onClick: () => setShowCustom(false), style: { flex: 1, padding: '12px', borderRadius: 10, background: 'none', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 } }, "Cancelar"),
                    react_1.default.createElement("button", { onClick: () => {
                            const precio = parseFloat(customPrecio.replace(',', '.')) || 0;
                            if (!customDesc.trim() || precio <= 0)
                                return;
                            setItems(prev => [...prev, {
                                    codigoRef: customDesc.trim(),
                                    descripcion: customDesc.trim(),
                                    codigoProv: '',
                                    precioCosto: precio,
                                    precioVenta: precio,
                                    cantidad: 1,
                                    margen: 0,
                                    proveedor: '',
                                    divisor: 1,
                                }]);
                            setShowCustom(false);
                        }, style: { flex: 2, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 } }, "Agregar al carrito"))))),
        scanning && (react_1.default.createElement(Scanner_1.Scanner, { onResult: code => { setScanning(false); agregarProducto(code.toUpperCase()); }, onClose: () => setScanning(false) }))));
}

__modules['tabs/TabCalculadora'] = exports;
})();

// === src/App.tsx ===
(function() {
const exports = {};
const module = { exports };
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
exports.default = App;
const react_1 = __importStar(require("react"));
const useAppData_1 = __require('./hooks/useAppData');
const Toast_1 = __require('./components/Toast');
const Icon_1 = __require('./components/Icon');
const LoginScreen_1 = __require('./components/LoginScreen');
const TabCalculadora_1 = __require('./tabs/TabCalculadora');
const TabProveedores_1 = __require('./tabs/TabProveedores');
const TabMisPrecios_1 = __require('./tabs/TabMisPrecios');
const TabStock_1 = __require('./tabs/TabStock');
const TabVentas_1 = __require('./tabs/TabVentas');
const TabPedidos_1 = __require('./tabs/TabPedidos');
const TabConfig_1 = __require('./tabs/TabConfig');
const TabPresupuestos_1 = __require('./tabs/TabPresupuestos');
const NAV = [
    { id: 'proveedores', label: 'Proveedores', icon: 'upload' },
    { id: 'precios', label: 'Mis Precios', icon: 'tag' },
    { id: 'stock', label: 'Stock', icon: 'box' },
    { id: 'ventas', label: 'Ventas', icon: 'download' },
    { id: 'pedidos', label: 'Pedidos', icon: 'store' },
    { id: 'presupuestos', label: 'Presupuestos', icon: 'download' },
    { id: 'config', label: 'Configuración', icon: 'settings' },
];
function App() {
    const [user, setUser] = (0, react_1.useState)(() => window.__user || null);
    const { data, setData, loaded, syncing } = (0, useAppData_1.useAppData)(user);
    const [tab, setTab] = (0, react_1.useState)(() => localStorage.getItem('mn_lastTab') || 'calc');
    const [menuOpen, setMenuOpen] = (0, react_1.useState)(false);
    const [isOnline, setIsOnline] = (0, react_1.useState)(() => window.__isOnline !== false);
    (0, react_1.useEffect)(() => {
        const handler = () => setIsOnline(window.__isOnline !== false);
        window.addEventListener('connectivityChange', handler);
        window.addEventListener('online', handler);
        window.addEventListener('offline', handler);
        return () => {
            window.removeEventListener('connectivityChange', handler);
            window.removeEventListener('online', handler);
            window.removeEventListener('offline', handler);
        };
    }, []);
    const [pendingCodProv, setPendingCodProv] = (0, react_1.useState)();
    const [pendingCalcItems, setPendingCalcItems] = (0, react_1.useState)();
    const [toast, setToast] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const onAuth = () => setUser(window.__user || null);
        window.addEventListener('authReady', onAuth);
        return () => window.removeEventListener('authReady', onAuth);
    }, []);
    const showToast = (0, react_1.useCallback)((msg, type = 'success') => {
        setToast({ msg, type });
    }, []);
    const onNavigate = (tabId, codigoProv) => {
        switchTab(tabId);
        if (codigoProv)
            setPendingCodProv(codigoProv);
    };
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
        return react_1.default.createElement(LoginScreen_1.LoginScreen, { onLogin: () => setUser(window.__user) });
    const tabProps = { data, setData, showToast };
    return (react_1.default.createElement("div", { style: { minHeight: '100vh', background: '#0d1117', color: '#f1f5f9', fontFamily: "'Space Grotesk', system-ui, sans-serif" } },
        react_1.default.createElement("div", { style: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e2535', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' } },
            react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                react_1.default.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 } }, "\uD83C\uDFEA"),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: '#f1f5f9' } }, "MiNegocio"),
                    react_1.default.createElement("div", { style: { fontSize: 10, color: '#6b7280' } }, "Sistema de Precios"))),
            react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 } },
                    react_1.default.createElement("div", { style: { width: 7, height: 7, borderRadius: '50%', background: !isOnline ? '#ef4444' : syncing ? '#fbbf24' : '#22c55e' } }),
                    react_1.default.createElement("span", { style: { color: '#6b7280' } }, !isOnline ? 'Sin conexión' : syncing ? 'Guardando...' : 'Sincronizado')),
                react_1.default.createElement("button", { onClick: () => setMenuOpen(v => !v), style: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 } },
                    react_1.default.createElement(Icon_1.Icon, { name: "menu", size: 22 })))),
        react_1.default.createElement("div", { style: { padding: '76px 12px 80px', maxWidth: 640, margin: '0 auto' } }, !loaded ? (react_1.default.createElement("div", { style: { textAlign: 'center', padding: '80px 20px', color: '#6b7280' } },
            react_1.default.createElement("div", { style: { fontSize: 40, marginBottom: 16 } }, "\u26A1"),
            react_1.default.createElement("div", null, "Cargando datos..."))) : (react_1.default.createElement(react_1.default.Fragment, null,
            tab === 'calc' && react_1.default.createElement(TabCalculadora_1.TabCalculadora, { ...tabProps, pendingItems: pendingCalcItems, onClearPending: () => setPendingCalcItems(undefined) }),
            tab === 'proveedores' && react_1.default.createElement(TabProveedores_1.TabProveedores, { ...tabProps, onNavigate: onNavigate }),
            tab === 'precios' && react_1.default.createElement(TabMisPrecios_1.TabMisPrecios, { ...tabProps, pendingCodProv: pendingCodProv, onClearPending: () => setPendingCodProv(undefined) }),
            tab === 'stock' && react_1.default.createElement(TabStock_1.TabStock, { ...tabProps }),
            tab === 'ventas' && react_1.default.createElement(TabVentas_1.TabVentas, { ...tabProps }),
            tab === 'pedidos' && react_1.default.createElement(TabPedidos_1.TabPedidos, { ...tabProps }),
            tab === 'presupuestos' && react_1.default.createElement(TabPresupuestos_1.TabPresupuestos, { ...tabProps, onCargarEnCalculadora: (items) => { setPendingCalcItems(items); switchTab('calc'); } }),
            tab === 'config' && react_1.default.createElement(TabConfig_1.TabConfig, { ...tabProps })))),
        react_1.default.createElement("div", { style: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(13,17,23,0.98)', borderTop: '1px solid #1e2535', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px' } },
            react_1.default.createElement("button", { onClick: () => switchTab('calc'), style: { background: 'none', border: 'none', cursor: 'pointer', color: tab === 'calc' ? '#818cf8' : '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: 'inherit' } },
                react_1.default.createElement(Icon_1.Icon, { name: "store", size: 20 }),
                " Calculadora"),
            react_1.default.createElement("button", { onClick: () => setMenuOpen(v => !v), style: { background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: 'inherit' } },
                react_1.default.createElement(Icon_1.Icon, { name: "menu", size: 20 }),
                " Men\u00FA")),
        menuOpen && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { onClick: () => setMenuOpen(false), style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 } }),
            react_1.default.createElement("div", { style: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1e2230', borderRadius: '20px 20px 0 0', zIndex: 200, padding: '8px 0 8px' } },
                react_1.default.createElement("div", { style: { width: 40, height: 4, background: '#374151', borderRadius: 2, margin: '8px auto 12px' } }),
                NAV.map(item => (react_1.default.createElement("button", { key: item.id, onClick: () => switchTab(item.id), style: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 20px', background: tab === item.id ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', color: tab === item.id ? '#818cf8' : '#94a3b8', fontFamily: 'inherit', fontSize: 15, fontWeight: tab === item.id ? 600 : 400 } },
                    react_1.default.createElement(Icon_1.Icon, { name: item.icon, size: 20 }),
                    item.label,
                    tab === item.id && react_1.default.createElement("span", { style: { marginLeft: 'auto', color: '#6366f1' } }, "\u2713")))),
                react_1.default.createElement("div", { style: { height: 1, background: '#1e2535', margin: '8px 0' } }),
                react_1.default.createElement("button", { onClick: logout, style: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit', fontSize: 15 } },
                    react_1.default.createElement(Icon_1.Icon, { name: "x", size: 20 }),
                    " Salir")))),
        react_1.default.createElement(Toast_1.Toast, { toast: toast, onClose: () => setToast(null) })));
}

__modules['App'] = exports;
})();

// === src/main.tsx ===
(function() {
const exports = {};
const module = { exports };
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const react_1 = __importDefault(require("react"));
const App_1 = __importDefault(require("./App"));
const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(react_1.default.createElement(App_1.default, null));
}

__modules['main'] = exports;
})();
