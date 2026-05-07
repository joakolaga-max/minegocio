const { useState, useEffect, useRef, useCallback } = React;

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const DB = {
    proveedores: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        nombre: `Proveedor ${i + 1}`,
        productos: []
    })),
    misProductos: [],
    margenes: { p1: 50, p2: 40, p3: 30, p4: 20 },
    stock: {},
    fotos: {},
    ventas: [],
    pedidos: []
};
const saveToFirebase = async (path, data) => {
    if (window.__fb)
        await window.__fb.save(path, data);
};
const loadFromFirebase = async (path) => {
    if (window.__fb)
        return window.__fb.load(path);
    return null;
};
// ─── HELPERS ──────────────────────────────────────────────────────────────────
const parsePrecio = (v) => {
    if (!v && v !== 0)
        return 0;
    if (typeof v === "number")
        return v;
    let s = String(v).replace(/[$\s]/g, "").trim();
    // Argentine format: $ 1.234,56 or 1.234,56
    if (s.includes(",") && s.includes(".")) {
        // Thousands dot + decimal comma: 1.234,56
        s = s.replace(/\./g, "").replace(",", ".");
    }
    else if (s.includes(",")) {
        // Only comma — could be decimal: 402,00
        s = s.replace(",", ".");
    }
    return parseFloat(s) || 0;
};
const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n || 0);
const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const rows = [];
    for (const line of lines) {
        const cols = line.split(/[,;\t]/).map(s => s.trim().replace(/^"|"$/g, ""));
        if (cols.length >= 3) {
            rows.push({ codigo: cols[0], descripcion: cols[1], precio: parsePrecio(cols[2]) });
        }
    }
    return rows;
};
const parseExcel = (buffer) => {
    const wb = window.XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const rows = [];
    for (const row of json) {
        if (!row[0])
            continue;
        const codigo = String(row[0]).trim();
        const descripcion = String(row[1] || "").trim();
        const precio = parsePrecio(row[2]);
        const codLower = codigo.toLowerCase();
        if (codigo && descripcion && codLower !== "codigo" && codLower !== "código" && codLower !== "code") {
            rows.push({ codigo, descripcion, precio });
        }
    }
    return rows;
};

