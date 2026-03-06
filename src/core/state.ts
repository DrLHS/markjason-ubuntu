import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";

export type FileType = "markdown" | "json" | "env" | "unknown";

export interface TabInfo {
  id: string;
  filePath: string;
  fileName: string;
  fileType: FileType;
  dirty: boolean;
  editorState: EditorState | null;
  content: string;
}

export interface AppState {
  tabs: TabInfo[];
  activeTabId: string | null;
  sidebarVisible: boolean;
  previewVisible: boolean;
}

const state: AppState = {
  tabs: [],
  activeTabId: null,
  sidebarVisible: true,
  previewVisible: true,
};

export function getState(): AppState {
  return state;
}

export function detectFileType(fileName: string): FileType {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".json") || lower.endsWith(".jsonc")) return "json";
  if (lower.startsWith(".env") || lower.endsWith(".env")) return "env";
  return "unknown";
}

export function generateTabId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function findTabByPath(path: string): TabInfo | undefined {
  return state.tabs.find((t) => t.filePath === path);
}

export function getActiveTab(): TabInfo | undefined {
  return state.tabs.find((t) => t.id === state.activeTabId);
}

export function addTab(tab: TabInfo): void {
  state.tabs.push(tab);
  state.activeTabId = tab.id;
}

export function removeTab(tabId: string): void {
  const idx = state.tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;
  state.tabs.splice(idx, 1);
  if (state.activeTabId === tabId) {
    state.activeTabId = state.tabs.length > 0
      ? state.tabs[Math.min(idx, state.tabs.length - 1)].id
      : null;
  }
}

export function setActiveTab(tabId: string): void {
  state.activeTabId = tabId;
}
