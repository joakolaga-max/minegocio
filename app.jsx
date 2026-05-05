const { useState, useEffect, useRef, useCallback } = React;

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const DB = {
  proveedores: Array.from({length: 10}, (_, i) => ({
    id: i + 1,
    nombre: `Proveedor ${i + 1}`,
    productos: []
  })),
  misProductos: [],
  margenes: { p1: 50, p2: 40, p3: 30, p4: 20 },
  stock: {}
};

const saveToFirebase = async (path, data) => {
  if (window.__fb) await window.__fb.save(path, data);
};
const loadFromFirebase = async (path) => {
  if (window.__fb) return window.__fb.load(path);
  return null;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const parsePrecio = (v) => {
  if (!v && v !== 0) return 0;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[$\s]/g, "").trim();
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  return parseFloat(s) || 0;
};

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n || 0);

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
    if (!row[0]) continue;
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

// ─── ICONS ───────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  store:    ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  tag:      ["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z", "M7 7h.01"],
  calc:     ["M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z", "M8 10h8", "M8 14h4"],
  box:      ["M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"],
  upload:   ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  search:   ["M11 17a6 6 0 100-12 6 6 0 000 12z", "M21 21l-4.35-4.35"],
  trash:    ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6"],
  plus:     ["M12 5v14", "M5 12h14"],
  check:    ["M20 6L9 17l-5-5"],
  alert:    ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z", "M12 9v4", "M12 17h.01"],
  camera:   ["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z", "M12 17a4 4 0 100-8 4 4 0 000 8z"],
  settings: ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  x:        ["M18 6L6 18", "M6 6l12 12"],
  scan:     ["M3 9V5a2 2 0 012-2h4", "M15 3h4a2 2 0 012 2v4", "M3 15v4a2 2 0 002 2h4", "M15 21h4a2 2 0 002-2v-4", "M7 12h10"],
  download: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  refresh:  ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0114.85-3.36L23 10", "M1 14l4.64 4.36A9 9 0 0020.49 15"],
};

