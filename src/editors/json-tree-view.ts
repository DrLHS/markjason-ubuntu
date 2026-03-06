export function renderJsonTree(container: HTMLElement, jsonStr: string): void {
  container.innerHTML = "";
  try {
    const data = JSON.parse(jsonStr);
    const tree = document.createElement("div");
    tree.className = "json-tree";
    tree.appendChild(buildNode(data, ""));
    container.appendChild(tree);
  } catch (e) {
    container.innerHTML = `<div style="color: var(--red); padding: 16px; font-family: var(--font-mono);">Invalid JSON: ${escapeHtml(String(e))}</div>`;
  }
}

function buildNode(value: any, path: string, key?: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "node";

  if (value !== null && typeof value === "object") {
    const isArray = Array.isArray(value);
    const entries = isArray ? value.map((v: any, i: number) => [String(i), v]) : Object.entries(value);
    const openBracket = isArray ? "[" : "{";
    const closeBracket = isArray ? "]" : "}";

    const header = document.createElement("div");
    header.className = "node-header";

    const toggle = document.createElement("span");
    toggle.className = "toggle";
    toggle.textContent = "\u25BE";

    const content = document.createElement("span");
    let headerHtml = "";
    if (key !== undefined) {
      headerHtml += `<span class="key">"${escapeHtml(key)}"</span><span class="colon">: </span>`;
    }
    headerHtml += `<span class="bracket">${openBracket}</span>`;
    headerHtml += `<span class="item-count"> ${entries.length} ${entries.length === 1 ? "item" : "items"}</span>`;
    content.innerHTML = headerHtml;

    const pathBadge = document.createElement("span");
    pathBadge.className = "path-badge";
    pathBadge.textContent = path || "$";
    pathBadge.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(path || "$");
    });

    header.appendChild(toggle);
    header.appendChild(content);
    header.appendChild(pathBadge);

    const children = document.createElement("div");
    children.style.paddingLeft = "16px";

    for (const [k, v] of entries) {
      const childPath = isArray ? `${path}[${k}]` : (path ? `${path}.${k}` : k);
      children.appendChild(buildNode(v, childPath, k));
    }

    const closingBracket = document.createElement("div");
    closingBracket.innerHTML = `<span class="bracket">${closeBracket}</span>`;
    closingBracket.style.paddingLeft = "0";

    let collapsed = false;
    header.addEventListener("click", () => {
      collapsed = !collapsed;
      children.style.display = collapsed ? "none" : "";
      closingBracket.style.display = collapsed ? "none" : "";
      toggle.textContent = collapsed ? "\u25B8" : "\u25BE";
    });

    wrapper.appendChild(header);
    wrapper.appendChild(children);
    wrapper.appendChild(closingBracket);
  } else {
    const leaf = document.createElement("div");
    leaf.className = "node-header";
    let html = `<span class="toggle"></span>`;
    if (key !== undefined) {
      html += `<span class="key">"${escapeHtml(key)}"</span><span class="colon">: </span>`;
    }
    html += formatValue(value);

    const pathBadge = `<span class="path-badge">${escapeHtml(path || "$")}</span>`;
    leaf.innerHTML = html + pathBadge;
    leaf.querySelector(".path-badge")?.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(path || "$");
    });
    wrapper.appendChild(leaf);
  }

  return wrapper;
}

function formatValue(value: any): string {
  if (value === null) return `<span class="null">null</span>`;
  if (typeof value === "boolean") return `<span class="boolean">${value}</span>`;
  if (typeof value === "number") return `<span class="number">${value}</span>`;
  if (typeof value === "string") return `<span class="string">"${escapeHtml(value)}"</span>`;
  return `<span>${escapeHtml(String(value))}</span>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
