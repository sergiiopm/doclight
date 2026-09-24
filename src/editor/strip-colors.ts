import { Fragment, type Mark, type Node as PMNode, Slice } from "@tiptap/pm/model";

function stripMarks(marks: readonly Mark[]): Mark[] {
  return marks.flatMap((mark) => {
    if (mark.type.name !== "textStyle") return [mark];
    const attrs = { ...mark.attrs, color: null, backgroundColor: null };
    if (Object.values(attrs).every((value) => value == null)) return [];
    return [mark.type.create(attrs)];
  });
}

function stripFragment(fragment: Fragment): Fragment {
  const nodes: PMNode[] = [];
  fragment.forEach((node) => {
    nodes.push(node.isText ? node.mark(stripMarks(node.marks)) : node.copy(stripFragment(node.content)));
  });
  return Fragment.fromArray(nodes);
}

/** Removes text and background colors so copied content pastes clean elsewhere. */
export function stripColorsFromSlice(slice: Slice): Slice {
  return new Slice(stripFragment(slice.content), slice.openStart, slice.openEnd);
}
