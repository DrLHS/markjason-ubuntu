import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export const darkEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#1e1e2e",
    color: "#cdd6f4",
  },
  ".cm-content": {
    caretColor: "#89b4fa",
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#89b4fa",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "#45475a",
  },
  ".cm-panels": {
    backgroundColor: "#181825",
    color: "#cdd6f4",
  },
  ".cm-panels.cm-panels-top": {
    borderBottom: "1px solid #313244",
  },
  ".cm-searchMatch": {
    backgroundColor: "#45475a80",
    outline: "1px solid #89b4fa40",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#89b4fa30",
  },
  ".cm-activeLine": {
    backgroundColor: "#181825",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#45475a60",
  },
  ".cm-matchingBracket, .cm-nonmatchingBracket": {
    backgroundColor: "#45475a",
    outline: "1px solid #89b4fa40",
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e2e",
    color: "#6c7086",
    border: "none",
    paddingRight: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#181825",
    color: "#a6adc8",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "#313244",
    color: "#a6adc8",
    border: "none",
  },
  ".cm-tooltip": {
    backgroundColor: "#181825",
    border: "1px solid #313244",
    color: "#cdd6f4",
  },
  ".cm-tooltip .cm-tooltip-arrow:before": {
    borderTopColor: "#313244",
    borderBottomColor: "#313244",
  },
  ".cm-tooltip .cm-tooltip-arrow:after": {
    borderTopColor: "#181825",
    borderBottomColor: "#181825",
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: "#45475a",
      color: "#cdd6f4",
    },
  },
}, { dark: true });

export const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#cba6f7" },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "#89b4fa" },
  { tag: [t.function(t.variableName), t.labelName], color: "#89b4fa" },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: "#fab387" },
  { tag: [t.definition(t.name), t.separator], color: "#cdd6f4" },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: "#fab387" },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: "#94e2d5" },
  { tag: [t.meta, t.comment], color: "#6c7086" },
  { tag: t.strong, fontWeight: "bold", color: "#f38ba8" },
  { tag: t.emphasis, fontStyle: "italic", color: "#f38ba8" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "#89b4fa", textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: "#f38ba8" },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#fab387" },
  { tag: [t.processingInstruction, t.string, t.inserted], color: "#a6e3a1" },
  { tag: t.invalid, color: "#f38ba8" },
]);

export const darkThemeExtension = [
  darkEditorTheme,
  syntaxHighlighting(darkHighlightStyle),
];
