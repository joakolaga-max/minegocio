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

const PATHS = ['proveedores', 'misProductos', 'config', 'stock', 'ventas', 'fotos', 'pedidos', 'pedidosHistorial', 'presupuestos'] as const;

export function useAppData(user: string | null) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const prevRef = useRef<AppData | null>(null);

  const loadAll = useCallback(async () => {
    setSyncing(true);
    try {
      const [provData, misData, config, stockData, ventasData, fotosData, pedidosData, pedHistData, presupuestosData] =
        await Promise.all(PATHS.map(p => loadFromFirebase(p)));

      setData(d => {
        const newData: AppData = {
          ...d,
          proveedores: (provData as any)?.length ? provData as any : d.proveedores,
          misProductos: (misData as any) ?? d.misProductos,
          margenes: (config as any)?.margenes ?? d.margenes,
          empresa: (config as any)?.empresa ?? d.empresa,
          telefono: (config as any)?.telefono ?? d.telefono,
          direccion: (config as any)?.direccion ?? d.direccion,
          stock: (stockData as any) ?? d.stock,
          ventas: (ventasData as any) ?? d.ventas,
          fotos: (fotosData as any) ?? d.fotos,
          pedidos: (pedidosData as any) ?? d.pedidos,
          pedidosHistorial: (pedHistData as any) ?? d.pedidosHistorial,
          presupuestos: (presupuestosData as any) ?? d.presupuestos,
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

  // Load when user is authenticated
  useEffect(() => {
    if (user) {
      setLoaded(false);
      loadAll();
    } else {
      setLoaded(false);
    }
  }, [user, loadAll]);

  // Save changes (debounced)
  useEffect(() => {
    if (!loaded || !user) return;
    const t = setTimeout(async () => {
      const prev = prevRef.current;
      if (!prev) return;
      setSyncing(true);
      const s = (key: keyof AppData) => JSON.stringify(data[key]) !== JSON.stringify(prev[key]);
      const saves: Promise<void>[] = [];
      if (s('proveedores')) saves.push(saveToFirebase('proveedores', data.proveedores));
      if (s('misProductos')) saves.push(saveToFirebase('misProductos', data.misProductos));
      if (s('margenes') || s('misProductos') || s('empresa') || s('telefono') || s('direccion'))
        saves.push(saveToFirebase('config', { margenes: data.margenes, empresa: data.empresa, telefono: data.telefono, direccion: data.direccion }));
      if (s('stock')) saves.push(saveToFirebase('stock', data.stock));
      if (s('ventas')) saves.push(saveToFirebase('ventas', data.ventas));
      if (s('fotos')) saves.push(saveToFirebase('fotos', data.fotos));
      if (s('pedidos')) saves.push(saveToFirebase('pedidos', data.pedidos));
      if (s('pedidosHistorial')) saves.push(saveToFirebase('pedidosHistorial', data.pedidosHistorial));
      if (s('presupuestos')) saves.push(saveToFirebase('presupuestos', data.presupuestos));
      if (saves.length > 0) await Promise.all(saves);
      prevRef.current = data;
      setSyncing(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [data, loaded, user]);

  return { data, setData, loaded, syncing };
}
