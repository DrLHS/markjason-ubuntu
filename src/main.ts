import { on, emit, Events } from "./core/events";
import { setupKeybindings } from "./core/keybindings";
import { openFile, setupFileWatchListener } from "./core/file-service";
import { getState, getActiveTab } from "./core/state";
import { saveSession, loadSession } from "./core/session";
import { renderTabBar } from "./components/tab-bar";
import { renderSidebar } from "./components/sidebar";
import { renderEditorPane, replaceEditorContent, forceRecreateEditor } from "./components/editor-pane";
import { renderPreviewPane, togglePreview, initPreviewScrollSync } from "./components/preview-pane";
import { setupQuickOpen, showQuickOpen } from "./components/quick-open";
import { exportPreviewAsImage } from "./core/export-image";
import { listen } from "@tauri-apps/api/event";

function renderAll(): void {
  renderTabBar();
  renderSidebar();
  renderEditorPane();
  renderPreviewPane();
}

function persistSession(): void {
  const state = getState();
  saveSession({
    openFiles: state.tabs.map((t) => t.filePath),
    activeFile: state.tabs.find((t) => t.id === state.activeTabId)?.filePath ?? null,
    sidebarVisible: state.sidebarVisible,
    previewVisible: state.previewVisible,
  });
}

// Event wiring
on(Events.RENDER_ALL, renderAll);
on(Events.TAB_OPENED, () => { renderAll(); persistSession(); });
on(Events.TAB_ACTIVATED, () => { renderAll(); persistSession(); });
on(Events.TAB_CLOSED, () => { renderAll(); persistSession(); });
on(Events.TAB_DIRTY, () => { renderTabBar(); renderSidebar(); });
on(Events.FILE_SAVED, () => { renderAll(); persistSession(); });
on(Events.CONTENT_CHANGED, () => { renderPreviewPane(); });
on(Events.PREVIEW_TOGGLE, () => { togglePreview(); renderAll(); persistSession(); });
on(Events.SIDEBAR_TOGGLE, () => {
  const state = getState();
  state.sidebarVisible = !state.sidebarVisible;
  renderAll();
  persistSession();
});
on(Events.QUICK_OPEN, showQuickOpen);
on(Events.EXPORT_IMAGE, exportPreviewAsImage);
on(Events.FILE_EXTERNAL_CHANGE, (tabId: string, _path: string, newContent: string, isDirty: boolean) => {
  if (isDirty) {
    const reload = confirm(`File "${_path.split("/").pop()}" was modified externally. Reload and lose local changes?`);
    if (!reload) return;
    const state = getState();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.content = newContent;
      tab.editorState = null;
      tab.dirty = false;
    }
  }
  const active = getActiveTab();
  if (active && active.id === tabId) {
    forceRecreateEditor();
  }
  renderAll();
});

// Restore previous session
async function restoreSession(): Promise<void> {
  const session = loadSession();
  if (!session) return;

  const state = getState();
  state.sidebarVisible = session.sidebarVisible;
  state.previewVisible = session.previewVisible;

  for (const path of session.openFiles) {
    try {
      await openFile(path);
    } catch {
      // File may have been moved/deleted
    }
  }

  // Activate the previously active tab
  if (session.activeFile) {
    const tab = state.tabs.find((t) => t.filePath === session.activeFile);
    if (tab) {
      state.activeTabId = tab.id;
    }
  }
}

// Listen for files passed via CLI arguments (emitted from Rust backend)
async function openCliFiles(): Promise<void> {
  listen<string[]>("open-files", async (event) => {
    for (const path of event.payload) {
      try {
        await openFile(path);
      } catch (e) {
        console.warn("Failed to open CLI file:", path, e);
      }
    }
    renderAll();
    persistSession();
  });
}

// Initialize
setupKeybindings();
setupQuickOpen();
setupFileWatchListener();
initPreviewScrollSync();
openCliFiles();
restoreSession().then(() => renderAll());
