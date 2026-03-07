const STORAGE_KEY = "markjason:session";

export interface SessionData {
  openFiles: string[];       // file paths in tab order
  activeFile: string | null; // path of active tab
  sidebarVisible: boolean;
  previewVisible: boolean;
}

export function saveSession(data: SessionData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be unavailable
  }
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}
