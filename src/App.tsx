import { useEffect, useState } from "react";
import { useEditor, useEditorState } from "@tiptap/react";
import { Minus, Plus } from "lucide-react";
import { DocumentCanvas } from "@/components/DocumentCanvas";
import { FindBar } from "@/components/FindBar";
import { LinkDialog } from "@/components/LinkDialog";
import { Toolbar } from "@/components/Toolbar";
import { UnsavedDialog } from "@/components/UnsavedDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEditorExtensions, editorProps } from "@/editor/extensions";
import { useDocumentLanguage } from "@/hooks/use-document-language";
import { useDocumentSession } from "@/hooks/use-document-session";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useZoom } from "@/hooks/use-zoom";
import { LANGUAGE_OPTIONS } from "@/lib/language";
import { applyTheme, getPreferredTheme, type ThemeMode } from "@/lib/theme";
import { applyTextTransform, getLinkHref } from "@/lib/text-transform";

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const zoom = useZoom();

  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: "<p></p>",
    autofocus: "end",
    editorProps,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
  });

  const languageState = useDocumentLanguage(editor);

  const editorState = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      canUndo: current?.can()?.undo() ?? false,
      canRedo: current?.can()?.redo() ?? false,
      isBold: current?.isActive("bold") ?? false,
      isItalic: current?.isActive("italic") ?? false,
      isUnderline: current?.isActive("underline") ?? false,
      isBullet: current?.isActive("bulletList") ?? false,
      isOrdered: current?.isActive("orderedList") ?? false,
      isH1: current?.isActive("heading", { level: 1 }) ?? false,
      isH2: current?.isActive("heading", { level: 2 }) ?? false,
      isH3: current?.isActive("heading", { level: 3 }) ?? false,
      isCenter: current?.isActive({ textAlign: "center" }) ?? false,
      isRight: current?.isActive({ textAlign: "right" }) ?? false,
      selection: current?.state.selection.from ?? 0,
    }),
  });

  const session = useDocumentSession({
    editor,
    onError: setError,
    locale: languageState.language.locale,
  });

  useEffect(() => {
    const initial = getPreferredTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useShortcuts({
    onNew: session.newDocument,
    onOpen: session.openDocument,
    onSave: () => {
      void session.save();
    },
    onSaveAs: () => {
      void session.saveAs();
    },
    onFind: () => setFindOpen(true),
    onRedo: () => editor?.chain().focus().redo().run(),
    onSentenceCase: () => {
      if (editor) applyTextTransform(editor, "sentence", languageState.language.locale);
    },
    onInsertLink: () => setLinkOpen(true),
  });

  return (
    <div className="flex h-full flex-col bg-workspace">
      <Toolbar
        editor={editor}
        theme={theme}
        canUndo={editorState?.canUndo ?? false}
        canRedo={editorState?.canRedo ?? false}
        onNew={session.newDocument}
        onOpen={session.openDocument}
        onSave={() => void session.save()}
        onSaveAs={() => void session.saveAs()}
        onFind={() => setFindOpen(true)}
        onInsertLink={() => setLinkOpen(true)}
        onToggleTheme={() => {
          const next = theme === "dark" ? "light" : "dark";
          setTheme(next);
          applyTheme(next);
        }}
      />
      {findOpen ? (
        <FindBar
          editor={editor}
          query={findQuery}
          onQueryChange={setFindQuery}
          onClose={() => setFindOpen(false)}
        />
      ) : null}
      <div className="flex items-center justify-between gap-3 px-4 py-1 text-[11px] text-muted-foreground">
        <span>
          {session.fileName}
          {session.dirty ? " — sin guardar" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Select value={languageState.mode} onValueChange={languageState.choose}>
            <SelectTrigger
              className="py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              aria-label="Idioma del documento"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="auto">Auto · {languageState.language.name}</SelectItem>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>{session.formatLabel}</span>
          <div className="flex items-center">
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={zoom.zoomOut} aria-label="Alejar">
              <Minus />
            </Button>
            <button
              type="button"
              className="w-10 cursor-pointer text-center hover:text-foreground"
              onClick={zoom.reset}
              aria-label="Restablecer zoom"
            >
              {Math.round(zoom.zoom * 100)}%
            </button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={zoom.zoomIn} aria-label="Acercar">
              <Plus />
            </Button>
          </div>
        </div>
      </div>
      {error ? (
        <div className="mx-4 mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => setError(null)}>
            Cerrar
          </button>
        </div>
      ) : null}
      <main className="min-h-0 flex-1 overflow-auto">
        <DocumentCanvas
          editor={editor}
          zoom={zoom.zoom}
          locale={languageState.language.locale}
          onInsertLink={() => setLinkOpen(true)}
        />
      </main>
      <UnsavedDialog
        open={session.pendingAction !== null}
        documentName={session.fileName}
        onSave={() => void session.confirmPending("save")}
        onDiscard={() => void session.confirmPending("discard")}
        onCancel={() => void session.confirmPending("cancel")}
      />
      <LinkDialog
        open={linkOpen}
        initial={editor ? getLinkHref(editor) ?? "" : ""}
        onClose={() => setLinkOpen(false)}
        onSubmit={(href) => {
          editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
          setLinkOpen(false);
        }}
        onRemove={() => {
          editor?.chain().focus().unsetLink().run();
          setLinkOpen(false);
        }}
      />
    </div>
  );
}
