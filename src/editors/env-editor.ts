import { StreamLanguage } from "@codemirror/language";
import { Extension } from "@codemirror/state";

const envLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.sol() && stream.peek() === "#") {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.sol()) {
      if (stream.match(/^export\s+/)) return "keyword";
      if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) return "propertyName";
    }
    if (stream.match("=")) return "operator";
    if (stream.match(/"[^"]*"/)) return "string";
    if (stream.match(/'[^']*'/)) return "string";
    if (stream.match(/\$\{[^}]*\}/)) return "variableName";
    if (stream.match(/\$[A-Za-z_][A-Za-z0-9_]*/)) return "variableName";
    stream.next();
    return null;
  },
});

export function envExtensions(): Extension[] {
  return [envLanguage];
}
