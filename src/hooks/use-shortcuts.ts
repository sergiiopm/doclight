import { useEffect } from "react";

interface ShortcutHandlers {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onFind: () => void;
  onRedo: () => void;
  onSentenceCase: () => void;
  onInsertLink: () => void;
}

export function useShortcuts({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onFind,
  onRedo,
  onSentenceCase,
  onInsertLink,
}: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "F3" && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        onSentenceCase();
        return;
      }

      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        onNew();
      } else if (key === "o") {
        event.preventDefault();
        onOpen();
      } else if (key === "s" && event.shiftKey) {
        event.preventDefault();
        onSaveAs();
      } else if (key === "s") {
        event.preventDefault();
        onSave();
      } else if (key === "f") {
        event.preventDefault();
        onFind();
      } else if (key === "y") {
        event.preventDefault();
        onRedo();
      } else if (key === "k") {
        event.preventDefault();
        onInsertLink();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onFind, onInsertLink, onNew, onOpen, onRedo, onSave, onSaveAs, onSentenceCase]);
}
