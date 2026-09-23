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
  onCloseTab: () => void;
  onNextTab: () => void;
  onPreviousTab: () => void;
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
  onCloseTab,
  onNextTab,
  onPreviousTab,
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

      if (event.key === "Tab" || event.key === "PageDown" || event.key === "PageUp") {
        event.preventDefault();
        const backwards = event.key === "PageUp" || (event.key === "Tab" && event.shiftKey);
        if (backwards) onPreviousTab();
        else onNextTab();
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "w") {
        event.preventDefault();
        onCloseTab();
      } else if (key === "n") {
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
  }, [
    onCloseTab,
    onFind,
    onInsertLink,
    onNew,
    onNextTab,
    onOpen,
    onPreviousTab,
    onRedo,
    onSave,
    onSaveAs,
    onSentenceCase,
  ]);
}