// ─── BEEP ─────────────────────────────────────────────────────────────────────
let _audioCtx = null;
const getAudioCtx = () => {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
};
const beep = () => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
};
// Desbloquear audio en primer toque (requerido en iOS/Android)
document.addEventListener('touchstart', () => { try { getAudioCtx(); } catch(e) {} }, { once: true });
// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
    var _a;
    const icons = {
        store: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
        tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
        calc: "M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z M8 10h8 M8 14h4",
        box: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
        upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
        search: "M11 17a6 6 0 100-12 6 6 0 000 12z M21 21l-4.35-4.35",
        trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
        plus: "M12 5v14 M5 12h14",
        check: "M20 6L9 17l-5-5",
        alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
        camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
        settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
        x: "M18 6L6 18 M6 6l12 12",
        scan: "M3 9V5a2 2 0 012-2h4 M15 3h4a2 2 0 012 2v4 M3 15v4a2 2 0 002 2h4 M15 21h4a2 2 0 002-2v-4 M7 12h10",
        download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
        menu: "M3 12h18 M3 6h18 M3 18h18",
        refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
    };
    return (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, (_a = icons[name]) === null || _a === void 0 ? void 0 : _a.split(" M").map((d, i) => (React.createElement("path", { key: i, d: i === 0 ? d : "M" + d })))));
};
// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
    const colors = { success: "#22c55e", error: "#ef4444", info: "#3b82f6" };
    return (React.createElement("div", { style: {
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: colors[type] || colors.info, color: "#fff",
            padding: "12px 20px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", gap: 10, maxWidth: 320,
            animation: "slideUp 0.3s ease"
        } },
        React.createElement(Icon, { name: type === "success" ? "check" : type === "error" ? "x" : "alert", size: 16 }),
        msg));
};
// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen() {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [mode, setMode] = React.useState("login");

    const handle = async (action) => {
        setError(""); setLoading(true);
        try {
            await window[action](email.trim(), password);
        } catch (e) {
            const msgs = {
                "auth/invalid-credential": "Email o contraseña incorrectos",
                "auth/email-already-in-use": "El email ya está registrado",
                "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
                "auth/invalid-email": "Email inválido",
            };
            setError(msgs[e.code] || e.message);
        }
        setLoading(false);
    };

    return React.createElement("div", { style: { minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" } },
        React.createElement("style", null, "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Space+Grotesk:wght@700&display=swap');*{box-sizing:border-box;margin:0;padding:0}.login-input{background:#1e2230;border:1px solid #374151;color:#f1f5f9;padding:12px 16px;border-radius:12px;font-family:inherit;font-size:15px;width:100%;outline:none;transition:border-color 0.2s}.login-input:focus{border-color:#6366f1}.login-input::placeholder{color:#4b5563}"),
        React.createElement("div", { style: { width: "100%", maxWidth: 380 } },
            React.createElement("div", { style: { textAlign: "center", marginBottom: 36 } },
                React.createElement("div", { style: { width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } },
                    React.createElement(Icon, { name: "store", size: 26 })),
                React.createElement("div", { style: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700, color: "#f1f5f9" } }, "MiNegocio"),
                React.createElement("div", { style: { fontSize: 13, color: "#6b7280", marginTop: 4 } }, mode === "login" ? "Iniciá sesión para continuar" : "Creá tu cuenta gratis")),
            React.createElement("div", { style: { background: "#1e2230", borderRadius: 20, border: "1px solid #1e2535", padding: 28 } },
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
                    React.createElement("input", { className: "login-input", type: "email", placeholder: "Email", value: email, onChange: e => setEmail(e.target.value) }),
                    React.createElement("input", { className: "login-input", type: "password", placeholder: "Contraseña (mín. 6 caracteres)", value: password, onChange: e => setPassword(e.target.value), onKeyDown: e => e.key === "Enter" && handle(mode) }),
                    error && React.createElement("div", { style: { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "10px 14px" } }, error),
                    React.createElement("button", { disabled: loading, onClick: () => handle(mode), style: { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", padding: 14, borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1 } },
                        loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta")),
                React.createElement("div", { style: { textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" } },
                    mode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? ",
                    React.createElement("span", { onClick: () => { setMode(mode === "login" ? "register" : "login"); setError(""); }, style: { color: "#818cf8", fontWeight: 600, cursor: "pointer" } },
                        mode === "login" ? "Registrate" : "Iniciá sesión")))));
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
    const [user, setUser] = useState(window.__user || null);
    const [authReady, setAuthReady] = useState(window.__authReady || false);
    const [tab, setTab] = useState("calc");
    const [data, setData] = useState(DB);
    const [toast, setToast] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [prefillProd, setPrefillProd] = useState(null);
    const prevDataRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const showToast = (msg, type = "success") => setToast({ msg, type });

    // ── Track auth state ──
    useEffect(() => {
        const onAuth = () => { setUser(window.__user || null); setAuthReady(true); };
        if (window.__authReady) onAuth();
        window.addEventListener("authReady", onAuth);
        return () => window.removeEventListener("authReady", onAuth);
    }, []);

    // ── Cargar datos de Firebase al inicio ──
    useEffect(() => {
        const loadAll = async () => {
            setSyncing(true);
            const [provData, misData, config, stockData, ventasData, fotosData, pedidosData] = await Promise.all([
                loadFromFirebase("proveedores"),
                loadFromFirebase("misProductos"),
                loadFromFirebase("config"),
                loadFromFirebase("stock"),
                loadFromFirebase("ventas"),
                loadFromFirebase("fotos"),
                loadFromFirebase("pedidos"),
            ]);
            setData(d => (Object.assign(Object.assign({}, d), { proveedores: (provData && provData.length) ? provData : d.proveedores, misProductos: misData || d.misProductos, margenes: (config === null || config === void 0 ? void 0 : config.margenes) || d.margenes, stock: stockData || d.stock || {}, ventas: (ventasData || d.ventas || []), fotos: (fotosData || d.fotos || {}), pedidos: (pedidosData || d.pedidos || []) })));
            setSyncing(false);
            setLoaded(true);
        };
        const init = () => { if (!window.__user) return; loadAll(); };
        if (window.__authReady) init();
        else window.addEventListener("authReady", init, { once: true });
    }, []);
    // ── Guardar en Firebase cuando cambian los datos ──
    useEffect(() => {
        if (!loaded)
            return;
        const t = setTimeout(async () => {
            var _a, _b, _c, _d;
            setSyncing(true);
            if (JSON.stringify(data.proveedores) !== JSON.stringify((_a = prevDataRef.current) === null || _a === void 0 ? void 0 : _a.proveedores)) {
                try {
                    localStorage.setItem("mn_proveedores", JSON.stringify(data.proveedores));
                }
                catch (e) { }
                await saveToFirebase("proveedores", data.proveedores);
            }
            if (JSON.stringify(data.misProductos) !== JSON.stringify((_b = prevDataRef.current) === null || _b === void 0 ? void 0 : _b.misProductos)) {
                try {
                    localStorage.setItem("mn_misProductos", JSON.stringify(data.misProductos));
                }
                catch (e) { }
                await saveToFirebase("misProductos", data.misProductos);
            }
            if (JSON.stringify(data.margenes) !== JSON.stringify((_c = prevDataRef.current) === null || _c === void 0 ? void 0 : _c.margenes)) {
                try {
                    localStorage.setItem("mn_config", JSON.stringify({ margenes: data.margenes }));
                }
                catch (e) { }
                await saveToFirebase("config", { margenes: data.margenes });
            }
            if (JSON.stringify(data.stock) !== JSON.stringify((_d = prevDataRef.current) === null || _d === void 0 ? void 0 : _d.stock)) {
                try {
                    localStorage.setItem("mn_stock", JSON.stringify(data.stock));
                }
                catch (e) { }
                await saveToFirebase("stock", data.stock);
            }
            if (JSON.stringify(data.ventas) !== JSON.stringify(prevDataRef.current && prevDataRef.current.ventas)) {
                try { localStorage.setItem("mn_ventas", JSON.stringify(data.ventas)); } catch(e) {}
                await saveToFirebase("ventas", data.ventas);
            }
            if (JSON.stringify(data.fotos) !== JSON.stringify(prevDataRef.current && prevDataRef.current.fotos)) {
                try { localStorage.setItem("mn_fotos", JSON.stringify(data.fotos)); } catch(e) {}
                await saveToFirebase("fotos", data.fotos);
            }
            if (JSON.stringify(data.pedidos) !== JSON.stringify(prevDataRef.current && prevDataRef.current.pedidos)) {
                try { localStorage.setItem("mn_pedidos", JSON.stringify(data.pedidos)); } catch(e) {}
                await saveToFirebase("pedidos", data.pedidos);
            }
            prevDataRef.current = data;
            setSyncing(false);
        }, 1200);
        return () => clearTimeout(t);
    }, [data, loaded]);
    // ── buscar producto en todos los proveedores por código ──
    const buscarEnProveedores = useCallback((codigo) => {
        for (const prov of data.proveedores) {
            const p = prov.productos.find(x => x.codigo === codigo);
            if (p)
                return Object.assign(Object.assign({}, p), { proveedor: prov.nombre });
        }
        return null;
    }, [data.proveedores]);
    const calcPrecioVenta = (costo, margenKey) => {
        const m = data.margenes[margenKey] / 100;
        if (m >= 1)
            return costo;
        return costo / (1 - m);
    };
    if (!authReady) {
        return React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, background: "#0f1117" } },
            React.createElement("div", { style: { width: 44, height: 44, border: "4px solid #1e2230", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
            React.createElement("div", { style: { color: "#6b7280", fontSize: 14 } }, "Conectando..."));
    }
    if (!user) return React.createElement(LoginScreen, null);
    return (React.createElement("div", { style: { minHeight: "100vh", background: "#0f1117", fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9" } },
        React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1e2230; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
        input, select, textarea { outline: none; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .card { animation: fadeIn 0.3s ease; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
        .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 13px; transition: all 0.2s; }
        .btn-danger:hover { transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #374151; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.2s; }
        .btn-ghost:hover { border-color: #6366f1; color: #a5b4fc; }
        .input-field { background: #1e2230; border: 1px solid #374151; color: #f1f5f9; padding: 10px 14px; border-radius: 10px; font-family: inherit; font-size: 14px; width: 100%; transition: border-color 0.2s; }
        .input-field:focus { border-color: #6366f1; }
        .input-field::placeholder { color: #4b5563; }
        .table-row:hover { background: rgba(99,102,241,0.06); }
        .nav-btn { background: none; border: none; cursor: pointer; font-family: inherit; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 14px; border-radius: 12px; transition: all 0.2s; color: #6b7280; font-size: 11px; font-weight: 500; }
        .nav-btn.active { color: #818cf8; background: rgba(99,102,241,0.15); }
        .nav-btn:hover:not(.active) { color: #94a3b8; background: rgba(255,255,255,0.05); }
        .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .section-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: #f1f5f9; }
        select.input-field option { background: #1e2230; }
      `),
        React.createElement("div", { style: { background: "linear-gradient(135deg, #1e2230 0%, #16192a 100%)", borderBottom: "1px solid #1e2535", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" } },
                    React.createElement(Icon, { name: "store", size: 18 })),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#f1f5f9", lineHeight: 1 } }, "MiNegocio"),
                    React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 2 } }, "Sistema de Precios"))),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: syncing ? "#f59e0b" : "#22c55e", boxShadow: `0 0 8px ${syncing ? "#f59e0b" : "#22c55e"}`, transition: "all 0.3s" } }),
                React.createElement("span", { style: { fontSize: 12, color: "#6b7280" } }, syncing ? "Guardando..." : loaded ? "Sincronizado ☁️" : "Conectando..."),
                React.createElement("button", { onClick: () => window.logout(), title: "Cerrar sesión", style: { background: "transparent", border: "1px solid #374151", borderRadius: 8, padding: "4px 10px", color: "#6b7280", cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginLeft: 4 } }, "Salir"))),
        React.createElement("div", { style: { padding: "20px 16px", maxWidth: 900, margin: "0 auto", paddingBottom: 100 } },
            tab === "proveedores" && React.createElement(TabProveedores, { data: data, setData: setData, showToast: showToast, busqueda: busqueda, setBusqueda: setBusqueda, onSelectProduct: (p) => { setPrefillProd(p); setTab("precios"); } }),
            tab === "precios" && React.createElement(TabMisPrecios, { data: data, setData: setData, showToast: showToast, buscarEnProveedores: buscarEnProveedores, prefillProd: prefillProd, clearPrefill: () => setPrefillProd(null) }),
            tab === "calc" && React.createElement(TabCalculadora, { data: data, setData: setData, showToast: showToast, buscarEnProveedores: buscarEnProveedores }),
            tab === "stock" && React.createElement(TabStock, { data: data, setData: setData, showToast: showToast }),
            tab === "pedidos" && React.createElement(TabPedidos, { data: data, setData: setData, showToast: showToast }),
        tab === "ventas" && React.createElement(TabVentas, { data: data, setData: setData, showToast: showToast }),
        tab === "config" && React.createElement(TabConfig, { data: data, setData: setData, showToast: showToast })),
        React.createElement("div", { style: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#1e2230", borderTop: "1px solid #1e2535", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 8px", zIndex: 100 } },
            React.createElement("button", { className: `nav-btn ${tab === "calc" ? "active" : ""}`, onClick: () => setTab("calc"), style: { flex: 1 } },
                React.createElement(Icon, { name: "calc", size: 22 }),
                "Calculadora"),
            React.createElement("button", { className: "nav-btn", onClick: () => setMenuOpen(m => !m), style: { flex: 0, padding: "10px 16px" } },
                React.createElement(Icon, { name: "menu", size: 22 }),
                "Men\u00FA")),
        menuOpen && (React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 200 }, onClick: () => setMenuOpen(false) },
            React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, background: "#1e2230", borderTop: "1px solid #1e2535", borderRadius: "20px 20px 0 0", padding: "8px 0 32px" }, onClick: e => e.stopPropagation() },
                React.createElement("div", { style: { width: 40, height: 4, background: "#374151", borderRadius: 2, margin: "8px auto 16px" } }),
                [
                    { id: "proveedores", icon: "upload", label: "Proveedores" },
                    { id: "precios", icon: "tag", label: "Mis Precios" },
                    { id: "stock", icon: "box", label: "Stock" },
                    { id: "ventas", icon: "download", label: "Ventas" },
                    { id: "pedidos", icon: "box", label: "Pedidos" },
                    { id: "config", icon: "settings", label: "Configuración" },
                ].map(n => (React.createElement("button", { key: n.id, onClick: () => { setTab(n.id); setMenuOpen(false); }, style: {
                        width: "100%", padding: "14px 24px", background: tab === n.id ? "rgba(99,102,241,0.1)" : "transparent",
                        border: "none", color: tab === n.id ? "#818cf8" : "#cbd5e1", cursor: "pointer",
                        fontFamily: "inherit", fontSize: 15, fontWeight: 500,
                        display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s"
                    } },
                    React.createElement(Icon, { name: n.icon, size: 20 }),
                    n.label,
                    tab === n.id && React.createElement("span", { style: { marginLeft: "auto", color: "#6366f1" } }, "\u2713"))))))),
        toast && React.createElement(Toast, { msg: toast.msg, type: toast.type, onClose: () => setToast(null) })));
}
// ─── TAB PROVEEDORES ──────────────────────────────────────────────────────────
function TabProveedores({ data, setData, showToast, busqueda, setBusqueda, onSelectProduct }) {
    const [provSel, setProvSel] = useState(0);
    const fileRef = useRef();
    const prov = data.proveedores[provSel];
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file)
            return;
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            let rows = [];
            try {
                if (isExcel) {
                    const buf = new Uint8Array(ev.target.result);
                    rows = parseExcel(buf);
                }
                else {
                    rows = parseCSV(ev.target.result);
                }
            }
            catch (err) {
                showToast("Error al leer el archivo", "error");
                return;
            }
            if (!rows.length) {
                showToast("No se encontraron productos en el archivo", "error");
                return;
            }
            setData(d => {
                const provs = [...d.proveedores];
                provs[provSel] = Object.assign(Object.assign({}, provs[provSel]), { productos: rows });
                return Object.assign(Object.assign({}, d), { proveedores: provs });
            });
            showToast(`✅ ${rows.length} productos cargados en ${prov.nombre}`, "success");
        };
        if (isExcel)
            reader.readAsArrayBuffer(file);
        else
            reader.readAsText(file);
        e.target.value = "";
    };
    const filtrados = prov.productos.filter(p => !busqueda || p.codigo.toLowerCase().includes(busqueda.toLowerCase()) || p.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    return (React.createElement("div", { className: "card" },
        React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("div", { className: "section-title" }, "\uD83D\uDCE6 Proveedores"),
            React.createElement("p", { style: { color: "#6b7280", fontSize: 13, marginTop: 4 } }, "Carg\u00E1 la lista en Excel (.xlsx) o CSV \u2014 tal cual te la manda el proveedor")),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 } }, data.proveedores.map((p, i) => (React.createElement("button", { key: i, onClick: () => setProvSel(i), style: {
                padding: "6px 14px", borderRadius: 20, border: "1px solid",
                borderColor: i === provSel ? "#6366f1" : "#374151",
                background: i === provSel ? "rgba(99,102,241,0.15)" : "transparent",
                color: i === provSel ? "#818cf8" : "#6b7280",
                cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
            } },
            p.nombre,
            p.productos.length > 0 && (React.createElement("span", { className: "badge", style: { background: "rgba(34,197,94,0.15)", color: "#22c55e" } }, p.productos.length)))))),
        React.createElement("div", { style: { background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 16 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "#f1f5f9" } }, prov.nombre),
                    React.createElement("div", { style: { fontSize: 13, color: "#6b7280", marginTop: 2 } }, prov.productos.length ? `${prov.productos.length} productos cargados` : "Sin productos — cargá el Excel o CSV")),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    prov.productos.length > 0 && (React.createElement("button", { className: "btn-danger", onClick: () => {
                            setData(d => { const ps = [...d.proveedores]; ps[provSel] = Object.assign(Object.assign({}, ps[provSel]), { productos: [] }); return Object.assign(Object.assign({}, d), { proveedores: ps }); });
                            showToast("Lista limpiada", "info");
                        } },
                        React.createElement(Icon, { name: "trash", size: 14 }),
                        " Limpiar")),
                    React.createElement("button", { className: "btn-primary", onClick: () => fileRef.current.click() },
                        React.createElement(Icon, { name: "upload", size: 16 }),
                        " Cargar Excel / CSV"),
                    prov.productos.length > 0 && React.createElement("button", { style: { background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }, onClick: async () => { showToast("Guardando...", "info"); if (window.__fb) await window.__fb.save("proveedores", data.proveedores); try { localStorage.setItem("mn_proveedores", JSON.stringify(data.proveedores)); } catch(e) {} showToast("\u2705 Lista guardada", "success"); } }, React.createElement(Icon, { name: "check", size: 14 }), " Guardar lista"),
                    React.createElement("input", { ref: fileRef, type: "file", accept: ".csv,.txt,.xlsx,.xls", style: { display: "none" }, onChange: handleFile })))),
        prov.productos.length > 0 && (React.createElement("div", { style: { position: "relative", marginBottom: 16 } },
            React.createElement("div", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" } },
                React.createElement(Icon, { name: "search", size: 16 })),
            React.createElement("input", { className: "input-field", placeholder: "Buscar por c\u00F3digo o descripci\u00F3n...", value: busqueda, onChange: e => setBusqueda(e.target.value), style: { paddingLeft: 38 } }))),
        filtrados.length > 0 && (React.createElement("div", { style: { background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", overflow: "hidden" } },
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "130px 1fr 110px", padding: "10px 16px", borderBottom: "1px solid #1e2535", fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" } },
                React.createElement("span", null, "C\u00F3digo"),
                React.createElement("span", null, "Descripci\u00F3n"),
                React.createElement("span", { style: { textAlign: "right" } }, "Precio")),
            React.createElement("div", { style: { maxHeight: 400, overflowY: "auto" } },
                filtrados.slice(0, 200).map((p, i) => (React.createElement("div", { key: i, className: "table-row", onClick: () => onSelectProduct(p), style: { display: "grid", gridTemplateColumns: "130px 1fr 110px", padding: "10px 16px", borderBottom: "1px solid #111827", fontSize: 13, alignItems: "center", cursor: "pointer" } },
                    React.createElement("span", { style: { color: "#818cf8", fontWeight: 600, fontFamily: "monospace" } }, p.codigo),
                    React.createElement("span", { style: { color: "#cbd5e1" } }, p.descripcion),
                    React.createElement("span", { style: { textAlign: "right", color: "#22c55e", fontWeight: 600 } }, fmt(p.precio))))),
                filtrados.length > 200 && (React.createElement("div", { style: { padding: "10px 16px", fontSize: 12, color: "#6b7280", textAlign: "center" } },
                    "Mostrando 200 de ",
                    filtrados.length,
                    " productos"))))),
        prov.productos.length === 0 && (React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", color: "#374151" } },
            React.createElement(Icon, { name: "upload", size: 48 }),
            React.createElement("div", { style: { marginTop: 16, fontSize: 15, color: "#6b7280" } }, "Carg\u00E1 el CSV del proveedor"),
            React.createElement("div", { style: { fontSize: 12, color: "#374151", marginTop: 6 } }, "Excel o CSV: C\u00F3digo | Descripci\u00F3n | Precio")))));
}
// ─── TAB MIS PRECIOS ──────────────────────────────────────────────────────────
function TabMisPrecios({ data, setData, showToast, buscarEnProveedores, prefillProd, clearPrefill }) {
    // Define locally so it always uses latest data.margenes
    const calcPrecioVenta = (costo, margenKey) => { const m = (data.margenes[margenKey] || 50) / 100; if (m >= 1) return costo; return costo / (1 - m); };
    const [codigoRef, setCodigoRef] = useState("");
    const [codigoProv, setCodigoProv] = useState("");
    const [margenSel, setMargenSel] = useState("p1");
    const [busqueda, setBusqueda] = useState("");
    const [editIdx, setEditIdx] = useState(null);
    const [photoModal, setPhotoModal] = useState(null);
    // Auto-fill when coming from Proveedores
    useEffect(() => {
        if (!prefillProd) return;
        setCodigoProv(prefillProd.codigo);
        setCodigoRef("");
        setMargenSel("p1");
        setEditIdx(null);
        if (clearPrefill) clearPrefill();
        // Open photo modal after a tick if no photo exists
        showToast("Completá el código REF y el margen", "info");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [prefillProd]);
    const [scanningRef, setScanningRef] = useState(false);
    const scanVideoRef = useRef();
    const stopRefScan = useCallback(() => {
        if (window._zxingRefReader) {
            try { window._zxingRefReader.reset(); } catch(e) {}
            window._zxingRefReader = null;
        }
        setScanningRef(false);
    }, []);
    const startRefScan = useCallback(() => {
        if (!window.ZXing) {
            showToast('Cargando escáner...', 'info');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js';
            script.onload = () => initRefScanner();
            document.head.appendChild(script);
        } else {
            initRefScanner();
        }
    }, []);
    const initRefScanner = useCallback(() => {
        setScanningRef(true);
        setTimeout(async () => {
            if (!scanVideoRef.current) return;
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
              });
              scanVideoRef.current.srcObject = stream;
              await scanVideoRef.current.play();
              const hints = new Map();
              hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
              const reader = new window.ZXing.BrowserMultiFormatReader(hints, 400);
              window._zxingRefReader = reader;
              reader.decodeFromStream(stream, scanVideoRef.current, (result, err) => {
                if (result) {
                    const text = result.getText().trim().toUpperCase();
                    beep();
                    setCodigoRef(text);
                    stopRefScan();
                    showToast('Código REF cargado: ' + text, 'success');
                }
            });
            } catch(e) { showToast("Error cámara: " + e.message, "error"); setScanningRef(false); }
        }, 300);
    }, []);
    const agregarProducto = () => {
        if (!codigoRef.trim() || !codigoProv.trim()) {
            showToast("Completá el código local y el código del proveedor", "error");
            return;
        }
        const encontrado = buscarEnProveedores(codigoProv.trim());
        if (!encontrado) {
            showToast("Código del proveedor no encontrado en ninguna lista", "error");
            return;
        }
        const yaExiste = data.misProductos.find(p => p.codigoRef === codigoRef.trim());
        if (yaExiste && editIdx === null) {
            showToast("El código local ya existe", "error");
            return;
        }
        const nuevo = {
            codigoRef: codigoRef.trim(),
            codigoProv: codigoProv.trim(),
            descripcion: encontrado.descripcion,
            precioCosto: encontrado.precio,
            margen: margenSel,
            proveedor: encontrado.proveedor,
        };
        setData(d => {
            const lista = [...d.misProductos];
            if (editIdx !== null) {
                lista[editIdx] = nuevo;
            }
            else {
                lista.push(nuevo);
            }
            return Object.assign(Object.assign({}, d), { misProductos: lista });
        });
        showToast(editIdx !== null ? "Producto actualizado" : "Producto agregado", "success");
        setCodigoRef("");
        setCodigoProv("");
        setMargenSel("p1");
        setEditIdx(null);
    };
    const eliminar = (i) => {
        setData(d => { const lista = [...d.misProductos]; lista.splice(i, 1); return Object.assign(Object.assign({}, d), { misProductos: lista }); });
        showToast("Producto eliminado", "info");
    };
    const editar = (i) => {
        const p = data.misProductos[i];
        setCodigoRef(p.codigoRef);
        setCodigoProv(p.codigoProv);
        setMargenSel(p.margen);
        setEditIdx(i);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const exportarCSV = () => {
        const rows = data.misProductos.map(p => {
            const pv = calcPrecioVenta(p.precioCosto, p.margen);
            const desc = (p.descripcion || "").replace(/,/g, ";");
            return [p.codigoRef, p.codigoProv || "", desc, (p.precioCosto||0).toFixed(2), pv.toFixed(2), p.margen].join(",");
        });
        const blob = new Blob(["Ref,CodProveedor,Descripcion,PrecioCompra,PrecioVenta,Margen\n" + rows.join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mis_precios.csv";
        a.click();
        showToast("CSV exportado listo para importar", "success");
    };
    const actualizarPrecios = () => {
        let actualizados = 0;
        setData(d => {
            const lista = d.misProductos.map(p => {
                const enc = buscarEnProveedores(p.codigoProv);
                if (enc && enc.precio !== p.precioCosto) {
                    actualizados++;
                    return Object.assign(Object.assign({}, p), { precioCosto: enc.precio, descripcion: enc.descripcion });
                }
                return p;
            });
            return Object.assign(Object.assign({}, d), { misProductos: lista });
        });
        showToast(`${actualizados} precios actualizados desde proveedores`, actualizados > 0 ? "success" : "info");
    };
    const filtrados = data.misProductos.map((p, i) => (Object.assign(Object.assign({}, p), { _i: i }))).filter(p => !busqueda || p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoProv || "").toLowerCase().includes(busqueda.toLowerCase()));
    const margenLabel = { p1: data.margenes.p1+"%", p2: data.margenes.p2+"%", p3: data.margenes.p3+"%", p4: data.margenes.p4+"%" };
    return (React.createElement(React.Fragment, null, React.createElement("div", { className: "card" },
        React.createElement("div", { style: { marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 } },
            React.createElement("div", null,
                React.createElement("div", { className: "section-title" }, "\uD83C\uDFF7\uFE0F Mis Precios"),
                React.createElement("p", { style: { color: "#6b7280", fontSize: 13, marginTop: 4 } }, "Tu cat\u00E1logo con m\u00E1rgenes personalizados")),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
                React.createElement("button", { className: "btn-ghost", onClick: actualizarPrecios },
                    React.createElement(Icon, { name: "refresh", size: 14 }),
                    " Actualizar precios"),
                data.misProductos.length > 0 && React.createElement("button", { className: "btn-primary", onClick: exportarCSV },
                    React.createElement(Icon, { name: "download", size: 14 }),
                    " Exportar CSV"),
            data.misProductos.length > 0 && React.createElement("button", { className: "btn-ghost", onClick: () => { const inp = document.createElement("input"); inp.type="file"; inp.accept=".csv,.txt,.xlsx,.xls"; inp.onchange = (e) => { const file=e.target.files[0]; if(!file) return; const isXls=/\.(xlsx|xls)$/i.test(file.name); const reader=new FileReader(); reader.onload=(ev)=>{ let rows=[]; try{ if(isXls){ const buf=new Uint8Array(ev.target.result); const wb=window.XLSX.read(buf,{type:"array"}); const ws=wb.Sheets[wb.SheetNames[0]]; const json=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:""}); rows=json.slice(1).map(r=>({ codigoRef:String(r[0]||"").trim(), codigoProv:String(r[1]||"").trim(), descripcion:String(r[2]||"").trim(), precioCosto:parseFloat(String(r[3]||"0").replace(",","."))||0, margen:r[5]||"p1" })).filter(r=>r.codigoRef); }else{ const lines=ev.target.result.trim().split(/\r?\n/).filter(Boolean); rows=lines.slice(1).map(l=>{ const c=l.split(",").map(s=>s.trim()); return{ codigoRef:c[0]||"", codigoProv:c[1]||"", descripcion:c[2]||"", precioCosto:parseFloat(c[3])||0, margen:c[5]||"p1" }; }).filter(r=>r.codigoRef); } }catch(err){ showToast("Error al leer archivo","error"); return; } if(!rows.length){ showToast("No se encontraron productos","error"); return; } if(!window.confirm("Reemplazar tu lista actual ("+data.misProductos.length+" productos) con "+rows.length+" del archivo?")) return; setData(d=>Object.assign({},d,{misProductos:rows})); showToast("Importados "+rows.length+" productos","success"); }; if(isXls) reader.readAsArrayBuffer(file); else reader.readAsText(file); }; inp.click(); }, style: { display:"flex", alignItems:"center", gap:6 } },
                React.createElement(Icon, { name: "upload", size: 14 }),
                " Importar"))),
        React.createElement("div", { style: { background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 20 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 14 } }, editIdx !== null ? "✏️ Editando producto" : "➕ Agregar producto"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } },
                React.createElement("div", null,
                    React.createElement("label", { style: { fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" } }, "Tu C\u00F3digo REF"),
                    React.createElement("div", { style: { display: "flex", gap: 6 } },
                        React.createElement("input", { className: "input-field", placeholder: "REF00001", value: codigoRef, onChange: e => setCodigoRef(e.target.value.toUpperCase()) }),
                        React.createElement("button", { className: "btn-ghost", style: { padding: "10px 12px", flexShrink: 0, color: scanningRef ? "#22c55e" : "#6b7280" }, onClick: () => scanningRef ? stopRefScan() : startRefScan(), title: "Escanear c\u00F3digo REF" },
                            React.createElement(Icon, { name: "camera", size: 18 }))),
                    scanningRef && (React.createElement("div", { style: { position: "fixed", bottom: 0, left: 0, right: 0, height: "55vh", background: "#000", zIndex: 500, display: "flex", flexDirection: "column", borderRadius: "20px 20px 0 0", overflow: "hidden" } },
                        React.createElement("video", { ref: scanVideoRef, autoPlay: true, playsInline: true, muted: true, style: { width: "100%", flex: 1, objectFit: "cover", display: "block" } }), React.createElement("div", { style: { position: "absolute", inset: 0, border: "2px solid #6366f1", borderRadius: 12, pointerEvents: "none" } }), React.createElement("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "70%", height: 2, background: "rgba(99,102,241,0.8)", boxShadow: "0 0 12px #6366f1" } }),
                        React.createElement("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "70%", height: 2, background: "rgba(99,102,241,0.8)", boxShadow: "0 0 12px #6366f1" } }),
                        React.createElement("div", { style: { position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 12 } }, "Apunt\u00E1 al c\u00F3digo REF"),
                        React.createElement("button", { onClick: () => stopRefScan(), style: { position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" } },
                            React.createElement(Icon, { name: "x", size: 18 }))))),
                React.createElement("div", null,
                    React.createElement("label", { style: { fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" } }, "C\u00F3digo Proveedor"),
                    React.createElement("input", { className: "input-field", placeholder: "IMP4512", value: codigoProv, onChange: e => setCodigoProv(e.target.value), onBlur: () => {
                            if (codigoProv) {
                                const enc = buscarEnProveedores(codigoProv.trim());
                                if (!enc)
                                    showToast("Código no encontrado en ningún proveedor", "error");
                            }
                        } }))),
            React.createElement("div", { style: { marginBottom: 14 } },
                React.createElement("label", { style: { fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" } }, "Margen de venta"),
                React.createElement("div", { style: { display: "flex", gap: 8 } }, Object.entries(margenLabel).map(([k, v]) => (React.createElement("button", { key: k, onClick: () => setMargenSel(k), style: {
                        flex: 1, padding: "8px 4px", borderRadius: 10, border: "1px solid",
                        borderColor: margenSel === k ? "#6366f1" : "#374151",
                        background: margenSel === k ? "rgba(99,102,241,0.2)" : "transparent",
                        color: margenSel === k ? "#818cf8" : "#6b7280",
                        cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, transition: "all 0.2s"
                    } }, v)))),
                React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 6 } }, "Los % exactos se configuran en la pesta\u00F1a \u2699\uFE0F Config")),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
                React.createElement("button", { className: "btn-primary", style: { flex: 1, justifyContent: "center" }, onClick: agregarProducto },
                    React.createElement(Icon, { name: editIdx !== null ? "check" : "plus", size: 16 }),
                    editIdx !== null ? "Guardar cambios" : "Agregar producto"),
                editIdx !== null && (React.createElement("button", { className: "btn-ghost", onClick: () => { setEditIdx(null); setCodigoRef(""); setCodigoProv(""); setMargenSel("p1"); } }, "Cancelar")))),
        data.misProductos.length > 0 && (React.createElement("div", { style: { position: "relative", marginBottom: 16 } },
            React.createElement("div", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" } },
                React.createElement(Icon, { name: "search", size: 16 })),
            React.createElement("input", { className: "input-field", placeholder: "Buscar en mis productos...", value: busqueda, onChange: e => setBusqueda(e.target.value), style: { paddingLeft: 38 } }))),
        filtrados.length > 0 ? (React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, filtrados.map((p) => {
            const pv = calcPrecioVenta(p.precioCosto, p.margen);
            return (React.createElement("div", { key: p._i, className: "table-row", onClick: () => setPhotoModal({ idx: p._i, codigoRef: p.codigoRef, descripcion: p.descripcion }), style: { background: "#1e2230", borderRadius: 12, border: "1px solid #1e2535", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" } },
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } },
                        React.createElement("span", { style: { color: "#818cf8", fontWeight: 700, fontFamily: "monospace", fontSize: 13 } }, p.codigoRef),
                        React.createElement("span", { style: { fontSize: 11, color: "#6b7280" } }, "\u2192"),
                        React.createElement("span", { style: { color: "#6b7280", fontFamily: "monospace", fontSize: 12 } }, p.codigoProv),
                        React.createElement("span", { className: "badge", style: { background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: 10 } }, margenLabel[p.margen])),
                    React.createElement("div", { style: { fontSize: 13, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.descripcion),
                    React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 6 } },
                        React.createElement("span", { style: { fontSize: 12, color: "#6b7280" } },
                            "Costo: ",
                            React.createElement("span", { style: { color: "#94a3b8" } }, fmt(p.precioCosto))),
                        React.createElement("span", { style: { fontSize: 12, color: "#6b7280" } },
                            "Venta: ",
                            React.createElement("span", { style: { color: "#22c55e", fontWeight: 700 } }, fmt(pv))))),
                React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                    React.createElement("button", { className: "btn-danger", style: { padding: "6px 12px" }, onClick: () => {
                            if (window.confirm(`¿Seguro que querés eliminar "${p.descripcion}"?`))
                                eliminar(p._i);
                        } },
                        React.createElement(Icon, { name: "trash", size: 14 })),
                    React.createElement("button", { className: "btn-primary", style: { padding: "6px 12px" }, onClick: () => editar(p._i) },
                        React.createElement(Icon, { name: "settings", size: 14 })))));
        }))) : data.misProductos.length === 0 ? (React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", color: "#374151" } },
            React.createElement(Icon, { name: "tag", size: 48 }),
            React.createElement("div", { style: { marginTop: 16, fontSize: 15, color: "#6b7280" } }, "Todav\u00EDa no agregaste productos"))) : null),
    photoModal && React.createElement("div", {
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
        onClick: () => setPhotoModal(null)
    },
        React.createElement("div", {
            style: { background: "#1e2230", borderRadius: 20, padding: 24, width: "100%", maxWidth: 420 },
            onClick: e => e.stopPropagation()
        },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "#f1f5f9", marginBottom: 4 } }, photoModal.descripcion),
            React.createElement("div", { style: { fontSize: 12, color: "#818cf8", fontFamily: "monospace", marginBottom: 16 } }, photoModal.codigoRef),
            data.fotos && data.fotos[photoModal.codigoRef]
                ? React.createElement("img", { src: data.fotos[photoModal.codigoRef], alt: photoModal.descripcion, style: { width: "100%", borderRadius: 12, marginBottom: 16, maxHeight: 280, objectFit: "contain", background: "#111" } })
                : React.createElement("div", { style: { background: "#111827", borderRadius: 12, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 16, gap: 8 } },
                    React.createElement(Icon, { name: "camera", size: 44 }),
                    React.createElement("div", { style: { fontSize: 13, color: "#6b7280" } }, "Sin foto cargada")),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                React.createElement("label", { style: { flex: 1, minWidth: 120, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", borderRadius: 10, padding: "11px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
                    React.createElement(Icon, { name: "camera", size: 16 }),
                    data.fotos && data.fotos[photoModal.codigoRef] ? "Cambiar foto" : "Cargar foto",
                    React.createElement("input", { type: "file", accept: "image/*", capture: "environment", style: { display: "none" },
                        onChange: e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement("canvas");
                                    const MAX = 700;
                                    const ratio = Math.min(MAX/img.width, MAX/img.height, 1);
                                    canvas.width = img.width * ratio;
                                    canvas.height = img.height * ratio;
                                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                                    const compressed = canvas.toDataURL("image/jpeg", 0.75);
                                    setData(d => { const fotos = Object.assign({}, d.fotos || {}); fotos[photoModal.codigoRef] = compressed; return Object.assign({}, d, { fotos }); });
                                    showToast("Foto guardada", "success");
                                };
                                img.src = ev.target.result;
                            };
                            reader.readAsDataURL(file);
                        }
                    })),
                data.fotos && data.fotos[photoModal.codigoRef] && React.createElement("button", {
                    className: "btn-danger", style: { padding: "11px 14px" },
                    onClick: () => {
                        if (!window.confirm("Eliminar la foto?")) return;
                        setData(d => { const fotos = Object.assign({}, d.fotos || {}); delete fotos[photoModal.codigoRef]; return Object.assign({}, d, { fotos }); });
                        setPhotoModal(null);
                        showToast("Foto eliminada", "info");
                    }
                }, React.createElement(Icon, { name: "trash", size: 16 })),
                React.createElement("button", { className: "btn-ghost", style: { padding: "11px 16px" }, onClick: () => setPhotoModal(null) }, "Cerrar"))))));
}
// ─── TAB CALCULADORA ─────────────────────────────────────────────────────────
function TabCalculadora({ data, showToast, buscarEnProveedores, setData }) {
    const calcPrecioVenta = (costo, margenKey) => { const m = (data.margenes[margenKey] || 50) / 100; if (m >= 1) return costo; return costo / (1 - m); };
    const [items, setItems] = useState([]);
    const [codigo, setCodigo] = useState("");
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef();
    const inputRef = useRef();
    const buscarYAgregar = (cod) => {
        const codLimpio = cod.trim().toUpperCase();
        const miProd = data.misProductos.find(p => p.codigoRef === codLimpio || p.codigoProv === codLimpio);
        if (!miProd) {
            showToast("Código no encontrado en Mis Precios", "error");
            return;
        }
        const pv = calcPrecioVenta(miProd.precioCosto, miProd.margen);
        const existe = items.findIndex(i => i.codigoRef === miProd.codigoRef);
        if (existe >= 0) {
            setItems(its => { const n = [...its]; n[existe].cantidad++; return n; });
        }
        else {
            setItems(its => [...its, { codigoRef: miProd.codigoRef, descripcion: miProd.descripcion, precioVenta: pv, cantidad: 1 }]);
        }
        setCodigo("");
    };
    const total = items.reduce((s, i) => s + i.precioVenta * i.cantidad, 0);
    const confirmarVenta = () => {
        if (items.length === 0) { showToast("No hay productos en la calculadora", "error"); return; }
        if (!window.confirm("¿Confirmás la venta por " + fmt(total) + "?")) return;
        // Descontar del stock
        setData(d => {
            const newStock = { ...(d.stock || {}) };
            items.forEach(item => {
                const prod = d.misProductos.find(p => p.codigoRef === item.codigoRef);
                if (prod) {
                    const cur = newStock[item.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
                    newStock[item.codigoRef] = { ...cur, salidas: (cur.salidas || 0) + item.cantidad };
                }
            });
            // Guardar registro de venta
            const now = new Date();
            const venta = {
                id: now.getTime(),
                fecha: now.toLocaleDateString("es-AR"),
                hora: now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
                items: items.map(i => ({ ...i })),
                total,
            };
            const ventas = [...(d.ventas || []), venta];
            // Guardar en Firebase
            saveToFirebase("ventas", ventas);
            try { localStorage.setItem("mn_ventas", JSON.stringify(ventas)); } catch(e) {}
            return { ...d, stock: newStock, ventas };
        });
        showToast("✅ Venta confirmada — " + fmt(total), "success");
        setItems([]);
    };
    const cambiarCantidad = (i, delta) => {
        setItems(its => {
            const n = [...its];
            n[i].cantidad = Math.max(0, n[i].cantidad + delta);
            if (n[i].cantidad === 0)
                n.splice(i, 1);
            return n;
        });
    };
    const startScan = useCallback(() => {
        if (!window.ZXing) {
            showToast("Cargando escáner...", "info");
            const script = document.createElement("script");
            script.src = "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js";
            script.onload = () => initScanner();
            document.head.appendChild(script);
        }
        else {
            initScanner();
        }
    }, []);
    const initScanner = useCallback(() => {
        setScanning(true);
        setTimeout(() => {
            if (!videoRef.current)
                return;
            const codeReader = new window.ZXing.BrowserMultiFormatReader();
            window._zxingReader = codeReader;
            codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
                if (result) {
                    const text = result.getText();
                    beep();
                    buscarYAgregar(text);
                    stopScan();
                }
            });
        }, 300);
    }, []);
    const stopScan = useCallback(() => {
        if (window._zxingReader) {
            try {
                window._zxingReader.reset();
            }
            catch (e) { }
            window._zxingReader = null;
        }
        setScanning(false);
    }, []);
    return (React.createElement("div", { className: "card" },
        React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("div", { className: "section-title" }, "\uD83E\uDDEE Calculadora"),
            React.createElement("p", { style: { color: "#6b7280", fontSize: 13, marginTop: 4 } }, "Arm\u00E1 presupuestos r\u00E1pido")),
        React.createElement("div", { style: { background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 16, marginBottom: 16 } },
            React.createElement("div", { style: { display: "flex", gap: 8 } },
                React.createElement("input", { ref: inputRef, className: "input-field", placeholder: "Ingres\u00E1 c\u00F3digo REF o del proveedor...", value: codigo, onChange: e => setCodigo(e.target.value.toUpperCase()), onKeyDown: e => e.key === "Enter" && buscarYAgregar(codigo), style: { flex: 1 } }),
                React.createElement("button", { className: "btn-primary", onClick: () => buscarYAgregar(codigo) },
                    React.createElement(Icon, { name: "plus", size: 16 })),
                React.createElement("button", { className: "btn-ghost", onClick: scanning ? stopScan : startScan, style: { padding: "10px 14px", color: scanning ? "#22c55e" : "#6b7280" } },
                    React.createElement(Icon, { name: "camera", size: 18 }))),
            scanning && (React.createElement("div", { style: { position: "fixed", bottom: 0, left: 0, right: 0, height: "55vh", background: "#000", zIndex: 500, display: "flex", flexDirection: "column", borderRadius: "20px 20px 0 0", overflow: "hidden" } },
                React.createElement("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: true, style: { width: "100%", flex: 1, objectFit: "cover", display: "block" } }),
                React.createElement("div", { style: { position: "absolute", inset: 0, border: "2px solid #6366f1", borderRadius: 12, pointerEvents: "none" } }),
                React.createElement("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "70%", height: 2, background: "rgba(99,102,241,0.8)", boxShadow: "0 0 12px #6366f1" } }),
                React.createElement("div", { style: { position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 12 } }, "Apunt\u00E1 al c\u00F3digo de barras"),
                React.createElement("button", { onClick: stopScan, style: { position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" } },
                    React.createElement(Icon, { name: "x", size: 18 }))))),
        items.length > 0 ? (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 } }, items.map((item, i) => (React.createElement("div", { key: i, style: { background: "#1e2230", borderRadius: 12, border: "1px solid #1e2535", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 } },
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { color: "#818cf8", fontFamily: "monospace", fontSize: 12, marginBottom: 2 } }, item.codigoRef),
                    React.createElement("div", { style: { fontSize: 13, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.descripcion),
                    React.createElement("div", { style: { fontSize: 12, color: "#22c55e", fontWeight: 600, marginTop: 2 } },
                        fmt(item.precioVenta),
                        " c/u")),
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    React.createElement("button", { onClick: () => cambiarCantidad(i, -1), style: { width: 28, height: 28, borderRadius: 8, background: "#374151", border: "none", color: "#f1f5f9", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" } }, "\u2212"),
                    React.createElement("input", { type: "number", inputMode: "numeric", min: 1, value: item.cantidad, onChange: e => { const v = Math.max(1, parseInt(e.target.value)||1); setItems(its => { const n=[...its]; n[i].cantidad=v; return n; }); }, style: { width: 52, height: 32, borderRadius: 8, background: "#1e2230", border: "1px solid #374151", color: "#f1f5f9", textAlign: "center", fontSize: 15, fontWeight: 700, fontFamily: "inherit" } }),
                    React.createElement("button", { onClick: () => cambiarCantidad(i, 1), style: { width: 28, height: 28, borderRadius: 8, background: "#6366f1", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" } }, "+")),
                React.createElement("div", { style: { fontWeight: 700, color: "#22c55e", minWidth: 90, textAlign: "right" } }, fmt(item.precioVenta * item.cantidad)))))),
            React.createElement("div", { style: { background: "linear-gradient(135deg, #1e3a2e, #1a3025)", borderRadius: 16, border: "1px solid #166534", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
                React.createElement("span", { style: { fontSize: 18, fontWeight: 700, color: "#86efac" } }, "TOTAL"),
                React.createElement("span", { style: { fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#22c55e" } }, fmt(total))),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
                React.createElement("button", {
                    onClick: () => { if (window.confirm("¿Cancelar la venta? Se borrará todo.")) { setItems([]); showToast("Venta cancelada", "info"); } },
                    style: { flex: 1, padding: "13px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }
                }, React.createElement(Icon, { name: "trash", size: 16 }), " Limpiar"),
                React.createElement("button", {
                    onClick: () => confirmarVenta(),
                    style: { flex: 2, padding: "13px", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(34,197,94,0.35)" }
                }, React.createElement(Icon, { name: "check", size: 16 }), " Confirmar venta")))) : (React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", color: "#374151" } },
            React.createElement(Icon, { name: "scan", size: 48 }),
            React.createElement("div", { style: { marginTop: 16, fontSize: 15, color: "#6b7280" } }, "Ingres\u00E1 o escane\u00E1 un c\u00F3digo")))));
}
// ─── TAB STOCK ───────────────────────────────────────────────────────────────
function TabStock({ data, setData, showToast }) {
    const [busqueda, setBusqueda] = useState("");
    const [editIdx, setEditIdx] = useState(null);
    const [photoModal, setPhotoModal] = useState(null);
    const [scanningStock, setScanningStock] = useState(false);
    const stockVideoRef = useRef();
    const stopStockScan = () => {
        if (window._zxingStockReader) {
            try { window._zxingStockReader.reset(); } catch(e) {}
            window._zxingStockReader = null;
        }
        setScanningStock(false);
    };
    const startStockScan = () => {
        const doScan = () => {
            setScanningStock(true);
            setTimeout(() => {
                if (!stockVideoRef.current) return;
                const reader = new window.ZXing.BrowserMultiFormatReader();
                window._zxingStockReader = reader;
                reader.decodeFromVideoDevice(null, stockVideoRef.current, (result, err) => {
                    if (result) {
                        const text = result.getText().trim().toUpperCase();
                        beep();
                        setBusqueda(text);
                        if (window._zxingStockReader) {
                            try { window._zxingStockReader.reset(); } catch(e) {}
                            window._zxingStockReader = null;
                        }
                        setScanningStock(false);
                        showToast('Buscando: ' + text, 'info');
                    }
                });
            }, 300);
        };
        if (!window.ZXing) {
            showToast('Cargando escáner...', 'info');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js';
            script.onload = doScan;
            document.head.appendChild(script);
        } else {
            doScan();
        }
    };
    const productos = data.misProductos.map((p, i) => {
        var _a;
        const stock = ((_a = data.stock) === null || _a === void 0 ? void 0 : _a[p.codigoRef]) || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
        const actual = (stock.inicial || 0) + (stock.entradas || 0) - (stock.salidas || 0);
        return Object.assign(Object.assign({}, p), { _i: i, stock, actual });
    }).filter(p => !busqueda || p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) || p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigoProv || "").toLowerCase().includes(busqueda.toLowerCase()));
    const updateStock = (codigoRef, field, val) => {
        setData(d => {
            var _a;
            return (Object.assign(Object.assign({}, d), { stock: Object.assign(Object.assign({}, d.stock), { [codigoRef]: Object.assign(Object.assign({}, (((_a = d.stock) === null || _a === void 0 ? void 0 : _a[codigoRef]) || {})), { [field]: Math.max(0, parseInt(val) || 0) }) }) }));
        });
    };
    const alertas = data.misProductos.filter(p => {
        var _a;
        const s = ((_a = data.stock) === null || _a === void 0 ? void 0 : _a[p.codigoRef]) || {};
        const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
        return s.minimo > 0 && actual < s.minimo;
    });
    return (React.createElement("div", { className: "card" },
        React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("div", { className: "section-title" }, "\uD83D\uDCE6 Stock"),
            React.createElement("p", { style: { color: "#6b7280", fontSize: 13, marginTop: 4 } }, "Control de inventario")),
        alertas.length > 0 && (React.createElement("div", { style: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, color: "#ef4444", fontWeight: 700, marginBottom: 8 } },
                React.createElement(Icon, { name: "alert", size: 16 }),
                " ",
                alertas.length,
                " producto",
                alertas.length > 1 ? "s" : "",
                " bajo m\u00EDnimo"),
            alertas.map(p => (React.createElement("div", { key: p.codigoRef, style: { fontSize: 12, color: "#fca5a5", marginTop: 4 } },
                "\u2022 ",
                p.codigoRef,
                " \u2014 ",
                p.descripcion))))),
        data.misProductos.length === 0 ? (React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", color: "#374151" } },
            React.createElement(Icon, { name: "box", size: 48 }),
            React.createElement("div", { style: { marginTop: 16, fontSize: 15, color: "#6b7280" } }, "Primero agreg\u00E1 productos en \"Mis Precios\""))) : (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("div", { style: { position: "relative", flex: 1 } },
                        React.createElement("div", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" } },
                            React.createElement(Icon, { name: "search", size: 16 })),
                        React.createElement("input", { className: "input-field", placeholder: "Buscar producto...", value: busqueda, onChange: e => setBusqueda(e.target.value), style: { paddingLeft: 38 } })),
                    React.createElement("button", { className: "btn-ghost", onClick: () => scanningStock ? stopStockScan() : startStockScan(), style: { padding: "10px 14px", color: scanningStock ? "#22c55e" : "#6b7280", flexShrink: 0 } },
                        React.createElement(Icon, { name: "camera", size: 18 }))),
                scanningStock && React.createElement("div", { style: { marginTop: 8, borderRadius: 12, overflow: "hidden", position: "relative", background: "#000" } },
                    React.createElement("video", { ref: stockVideoRef, autoPlay: true, playsInline: true, muted: true, style: { width: "100%", borderRadius: 12, display: "block", minHeight: 200 } }),
                    React.createElement("div", { style: { position: "absolute", inset: 0, border: "2px solid #6366f1", borderRadius: 12, pointerEvents: "none" } }),
                    React.createElement("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "70%", height: 2, background: "rgba(99,102,241,0.8)", boxShadow: "0 0 12px #6366f1" } }),
                    React.createElement("div", { style: { position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 12 } }, "📷  Apuntá al código de barras — se detecta solo"),
                    React.createElement("button", { onClick: stopStockScan, style: { position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" } },
                        React.createElement(Icon, { name: "x", size: 18 })))),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, productos.map(p => {
                const bajo = p.stock.minimo > 0 && p.actual < p.stock.minimo;
                return (React.createElement("div", { key: p.codigoRef, style: { background: bajo ? "rgba(239,68,68,0.08)" : "#1e2230", borderRadius: 12, border: `1px solid ${bajo ? "rgba(239,68,68,0.3)" : "#1e2535"}`, padding: "14px 16px" } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } },
                        React.createElement("div", null,
                            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                                React.createElement("span", { style: { color: "#818cf8", fontFamily: "monospace", fontWeight: 700, fontSize: 13 } }, p.codigoRef),
                                bajo && React.createElement("span", { className: "badge", style: { background: "rgba(239,68,68,0.2)", color: "#ef4444" } }, "\u26A0 Bajo m\u00EDnimo")),
                            React.createElement("div", { style: { fontSize: 13, color: "#cbd5e1", marginTop: 2 } }, p.descripcion)),
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                            React.createElement("button", {
                                onClick: () => {
                                    const existe = data.pedidos && data.pedidos.find(x => x.codigoRef === p.codigoRef);
                                    if (existe) { showToast("Ya está en pedidos", "info"); return; }
                                    const cantSugerida = Math.max(1, (p.stock.minimo || 1) - Math.max(0, p.actual));
                                    setData(d => {
                                        const peds = [...(d.pedidos||[]), { codigoRef: p.codigoRef, codigoProv: p.codigoProv||"", descripcion: p.descripcion, cantidad: cantSugerida, proveedor: p.proveedor||"", precioCosto: p.precioCosto||0 }];
                                        return Object.assign({}, d, { pedidos: peds });
                                    });
                                    showToast("Agregado a pedidos", "success");
                                },
                                style: { background: data.pedidos && data.pedidos.find(x => x.codigoRef === p.codigoRef) ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.15)", border: "1px solid", borderColor: data.pedidos && data.pedidos.find(x => x.codigoRef === p.codigoRef) ? "#22c55e" : "#6366f1", color: data.pedidos && data.pedidos.find(x => x.codigoRef === p.codigoRef) ? "#22c55e" : "#818cf8", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }
                            }, data.pedidos && data.pedidos.find(x => x.codigoRef === p.codigoRef) ? "✓ En pedido" : "+ Pedir"),
                            data.fotos && data.fotos[p.codigoRef] && React.createElement("img", { src: data.fotos[p.codigoRef], alt: p.descripcion, onClick: () => setPhotoModal({ codigoRef: p.codigoRef, descripcion: p.descripcion }), style: { width: 52, height: 52, borderRadius: 8, objectFit: "cover", border: "2px solid #374151", cursor: "pointer", flexShrink: 0 } }),
                            React.createElement("div", { style: { textAlign: "right" } },
                                React.createElement("div", { style: { fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: bajo ? "#ef4444" : "#22c55e" } }, p.actual),
                                React.createElement("div", { style: { fontSize: 11, color: "#6b7280" } }, "en stock")))),
                    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 } }, [
                        { label: "Inicial", field: "inicial", color: "#6b7280" },
                        { label: "Entradas", field: "entradas", color: "#22c55e" },
                        { label: "Salidas", field: "salidas", color: "#ef4444" },
                        { label: "Mínimo", field: "minimo", color: "#f59e0b" },
                    ].map(({ label, field, color }) => (React.createElement("div", { key: field },
                        React.createElement("div", { style: { fontSize: 11, color, marginBottom: 4, fontWeight: 600 } }, label),
                        React.createElement("input", { type: "number", min: "0", className: "input-field", value: p.stock[field] || 0, onChange: e => updateStock(p.codigoRef, field, e.target.value), style: { padding: "6px 8px", fontSize: 13, textAlign: "center" } })))))));
            }))))));
}
// ─── TAB CONFIG ──────────────────────────────────────────────────────────────
function TabConfig({ data, setData, showToast }) {
    const [margenes, setMargenes] = useState(Object.assign({}, data.margenes));
    const [nombres, setNombres] = useState(data.proveedores.map(p => p.nombre));
    // Sync when Firebase loads data after component mounts
    useEffect(() => { setMargenes(Object.assign({}, data.margenes)); }, [JSON.stringify(data.margenes)]);
    useEffect(() => { setNombres(data.proveedores.map(p => p.nombre)); }, [JSON.stringify(data.proveedores.map(p=>p.nombre))]);
    const guardar = () => {
        setData(d => (Object.assign(Object.assign({}, d), { margenes, proveedores: d.proveedores.map((p, i) => (Object.assign(Object.assign({}, p), { nombre: nombres[i] || p.nombre }))) })));
        showToast("Configuración guardada", "success");
    };
    return (React.createElement("div", { className: "card" },
        React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("div", { className: "section-title" }, "\u2699\uFE0F Configuraci\u00F3n"),
            React.createElement("p", { style: { color: "#6b7280", fontSize: 13, marginTop: 4 } }, "Personaliz\u00E1 el sistema")),
        React.createElement("div", { style: { background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 16 } },
            React.createElement("div", { style: { fontWeight: 700, color: "#818cf8", marginBottom: 16, fontSize: 14 } }, "M\u00E1rgenes de venta"),
            React.createElement("div", { style: { fontSize: 12, color: "#6b7280", marginBottom: 12 } }, "F\u00F3rmula: Precio venta = Costo / (1 \u2212 margen)"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, ["p1", "p2", "p3", "p4"].map((k, i) => (React.createElement("div", { key: k },
                React.createElement("label", { style: { fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" } },
                    "% ",
                    i + 1),
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    React.createElement("input", { type: "number", min: "1", max: "99", className: "input-field", value: margenes[k], onChange: e => setMargenes(m => (Object.assign(Object.assign({}, m), { [k]: parseInt(e.target.value) || 0 }))), style: { flex: 1 } }),
                    React.createElement("span", { style: { color: "#6b7280", fontSize: 14 } }, "%")),
                React.createElement("div", { style: { fontSize: 11, color: "#4b5563", marginTop: 4 } },
                    "Ej: $1000 costo \u2192 ",
                    margenes[k] < 100 ? fmt(1000 / (1 - margenes[k] / 100)) : "∞",
                    " venta")))))),
        React.createElement("div", { style: { background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 20 } },
            React.createElement("div", { style: { fontWeight: 700, color: "#818cf8", marginBottom: 16, fontSize: 14 } }, "Nombres de proveedores"),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, nombres.map((n, i) => (React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10 } },
                React.createElement("span", { style: { fontSize: 12, color: "#6b7280", minWidth: 20 } },
                    i + 1,
                    "."),
                React.createElement("input", { className: "input-field", value: n, onChange: e => setNombres(ns => { const c = [...ns]; c[i] = e.target.value; return c; }) })))))),
        React.createElement("button", { className: "btn-primary", style: { width: "100%", justifyContent: "center", padding: "14px" }, onClick: guardar },
            React.createElement(Icon, { name: "check", size: 16 }),
            " Guardar configuraci\u00F3n")));
}


// ─── TAB VENTAS ───────────────────────────────────────────────────────────────
function TabVentas({ data, setData, showToast }) {
    const ventas = [...(data.ventas || [])].reverse();
    const totalHoy = ventas
        .filter(v => v.fecha === new Date().toLocaleDateString("es-AR"))
        .reduce((s, v) => s + v.total, 0);
    const fmt2 = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n || 0);
    const borrarVenta = (ventaId) => {
        if (!window.confirm("Borrar esta venta del registro?")) return;
        setData(d => {
            const nuevas = (d.ventas || []).filter(v => v.id !== ventaId);
            saveToFirebase("ventas", nuevas);
            try { localStorage.setItem("mn_ventas", JSON.stringify(nuevas)); } catch(e) {}
            return Object.assign({}, d, { ventas: nuevas });
        });
        showToast("Venta eliminada", "info");
    };
    const borrarTodo = () => {
        if (!window.confirm("Borrar TODO el historial de ventas? Esta accion no se puede deshacer.")) return;
        setData(d => {
            saveToFirebase("ventas", []);
            try { localStorage.setItem("mn_ventas", JSON.stringify([])); } catch(e) {}
            return Object.assign({}, d, { ventas: [] });
        });
        showToast("Historial borrado", "info");
    };
    return React.createElement("div", { className: "card" },
        React.createElement("div", { style: { marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 } },
            React.createElement("div", null,
                React.createElement("div", { className: "section-title" }, "Registro de Ventas"),
                React.createElement("div", { style: { fontSize: 13, color: "#6b7280", marginTop: 4 } }, "Historial de ventas confirmadas")),
            ventas.length > 0 && React.createElement("button", { onClick: borrarTodo, style: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 } },
                React.createElement(Icon, { name: "trash", size: 14 }), " Borrar todo")),
        ventas.length > 0 && React.createElement("div", { style: { background: "linear-gradient(135deg,#1e3a2e,#1a3025)", borderRadius: 14, border: "1px solid #166534", padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", { style: { fontSize: 13, color: "#86efac", fontWeight: 600 } }, "Total del dia"),
            React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "#22c55e", fontFamily: "'Space Grotesk',sans-serif" } }, fmt2(totalHoy))),
        ventas.length === 0
            ? React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", color: "#374151" } },
                React.createElement(Icon, { name: "download", size: 48 }),
                React.createElement("div", { style: { marginTop: 16, fontSize: 15, color: "#6b7280" } }, "No hay ventas registradas"))
            : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                ventas.map((v, i) => React.createElement("div", { key: v.id || i, style: { background: "#1e2230", borderRadius: 14, border: "1px solid #1e2535", overflow: "hidden" } },
                    React.createElement("div", { style: { padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #111827" } },
                        React.createElement("div", null,
                            React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "#f1f5f9" } }, v.fecha),
                            React.createElement("div", { style: { fontSize: 12, color: "#6b7280", marginTop: 2 } }, v.hora + " - " + v.items.length + " producto(s)")),
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                            React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "#22c55e" } }, fmt2(v.total)),
                            React.createElement("button", { onClick: () => borrarVenta(v.id), style: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 8, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" } },
                                React.createElement(Icon, { name: "trash", size: 14 })))),
                    React.createElement("div", { style: { padding: "8px 16px 12px" } },
                        v.items.map((item, j) => React.createElement("div", { key: j, style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", padding: "3px 0" } },
                            React.createElement("span", null, item.cantidad + "x " + item.descripcion),
                            React.createElement("span", { style: { color: "#6b7280" } }, fmt2(item.precioVenta * item.cantidad)))))))));
}


// ─── TAB PEDIDOS ──────────────────────────────────────────────────────────────
function TabPedidos({ data, setData, showToast }) {
    const [busqueda, setBusqueda] = useState("");
    const pedidos = data.pedidos || [];

    // Group by proveedor
    const porProveedor = {};
    pedidos.forEach(p => {
        const prov = p.proveedor || p.codigoProv || "Sin proveedor";
        if (!porProveedor[prov]) porProveedor[prov] = [];
        porProveedor[prov].push(p);
    });

    // Also show productos bajo minimo not yet in pedidos
    const bajoMinimo = (data.misProductos || []).filter(p => {
        const s = (data.stock || {})[p.codigoRef] || {};
        const actual = (s.inicial||0)+(s.entradas||0)-(s.salidas||0);
        return s.minimo > 0 && actual < s.minimo && !pedidos.find(x => x.codigoRef === p.codigoRef);
    });

    const filtrados = busqueda
        ? pedidos.filter(p => p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) || (p.descripcion||"").toLowerCase().includes(busqueda.toLowerCase()) || (p.codigoProv||"").toLowerCase().includes(busqueda.toLowerCase()))
        : pedidos;

    const quitarDePedido = (codigoRef) => {
        setData(d => Object.assign({}, d, { pedidos: (d.pedidos||[]).filter(x => x.codigoRef !== codigoRef) }));
    };

    const cambiarCantidad = (codigoRef, delta) => {
        setData(d => Object.assign({}, d, { pedidos: (d.pedidos||[]).map(x => x.codigoRef === codigoRef ? Object.assign({}, x, { cantidad: Math.max(1, (x.cantidad||1)+delta) }) : x) }));
    };

    const exportarProveedor = (provNombre, items) => {
        const BOM = "\uFEFF";
        const header = "Codigo Proveedor,Descripcion,Cantidad,Precio Costo\n";
        const rows = items.map(p => [p.codigoProv||p.codigoRef, (p.descripcion||"").replace(/,/g,";"), p.cantidad||1, (p.precioCosto||0).toFixed(2)].join(",")).join("\n");
        const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Pedido_" + provNombre.replace(/\s+/g,"_") + ".csv";
        a.click();
        showToast("Excel exportado para " + provNombre, "success");
    };

    const agregarBajoMinimo = () => {
        if (!bajoMinimo.length) return;
        setData(d => {
            const nuevos = bajoMinimo.map(p => {
                const s = (d.stock||{})[p.codigoRef]||{};
                const actual = (s.inicial||0)+(s.entradas||0)-(s.salidas||0);
                return { codigoRef: p.codigoRef, codigoProv: p.codigoProv||"", descripcion: p.descripcion, cantidad: Math.max(1,(s.minimo||1)-Math.max(0,actual)), proveedor: p.proveedor||"", precioCosto: p.precioCosto||0 };
            });
            return Object.assign({}, d, { pedidos: [...(d.pedidos||[]), ...nuevos] });
        });
        showToast(bajoMinimo.length + " productos bajo mínimo agregados", "success");
    };

    const limpiarTodo = () => {
        if (!window.confirm("Limpiar toda la lista de pedidos?")) return;
        setData(d => Object.assign({}, d, { pedidos: [] }));
        showToast("Lista limpiada", "info");
    };

    return React.createElement("div", { className: "card" },
        // Header
        React.createElement("div", { style: { marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 } },
            React.createElement("div", null,
                React.createElement("div", { className: "section-title" }, "Pedidos"),
                React.createElement("div", { style: { fontSize: 13, color: "#6b7280", marginTop: 4 } }, pedidos.length + " producto(s) en lista")),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                bajoMinimo.length > 0 && React.createElement("button", { onClick: agregarBajoMinimo, style: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement(Icon, { name: "alert", size: 13 }), bajoMinimo.length + " bajo minimo"),
                pedidos.length > 0 && React.createElement("button", { onClick: limpiarTodo, style: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 } }, "Limpiar todo"))),

        // Search
        pedidos.length > 0 && React.createElement("div", { style: { position: "relative", marginBottom: 14 } },
            React.createElement("div", { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" } }, React.createElement(Icon, { name: "search", size: 16 })),
            React.createElement("input", { className: "input-field", placeholder: "Buscar en pedidos...", value: busqueda, onChange: e => setBusqueda(e.target.value), style: { paddingLeft: 38 } })),

        // Empty state
        pedidos.length === 0
            ? React.createElement("div", { style: { textAlign: "center", padding: "50px 20px", color: "#374151" } },
                React.createElement(Icon, { name: "box", size: 44 }),
                React.createElement("div", { style: { marginTop: 14, fontSize: 15, color: "#6b7280" } }, "No hay productos en la lista de pedidos"),
                React.createElement("div", { style: { fontSize: 12, color: "#4b5563", marginTop: 6 } }, "Usá el botón + Pedir en Stock o agregá los productos bajo mínimo"))

            // Grouped by proveedor
            : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
                Object.entries(porProveedor).filter(([prov, items]) =>
                    !busqueda || items.some(p => p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) || (p.descripcion||"").toLowerCase().includes(busqueda.toLowerCase()))
                ).map(([prov, items]) =>
                    React.createElement("div", { key: prov, style: { background: "#1e2230", borderRadius: 14, border: "1px solid #1e2535", overflow: "hidden" } },
                        // Proveedor header
                        React.createElement("div", { style: { padding: "12px 16px", borderBottom: "1px solid #111827", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(99,102,241,0.08)" } },
                            React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "#818cf8" } }, prov),
                            React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                                React.createElement("span", { style: { fontSize: 12, color: "#6b7280" } }, items.length + " item(s)"),
                                React.createElement("button", { onClick: () => exportarProveedor(prov, items), style: { background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 } },
                                    React.createElement(Icon, { name: "download", size: 12 }), " Exportar CSV"))),
                        // Products
                        React.createElement("div", null,
                            items.filter(p => !busqueda || p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) || (p.descripcion||"").toLowerCase().includes(busqueda.toLowerCase())).map((p, i) =>
                                React.createElement("div", { key: p.codigoRef, style: { padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < items.length-1 ? "1px solid #111827" : "none" } },
                                    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                                        React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
                                            React.createElement("span", { style: { fontSize: 12, color: "#818cf8", fontFamily: "monospace", fontWeight: 700 } }, p.codigoRef),
                                            React.createElement("span", { style: { fontSize: 11, color: "#4b5563" } }, p.codigoProv)),
                                        React.createElement("div", { style: { fontSize: 13, color: "#cbd5e1", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.descripcion)),
                                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                                        React.createElement("button", { onClick: () => cambiarCantidad(p.codigoRef, -1), style: { width: 28, height: 28, borderRadius: 6, background: "#374151", border: "none", color: "#f1f5f9", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" } }, "−"),
                                        React.createElement("input", { type: "number", min: 1, value: p.cantidad||1, onChange: e => setData(d => Object.assign({}, d, { pedidos: (d.pedidos||[]).map(x => x.codigoRef===p.codigoRef ? Object.assign({},x,{cantidad:Math.max(1,parseInt(e.target.value)||1)}) : x) })), style: { width: 44, height: 28, borderRadius: 6, background: "#1e2230", border: "1px solid #374151", color: "#f1f5f9", textAlign: "center", fontSize: 13, fontWeight: 700, fontFamily: "inherit" } }),
                                        React.createElement("button", { onClick: () => cambiarCantidad(p.codigoRef, 1), style: { width: 28, height: 28, borderRadius: 6, background: "#6366f1", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" } }, "+"),
                                        React.createElement("button", { onClick: () => quitarDePedido(p.codigoRef), style: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 6, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" } },
                                            React.createElement(Icon, { name: "trash", size: 13 }))))))))));
}


(function(){function startApp(){ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));}if(window.__fbReady)startApp();else{window.addEventListener('fbReady',startApp,{once:true});setTimeout(startApp,4000);}})();
