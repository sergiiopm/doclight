import type { DocumentFormat } from "@/files/types";

export function getFileName(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || path;
}

export function getFormatFromPath(path: string): DocumentFormat | null {
  const name = getFileName(path).toLowerCase();
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".txt")) return "txt";
  return null;
}

export function formatLabel(format: DocumentFormat): string {
  switch (format) {
    case "docx":
      return "Word";
    case "md":
      return "Markdown";
    case "txt":
      return "Texto";
  }
}

export function defaultFileName(format: DocumentFormat): string {
  switch (format) {
    case "docx":
      return "Documento.docx";
    case "md":
      return "Documento.md";
    case "txt":
      return "Documento.txt";
  }
}
