import { getState, setActiveTab, removeTab } from "../core/state";
import { emit, Events } from "../core/events";

export function renderSidebar(): void {
  const sidebar = document.getElementById("sidebar")!;
  const list = document.getElementById("sidebar-list")!;
  const state = getState();

  sidebar.classList.toggle("hidden", !state.sidebarVisible);
  list.innerHTML = "";

  for (const tab of state.tabs) {
    const el = document.createElement("div");
    el.className = `sidebar-item${tab.id === state.activeTabId ? " active" : ""}`;

    const dotClass = tab.fileType === "markdown" ? "md" : tab.fileType;
    el.innerHTML = `
      <span class="dot ${dotClass}" style="background: var(--${dotClass === "md" ? "blue" : dotClass === "json" ? "yellow" : dotClass === "env" ? "green" : "text-muted"})"></span>
      <span>${escapeHtml(tab.fileName)}</span>
    `;

    el.addEventListener("click", () => {
      setActiveTab(tab.id);
      emit(Events.TAB_ACTIVATED, tab.id);
      emit(Events.RENDER_ALL);
    });

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e, tab.id);
    });

    list.appendChild(el);
  }
}

function showContextMenu(e: MouseEvent, tabId: string): void {
  // Remove any existing context menu
  document.querySelector(".context-menu")?.remove();

  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.style.left = e.clientX + "px";
  menu.style.top = e.clientY + "px";

  const items = [
    { label: "Close", shortcut: "Ctrl+W", action: () => { removeTab(tabId); emit(Events.TAB_CLOSED, tabId); emit(Events.RENDER_ALL); } },
    { label: "Close Others", shortcut: "", action: () => closeOthers(tabId) },
  ];

  for (const item of items) {
    const el = document.createElement("div");
    el.className = "context-menu-item";
    el.innerHTML = `<span>${item.label}</span>${item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : ""}`;
    el.addEventListener("click", () => { menu.remove(); item.action(); });
    menu.appendChild(el);
  }

  document.body.appendChild(menu);

  const close = () => { menu.remove(); document.removeEventListener("click", close); };
  setTimeout(() => document.addEventListener("click", close), 0);
}

function closeOthers(keepId: string): void {
  const state = getState();
  const toRemove = state.tabs.filter((t) => t.id !== keepId).map((t) => t.id);
  for (const id of toRemove) {
    removeTab(id);
    emit(Events.TAB_CLOSED, id);
  }
  setActiveTab(keepId);
  emit(Events.RENDER_ALL);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
