import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { bytesToHtml, htmlToBytes } from "@/files/document-io";
import { isTauri } from "@/lib/is-tauri";
import {
  downloadBytes,
  pickBrowserFile,
  pickOpenPath,
  pickSavePath,
  readPathBytes,
  writePathBytes,
} from "@/files/native";
import { defaultFileName, formatLabel, getFileName, getFormatFromPath } from "@/files/path";
import { EMPTY_DOCUMENT_HTML, type DocumentFormat } from "@/files/types";

let consumedLaunchPath: string | null = null;

interface UseDocumentSessionOptions {
  editor: Editor | null;
  onError: (message: string) => void;
  locale?: string;
}

export type PendingAction = "new" | "open" | "open-path" | "close" | null;

export function useDocumentSession({ editor, onError, locale = "es-ES" }: UseDocumentSessionOptions) {
  const [path, setPath] = useState<string | null>(null);
  const [format, setFormat] = useState<DocumentFormat>("docx");
  const [dirty, setDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const savedHtmlRef = useRef(EMPTY_DOCUMENT_HTML);
  const dirtyRef = useRef(false);
  const allowCloseRef = useRef(false);
  const pendingRef = useRef<PendingAction>(null);
  const pendingOpenPathRef = useRef<string | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const fileName = path ? getFileName(path) : defaultFileName(format);
  const title = `${fileName}${dirty ? " •" : ""}`;

  const markSaved = useCallback((html: string) => {
    savedHtmlRef.current = html;
    dirtyRef.current = false;
    setDirty(false);
  }, []);

  const loadHtml = useCallback((html: string) => {
    if (!editor) return;
    editor.commands.setContent(html, { emitUpdate: false });
    markSaved(editor.getHTML());
  }, [editor, markSaved]);

  const newDocument = useCallback(() => {
    setPath(null);
    setFormat("docx");
    loadHtml(EMPTY_DOCUMENT_HTML);
  }, [loadHtml]);

  const openFromBytes = useCallback(async (nextPath: string, bytes: Uint8Array) => {
    const nextFormat = getFormatFromPath(nextPath);
    if (!nextFormat) {
      onError("Doclight solo abre archivos .docx, .txt y .md.");
      return;
    }
    const html = await bytesToHtml(nextFormat, bytes);
    setPath(nextPath);
    setFormat(nextFormat);
    loadHtml(html);
  }, [loadHtml, onError]);

  const openFromPath = useCallback(async (nextPath: string) => {
    try {
      setBusy(true);
      const bytes = await readPathBytes(nextPath);
      await openFromBytes(nextPath, bytes);
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo abrir el documento.");
    } finally {
      setBusy(false);
    }
  }, [onError, openFromBytes]);

  const requestOpenPath = useCallback((nextPath: string) => {
    if (dirtyRef.current) {
      pendingOpenPathRef.current = nextPath;
      pendingRef.current = "open-path";
      setPendingAction("open-path");
      return;
    }
    void openFromPath(nextPath);
  }, [openFromPath]);

  const openDocument = useCallback(async () => {
    try {
      setBusy(true);
      if (isTauri()) {
        const selected = await pickOpenPath();
        if (!selected) return;
        const bytes = await readPathBytes(selected);
        await openFromBytes(selected, bytes);
        return;
      }

      const file = await pickBrowserFile();
      if (!file) return;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await openFromBytes(file.name, bytes);
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo abrir el documento.");
    } finally {
      setBusy(false);
    }
  }, [onError, openFromBytes]);

  const writeCurrent = useCallback(async (targetPath: string, targetFormat: DocumentFormat) => {
    if (!editor) return false;
    const html = editor.getHTML();
    const bytes = await htmlToBytes(targetFormat, html, localeRef.current);
    if (isTauri() && !targetPath.startsWith("browser:")) {
      await writePathBytes(targetPath, bytes);
    } else {
      downloadBytes(getFileName(targetPath), bytes);
    }
    setPath(targetPath);
    setFormat(targetFormat);
    markSaved(html);
    return true;
  }, [editor, markSaved]);

  const saveAs = useCallback(async () => {
    try {
      setBusy(true);
      if (isTauri()) {
        const selected = await pickSavePath(path ?? defaultFileName(format));
        if (!selected) return false;
        const nextFormat = getFormatFromPath(selected) ?? format;
        return writeCurrent(selected, nextFormat);
      }

      const nextName = path ?? defaultFileName(format);
      return writeCurrent(nextName, getFormatFromPath(nextName) ?? format);
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo guardar el documento.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [format, onError, path, writeCurrent]);

  const save = useCallback(async () => {
    if (!path) return saveAs();
    try {
      setBusy(true);
      return await writeCurrent(path, format);
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo guardar el documento.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [format, onError, path, saveAs, writeCurrent]);

  const requestAction = useCallback((action: Exclude<PendingAction, null>) => {
    if (dirtyRef.current) {
      pendingRef.current = action;
      setPendingAction(action);
      return;
    }
    if (action === "new") newDocument();
    if (action === "open") void openDocument();
    if (action === "close") {
      allowCloseRef.current = true;
      void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        void getCurrentWindow().close();
      });
    }
  }, [newDocument, openDocument]);

  const confirmPending = useCallback(async (mode: "save" | "discard" | "cancel") => {
    const action = pendingRef.current;
    pendingRef.current = null;
    setPendingAction(null);
    if (!action || mode === "cancel") {
      if (mode === "cancel") pendingOpenPathRef.current = null;
      return;
    }

    if (mode === "save") {
      const saved = await save();
      if (!saved) return;
    }

    if (action === "new") newDocument();
    if (action === "open") void openDocument();
    if (action === "open-path") {
      const nextPath = pendingOpenPathRef.current;
      pendingOpenPathRef.current = null;
      if (nextPath) void openFromPath(nextPath);
    }
    if (action === "close") {
      allowCloseRef.current = true;
      if (isTauri()) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().destroy();
      }
    }
  }, [newDocument, openDocument, openFromPath, save]);

  useEffect(() => {
    if (!editor) return;

    const updateDirty = () => {
      const nextDirty = editor.getHTML() !== savedHtmlRef.current;
      dirtyRef.current = nextDirty;
      setDirty(nextDirty);
    };

    editor.on("update", updateDirty);
    return () => {
      editor.off("update", updateDirty);
    };
  }, [editor]);

  useEffect(() => {
    if (!isTauri()) {
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!dirtyRef.current) return;
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }

    let unlisten: (() => void) | undefined;
    void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      void getCurrentWindow().onCloseRequested(async (event) => {
        if (allowCloseRef.current || !dirtyRef.current) return;
        event.preventDefault();
        pendingRef.current = "close";
        setPendingAction("close");
      }).then((fn) => {
        unlisten = fn;
      });
    });

    return () => unlisten?.();
  }, []);

  useEffect(() => {
    document.title = path ? `Doclight — ${title}` : `Doclight${dirty ? " •" : ""}`;
    if (!isTauri()) return;
    void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      void getCurrentWindow()
        .setTitle(path ? `Doclight — ${title}` : `Doclight${dirty ? " •" : ""}`)
        .catch(() => undefined);
    });
  }, [dirty, path, title]);

  useEffect(() => {
    if (!isTauri() || !editor) return;

    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void (async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      const { listen } = await import("@tauri-apps/api/event");
      if (cancelled) return;

      const launchPath = await invoke<string | null>("take_launch_path");
      if (launchPath && consumedLaunchPath !== launchPath) {
        consumedLaunchPath = launchPath;
        requestOpenPath(launchPath);
      }

      unlisten = await listen<string>("open-file", (event) => {
        requestOpenPath(event.payload);
      });
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [editor, requestOpenPath]);

  return {
    path,
    format,
    dirty,
    busy,
    fileName,
    title,
    formatLabel: formatLabel(format),
    pendingAction,
    newDocument: () => requestAction("new"),
    openDocument: () => requestAction("open"),
    save,
    saveAs,
    confirmPending,
  };
}
