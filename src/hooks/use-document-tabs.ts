import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { bytesToHtml, htmlToBytes } from "@/files/document-io";
import { isTauri } from "@/lib/is-tauri";
import { createEditorExtensions, editorProps } from "@/editor/extensions";
import {
  downloadBytes,
  pickBrowserFiles,
  pickOpenPaths,
  pickSavePath,
  readPathBytes,
  writePathBytes,
} from "@/files/native";
import { defaultFileName, formatLabel, getFileName, getFormatFromPath } from "@/files/path";
import { EMPTY_DOCUMENT_HTML, type DocumentFormat } from "@/files/types";

let launchPathsPromise: Promise<string[]> | null = null;

export interface DocumentTab {
  id: string;
  path: string | null;
  format: DocumentFormat;
  dirty: boolean;
  /** Number shown in the name of unsaved new documents ("Documento 2.docx"). */
  untitled: number;
  editor: Editor;
}

interface PendingClose {
  tabId: string;
  closeWindow: boolean;
}

interface UseDocumentTabsOptions {
  onError: (message: string) => void;
  locale?: string;
}

let nextTabNumber = 1;

function samePath(a: string, b: string) {
  const normalize = (value: string) => value.replaceAll("/", "\\").toLowerCase();
  return normalize(a) === normalize(b);
}

export function tabFileName(tab: Pick<DocumentTab, "path" | "format" | "untitled">) {
  if (tab.path) return getFileName(tab.path);
  const name = defaultFileName(tab.format);
  return tab.untitled > 1 ? name.replace(".", ` ${tab.untitled}.`) : name;
}

function nextUntitledNumber(tabs: DocumentTab[]) {
  const used = new Set(tabs.filter((tab) => !tab.path).map((tab) => tab.untitled));
  let number = 1;
  while (used.has(number)) number += 1;
  return number;
}

function isPristine(tab: DocumentTab) {
  return !tab.path && !tab.dirty && tab.editor.isEmpty;
}

