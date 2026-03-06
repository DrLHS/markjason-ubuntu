import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import { Extension } from "@codemirror/state";

export function jsonExtensions(): Extension[] {
  return [
    json(),
    linter(jsonParseLinter()),
  ];
}
