import type { Editor } from "@tiptap/react";

export type TransformMode = "uppercase" | "lowercase" | "capitalize" | "sentence";

function transformChunk(text: string, mode: TransformMode, locale: string, firstLetterPending: boolean): {
  text: string;
  firstLetterPending: boolean;
} {
  if (mode === "uppercase") {
    return { text: text.toLocaleUpperCase(locale), firstLetterPending };
  }
  if (mode === "lowercase") {
    return { text: text.toLocaleLowerCase(locale), firstLetterPending };
  }
  if (mode === "capitalize") {
    const next = text.replace(/(\p{L})([\p{L}\p{M}\p{N}'’-]*)/gu, (_all, first: string, rest: string) => {
      return first.toLocaleUpperCase(locale) + rest.toLocaleLowerCase(locale);
    });
    return { text: next, firstLetterPending };
  }

  const lowered = text.toLocaleLowerCase(locale);
  if (!firstLetterPending) {
    return { text: lowered, firstLetterPending: false };
  }

  const match = /^(\s*)(\p{L})/u.exec(lowered);
  if (!match) {
    return { text: lowered, firstLetterPending: true };
  }

  const prefix = match[1] ?? "";
  const letter = match[2] ?? "";
  const rest = lowered.slice(match[0].length);
  return {
    text: `${prefix}${letter.toLocaleUpperCase(locale)}${rest}`,
    firstLetterPending: false,
  };
}

export function getTransformRange(editor: Editor): { from: number; to: number } | null {
  const { from, to, empty, $from } = editor.state.selection;
  if (!empty) return { from, to };

  const parent = $from.parent;
  if (!parent.isTextblock) return null;

  const offset = $from.parentOffset;
  const text = parent.textContent;
  let start = offset;
  let end = offset;
  while (start > 0 && /[\p{L}\p{N}]/u.test(text[start - 1] ?? "")) start -= 1;
  while (end < text.length && /[\p{L}\p{N}]/u.test(text[end] ?? "")) end += 1;
  if (start === end) return null;

  const base = $from.start();
  return { from: base + start, to: base + end };
}

export function applyTextTransform(editor: Editor, mode: TransformMode, locale = "es"): boolean {
  const range = getTransformRange(editor);
  if (!range) return false;

  const { from, to } = range;
  const { tr, doc } = editor.state;
  let firstLetterPending = mode === "sentence";
  const replacements: { from: number; to: number; node: ReturnType<typeof editor.schema.text> }[] = [];

  doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText || !node.text) return;
    const start = Math.max(pos, from);
    const end = Math.min(pos + node.nodeSize, to);
    if (start >= end) return;

    const original = node.text.slice(start - pos, end - pos);
    const next = transformChunk(original, mode, locale, firstLetterPending);
    firstLetterPending = next.firstLetterPending;
    if (next.text === original) return;
    replacements.push({
      from: start,
      to: end,
      node: editor.schema.text(next.text, node.marks),
    });
  });

  for (let index = replacements.length - 1; index >= 0; index -= 1) {
    const item = replacements[index];
    if (!item) continue;
    tr.replaceWith(item.from, item.to, item.node);
  }

  if (!tr.docChanged) return false;
  editor.view.dispatch(tr);
  return true;
}

export function getLinkHref(editor: Editor): string | null {
  const href = editor.getAttributes("link").href;
  return typeof href === "string" && href ? href : null;
}
