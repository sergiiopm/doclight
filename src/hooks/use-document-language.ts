import { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  detectLanguage,
  languageByCode,
  type LanguageOption,
} from "@/lib/language";

const STORAGE_KEY = "doclight-language";

export function useDocumentLanguage(editor: Editor | null) {
  const [mode, setMode] = useState<string>("auto");
  const [detected, setDetected] = useState<LanguageOption>(() => languageByCode("es"));

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setMode(stored);
  }, []);

  const refresh = useCallback(() => {
    if (!editor) return;
    setDetected(detectLanguage(editor.getText()));
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    refresh();
    let timer = 0;
    const onUpdate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, 500);
    };
    editor.on("update", onUpdate);
    return () => {
      window.clearTimeout(timer);
      editor.off("update", onUpdate);
    };
  }, [editor, refresh]);

  const choose = useCallback((next: string) => {
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const language = useMemo(
    () => (mode === "auto" ? detected : languageByCode(mode)),
    [detected, mode],
  );

  useEffect(() => {
    document.documentElement.lang = language.locale;
    document.documentElement.setAttribute("xml:lang", language.locale);
    if (!editor) return;
    editor.view.dom.setAttribute("lang", language.locale);
    editor.view.dom.setAttribute("spellcheck", "true");
  }, [editor, language]);

  return { mode, language, choose, refresh };
}
