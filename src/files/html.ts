const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "DIV"]);

export function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function htmlToPlainText(html: string): string {
  const document = parseHtml(html);
  const parts: string[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? "");
      return;
    }

    if (!(node instanceof HTMLElement)) {
      node.childNodes.forEach(walk);
      return;
    }

    if (node.tagName === "BR") {
      parts.push("\n");
      return;
    }

    const isBlock = BLOCK_TAGS.has(node.tagName);
    if (isBlock && parts.length > 0 && !parts[parts.length - 1]?.endsWith("\n")) {
      parts.push("\n");
    }

    node.childNodes.forEach(walk);

    if (isBlock) {
      parts.push("\n");
    }
  }

  walk(document.body);
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export function plainTextToHtml(text: string): string {
  const normalized = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  if (!normalized.trim()) {
    return "<p></p>";
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

export function getTextAlign(element: Element): "left" | "center" | "right" | null {
  const attr = element.getAttribute("textalign") ?? element.getAttribute("textAlign");
  const style = element.getAttribute("style") ?? "";
  const fromStyle = /text-align:\s*(left|center|right)/i.exec(style)?.[1];
  const value = (attr ?? fromStyle ?? "").toLowerCase();

  if (value === "left" || value === "center" || value === "right") {
    return value;
  }

  return null;
}

export function decodeTextBytes(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes);
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

export function encodeTextBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
