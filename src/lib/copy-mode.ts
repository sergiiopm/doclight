export type CopyMode = "web" | "doc";

const STORAGE_KEY = "doclight-copy-mode";

let current: CopyMode = readStoredMode();

function readStoredMode(): CopyMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "doc" ? "doc" : "web";
  } catch {
    return "web";
  }
}

export function getCopyMode(): CopyMode {
  return current;
}

export function setCopyMode(mode: CopyMode) {
  current = mode;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
