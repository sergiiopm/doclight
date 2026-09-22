import { marked } from "marked";
import TurndownService from "turndown";
import { decodeTextBytes, encodeTextBytes } from "@/files/html";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

turndown.addRule("underline", {
  filter: ["u"],
  replacement(content) {
    return `<u>${content}</u>`;
  },
});

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return typeof html === "string" && html.trim() ? html : "<p></p>";
}

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}

export function bytesToHtmlFromMarkdown(bytes: Uint8Array): string {
  return markdownToHtml(decodeTextBytes(bytes));
}

export function htmlToMarkdownBytes(html: string): Uint8Array {
  return encodeTextBytes(htmlToMarkdown(html));
}
