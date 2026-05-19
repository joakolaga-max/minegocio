export const saveToFirebase = async (path: string, data: unknown): Promise<void> => {
  const w = window as any;
  if (w.__fb) await w.__fb.save(path, data);
};

export const loadFromFirebase = async (path: string): Promise<unknown> => {
  const w = window as any;
  if (w.__fb) return await w.__fb.load(path);
  return null;
};
