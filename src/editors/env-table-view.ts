const SENSITIVE_KEYS = /^(.*_)?(SECRET|KEY|TOKEN|PASSWORD|PASS|AUTH|PRIVATE|CREDENTIAL|API_KEY|ACCESS_KEY)/i;

interface EnvEntry {
  type: "pair" | "comment" | "blank";
  key?: string;
  value?: string;
  raw: string;
}

export function renderEnvTable(container: HTMLElement, content: string): void {
  container.innerHTML = "";
  const entries = parseEnv(content);

  const table = document.createElement("table");
  table.className = "env-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr><th>Key</th><th>Value</th><th></th></tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (const entry of entries) {
    const tr = document.createElement("tr");
    if (entry.type === "comment") {
      tr.innerHTML = `<td class="env-comment" colspan="3">${escapeHtml(entry.raw)}</td>`;
    } else if (entry.type === "blank") {
      tr.innerHTML = `<td colspan="3">&nbsp;</td>`;
    } else {
      const isSensitive = SENSITIVE_KEYS.test(entry.key!);
      const valueId = `env-val-${Math.random().toString(36).slice(2, 8)}`;

      tr.innerHTML = `
        <td class="env-key">${escapeHtml(entry.key!)}</td>
        <td class="env-value${isSensitive ? " masked" : ""}" id="${valueId}">${
          isSensitive ? "\u2022".repeat(8) : escapeHtml(entry.value!)
        }</td>
        <td>${
          isSensitive
            ? `<button class="toggle-mask" data-target="${valueId}" data-value="${escapeAttr(entry.value!)}" data-masked="true">show</button>`
            : ""
        }</td>`;
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  table.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(".toggle-mask") as HTMLElement;
    if (!btn) return;
    const target = document.getElementById(btn.dataset.target!);
    if (!target) return;
    const masked = btn.dataset.masked === "true";
    if (masked) {
      target.textContent = btn.dataset.value!;
      target.classList.remove("masked");
      btn.textContent = "hide";
      btn.dataset.masked = "false";
    } else {
      target.textContent = "\u2022".repeat(8);
      target.classList.add("masked");
      btn.textContent = "show";
      btn.dataset.masked = "true";
    }
  });
}

function parseEnv(content: string): EnvEntry[] {
  return content.split("\n").map((line) => {
    const trimmed = line.trim();
    if (trimmed === "") return { type: "blank" as const, raw: line };
    if (trimmed.startsWith("#")) return { type: "comment" as const, raw: line };
    const match = line.match(/^(export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)/);
    if (match) {
      let value = match[3];
      // Strip quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return { type: "pair" as const, key: match[2], value, raw: line };
    }
    return { type: "comment" as const, raw: line };
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
