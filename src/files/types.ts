export type DocumentFormat = "txt" | "md" | "docx";

export const DOCUMENT_FILTERS = [
  { name: "Documentos", extensions: ["docx", "txt", "md"] },
  { name: "Word", extensions: ["docx"] },
  { name: "Texto", extensions: ["txt"] },
  { name: "Markdown", extensions: ["md"] },
] as const;

export const EMPTY_DOCUMENT_HTML = "<p></p>";
