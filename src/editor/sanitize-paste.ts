import { sanitizeHref } from "@/lib/open-url";

const ALLOWED_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "BR",
  "SPAN",
  "DIV",
  "BLOCKQUOTE",
  "PRE",
  "CODE",
  "A",
]);

function headingTag(tag: string): string {
  if (tag === "H1" || tag === "H2" || tag === "H3") return tag.toLowerCase();
  if (tag === "H4" || tag === "H5" || tag === "H6") return "h3";
  return tag.toLowerCase();
}

function styleMarks(element: HTMLElement): string[] {
  const style = element.getAttribute("style") ?? "";
  const wrap: string[] = [];
  if (/font-weight:\s*(bold|[7-9]00)/i.test(style)) wrap.push("strong");
  if (/font-style:\s*italic/i.test(style)) wrap.push("em");
  if (/text-decoration:\s*underline/i.test(style)) wrap.push("u");
  return wrap;
}

function alignmentStyle(element: HTMLElement): string {
  const match = /text-align:\s*(left|center|right)/i.exec(element.getAttribute("style") ?? "");
  return match ? ` style="text-align: ${match[1].toLowerCase()}"` : "";
}

function serialize(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  if (!(node instanceof HTMLElement)) {
    return Array.from(node.childNodes).map(serialize).join("");
  }

  const tag = node.tagName;
  if (!ALLOWED_TAGS.has(tag)) {
    return Array.from(node.childNodes).map(serialize).join("");
  }

  if (tag === "BR") return "<br>";
  if (tag === "SPAN") {
    const inner = Array.from(node.childNodes).map(serialize).join("");
    return styleMarks(node).reduceRight((content, mark) => `<${mark}>${content}</${mark}>`, inner);
  }

  if (tag === "DIV") {
    const inner = Array.from(node.childNodes).map(serialize).join("");
    const hasBlock = Array.from(node.children).some((child) =>
      ["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE", "PRE", "DIV"].includes(
        child.tagName,
      ),
    );
    return hasBlock ? inner : `<p${alignmentStyle(node)}>${inner}</p>`;
  }

  const name = headingTag(tag);
  const inner = Array.from(node.childNodes).map(serialize).join("");
  if (tag === "A") {
    const href = sanitizeHref(node.getAttribute("href"));
    return href
      ? `<a href="${href.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">${inner}</a>`
      : inner;
  }

  return `<${name}${alignmentStyle(node)}>${inner}</${name}>`;
}

export function sanitizePastedHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const cleaned = serialize(parsed.body).trim();
  return cleaned || "<p></p>";
}
