export const saveToFirebase = async (path: string, data: unknown): Promise<void> => {
  const w = window as any;
  if (w.__fb) await w.__fb.save(path, data);
};

export const loadFromFirebase = async (path: string): Promise<unknown> => {
  const w = window as any;
  if (w.__fb) return await w.__fb.load(path);
  return null;
};

// Cada foto se guarda en su propio documento (evita el límite de 1MB de Firestore)
export const saveFoto = async (codigoRef: string, base64: string): Promise<void> => {
  const w = window as any;
  if (w.__fb?.saveFoto) await w.__fb.saveFoto(codigoRef, base64);
};

export const deleteFoto = async (codigoRef: string): Promise<void> => {
  const w = window as any;
  if (w.__fb?.deleteFoto) await w.__fb.deleteFoto(codigoRef);
};

export const loadFotos = async (): Promise<Record<string, string>> => {
  const w = window as any;
  if (w.__fb?.loadFotos) return await w.__fb.loadFotos();
  return {};
};

// Cada proveedor se guarda en su propio documento (evita el límite de 1MB de Firestore
// cuando los 10 proveedores combinados, con miles de productos, superan ese tamaño)
export const saveProveedor = async (id: number, proveedor: unknown): Promise<void> => {
  const w = window as any;
  if (w.__fb?.saveProveedor) await w.__fb.saveProveedor(id, proveedor);
};

export const loadProveedores = async (): Promise<Record<string, any> | null> => {
  const w = window as any;
  if (w.__fb?.loadProveedores) return await w.__fb.loadProveedores();
  return null;
};
