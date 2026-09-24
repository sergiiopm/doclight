import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { BackgroundColor, Color, TextStyle } from "@tiptap/extension-text-style";
import type { Slice } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { sanitizePastedHtml } from "@/editor/sanitize-paste";
import { stripColorsFromSlice } from "@/editor/strip-colors";
import { getCopyMode } from "@/lib/copy-mode";
import { openExternalUrl, sanitizeHref } from "@/lib/open-url";

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: "https",
      HTMLAttributes: {
        rel: "noopener noreferrer",
      },
      isAllowedUri: (url) => Boolean(sanitizeHref(url)),
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    TextStyle,
    Color,
    BackgroundColor,
    Placeholder.configure({
      placeholder: "Empieza a escribir…",
    }),
  ];
}

export const editorProps = {
  attributes: {
    spellcheck: "true",
    lang: "es",
  },
  transformPastedHTML(html: string) {
    return sanitizePastedHtml(html, { keepColors: getCopyMode() === "doc" });
  },
  transformCopied(slice: Slice) {
    return getCopyMode() === "doc" ? slice : stripColorsFromSlice(slice);
  },
  handleClick(_view: unknown, _pos: number, event: MouseEvent) {
    if (!(event.ctrlKey || event.metaKey)) return false;
    const target = event.target as HTMLElement | null;
    const href = sanitizeHref(target?.closest("a")?.getAttribute("href"));
    if (!href) return false;
    event.preventDefault();
    void openExternalUrl(href);
    return true;
  },
};