export function useDocumentTabs({ onError, locale = "es-ES" }: UseDocumentTabsOptions) {
  const savedHtmlRef = useRef(new Map<string, string>());
  const createdEditorsRef = useRef(new Map<string, Editor>());
  const tabsRef = useRef<DocumentTab[]>([]);
  const activeIdRef = useRef("");
  const pendingRef = useRef<PendingClose | null>(null);
  const skippedOnCloseRef = useRef(new Set<string>());
  const allowCloseRef = useRef(false);
  const openQueueRef = useRef<Promise<void>>(Promise.resolve());
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const [tabs, setTabsState] = useState<DocumentTab[]>([]);
  const [activeId, setActiveIdState] = useState("");
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);

  const setTabs = useCallback((next: DocumentTab[]) => {
    tabsRef.current = next;
    setTabsState(next);
  }, []);

  const activate = useCallback((id: string) => {
    activeIdRef.current = id;
    setActiveIdState(id);
  }, []);

  const createTab = useCallback((html: string, path: string | null, format: DocumentFormat): DocumentTab => {
    const id = `tab-${nextTabNumber++}`;
    const editor = new Editor({
      extensions: createEditorExtensions(),
      content: html,
      editorProps,
    });
    savedHtmlRef.current.set(id, editor.getHTML());
    createdEditorsRef.current.set(id, editor);

    editor.on("update", () => {
      const dirty = editor.getHTML() !== savedHtmlRef.current.get(id);
      const current = tabsRef.current.find((tab) => tab.id === id);
      if (!current || current.dirty === dirty) return;
      setTabs(tabsRef.current.map((tab) => (tab.id === id ? { ...tab, dirty } : tab)));
    });

    const untitled = path ? 0 : nextUntitledNumber(tabsRef.current);
    return { id, path, format, dirty: false, untitled, editor };
  }, [setTabs]);

  // Always keep at least one document open.
  if (tabsRef.current.length === 0) {
    const first = createTab(EMPTY_DOCUMENT_HTML, null, "docx");
    tabsRef.current = [first];
    activeIdRef.current = first.id;
  }

  // Destroy editors whose tab has been closed (after React unmounted their view).
  useEffect(() => {
    for (const [id, editor] of createdEditorsRef.current) {
      if (tabs.some((tab) => tab.id === id) || tabsRef.current.some((tab) => tab.id === id)) continue;
      createdEditorsRef.current.delete(id);
      savedHtmlRef.current.delete(id);
      editor.destroy();
    }
  }, [tabs]);

  const updateTab = useCallback((id: string, patch: Partial<DocumentTab>) => {
    setTabs(tabsRef.current.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)));
  }, [setTabs]);

  /** Adds a tab, replacing the active one if it is an untouched blank document. */
  const addTab = useCallback((tab: DocumentTab) => {
    const current = tabsRef.current;
    const active = current.find((item) => item.id === activeIdRef.current);
    if (active && isPristine(active)) {
      setTabs(current.map((item) => (item.id === active.id ? tab : item)));
    } else {
      setTabs([...current, tab]);
    }
    activate(tab.id);
  }, [activate, setTabs]);

  const removeTab = useCallback((id: string) => {
    const current = tabsRef.current;
    const index = current.findIndex((tab) => tab.id === id);
    if (index === -1) return;
    const remaining = current.filter((tab) => tab.id !== id);
    tabsRef.current = remaining;
    const next = remaining.length > 0 ? remaining : [createTab(EMPTY_DOCUMENT_HTML, null, "docx")];
    setTabs(next);
    if (activeIdRef.current === id || !next.some((tab) => tab.id === activeIdRef.current)) {
      activate(next[Math.min(index, next.length - 1)].id);
    }
  }, [activate, createTab, setTabs]);

  const newDocument = useCallback(() => {
    const tab = createTab(EMPTY_DOCUMENT_HTML, null, "docx");
    setTabs([...tabsRef.current, tab]);
    activate(tab.id);
  }, [activate, createTab, setTabs]);

  const openFromBytes = useCallback(async (path: string, bytes: Uint8Array) => {
    const format = getFormatFromPath(path);
    if (!format) {
      onError(`«${getFileName(path)}»: Doclight solo abre archivos .docx, .txt y .md.`);
      return;
    }
    const html = await bytesToHtml(format, bytes);
    addTab(createTab(html, path, format));
  }, [addTab, createTab, onError]);

  const openPath = useCallback(async (path: string) => {
    const existing = tabsRef.current.find((tab) => tab.path && samePath(tab.path, path));
    if (existing) {
      activate(existing.id);
      return;
    }
    try {
      const bytes = await readPathBytes(path);
      await openFromBytes(path, bytes);
    } catch (error) {
      onError(error instanceof Error ? error.message : `No se pudo abrir «${getFileName(path)}».`);
    }
  }, [activate, onError, openFromBytes]);

  /** Opens files one after another so their tabs keep the requested order. */
  const openPaths = useCallback((paths: string[]) => {
    for (const path of paths) {
      openQueueRef.current = openQueueRef.current.then(() => openPath(path));
    }
  }, [openPath]);

  const openDocument = useCallback(async () => {
    try {
      if (isTauri()) {
        openPaths(await pickOpenPaths());
        return;
      }

      for (const file of await pickBrowserFiles()) {
        await openFromBytes(file.name, new Uint8Array(await file.arrayBuffer()));
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo abrir el documento.");
    }
  }, [onError, openFromBytes, openPaths]);

  const writeTab = useCallback(async (id: string, targetPath: string, targetFormat: DocumentFormat) => {
    const tab = tabsRef.current.find((item) => item.id === id);
    if (!tab) return false;
    const html = tab.editor.getHTML();
    const bytes = await htmlToBytes(targetFormat, html, localeRef.current);
    if (isTauri() && !targetPath.startsWith("browser:")) {
      await writePathBytes(targetPath, bytes);
    } else {
      downloadBytes(getFileName(targetPath), bytes);
    }
    savedHtmlRef.current.set(id, html);
    updateTab(id, { path: targetPath, format: targetFormat, dirty: false });
    return true;
  }, [updateTab]);

  const saveTabAs = useCallback(async (id: string) => {
    const tab = tabsRef.current.find((item) => item.id === id);
    if (!tab) return false;
    try {
      const suggested = tab.path ?? tabFileName(tab);
      if (isTauri()) {
        const selected = await pickSavePath(suggested);
        if (!selected) return false;
        return await writeTab(id, selected, getFormatFromPath(selected) ?? tab.format);
      }
      return await writeTab(id, suggested, getFormatFromPath(suggested) ?? tab.format);
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo guardar el documento.");
      return false;
    }
  }, [onError, writeTab]);

  const saveTab = useCallback(async (id: string) => {
    const tab = tabsRef.current.find((item) => item.id === id);
    if (!tab) return false;
    if (!tab.path) return saveTabAs(id);
    try {
      return await writeTab(id, tab.path, tab.format);
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo guardar el documento.");
      return false;
    }
  }, [onError, saveTabAs, writeTab]);

  const askToClose = useCallback((pending: PendingClose) => {
    activate(pending.tabId);
    pendingRef.current = pending;
    setPendingClose(pending);
  }, [activate]);

  const closeTab = useCallback((id: string) => {
    const tab = tabsRef.current.find((item) => item.id === id);
    if (!tab) return;
    if (tab.dirty) {
      askToClose({ tabId: id, closeWindow: false });
      return;
    }
    removeTab(id);
  }, [askToClose, removeTab]);

  /** Walks every unsaved tab asking what to do, then closes the window. */
  const closeWindow = useCallback(async () => {
    const dirty = tabsRef.current.find((tab) => tab.dirty && !skippedOnCloseRef.current.has(tab.id));
    if (dirty) {
      askToClose({ tabId: dirty.id, closeWindow: true });
      return;
    }
    allowCloseRef.current = true;
    if (isTauri()) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().destroy();
    }
  }, [askToClose]);

  const confirmPending = useCallback(async (mode: "save" | "discard" | "cancel") => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setPendingClose(null);
    if (!pending || mode === "cancel") {
      skippedOnCloseRef.current.clear();
      return;
    }

    if (mode === "save" && !(await saveTab(pending.tabId))) {
      skippedOnCloseRef.current.clear();
      return;
    }

    if (pending.closeWindow) {
      skippedOnCloseRef.current.add(pending.tabId);
      await closeWindow();
    } else {
      removeTab(pending.tabId);
    }
  }, [closeWindow, removeTab, saveTab]);

  const cycle = useCallback((step: number) => {
    const current = tabsRef.current;
    const index = current.findIndex((tab) => tab.id === activeIdRef.current);
    activate(current[(index + step + current.length) % current.length].id);
  }, [activate]);

  const moveTab = useCallback((id: string, overId: string) => {
    const current = [...tabsRef.current];
    const from = current.findIndex((tab) => tab.id === id);
    const to = current.findIndex((tab) => tab.id === overId);
    if (from === -1 || to === -1 || from === to) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    setTabs(current);
  }, [setTabs]);

  const closeWindowRef = useRef(closeWindow);
  closeWindowRef.current = closeWindow;
  const openPathsRef = useRef(openPaths);
  openPathsRef.current = openPaths;

  useEffect(() => {
    if (!isTauri()) {
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!tabsRef.current.some((tab) => tab.dirty)) return;
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }

    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    void (async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      const { listen } = await import("@tauri-apps/api/event");
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const { getCurrentWebview } = await import("@tauri-apps/api/webview");

      launchPathsPromise ??= invoke<string[]>("take_launch_paths").catch(() => []);
      const launchPaths = await launchPathsPromise;
      if (cancelled) return;
      openPathsRef.current(launchPaths);

      const handlers = await Promise.all([
        getCurrentWindow().onCloseRequested((event) => {
          if (allowCloseRef.current || !tabsRef.current.some((tab) => tab.dirty)) return;
          event.preventDefault();
          skippedOnCloseRef.current.clear();
          void closeWindowRef.current();
        }),
        listen<string[]>("open-files", (event) => openPathsRef.current(event.payload)),
        getCurrentWebview().onDragDropEvent((event) => {
          if (event.payload.type === "drop") openPathsRef.current(event.payload.paths);
        }),
      ]);
      if (cancelled) handlers.forEach((unlisten) => unlisten());
      else unlisteners.push(...handlers);
    })();

    return () => {
      cancelled = true;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);

  const renderedTabs = tabs.length > 0 ? tabs : tabsRef.current;
  const currentId = activeId || activeIdRef.current;
  const activeTab = renderedTabs.find((tab) => tab.id === currentId) ?? renderedTabs[0];
  const fileName = tabFileName(activeTab);
  const title = `${fileName}${activeTab.dirty ? " •" : ""}`;

  useEffect(() => {
    const next = activeTab.path ? `Doclight — ${title}` : `Doclight${activeTab.dirty ? " •" : ""}`;
    document.title = next;
    if (!isTauri()) return;
    void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      void getCurrentWindow().setTitle(next).catch(() => undefined);
    });
  }, [activeTab.dirty, activeTab.path, title]);

  useEffect(() => {
    const editor = activeTab.editor;
    const frame = requestAnimationFrame(() => {
      if (!editor.isDestroyed && !pendingRef.current) editor.commands.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab.editor]);

  const pendingTab = pendingClose ? renderedTabs.find((tab) => tab.id === pendingClose.tabId) : undefined;

  return {
    tabs: renderedTabs,
    activeTab,
    editor: activeTab.editor,
    fileName,
    formatLabel: formatLabel(activeTab.format),
    pendingCloseName: pendingTab ? tabFileName(pendingTab) : null,
    activate,
    newDocument,
    openDocument: () => void openDocument(),
    closeTab,
    closeActiveTab: () => closeTab(activeTab.id),
    nextTab: () => cycle(1),
    previousTab: () => cycle(-1),
    moveTab,
    save: () => saveTab(activeTab.id),
    saveAs: () => saveTabAs(activeTab.id),
    confirmPending,
  };
}
