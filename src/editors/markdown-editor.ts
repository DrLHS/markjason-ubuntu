import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Extension } from "@codemirror/state";

export function markdownExtensions(): Extension[] {
  return [
    markdown({ base: markdownLanguage }),
  ];
}
