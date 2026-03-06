import { getState, setActiveTab } from "../core/state";
import { emit, Events } from "../core/events";

let visible = false;
let selectedIdx = 0;

export function setupQuickOpen(): void {
  const overlay = document.getElementById("quick-open-overlay")!;
  const input = document.getElementById("quick-open-input") as HTMLInputElement;
  const results = document.getElementById("quick-open-results")!;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideQuickOpen();
  });

  input.addEventListener("input", () => {
    selectedIdx = 0;
    renderResults(input.value, results);
  });

  input.addEventListener("keydown", (e) => {
    const items = results.querySelectorAll(".quick-open-item");
    if (e.key === "Escape") {
      e.preventDefault();
      hideQuickOpen();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
      updateSelection(results);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      updateSelection(results);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const selected = items[selectedIdx] as HTMLElement | undefined;
      if (selected?.dataset.tabId) {
        setActiveTab(selected.dataset.tabId);
        emit(Events.TAB_ACTIVATED, selected.dataset.tabId);
        emit(Events.RENDER_ALL);
        hideQuickOpen();
      }
      return;
    }
  });
}

export function showQuickOpen(): void {
  const overlay = document.getElementById("quick-open-overlay")!;
  const input = document.getElementById("quick-open-input") as HTMLInputElement;
  const results = document.getElementById("quick-open-results")!;

  visible = true;
  selectedIdx = 0;
  overlay.classList.remove("hidden");
  input.value = "";
  renderResults("", results);
  input.focus();
}

export function hideQuickOpen(): void {
  const overlay = document.getElementById("quick-open-overlay")!;
  visible = false;
  overlay.classList.add("hidden");
}

function renderResults(query: string, container: HTMLElement): void {
  const state = getState();
  const q = query.toLowerCase();

  const filtered = state.tabs.filter((t) =>
    !q || t.fileName.toLowerCase().includes(q) || t.filePath.toLowerCase().includes(q)
  );

  // Simple fuzzy scoring
  filtered.sort((a, b) => {
    if (!q) return 0;
    const aName = a.fileName.toLowerCase();
    const bName = b.fileName.toLowerCase();
    const aStarts = aName.startsWith(q) ? -1 : 0;
    const bStarts = bName.startsWith(q) ? -1 : 0;
    return aStarts - bStarts;
  });

  container.innerHTML = "";
  for (const tab of filtered) {
    const el = document.createElement("div");
    el.className = "quick-open-item";
    el.dataset.tabId = tab.id;
    el.innerHTML = `<span>${escapeHtml(tab.fileName)}</span><span class="path">${escapeHtml(shortenPath(tab.filePath))}</span>`;
    el.addEventListener("click", () => {
      setActiveTab(tab.id);
      emit(Events.TAB_ACTIVATED, tab.id);
      emit(Events.RENDER_ALL);
      hideQuickOpen();
    });
    container.appendChild(el);
  }

  updateSelection(container);
}

function updateSelection(container: HTMLElement): void {
  const items = container.querySelectorAll(".quick-open-item");
  items.forEach((el, i) => el.classList.toggle("selected", i === selectedIdx));
}

function shortenPath(p: string): string {
  const home = "/home/";
  if (p.startsWith(home)) {
    const rest = p.substring(home.length);
    const slash = rest.indexOf("/");
    if (slash !== -1) return "~" + rest.substring(slash);
  }
  return p;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
