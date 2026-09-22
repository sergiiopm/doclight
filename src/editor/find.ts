import type { Editor } from "@tiptap/react";

export function findNext(editor: Editor, query: string, backwards = false): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;

  const { doc, selection } = editor.state;
  const start = backwards ? selection.from : selection.to;
  const matches: Array<{ from: number; to: number }> = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const haystack = node.text.toLowerCase();
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      matches.push({ from: pos + index, to: pos + index + needle.length });
      index = haystack.indexOf(needle, index + needle.length);
    }
  });

  if (matches.length === 0) return false;

  const match = backwards
    ? [...matches].reverse().find((item) => item.to <= start) ?? matches[matches.length - 1]
    : matches.find((item) => item.from >= start) ?? matches[0];

  if (!match) return false;

  editor.chain().focus().setTextSelection(match).scrollIntoView().run();
  return true;
}
