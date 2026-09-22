import { EditorContent, type Editor } from "@tiptap/react";
import { EditorContextMenu } from "@/components/EditorContextMenu";

interface DocumentCanvasProps {
  editor: Editor | null;
  zoom: number;
  locale: string;
  onInsertLink: () => void;
}

export function DocumentCanvas({ editor, zoom, locale, onInsertLink }: DocumentCanvasProps) {
  return (
    <EditorContextMenu editor={editor} locale={locale} onInsertLink={onInsertLink}>
      <div className="min-h-full px-4 py-8">
        <div
          className="paper-editor mx-auto w-[210mm] max-w-full rounded-[2px] bg-paper text-paper-foreground shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] dark:ring-white/10"
          style={{ zoom }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </EditorContextMenu>
  );
}
