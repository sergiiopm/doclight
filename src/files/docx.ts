import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  type ParagraphChild,
  TextRun,
  UnderlineType,
} from "docx";
import mammoth from "mammoth";
import { getTextAlign, parseHtml } from "@/files/html";
import { sanitizeHref } from "@/lib/open-url";

interface Marks {
  bold: boolean;
  italics: boolean;
  underline: boolean;
  link: boolean;
}

function alignmentOf(element: Element) {
  switch (getTextAlign(element)) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "left":
      return AlignmentType.LEFT;
    default:
      return undefined;
  }
}

function runFromText(text: string, marks: Marks, locale: string): TextRun | null {
  if (!text) return null;
  return new TextRun({
    text,
    bold: marks.bold || undefined,
    italics: marks.italics || undefined,
    underline: (marks.underline || marks.link) ? { type: UnderlineType.SINGLE } : undefined,
    color: marks.link ? "0563C1" : undefined,
    language: { value: locale },
  });
}

function collectRuns(node: Node, marks: Marks, locale: string): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const run = runFromText(node.textContent ?? "", marks, locale);
    return run ? [run] : [];
  }

  if (!(node instanceof HTMLElement)) {
    return [];
  }

  if (node.tagName === "BR") {
    return [new TextRun({ break: 1 })];
  }

  const next = nextMarks(node, marks);
  return Array.from(node.childNodes).flatMap((child) => collectRuns(child, next, locale));
}

function nextMarks(node: HTMLElement, marks: Marks): Marks {
  const next: Marks = { ...marks };
  const tag = node.tagName;
  const style = node.getAttribute("style") ?? "";

  if (tag === "STRONG" || tag === "B" || /font-weight:\s*(bold|[7-9]00)/i.test(style)) {
    next.bold = true;
  }
  if (tag === "EM" || tag === "I" || /font-style:\s*italic/i.test(style)) {
    next.italics = true;
  }
  if (tag === "U" || /text-decoration:\s*underline/i.test(style)) {
    next.underline = true;
  }
  if (tag === "A" && sanitizeHref(node.getAttribute("href"))) {
    next.link = true;
  }
  return next;
}

function collectChildren(node: Node, marks: Marks, locale: string): ParagraphChild[] {
  if (node instanceof HTMLElement && node.tagName === "BR") {
    return [new TextRun({ break: 1 })];
  }

  if (node instanceof HTMLElement && node.tagName === "A") {
    const href = sanitizeHref(node.getAttribute("href"));
    const next = nextMarks(node, marks);
    const runs = Array.from(node.childNodes).flatMap((child) => collectRuns(child, next, locale));
    if (!href) return runs;
    return [
      new ExternalHyperlink({
        link: href,
        children: runs.length > 0 ? runs : [new TextRun({ text: href, color: "0563C1", underline: { type: UnderlineType.SINGLE } })],
      }),
    ];
  }

  if (node instanceof HTMLElement) {
    const next = nextMarks(node, marks);
    return Array.from(node.childNodes).flatMap((child) => collectChildren(child, next, locale));
  }

  return collectRuns(node, marks, locale);
}

function paragraphFromElement(
  element: HTMLElement,
  locale: string,
  options: {
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    numbering?: { reference: string; level: number };
  } = {},
): Paragraph {
  const children = collectChildren(element, { bold: false, italics: false, underline: false, link: false }, locale);
  return new Paragraph({
    heading: options.heading,
    numbering: options.numbering,
    alignment: alignmentOf(element),
    children: children.length > 0 ? children : [new TextRun("")],
    spacing: { after: 200 },
  });
}

function convertBlocks(nodes: NodeListOf<ChildNode> | ChildNode[], locale: string, listLevel = 0): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const node of Array.from(nodes)) {
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim()) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(node.textContent ?? "")],
          spacing: { after: 200 },
        }),
      );
      continue;
    }

    if (!(node instanceof HTMLElement)) continue;

    const tag = node.tagName;
    if (tag === "H1") {
      paragraphs.push(paragraphFromElement(node, locale, { heading: HeadingLevel.HEADING_1 }));
    } else if (tag === "H2") {
      paragraphs.push(paragraphFromElement(node, locale, { heading: HeadingLevel.HEADING_2 }));
    } else if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
      paragraphs.push(paragraphFromElement(node, locale, { heading: HeadingLevel.HEADING_3 }));
    } else if (tag === "P") {
      paragraphs.push(paragraphFromElement(node, locale));
    } else if (tag === "UL" || tag === "OL") {
      const reference = tag === "UL" ? "bullets" : "numbers";
      for (const item of Array.from(node.children)) {
        if (!(item instanceof HTMLElement) || item.tagName !== "LI") continue;
        const nestedLists = Array.from(item.children).filter(
          (child) => child.tagName === "UL" || child.tagName === "OL",
        );
        const content = item.cloneNode(true) as HTMLElement;
        for (const nested of Array.from(content.children)) {
          if (nested.tagName === "UL" || nested.tagName === "OL") {
            nested.remove();
          }
        }
        paragraphs.push(
          paragraphFromElement(content, locale, {
            numbering: { reference, level: Math.min(listLevel, 2) },
          }),
        );
        for (const nested of nestedLists) {
          paragraphs.push(...convertBlocks([nested], locale, listLevel + 1));
        }
      }
    } else if (tag === "BLOCKQUOTE" || tag === "DIV" || tag === "SECTION") {
      const nested = convertBlocks(node.childNodes, locale, listLevel);
      if (nested.length > 0) {
        paragraphs.push(...nested);
      } else {
        paragraphs.push(paragraphFromElement(node, locale));
      }
    }
  }

  return paragraphs;
}

export async function htmlToDocxBytes(html: string, locale = "es-ES"): Promise<Uint8Array> {
  const documentHtml = parseHtml(html);
  const children = convertBlocks(documentHtml.body.childNodes, locale);
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            language: { value: locale },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [0, 1, 2].map((level) => ({
            level,
            format: LevelFormat.BULLET,
            text: level === 1 ? "o" : "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720 * (level + 1), hanging: 360 },
              },
            },
          })),
        },
        {
          reference: "numbers",
          levels: [0, 1, 2].map((level) => ({
            level,
            format: level === 1 ? LevelFormat.LOWER_LETTER : LevelFormat.DECIMAL,
            text: `%${level + 1}.`,
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720 * (level + 1), hanging: 360 },
              },
            },
          })),
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
          },
        },
        children: children.length > 0 ? children : [new Paragraph({})],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}

export async function docxBytesToHtml(bytes: Uint8Array): Promise<string> {
  const copy = bytes.slice();
  const result = await mammoth.convertToHtml({
    arrayBuffer: copy.buffer as ArrayBuffer,
  });
  return result.value.trim() ? result.value : "<p></p>";
}
