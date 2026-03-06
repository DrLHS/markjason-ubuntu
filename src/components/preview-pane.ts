import { marked } from "marked";
import DOMPurify from "dompurify";
import { getState, getActiveTab } from "../core/state";
import { renderJsonTree } from "../editors/json-tree-view";
import { renderEnvTable } from "../editors/env-table-view";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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
    updatePreview(container, tab.fileType, tab.content);
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
