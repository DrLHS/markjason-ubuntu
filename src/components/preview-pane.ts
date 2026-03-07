import { marked } from "marked";
import DOMPurify from "dompurify";
import { getState, getActiveTab } from "../core/state";
import { on, Events } from "../core/events";
import { renderJsonTree } from "../editors/json-tree-view";
import { renderEnvTable } from "../editors/env-table-view";
import { scrollEditorToFraction } from "./editor-pane";
import { previewScrolled } from "../core/scroll-sync";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function initPreviewScrollSync(): void {
  const container = document.getElementById("preview-pane")!;

  // Editor scroll -> preview scroll
  on(Events.CONTENT_CHANGED + ":scroll", (fraction: number) => {
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;
    container.scrollTop = Math.round(fraction * maxScroll);
  });

  // Preview scroll -> editor scroll (only on user-initiated scroll)
  container.addEventListener("scroll", () => {
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;
    const fraction = container.scrollTop / maxScroll;
    previewScrolled(fraction, scrollEditorToFraction);
  });

  // Prevent preview from stealing focus — keep it on the editor
  container.addEventListener("mousedown", (e) => {
    // Allow clicks on interactive elements (buttons, links, toggle-mask)
    const target = e.target as HTMLElement;
    if (target.closest("button, a, .toggle-mask, .node-header")) return;
    e.preventDefault();
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

  // Large file guard — disable preview
  if (tab.previewDisabled) {
    container.innerHTML = `<div style="color: var(--text-muted); padding: 16px;">Preview disabled for large files (&gt;5 MB).</div>`;
    return;
  }

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
