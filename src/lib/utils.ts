export const fmtPeso = (n: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0);

export const fmtPesoInt = (n: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);

export const calcPrecioVenta = (costo: number, margen: string | number, margenes: Record<string, number>): number => {
  const pct = typeof margen === 'number' ? margen : (margenes[margen as string] ?? 50);
  const m = pct / 100;
  if (m >= 1) return costo;
  return costo / (1 - m);
};

export const todayStr = (): string => new Date().toLocaleDateString('es-AR');
export const nowStr = (): string => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
export const genId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2);
