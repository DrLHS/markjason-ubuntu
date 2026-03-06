import { marked } from "marked";
import DOMPurify from "dompurify";
import { getState, getActiveTab } from "../core/state";
import { on, Events } from "../core/events";
import { renderJsonTree } from "../editors/json-tree-view";
import { renderEnvTable } from "../editors/env-table-view";
import { scrollEditorToFraction } from "./editor-pane";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let scrollSyncSource: "editor" | "preview" | null = null;

export function initPreviewScrollSync(): void {
  const container = document.getElementById("preview-pane")!;

  // Editor scroll -> preview scroll
  on(Events.CONTENT_CHANGED + ":scroll", (fraction: number) => {
    if (scrollSyncSource === "preview") return;
    scrollSyncSource = "editor";
    container.scrollTop = fraction * (container.scrollHeight - container.clientHeight);
    requestAnimationFrame(() => { scrollSyncSource = null; });
  });

  // Preview scroll -> editor scroll
  container.addEventListener("scroll", () => {
    if (scrollSyncSource === "editor") return;
    scrollSyncSource = "preview";
    const fraction = container.scrollTop / Math.max(1, container.scrollHeight - container.clientHeight);
    scrollEditorToFraction(fraction);
    requestAnimationFrame(() => { scrollSyncSource = null; });
  });
}

export function renderPreviewPane(): void {
  const container = document.getElementById("preview-pane")!;
  const state = getState();
  const tab = getActiveTab();

  if (!state.previewVisible || !tab) {
    container.classList.remove("visible");
    return;
  }

  container.classList.add("visible");

  // Debounce updates
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const scrollTop = container.scrollTop;
    updatePreview(container, tab.fileType, tab.content);
    // Restore scroll position after re-render
    container.scrollTop = scrollTop;
  }, 150);
}

function updatePreview(container: HTMLElement, fileType: string, content: string): void {
  switch (fileType) {
    case "markdown":
      renderMarkdownPreview(container, content);
      break;
    case "json":
      renderJsonTree(container, content);
      break;
    case "env":
      renderEnvTable(container, content);
      break;
    default:
      container.innerHTML = `<div style="color: var(--text-muted); padding: 16px;">No preview available for this file type.</div>`;
  }
}

function renderMarkdownPreview(container: HTMLElement, content: string): void {
  const html = marked.parse(content, { async: false }) as string;
  const clean = DOMPurify.sanitize(html);
  container.innerHTML = `<div class="markdown-preview">${clean}</div>`;
}

export function togglePreview(): void {
  const state = getState();
  state.previewVisible = !state.previewVisible;
  renderPreviewPane();
}
