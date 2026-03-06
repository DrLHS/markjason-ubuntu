import { emit, Events } from "./events";
import { openFileDialog, saveCurrentFile } from "./file-service";
import { getState, setActiveTab, removeTab, getActiveTab } from "./state";

export function setupKeybindings(): void {
  document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === "o") {
      e.preventDefault();
      openFileDialog();
      return;
    }

    if (ctrl && e.key === "s") {
      e.preventDefault();
      saveCurrentFile();
      return;
    }

    if (ctrl && e.key === "w") {
      e.preventDefault();
      const tab = getActiveTab();
      if (tab) {
        removeTab(tab.id);
        emit(Events.TAB_CLOSED, tab.id);
        emit(Events.RENDER_ALL);
      }
      return;
    }

    if (ctrl && e.key === "e") {
      e.preventDefault();
      emit(Events.PREVIEW_TOGGLE);
      return;
    }

    if (ctrl && e.key === "b") {
      e.preventDefault();
      emit(Events.SIDEBAR_TOGGLE);
      return;
    }

    if (ctrl && e.key === "k") {
      e.preventDefault();
      emit(Events.QUICK_OPEN);
      return;
    }

    if (ctrl && e.shiftKey && e.key === "E") {
      e.preventDefault();
      emit(Events.EXPORT_IMAGE);
      return;
    }

    if (ctrl && e.key === "Tab") {
      e.preventDefault();
      cycleTab(e.shiftKey ? -1 : 1);
      return;
    }

    if (ctrl && e.key >= "1" && e.key <= "9") {
      e.preventDefault();
      const idx = parseInt(e.key) - 1;
      const state = getState();
      if (idx < state.tabs.length) {
        setActiveTab(state.tabs[idx].id);
        emit(Events.TAB_ACTIVATED, state.tabs[idx].id);
        emit(Events.RENDER_ALL);
      }
      return;
    }
  });
}

function cycleTab(direction: number): void {
  const state = getState();
  if (state.tabs.length === 0) return;
  const currentIdx = state.tabs.findIndex((t) => t.id === state.activeTabId);
  const nextIdx = (currentIdx + direction + state.tabs.length) % state.tabs.length;
  setActiveTab(state.tabs[nextIdx].id);
  emit(Events.TAB_ACTIVATED, state.tabs[nextIdx].id);
  emit(Events.RENDER_ALL);
}
