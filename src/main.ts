import { on, emit, Events } from "./core/events";
import { setupKeybindings } from "./core/keybindings";
import { setupFileWatchListener } from "./core/file-service";
import { getState, getActiveTab } from "./core/state";
import { renderTabBar } from "./components/tab-bar";
import { renderSidebar } from "./components/sidebar";
import { renderEditorPane, replaceEditorContent, forceRecreateEditor } from "./components/editor-pane";
import { renderPreviewPane, togglePreview, initPreviewScrollSync } from "./components/preview-pane";
import { setupQuickOpen, showQuickOpen } from "./components/quick-open";
import { exportPreviewAsImage } from "./core/export-image";

function renderAll(): void {
  renderTabBar();
  renderSidebar();
  renderEditorPane();
  renderPreviewPane();
}

// Event wiring
on(Events.RENDER_ALL, renderAll);
on(Events.TAB_OPENED, renderAll);
on(Events.TAB_ACTIVATED, renderAll);
on(Events.TAB_CLOSED, renderAll);
on(Events.TAB_DIRTY, () => { renderTabBar(); renderSidebar(); });
on(Events.FILE_SAVED, renderAll);
on(Events.CONTENT_CHANGED, () => { renderPreviewPane(); });
on(Events.PREVIEW_TOGGLE, () => { togglePreview(); renderAll(); });
on(Events.SIDEBAR_TOGGLE, () => {
  const state = getState();
  state.sidebarVisible = !state.sidebarVisible;
  renderAll();
});
on(Events.QUICK_OPEN, showQuickOpen);
on(Events.EXPORT_IMAGE, exportPreviewAsImage);
on(Events.FILE_EXTERNAL_CHANGE, (tabId: string, _path: string, newContent: string, isDirty: boolean) => {
  if (isDirty) {
    const reload = confirm(`File "${_path.split("/").pop()}" was modified externally. Reload and lose local changes?`);
    if (!reload) return;
    // User chose to reload — update the tab
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

// Initialize
setupKeybindings();
setupQuickOpen();
setupFileWatchListener();
initPreviewScrollSync();
renderAll();
