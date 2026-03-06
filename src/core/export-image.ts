import html2canvas from "html2canvas";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { getActiveTab } from "./state";

export async function exportPreviewAsImage(): Promise<void> {
  const previewPane = document.getElementById("preview-pane");
  if (!previewPane || !previewPane.classList.contains("visible")) return;

  const tab = getActiveTab();
  if (!tab) return;

  const baseName = tab.fileName.replace(/\.[^.]+$/, "");

  const canvas = await html2canvas(previewPane, {
    backgroundColor: "#1e1e2e",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const path = await save({
    defaultPath: `${baseName}.png`,
    filters: [
      { name: "PNG Image", extensions: ["png"] },
      { name: "JPEG Image", extensions: ["jpg", "jpeg"] },
    ],
  });

  if (!path) return;

  const isJpeg = /\.jpe?g$/i.test(path);
  const mimeType = isJpeg ? "image/jpeg" : "image/png";
  const quality = isJpeg ? 0.92 : undefined;

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), mimeType, quality);
  });

  const buffer = new Uint8Array(await blob.arrayBuffer());
  await writeFile(path, buffer);
}
