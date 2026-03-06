import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  getState, findTabByPath, addTab, generateTabId, detectFileType,
  setActiveTab, getActiveTab, type TabInfo,
} from "./state";
import { emit, Events } from "./events";

export async function openFileDialog(): Promise<void> {
  const result = await open({
    multiple: true,
    filters: [
      { name: "Supported Files", extensions: ["md", "markdown", "json", "jsonc", "env"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (!result) return;
  const paths = Array.isArray(result) ? result : [result];
  for (const p of paths) {
    await openFile(p);
  }
}

export async function openFile(filePath: string): Promise<void> {
  const existing = findTabByPath(filePath);
  if (existing) {
    setActiveTab(existing.id);
    emit(Events.TAB_ACTIVATED, existing.id);
    return;
  }

  const content = await readTextFile(filePath);
  const fileName = filePath.split("/").pop() || filePath;
  const fileType = detectFileType(fileName);
  const tab: TabInfo = {
    id: generateTabId(),
    filePath,
    fileName,
    fileType,
    dirty: false,
    editorState: null,
    content,
  };

  addTab(tab);
  emit(Events.TAB_OPENED, tab);

  // Start watching
  try {
    await invoke("watch_file", { path: filePath });
  } catch (_) {
    // watcher not available in dev sometimes
  }
}

export async function saveCurrentFile(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;

  if (!tab.filePath) {
    const path = await save({
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "JSON", extensions: ["json"] },
        { name: "Env", extensions: ["env"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (!path) return;
    tab.filePath = path;
    tab.fileName = path.split("/").pop() || path;
    tab.fileType = detectFileType(tab.fileName);
  }

  await writeTextFile(tab.filePath, tab.content);
  tab.dirty = false;
  emit(Events.FILE_SAVED, tab.id);
}

export function setupFileWatchListener(): void {
  listen<{ path: string }>("file-changed", async (event) => {
    const { path } = event.payload;
    const tab = findTabByPath(path);
    if (!tab) return;

    if (tab.dirty) {
      emit(Events.FILE_EXTERNAL_CHANGE, tab.id, path);
    } else {
      const content = await readTextFile(path);
      tab.content = content;
      tab.editorState = null;
      emit(Events.FILE_EXTERNAL_CHANGE, tab.id, path, content);
    }
  });
}
