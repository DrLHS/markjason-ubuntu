import { getState, setActiveTab, removeTab, getActiveTab, type TabInfo } from "../core/state";
import { emit, Events } from "../core/events";

export function renderTabBar(): void {
  const container = document.getElementById("tab-bar")!;
  const state = getState();

  container.innerHTML = "";

  for (const tab of state.tabs) {
    const el = document.createElement("div");
    el.className = `tab${tab.id === state.activeTabId ? " active" : ""}${tab.dirty ? " dirty" : ""}`;
    el.dataset.tabId = tab.id;

    const dotClass = tab.fileType === "markdown" ? "md" : tab.fileType;

    el.innerHTML = `
      <span class="dot ${dotClass}"></span>
      <span class="tab-name">${escapeHtml(tab.fileName)}</span>
      <span class="close-btn">&times;</span>
    `;

    el.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).classList.contains("close-btn")) {
        closeTab(tab);
        return;
      }
      setActiveTab(tab.id);
      emit(Events.TAB_ACTIVATED, tab.id);
      emit(Events.RENDER_ALL);
    });

    container.appendChild(el);
  }
}

function closeTab(tab: TabInfo): void {
  if (tab.dirty) {
    if (!confirm(`"${tab.fileName}" has unsaved changes. Close anyway?`)) return;
  }
  removeTab(tab.id);
  emit(Events.TAB_CLOSED, tab.id);
  emit(Events.RENDER_ALL);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
