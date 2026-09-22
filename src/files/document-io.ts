import { docxBytesToHtml, htmlToDocxBytes } from "@/files/docx";
import { bytesToHtmlFromMarkdown, htmlToMarkdownBytes } from "@/files/markdown";
import { bytesToHtmlFromTxt, htmlToTxtBytes } from "@/files/txt";
import type { DocumentFormat } from "@/files/types";

export async function bytesToHtml(format: DocumentFormat, bytes: Uint8Array): Promise<string> {
  switch (format) {
    case "txt":
      return bytesToHtmlFromTxt(bytes);
    case "md":
      return bytesToHtmlFromMarkdown(bytes);
    case "docx":
      return docxBytesToHtml(bytes);
  }
}

export async function htmlToBytes(format: DocumentFormat, html: string, locale = "es-ES"): Promise<Uint8Array> {
  switch (format) {
    case "txt":
      return htmlToTxtBytes(html);
    case "md":
      return htmlToMarkdownBytes(html);
    case "docx":
      return htmlToDocxBytes(html, locale);
  }
}
