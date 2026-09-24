import JSZip from "jszip";

/** Word highlight palette (w:highlight values) as hex. */
export const WORD_HIGHLIGHTS: Record<string, string> = {
  black: "000000",
  blue: "0000FF",
  cyan: "00FFFF",
  green: "00FF00",
  magenta: "FF00FF",
  red: "FF0000",
  yellow: "FFFF00",
  white: "FFFFFF",
  darkBlue: "000080",
  darkCyan: "008080",
  darkGreen: "008000",
  darkMagenta: "800080",
  darkRed: "800000",
  darkYellow: "808000",
  darkGray: "808080",
  lightGray: "C0C0C0",
};

const HIGHLIGHT_BY_HEX = new Map(Object.entries(WORD_HIGHLIGHTS).map(([name, hex]) => [hex, name]));

export function highlightNameForHex(hex: string): string | undefined {
  return HIGHLIGHT_BY_HEX.get(hex.toUpperCase());
}

interface RunColors {
  color: string | null;
  background: string | null;
}

const CLASS_PREFIX = "doclight-fmt-";

function readRunColors(rPr: string): RunColors {
  const color = /<w:color\b[^>]*\bw:val="([0-9A-Fa-f]{6})"/.exec(rPr)?.[1]?.toUpperCase() ?? null;
  const highlight = /<w:highlight\b[^>]*\bw:val="(\w+)"/.exec(rPr)?.[1];
  const shading = /<w:shd\b[^>]*\bw:fill="([0-9A-Fa-f]{6})"/.exec(rPr)?.[1]?.toUpperCase();
  const background = (highlight && WORD_HIGHLIGHTS[highlight]) ?? shading ?? null;
  return {
    // Explicit black is the default text color; keeping it would break dark mode.
    color: color && color !== "000000" ? color : null,
    background: background && background !== "FFFFFF" ? background : null,
  };
}

/**
 * Mammoth ignores text color and only exposes highlights through the style map.
 * Rewrite each colored run so its colors travel inside a synthetic highlight value
 * that a generated style map turns into a span with a known class.
 */
export async function prepareDocxColors(bytes: Uint8Array): Promise<{
  bytes: Uint8Array;
  styleMap: string[];
  styles: Map<string, string>;
}> {
  const zip = await JSZip.loadAsync(bytes);
  const file = zip.file("word/document.xml");
  if (!file) return { bytes, styleMap: [], styles: new Map() };

  const xml = await file.async("string");
  const keys = new Map<string, string>();
  let changed = false;

  const rewritten = xml.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (whole, inner: string) => {
    if (inner.includes("<w:rPrChange")) return whole;
    const { color, background } = readRunColors(inner);
    if (!color && !background) return whole;

    const key = `doclight_${color ?? "none"}_${background ?? "none"}`;
    if (!keys.has(key)) {
      const declarations = [
        color ? `color: #${color}` : null,
        background ? `background-color: #${background}` : null,
      ].filter(Boolean);
      keys.set(key, declarations.join("; "));
    }
    changed = true;
    const withoutHighlight = inner.replace(/<w:highlight\b[^>]*\/>/g, "");
    return `<w:rPr>${withoutHighlight}<w:highlight w:val="${key}"/></w:rPr>`;
  });

  if (!changed) return { bytes, styleMap: [], styles: new Map() };

  zip.file("word/document.xml", rewritten);
  const styleMap: string[] = [];
  const styles = new Map<string, string>();
  Array.from(keys.entries()).forEach(([key, style], index) => {
    const className = `${CLASS_PREFIX}${index}`;
    styleMap.push(`highlight[color='${key}'] => span.${className}`);
    styles.set(className, style);
  });

  return { bytes: await zip.generateAsync({ type: "uint8array" }), styleMap, styles };
}

/** Replace the placeholder classes emitted by mammoth with inline color styles. */
export function applyDocxColors(html: string, styles: Map<string, string>): string {
  if (styles.size === 0) return html;
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const span of Array.from(document.querySelectorAll<HTMLElement>(`span[class^="${CLASS_PREFIX}"]`))) {
    const style = styles.get(span.className);
    span.removeAttribute("class");
    if (style) span.setAttribute("style", style);
  }
  return document.body.innerHTML;
}

function toHex(value: string): string | undefined {
  const color = value.trim();
  if (!color || color === "transparent") return undefined;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1];
  if (hex) {
    return (hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex).toUpperCase();
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color);
  if (rgb) {
    if (rgb[4] !== undefined && Number(rgb[4]) === 0) return undefined;
    return rgb
      .slice(1, 4)
      .map((part) => Math.min(255, Number(part)).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  // Named colors: let the browser normalize them.
  const context = globalThis.document?.createElement("canvas").getContext("2d");
  if (!context) return undefined;
  context.fillStyle = "#010203";
  context.fillStyle = color;
  const normalized = context.fillStyle;
  return normalized === "#010203" ? undefined : toHex(normalized);
}

export function cssColorToHex(value: string | null | undefined): string | undefined {
  return value ? toHex(value) : undefined;
}