const Icon = ({ name, size = 20 }) => {
  const paths = ICON_PATHS[name] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = { success: "#22c55e", error: "#ef4444", info: "#3b82f6" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: colors[type] || colors.info, color: "#fff",
      padding: "12px 20px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
      fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      display: "flex", alignItems: "center", gap: 10, maxWidth: 320,
      animation: "slideUp 0.3s ease"
    }}>
      <Icon name={type === "success" ? "check" : type === "error" ? "x" : "alert"} size={16} />
      {msg}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("proveedores");
  const [data, setData] = useState(DB);
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [syncing, setSyncing] = useState(false);
  const prevDataRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // FIX #1 y #2: esperar auth antes de cargar, y no pisar con array vacío
  useEffect(() => {
    const loadAll = async () => {
      if (!window.__fb)
        await new Promise(res => window.addEventListener("fbReady", res, { once: true }));
      if (!window.__authReady)
        await new Promise(res => window.addEventListener("authReady", res, { once: true }));
      if (!window.__user) {
        setLoaded(true);
        return;
      }
      setSyncing(true);
      try {
        const [provData, misData, config, stockData] = await Promise.all([
          loadFromFirebase("proveedores"),
          loadFromFirebase("misProductos"),
          loadFromFirebase("config"),
          loadFromFirebase("stock"),
        ]);
        setData(d => ({
          ...d,
          proveedores: (Array.isArray(provData) && provData.length > 0) ? provData : d.proveedores,
          misProductos: (Array.isArray(misData) && misData.length > 0) ? misData : d.misProductos,
          margenes: config?.margenes || d.margenes,
          stock: (stockData && typeof stockData === "object" && !Array.isArray(stockData)) ? stockData : d.stock,
        }));
      } catch (e) {
        showToast("Error al cargar datos", "error");
      }
      setSyncing(false);
      setLoaded(true);
    };
    loadAll();
  }, []);

  // Guardar en Firebase cuando cambian los datos
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      setSyncing(true);
      if (JSON.stringify(data.proveedores) !== JSON.stringify(prevDataRef.current?.proveedores))
        await saveToFirebase("proveedores", data.proveedores);
      if (JSON.stringify(data.misProductos) !== JSON.stringify(prevDataRef.current?.misProductos))
        await saveToFirebase("misProductos", data.misProductos);
      if (JSON.stringify(data.margenes) !== JSON.stringify(prevDataRef.current?.margenes))
        await saveToFirebase("config", { margenes: data.margenes });
      if (JSON.stringify(data.stock) !== JSON.stringify(prevDataRef.current?.stock))
        await saveToFirebase("stock", data.stock);
      prevDataRef.current = data;
      setSyncing(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [data, loaded]);

  const buscarEnProveedores = useCallback((codigo) => {
    for (const prov of data.proveedores) {
      const p = prov.productos.find(x => x.codigo === codigo);
      if (p) return { ...p, proveedor: prov.nombre };
    }
    return null;
  }, [data.proveedores]);

  const calcPrecioVenta = (costo, margenKey) => {
    const m = data.margenes[margenKey] / 100;
    if (m >= 1) return costo;
    return costo / (1 - m);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9" }}>
      <style>{`
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
      `}</style>

      <div style={{ background: "linear-gradient(135deg, #1e2230 0%, #16192a 100%)", borderBottom: "1px solid #1e2535", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="store" size={18} />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#f1f5f9", lineHeight: 1 }}>MiNegocio</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Sistema de Precios</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: syncing ? "#f59e0b" : "#22c55e", boxShadow: `0 0 8px ${syncing ? "#f59e0b" : "#22c55e"}`, transition: "all 0.3s" }} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>{syncing ? "Guardando..." : loaded ? "Sincronizado ☁️" : "Conectando..."}</span>
        </div>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>
        {tab === "proveedores" && <TabProveedores data={data} setData={setData} showToast={showToast} busqueda={busqueda} setBusqueda={setBusqueda} />}
        {tab === "precios" && <TabMisPrecios data={data} setData={setData} showToast={showToast} buscarEnProveedores={buscarEnProveedores} calcPrecioVenta={calcPrecioVenta} />}
        {tab === "calc" && <TabCalculadora data={data} showToast={showToast} buscarEnProveedores={buscarEnProveedores} calcPrecioVenta={calcPrecioVenta} />}
        {tab === "stock" && <TabStock data={data} setData={setData} showToast={showToast} />}
        {tab === "config" && <TabConfig data={data} setData={setData} showToast={showToast} />}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1e2230", borderTop: "1px solid #1e2535", display: "flex", justifyContent: "space-around", padding: "6px 0 8px", zIndex: 100 }}>
        {[
          { id: "proveedores", icon: "upload", label: "Proveedores" },
          { id: "precios", icon: "tag", label: "Mis Precios" },
          { id: "calc", icon: "calc", label: "Calculadora" },
          { id: "stock", icon: "box", label: "Stock" },
          { id: "config", icon: "settings", label: "Config" },
        ].map(n => (
          <button key={n.id} className={`nav-btn ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
            <Icon name={n.icon} size={22} />
            {n.label}
          </button>
        ))}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── TAB PROVEEDORES ──────────────────────────────────────────────────────────
function TabProveedores({ data, setData, showToast, busqueda, setBusqueda }) {
  const [provSel, setProvSel] = useState(0);
  const fileRef = useRef();
  const prov = data.proveedores[provSel];

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      let rows = [];
      try {
        if (isExcel) {
          const buf = new Uint8Array(ev.target.result);
          rows = parseExcel(buf);
        } else {
          rows = parseCSV(ev.target.result);
        }
      } catch (err) {
        showToast("Error al leer el archivo", "error"); return;
      }
      if (!rows.length) { showToast("No se encontraron productos en el archivo", "error"); return; }
      setData(d => {
        const provs = [...d.proveedores];
        provs[provSel] = { ...provs[provSel], productos: rows };
        return { ...d, proveedores: provs };
      });
      showToast(`✅ ${rows.length} productos cargados en ${prov.nombre}`, "success");
    };
    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
    e.target.value = "";
  };

  const filtrados = prov.productos.filter(p =>
    !busqueda || p.codigo.toLowerCase().includes(busqueda.toLowerCase()) || p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">📦 Proveedores</div>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Cargá la lista en Excel (.xlsx) o CSV — tal cual te la manda el proveedor</p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {data.proveedores.map((p, i) => (
          <button key={i} onClick={() => setProvSel(i)} style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid",
            borderColor: i === provSel ? "#6366f1" : "#374151",
            background: i === provSel ? "rgba(99,102,241,0.15)" : "transparent",
            color: i === provSel ? "#818cf8" : "#6b7280",
            cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
          }}>
            {p.nombre}
            {p.productos.length > 0 && (
              <span className="badge" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                {p.productos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>{prov.nombre}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              {prov.productos.length ? `${prov.productos.length} productos cargados` : "Sin productos — cargá el Excel o CSV"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {prov.productos.length > 0 && (
              <button className="btn-danger" onClick={() => {
                setData(d => { const ps = [...d.proveedores]; ps[provSel] = { ...ps[provSel], productos: [] }; return { ...d, proveedores: ps }; });
                showToast("Lista limpiada", "info");
              }}>
                <Icon name="trash" size={14} /> Limpiar
              </button>
            )}
            <button className="btn-primary" onClick={() => fileRef.current.click()}>
              <Icon name="upload" size={16} /> Cargar Excel / CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display: "none" }} onChange={handleFile} />
          </div>
        </div>
      </div>

      {prov.productos.length > 0 && (
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}>
            <Icon name="search" size={16} />
          </div>
          <input className="input-field" placeholder="Buscar por código o descripción..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
      )}

      {filtrados.length > 0 && (
        <div style={{ background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 110px", padding: "10px 16px", borderBottom: "1px solid #1e2535", fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span>Código</span><span>Descripción</span><span style={{ textAlign: "right" }}>Precio</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {filtrados.slice(0, 200).map((p, i) => (
              <div key={i} className="table-row" style={{ display: "grid", gridTemplateColumns: "130px 1fr 110px", padding: "10px 16px", borderBottom: "1px solid #111827", fontSize: 13, alignItems: "center" }}>
                <span style={{ color: "#818cf8", fontWeight: 600, fontFamily: "monospace" }}>{p.codigo}</span>
                <span style={{ color: "#cbd5e1" }}>{p.descripcion}</span>
                <span style={{ textAlign: "right", color: "#22c55e", fontWeight: 600 }}>{fmt(p.precio)}</span>
              </div>
            ))}
            {filtrados.length > 200 && (
              <div style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                Mostrando 200 de {filtrados.length} productos
              </div>
            )}
          </div>
        </div>
      )}

      {prov.productos.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
          <Icon name="upload" size={48} />
          <div style={{ marginTop: 16, fontSize: 15, color: "#6b7280" }}>Cargá el CSV del proveedor</div>
          <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>Excel o CSV: Código | Descripción | Precio</div>
        </div>
      )}
    </div>
  );
}

// ─── TAB MIS PRECIOS ──────────────────────────────────────────────────────────
function TabMisPrecios({ data, setData, showToast, buscarEnProveedores, calcPrecioVenta }) {
  const [codigoRef, setCodigoRef] = useState("");
  const [codigoProv, setCodigoProv] = useState("");
  const [margenSel, setMargenSel] = useState("p1");
  const [busqueda, setBusqueda] = useState("");
  const [editIdx, setEditIdx] = useState(null);

  const agregarProducto = () => {
    if (!codigoRef.trim() || !codigoProv.trim()) { showToast("Completá el código local y el código del proveedor", "error"); return; }
    const encontrado = buscarEnProveedores(codigoProv.trim());
    if (!encontrado) { showToast("Código del proveedor no encontrado en ninguna lista", "error"); return; }
    const yaExiste = data.misProductos.find(p => p.codigoRef === codigoRef.trim());
    if (yaExiste && editIdx === null) { showToast("El código local ya existe", "error"); return; }
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
      if (editIdx !== null) { lista[editIdx] = nuevo; } else { lista.push(nuevo); }
      return { ...d, misProductos: lista };
    });
    showToast(editIdx !== null ? "Producto actualizado" : "Producto agregado", "success");
    setCodigoRef(""); setCodigoProv(""); setMargenSel("p1"); setEditIdx(null);
  };

  const eliminar = (i) => {
    setData(d => { const lista = [...d.misProductos]; lista.splice(i, 1); return { ...d, misProductos: lista }; });
    showToast("Producto eliminado", "info");
  };

  const editar = (i) => {
    const p = data.misProductos[i];
    setCodigoRef(p.codigoRef); setCodigoProv(p.codigoProv); setMargenSel(p.margen); setEditIdx(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportarCSV = () => {
    const rows = data.misProductos.map(p => {
      const pv = calcPrecioVenta(p.precioCosto, p.margen);
      return `${p.codigoRef},${p.descripcion},${pv.toFixed(2)}`;
    });
    const blob = new Blob(["Codigo,Descripcion,Precio\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "mis_precios.csv"; a.click();
    showToast("CSV exportado listo para importar", "success");
  };

  const actualizarPrecios = () => {
    let actualizados = 0;
    setData(d => {
      const lista = d.misProductos.map(p => {
        const enc = buscarEnProveedores(p.codigoProv);
        if (enc && enc.precio !== p.precioCosto) { actualizados++; return { ...p, precioCosto: enc.precio, descripcion: enc.descripcion }; }
        return p;
      });
      return { ...d, misProductos: lista };
    });
    showToast(`${actualizados} precios actualizados desde proveedores`, actualizados > 0 ? "success" : "info");
  };

  const filtrados = data.misProductos.map((p, i) => ({ ...p, _i: i })).filter(p =>
    !busqueda || p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const margenLabel = { p1: "50%", p2: "40%", p3: "30%", p4: "20%" };

  return (
    <div className="card">
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="section-title">🏷️ Mis Precios</div>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Tu catálogo con márgenes personalizados</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={actualizarPrecios}><Icon name="refresh" size={14} /> Actualizar precios</button>
          {data.misProductos.length > 0 && <button className="btn-primary" onClick={exportarCSV}><Icon name="download" size={14} /> Exportar CSV</button>}
        </div>
      </div>

      <div style={{ background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 14 }}>
          {editIdx !== null ? "✏️ Editando producto" : "➕ Agregar producto"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" }}>Tu Código REF</label>
            <input className="input-field" placeholder="REF00001" value={codigoRef} onChange={e => setCodigoRef(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" }}>Código Proveedor</label>
            <input className="input-field" placeholder="IMP4512" value={codigoProv} onChange={e => setCodigoProv(e.target.value)}
              onBlur={() => {
                if (codigoProv) {
                  const enc = buscarEnProveedores(codigoProv.trim());
                  if (!enc) showToast("Código no encontrado en ningún proveedor", "error");
                }
              }} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" }}>Margen de venta</label>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(margenLabel).map(([k, v]) => (
              <button key={k} onClick={() => setMargenSel(k)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 10, border: "1px solid",
                borderColor: margenSel === k ? "#6366f1" : "#374151",
                background: margenSel === k ? "rgba(99,102,241,0.2)" : "transparent",
                color: margenSel === k ? "#818cf8" : "#6b7280",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, transition: "all 0.2s"
              }}>{v}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
            Los % exactos se configuran en la pestaña ⚙️ Config
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={agregarProducto}>
            <Icon name={editIdx !== null ? "check" : "plus"} size={16} />
            {editIdx !== null ? "Guardar cambios" : "Agregar producto"}
          </button>
          {editIdx !== null && (
            <button className="btn-ghost" onClick={() => { setEditIdx(null); setCodigoRef(""); setCodigoProv(""); setMargenSel("p1"); }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {data.misProductos.length > 0 && (
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}>
            <Icon name="search" size={16} />
          </div>
          <input className="input-field" placeholder="Buscar en mis productos..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
      )}

      {filtrados.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map((p) => {
            const pv = calcPrecioVenta(p.precioCosto, p.margen);
            return (
              <div key={p._i} className="table-row" style={{ background: "#1e2230", borderRadius: 12, border: "1px solid #1e2535", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: "#818cf8", fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{p.codigoRef}</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>→</span>
                    <span style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{p.codigoProv}</span>
                    <span className="badge" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: 10 }}>
                      {margenLabel[p.margen]}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.descripcion}</div>
                  <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Costo: <span style={{ color: "#94a3b8" }}>{fmt(p.precioCosto)}</span></span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Venta: <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(pv)}</span></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost" style={{ padding: "6px 10px" }} onClick={() => editar(p._i)}><Icon name="settings" size={14} /></button>
                  <button className="btn-danger" style={{ padding: "6px 10px" }} onClick={() => eliminar(p._i)}><Icon name="trash" size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : data.misProductos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
          <Icon name="tag" size={48} />
          <div style={{ marginTop: 16, fontSize: 15, color: "#6b7280" }}>Todavía no agregaste productos</div>
        </div>
      ) : null}
    </div>
  );
}

// ─── TAB CALCULADORA ─────────────────────────────────────────────────────────
function TabCalculadora({ data, showToast, buscarEnProveedores, calcPrecioVenta }) {
  const [items, setItems] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef();
  const inputRef = useRef();

  const buscarYAgregar = (cod) => {
    const codLimpio = cod.trim().toUpperCase();
    const miProd = data.misProductos.find(p => p.codigoRef === codLimpio || p.codigoProv === codLimpio);
    if (!miProd) { showToast("Código no encontrado en Mis Precios", "error"); return; }
    const pv = calcPrecioVenta(miProd.precioCosto, miProd.margen);
    const existe = items.findIndex(i => i.codigoRef === miProd.codigoRef);
    if (existe >= 0) {
      setItems(its => { const n = [...its]; n[existe] = { ...n[existe], cantidad: n[existe].cantidad + 1 }; return n; });
    } else {
      setItems(its => [...its, { codigoRef: miProd.codigoRef, descripcion: miProd.descripcion, precioVenta: pv, cantidad: 1 }]);
    }
    setCodigo("");
  };

  const total = items.reduce((s, i) => s + i.precioVenta * i.cantidad, 0);

  const cambiarCantidad = (i, delta) => {
    setItems(its => {
      const n = [...its];
      const nueva = n[i].cantidad + delta;
      if (nueva <= 0) { n.splice(i, 1); } else { n[i] = { ...n[i], cantidad: nueva }; }
      return n;
    });
  };

  // FIX #4: aviso honesto + cleanup al desmontar
  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      setScanning(true);
      showToast("Cámara activa — ingresá el código manualmente", "info");
    } catch {
      showToast("No se pudo acceder a la cámara", "error");
    }
  };

  const stopScan = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject)
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">🧮 Calculadora</div>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Armá presupuestos rápido</p>
      </div>

      <div style={{ background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={inputRef} className="input-field" placeholder="Ingresá código REF o del proveedor..." value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && buscarYAgregar(codigo)}
            style={{ flex: 1 }} />
          <button className="btn-primary" onClick={() => buscarYAgregar(codigo)}><Icon name="plus" size={16} /></button>
          <button className="btn-ghost" onClick={scanning ? stopScan : startScan} style={{ padding: "10px 14px", color: scanning ? "#22c55e" : "#6b7280" }}>
            <Icon name="camera" size={18} />
          </button>
        </div>

        {scanning && (
          <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", position: "relative" }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12, display: "block" }} />
            <div style={{ position: "absolute", inset: 0, border: "2px solid #6366f1", borderRadius: 12, pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: 2, background: "rgba(99,102,241,0.7)", boxShadow: "0 0 8px #6366f1" }} />
            <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "#a5b4fc", background: "rgba(0,0,0,0.5)", padding: "4px 0" }}>
              Lectura automática no disponible — ingresá el código arriba
            </div>
            <button onClick={stopScan} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: "#1e2230", borderRadius: 12, border: "1px solid #1e2535", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#818cf8", fontFamily: "monospace", fontSize: 12, marginBottom: 2 }}>{item.codigoRef}</div>
                  <div style={{ fontSize: 13, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.descripcion}</div>
                  <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, marginTop: 2 }}>{fmt(item.precioVenta)} c/u</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => cambiarCantidad(i, -1)} style={{ width: 28, height: 28, borderRadius: 8, background: "#374151", border: "none", color: "#f1f5f9", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: "center" }}>{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(i, 1)} style={{ width: 28, height: 28, borderRadius: 8, background: "#6366f1", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <div style={{ fontWeight: 700, color: "#22c55e", minWidth: 90, textAlign: "right" }}>
                  {fmt(item.precioVenta * item.cantidad)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "linear-gradient(135deg, #1e3a2e, #1a3025)", borderRadius: 16, border: "1px solid #166534", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#86efac" }}>TOTAL</span>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#22c55e" }}>{fmt(total)}</span>
          </div>
          <button onClick={() => { setItems([]); showToast("Calculadora limpiada", "info"); }} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="trash" size={16} /> Limpiar todo
          </button>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
          <Icon name="scan" size={48} />
          <div style={{ marginTop: 16, fontSize: 15, color: "#6b7280" }}>Ingresá o escaneá un código</div>
        </div>
      )}
    </div>
  );
}

// ─── TAB STOCK ───────────────────────────────────────────────────────────────
function TabStock({ data, setData, showToast }) {
  const [busqueda, setBusqueda] = useState("");

  const productos = data.misProductos.map((p, i) => {
    const stock = data.stock?.[p.codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 };
    const actual = (stock.inicial || 0) + (stock.entradas || 0) - (stock.salidas || 0);
    return { ...p, _i: i, stock, actual };
  }).filter(p => !busqueda || p.codigoRef.toLowerCase().includes(busqueda.toLowerCase()) || p.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

  const updateStock = (codigoRef, field, val) => {
    setData(d => ({
      ...d,
      stock: {
        ...d.stock,
        [codigoRef]: {
          ...(d.stock?.[codigoRef] || { inicial: 0, entradas: 0, salidas: 0, minimo: 0 }),
          [field]: Math.max(0, parseInt(val) || 0)
        }
      }
    }));
  };

  const alertas = data.misProductos.filter(p => {
    const s = data.stock?.[p.codigoRef] || {};
    const actual = (s.inicial || 0) + (s.entradas || 0) - (s.salidas || 0);
    return s.minimo > 0 && actual < s.minimo;
  });

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">📦 Stock</div>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Control de inventario</p>
      </div>

      {alertas.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444", fontWeight: 700, marginBottom: 8 }}>
            <Icon name="alert" size={16} /> {alertas.length} producto{alertas.length > 1 ? "s" : ""} bajo mínimo
          </div>
          {alertas.map(p => (
            <div key={p.codigoRef} style={{ fontSize: 12, color: "#fca5a5", marginTop: 4 }}>• {p.codigoRef} — {p.descripcion}</div>
          ))}
        </div>
      )}

      {data.misProductos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
          <Icon name="box" size={48} />
          <div style={{ marginTop: 16, fontSize: 15, color: "#6b7280" }}>Primero agregá productos en "Mis Precios"</div>
        </div>
      ) : (
        <>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}>
              <Icon name="search" size={16} />
            </div>
            <input className="input-field" placeholder="Buscar producto..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {productos.map(p => {
              const bajo = p.stock.minimo > 0 && p.actual < p.stock.minimo;
              return (
                <div key={p.codigoRef} style={{ background: bajo ? "rgba(239,68,68,0.08)" : "#1e2230", borderRadius: 12, border: `1px solid ${bajo ? "rgba(239,68,68,0.3)" : "#1e2535"}`, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#818cf8", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{p.codigoRef}</span>
                        {bajo && <span className="badge" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>⚠ Bajo mínimo</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 2 }}>{p.descripcion}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: bajo ? "#ef4444" : "#22c55e" }}>{p.actual}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>en stock</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Inicial", field: "inicial", color: "#6b7280" },
                      { label: "Entradas", field: "entradas", color: "#22c55e" },
                      { label: "Salidas", field: "salidas", color: "#ef4444" },
                      { label: "Mínimo", field: "minimo", color: "#f59e0b" },
                    ].map(({ label, field, color }) => (
                      <div key={field}>
                        <div style={{ fontSize: 11, color, marginBottom: 4, fontWeight: 600 }}>{label}</div>
                        <input type="number" min="0" className="input-field"
                          value={p.stock[field] || 0}
                          onChange={e => updateStock(p.codigoRef, field, e.target.value)}
                          style={{ padding: "6px 8px", fontSize: 13, textAlign: "center" }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB CONFIG ──────────────────────────────────────────────────────────────
function TabConfig({ data, setData, showToast }) {
  const [margenes, setMargenes] = useState({ ...data.margenes });
  const [nombres, setNombres] = useState(data.proveedores.map(p => p.nombre));

  // FIX #3: sincronizar cuando llegan datos de Firebase después del montaje
  useEffect(() => { setMargenes({ ...data.margenes }); }, [data.margenes]);
  useEffect(() => { setNombres(data.proveedores.map(p => p.nombre)); }, [data.proveedores]);

  const guardar = () => {
    setData(d => ({
      ...d,
      margenes,
      proveedores: d.proveedores.map((p, i) => ({ ...p, nombre: nombres[i] || p.nombre }))
    }));
    showToast("Configuración guardada", "success");
  };

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">⚙️ Configuración</div>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Personalizá el sistema</p>
      </div>

      <div style={{ background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: "#818cf8", marginBottom: 16, fontSize: 14 }}>Márgenes de venta</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Fórmula: Precio venta = Costo / (1 − margen)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["p1", "p2", "p3", "p4"].map((k, i) => (
            <div key={k}>
              <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "block" }}>% {i + 1}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" min="1" max="99" className="input-field" value={margenes[k]}
                  onChange={e => setMargenes(m => ({ ...m, [k]: parseInt(e.target.value) || 0 }))}
                  style={{ flex: 1 }} />
                <span style={{ color: "#6b7280", fontSize: 14 }}>%</span>
              </div>
              <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
                Ej: $1000 costo → {margenes[k] < 100 ? fmt(1000 / (1 - margenes[k] / 100)) : "∞"} venta
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#1e2230", borderRadius: 16, border: "1px solid #1e2535", padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: "#818cf8", marginBottom: 16, fontSize: 14 }}>Nombres de proveedores</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {nombres.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#6b7280", minWidth: 20 }}>{i + 1}.</span>
              <input className="input-field" value={n} onChange={e => setNombres(ns => { const c = [...ns]; c[i] = e.target.value; return c; })} />
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px" }} onClick={guardar}>
        <Icon name="check" size={16} /> Guardar configuración
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
