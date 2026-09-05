import { useState, useEffect, useRef, useCallback } from 'react';
import { AppData, Margenes } from '../types';
import { loadFromFirebase, saveToFirebase, loadFotos, saveProveedor, loadProveedores } from '../lib/firebase';

const DEFAULT_MARGENES: Margenes = { p1: 50, p2: 40, p3: 30, p4: 20 };

const proveedoresPorDefecto = () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, nombre: `Proveedor ${i + 1}`, productos: [] }));

const DEFAULT_DATA: AppData = {
  proveedores: proveedoresPorDefecto(),
  misProductos: [],
  margenes: DEFAULT_MARGENES,
  stock: {},
  ventas: [],
  fotos: {},
  pedidos: [],
  pedidosHistorial: [],
  presupuestos: [],
  empresa: '',
  telefono: '',
  direccion: '',
};

// 'proveedores' ya NO va acá: cada proveedor tiene su propio documento (ver saveProveedor/loadProveedores)
const PATHS = ['misProductos', 'config', 'stock', 'ventas', 'pedidos', 'pedidosHistorial', 'presupuestos'] as const;

export function useAppData(user: string | null) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const prevRef = useRef<AppData | null>(null);
  const dataRef = useRef<AppData>(data);
  const savingRef = useRef(false);

  useEffect(() => { dataRef.current = data; }, [data]);

  const loadAll = useCallback(async () => {
    setSyncing(true);
    try {
      const [misData, config, stockData, ventasData, pedidosData, pedHistData, presupuestosData] =
        await Promise.all(PATHS.map(p => loadFromFirebase(p)));
      // Las fotos se cargan por separado (cada una en su documento)
      const fotosData = await loadFotos();

      // Proveedores: combinar sistema nuevo (por documento) + sistema viejo (combinado) por si
      // la migración quedó a mitad de camino (ej. se cortó la conexión) — así ningún proveedor
      // se muestra vacío por error mientras se termina de migrar.
      let proveedoresFinal: AppData['proveedores'] | null = null;
      const porId = await loadProveedores();
      const viejo = await loadFromFirebase('proveedores');
      const viejoPorId: Record<number, any> = {};
      if (Array.isArray(viejo)) (viejo as any[]).forEach(p => { if (p && p.id) viejoPorId[p.id] = p; });

      if ((porId && Object.keys(porId).length > 0) || Object.keys(viejoPorId).length > 0) {
        proveedoresFinal = proveedoresPorDefecto().map(p => {
          const nuevo = porId?.[p.id];
          const legacy = viejoPorId[p.id];
          const elegido = nuevo || legacy || p;
          // Si este proveedor todavía no está en el sistema nuevo pero sí en el viejo, migrarlo ahora
          if (!nuevo && legacy) saveProveedor(p.id, legacy);
          return { ...p, ...elegido };
        });
      }

      setData(d => {
        const newData: AppData = {
          ...d,
          proveedores: proveedoresFinal ?? d.proveedores,
          misProductos: (misData as any) ?? d.misProductos,
          margenes: (config as any)?.margenes ?? d.margenes,
          empresa: (config as any)?.empresa ?? d.empresa ?? '',
          telefono: (config as any)?.telefono ?? d.telefono ?? '',
          direccion: (config as any)?.direccion ?? d.direccion ?? '',
          stock: (stockData as any) ?? d.stock,
          ventas: (ventasData as any) ?? d.ventas,
          fotos: (fotosData as any) ?? d.fotos,
          pedidos: (pedidosData as any) ?? d.pedidos,
          pedidosHistorial: (pedHistData as any) ?? d.pedidosHistorial,
          presupuestos: (presupuestosData as any) ?? d.presupuestos,
        };
        prevRef.current = newData;
        dataRef.current = newData;
        return newData;
      });
    } catch (e) {
      console.error('Load error:', e);
    }
    setSyncing(false);
    setLoaded(true);
  }, []);

  // Load when user is authenticated
  useEffect(() => {
    if (user) {
      setLoaded(false);
      loadAll();
    } else {
      setLoaded(false);
    }
  }, [user, loadAll]);

  // Guarda lo que haya cambiado entre prevRef.current y dataRef.current (usa el ref, no el
  // `data` capturado por closure, para que también funcione al llamarla desde el listener de
  // visibilitychange con el valor más actual posible)
  const flushSave = useCallback(async () => {
    if (!loaded || !user) return;
    const current = dataRef.current;
    const prev = prevRef.current;
    if (!prev || savingRef.current) return;
    const s = (key: keyof AppData) => JSON.stringify(current[key]) !== JSON.stringify(prev[key]);
    const saves: Promise<void>[] = [];

    // Proveedores: guardar SOLO el/los que cambiaron, cada uno en su propio documento
    // (nunca un combinado de los 10 — eso es lo que hacía saltar el límite de 1MB de Firestore)
    if (s('proveedores')) {
      current.proveedores.forEach((prov, i) => {
        const anterior = prev.proveedores[i];
        if (JSON.stringify(prov) !== JSON.stringify(anterior)) {
          saves.push(saveProveedor(prov.id, prov));
        }
      });
    }

    if (s('misProductos')) saves.push(saveToFirebase('misProductos', current.misProductos));
    if (s('margenes') || s('misProductos') || s('empresa') || s('telefono') || s('direccion'))
      saves.push(saveToFirebase('config', {
        margenes: current.margenes,
        empresa: current.empresa ?? '',
        telefono: current.telefono ?? '',
        direccion: current.direccion ?? '',
      }));
    if (s('stock')) saves.push(saveToFirebase('stock', current.stock));
    if (s('ventas')) saves.push(saveToFirebase('ventas', current.ventas));
    if (s('pedidos')) saves.push(saveToFirebase('pedidos', current.pedidos));
    if (s('pedidosHistorial')) saves.push(saveToFirebase('pedidosHistorial', current.pedidosHistorial));
    if (s('presupuestos')) saves.push(saveToFirebase('presupuestos', current.presupuestos));
    if (saves.length === 0) return;
    savingRef.current = true;
    setSyncing(true);
    try {
      await Promise.all(saves);
      prevRef.current = current;
    } finally {
      savingRef.current = false;
      setSyncing(false);
    }
  }, [loaded, user]);

  // Save changes (debounced) — cubre el caso normal: seguís usando la app, se guarda solo
  useEffect(() => {
    if (!loaded || !user) return;
    const t = setTimeout(() => { flushSave(); }, 1200);
    return () => clearTimeout(t);
  }, [data, loaded, user, flushSave]);

  // Guardado inmediato al salir/cambiar de pestaña/minimizar — cubre el caso en que el usuario
  // sale de la app ANTES de que se cumplan los 1.2s del guardado automático, para que ningún
  // cambio se pierda por salir demasiado rápido.
  useEffect(() => {
    if (!loaded || !user) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    const onPageHide = () => { flushSave(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
    };
  }, [loaded, user, flushSave]);

  return { data, setData, loaded, syncing };
}
