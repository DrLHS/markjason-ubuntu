import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from "@codemirror/view";
import { EditorState, Extension } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, indentOnInput, foldKeymap } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";

import { getState, getActiveTab, type FileType, type TabInfo } from "../core/state";
import { emit, Events } from "../core/events";
import { darkThemeExtension } from "../themes/dark-theme";
import { markdownExtensions } from "../editors/markdown-editor";
import { jsonExtensions } from "../editors/json-editor";
import { envExtensions } from "../editors/env-editor";

let currentView: EditorView | null = null;
let currentTabId: string | null = null;
let scrollSyncSource: "editor" | "preview" | null = null;

function baseExtensions(tab: TabInfo): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    rectangularSelection(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    foldGutter(),
    highlightSelectionMatches(),
    history(),
    EditorView.lineWrapping,
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...searchKeymap,
      ...foldKeymap,
      ...lintKeymap,
      indentWithTab,
    ]),
    ...darkThemeExtension,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        tab.content = content;
        if (!tab.dirty) {
          tab.dirty = true;
          emit(Events.TAB_DIRTY, tab.id);
        }
        emit(Events.CONTENT_CHANGED, tab.id, content);
      }
    }),
  ];
}

function langExtensions(fileType: FileType): Extension[] {
  switch (fileType) {
    case "markdown": return markdownExtensions();
    case "json": return jsonExtensions();
    case "env": return envExtensions();
    default: return [];
  }
}

function saveCurrentState(): void {
  if (!currentView || !currentTabId) return;
  const state = getState();
  const tab = state.tabs.find((t) => t.id === currentTabId);
  if (tab) {
    tab.editorState = currentView.state;
  }
}

export function renderEditorPane(): void {
  const container = document.getElementById("editor-pane")!;
  const tab = getActiveTab();

  if (!tab) {
    if (currentView) {
      saveCurrentState();
      currentView.destroy();
      currentView = null;
      currentTabId = null;
    }
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 28px; margin-bottom: 8px;">markjason</div>
        <div>Open a file to get started</div>
        <div><span class="shortcut">Ctrl+O</span> Open file</div>
        <div><span class="shortcut">Ctrl+K</span> Quick open</div>
      </div>`;
    return;
  }

  // Same tab already displayed — no need to recreate
  if (currentView && currentTabId === tab.id) return;

  // Save state of previous tab before switching
  if (currentView) {
    saveCurrentState();
    currentView.destroy();
    currentView = null;
  }

  container.innerHTML = "";
  currentTabId = tab.id;

  const extensions = [...baseExtensions(tab), ...langExtensions(tab.fileType)];

  const state = tab.editorState
    ? tab.editorState
    : EditorState.create({ doc: tab.content, extensions });

  currentView = new EditorView({ state, parent: container });

  // Sync editor scroll -> preview
  const scroller = currentView.scrollDOM;
  scroller.addEventListener("scroll", () => {
    if (scrollSyncSource === "preview") return;
    scrollSyncSource = "editor";
    const fraction = scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    emit(Events.CONTENT_CHANGED + ":scroll", fraction);
    requestAnimationFrame(() => { scrollSyncSource = null; });
  });
}

export function getCurrentView(): EditorView | null {
  return currentView;
}

export function scrollEditorToFraction(fraction: number): void {
  if (!currentView) return;
  scrollSyncSource = "preview";
  const scroller = currentView.scrollDOM;
  scroller.scrollTop = fraction * (scroller.scrollHeight - scroller.clientHeight);
  requestAnimationFrame(() => { scrollSyncSource = null; });
}

export function replaceEditorContent(content: string): void {
  if (!currentView) return;
  currentView.dispatch({
    changes: { from: 0, to: currentView.state.doc.length, insert: content },
  });
}
