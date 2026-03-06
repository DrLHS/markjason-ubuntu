import { on, emit, Events } from "./core/events";
import { setupKeybindings } from "./core/keybindings";
import { setupFileWatchListener } from "./core/file-service";
import { getState, getActiveTab } from "./core/state";
import { renderTabBar } from "./components/tab-bar";
import { renderSidebar } from "./components/sidebar";
import { renderEditorPane, replaceEditorContent } from "./components/editor-pane";
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
on(Events.FILE_EXTERNAL_CHANGE, (_tabId: string, _path: string, newContent?: string) => {
  if (newContent !== undefined) {
    const tab = getActiveTab();
    if (tab && tab.id === _tabId) {
      replaceEditorContent(newContent);
    }
    renderAll();
  }
});

// Initialize
setupKeybindings();
setupQuickOpen();
setupFileWatchListener();
initPreviewScrollSync();
renderAll();
