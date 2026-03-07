// Centralized scroll sync to prevent feedback loops and drift.
// Only the pane the user is actively scrolling drives sync.
// Uses a cooldown timer (not rAF) so the lock holds long enough
// to absorb the programmatic scroll event fired back.

const COOLDOWN_MS = 80;
const DEAD_ZONE = 0.002; // ignore fraction changes smaller than this

let activeSource: "editor" | "preview" | null = null;
let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
let lastEditorFraction = 0;
let lastPreviewFraction = 0;

function startCooldown(source: "editor" | "preview"): void {
  activeSource = source;
  if (cooldownTimer) clearTimeout(cooldownTimer);
  cooldownTimer = setTimeout(() => {
    activeSource = null;
    cooldownTimer = null;
  }, COOLDOWN_MS);
}

export function editorScrolled(fraction: number, applyToPreview: (f: number) => void): void {
  if (activeSource === "preview") return;
  if (Math.abs(fraction - lastEditorFraction) < DEAD_ZONE) return;
  lastEditorFraction = fraction;
  startCooldown("editor");
  applyToPreview(fraction);
}

export function previewScrolled(fraction: number, applyToEditor: (f: number) => void): void {
  if (activeSource === "editor") return;
  if (Math.abs(fraction - lastPreviewFraction) < DEAD_ZONE) return;
  lastPreviewFraction = fraction;
  startCooldown("preview");
  applyToEditor(fraction);
}
