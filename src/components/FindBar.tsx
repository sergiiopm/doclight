import type { Editor } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findNext } from "@/editor/find";

interface FindBarProps {
  editor: Editor | null;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
}

export function FindBar({ editor, query, onQueryChange, onClose }: FindBarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-1.5">
      <Input
        autoFocus
        value={query}
        placeholder="Buscar en el documento"
        className="h-8 max-w-xs"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && editor) {
            event.preventDefault();
            findNext(editor, query, event.shiftKey);
          }
          if (event.key === "Escape") {
            onClose();
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor && findNext(editor, query, true)}
      >
        Anterior
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor && findNext(editor, query)}
      >
        Siguiente
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );
}
