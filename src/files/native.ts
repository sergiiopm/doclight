function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function readPathBytes(path: string): Promise<Uint8Array> {
  const { invoke } = await import("@tauri-apps/api/core");
  const encoded = await invoke<string>("read_file_b64", { path });
  return base64ToBytes(encoded);
}

export async function writePathBytes(path: string, bytes: Uint8Array): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("write_file_b64", { path, contents: bytesToBase64(bytes) });
}

export async function pickOpenPath(): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    title: "Abrir documento",
    multiple: false,
    filters: [
      { name: "Documentos", extensions: ["docx", "txt", "md"] },
      { name: "Word", extensions: ["docx"] },
      { name: "Texto", extensions: ["txt"] },
      { name: "Markdown", extensions: ["md"] },
    ],
  });

  return typeof selected === "string" ? selected : null;
}

export async function pickSavePath(defaultPath: string): Promise<string | null> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const selected = await save({
    title: "Guardar documento",
    defaultPath,
    filters: [
      { name: "Word", extensions: ["docx"] },
      { name: "Texto", extensions: ["txt"] },
      { name: "Markdown", extensions: ["md"] },
    ],
  });

  return selected ?? null;
}

export function downloadBytes(fileName: string, bytes: Uint8Array) {
  const blob = new Blob([bytes.slice().buffer]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function pickBrowserFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx,.txt,.md,.markdown,text/plain,text/markdown";
    input.addEventListener("change", () => {
      resolve(input.files?.[0] ?? null);
    }, { once: true });
    input.click();
  });
}
