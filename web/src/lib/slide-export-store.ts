type SlideExport = {
  markdown: string;
  createdAt: number;
};

const exportsById = new Map<string, SlideExport>();
const exportTtlMs = 30 * 60 * 1000;

function removeExpiredExports() {
  const now = Date.now();

  for (const [id, slideExport] of exportsById) {
    if (now - slideExport.createdAt > exportTtlMs) {
      exportsById.delete(id);
    }
  }
}

export function createSlideExport(markdown: string) {
  removeExpiredExports();

  const id = crypto.randomUUID();
  exportsById.set(id, {
    markdown,
    createdAt: Date.now(),
  });

  return id;
}

export function getSlideExport(id: string) {
  removeExpiredExports();
  return exportsById.get(id);
}
