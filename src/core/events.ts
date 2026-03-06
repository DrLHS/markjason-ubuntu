type Handler = (...args: any[]) => void;

const handlers = new Map<string, Set<Handler>>();

export function on(event: string, handler: Handler): () => void {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(handler);
  return () => handlers.get(event)?.delete(handler);
}

export function emit(event: string, ...args: any[]): void {
  handlers.get(event)?.forEach((h) => {
    try { h(...args); } catch (e) { console.error(`Event handler error [${event}]:`, e); }
  });
}

// Event names
export const Events = {
  TAB_OPENED: "tab:opened",
  TAB_CLOSED: "tab:closed",
  TAB_ACTIVATED: "tab:activated",
  TAB_DIRTY: "tab:dirty",
  CONTENT_CHANGED: "content:changed",
  FILE_SAVED: "file:saved",
  FILE_EXTERNAL_CHANGE: "file:external-change",
  PREVIEW_TOGGLE: "preview:toggle",
  SIDEBAR_TOGGLE: "sidebar:toggle",
  QUICK_OPEN: "quick-open:show",
  EXPORT_IMAGE: "export:image",
  RENDER_ALL: "render:all",
} as const;
