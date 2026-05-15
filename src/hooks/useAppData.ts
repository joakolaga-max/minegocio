import { useState, useEffect, useRef, useCallback } from 'react';
import { AppData, Margenes } from '../types';
import { loadFromFirebase, saveToFirebase } from '../lib/firebase';

const DEFAULT_MARGENES: Margenes = { p1: 50, p2: 40, p3: 30, p4: 20 };

const DEFAULT_DATA: AppData = {
  proveedores: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, nombre: `Proveedor ${i + 1}`, productos: [] })),
  misProductos: [],
  margenes: DEFAULT_MARGENES,
  stock: {},
  ventas: [],
  fotos: {},
  pedidos: [],
  pedidosHistorial: [],
};

const PATHS = ['proveedores', 'misProductos', 'config', 'stock', 'ventas', 'fotos', 'pedidos', 'pedidosHistorial'] as const;

export function useAppData() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const prevRef = useRef<AppData | null>(null);

  // Load all data from Firebase on mount
  const loadAll = useCallback(async () => {
    setSyncing(true);
    try {
      const [provData, misData, config, stockData, ventasData, fotosData, pedidosData, pedHistData] =
        await Promise.all(PATHS.map(p => loadFromFirebase(p)));

      setData(d => {
        const newData: AppData = {
          ...d,
          proveedores: (provData as any)?.length ? provData as any : d.proveedores,
          misProductos: (misData as any) ?? d.misProductos,
          margenes: (config as any)?.margenes ?? d.margenes,
          stock: (stockData as any) ?? d.stock,
          ventas: (ventasData as any) ?? d.ventas,
          fotos: (fotosData as any) ?? d.fotos,
          pedidos: (pedidosData as any) ?? d.pedidos,
          pedidosHistorial: (pedHistData as any) ?? d.pedidosHistorial,
        };
        prevRef.current = newData;
        return newData;
      });
    } catch (e) {
      console.error('Load error:', e);
    }
    setSyncing(false);
    setLoaded(true);
  }, []);

  // Listen for auth ready
  useEffect(() => {
    const w = window as any;
    const onAuth = () => {
      if (w.__user) loadAll();
    };
    if (w.__authReady && w.__user) loadAll();
    window.addEventListener('authReady', onAuth);
    return () => window.removeEventListener('authReady', onAuth);
  }, [loadAll]);

  // Save changes to Firebase (debounced, only changed fields)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      const prev = prevRef.current;
      if (!prev) return;
      setSyncing(true);
      const saves: Promise<void>[] = [];
      const s = (key: keyof AppData) => JSON.stringify(data[key]) !== JSON.stringify(prev[key]);

      if (s('proveedores')) saves.push(saveToFirebase('proveedores', data.proveedores));
      if (s('misProductos')) saves.push(saveToFirebase('misProductos', data.misProductos));
      if (s('margenes') || s('misProductos')) saves.push(saveToFirebase('config', { margenes: data.margenes }));
      if (s('stock')) saves.push(saveToFirebase('stock', data.stock));
      if (s('ventas')) saves.push(saveToFirebase('ventas', data.ventas));
      if (s('fotos')) saves.push(saveToFirebase('fotos', data.fotos));
      if (s('pedidos')) saves.push(saveToFirebase('pedidos', data.pedidos));
      if (s('pedidosHistorial')) saves.push(saveToFirebase('pedidosHistorial', data.pedidosHistorial));

      await Promise.all(saves);
      prevRef.current = data;
      setSyncing(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [data, loaded]);

  return { data, setData, loaded, syncing };
}
