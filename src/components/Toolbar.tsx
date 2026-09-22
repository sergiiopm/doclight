import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FilePlus,
  FolderOpen,
  Italic,
  Link2,
  List,
  ListOrdered,
  Moon,
  Redo2,
  Save,
  Search,
  Sun,
  Underline,
  Undo2,
} from "lucide-react";
import { ToolbarButton } from "@/components/ToolbarButton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ThemeMode } from "@/lib/theme";

interface ToolbarProps {
  editor: Editor | null;
  theme: ThemeMode;
  canUndo: boolean;
  canRedo: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onFind: () => void;
  onToggleTheme: () => void;
  onInsertLink: () => void;
}

function HeadingButton({
  editor,
  label,
  level,
  hint,
}: {
  editor: Editor | null;
  label: string;
  level: 0 | 1 | 2 | 3;
  hint: string;
}) {
  const pressed = level === 0
    ? Boolean(editor?.isActive("paragraph")) && !editor?.isActive("heading")
    : Boolean(editor?.isActive("heading", { level }));

  return (
    <ToolbarButton
      label={hint}
      pressed={pressed}
      disabled={!editor}
      className="w-auto min-w-8 px-2 font-semibold"
      onClick={() => {
        if (!editor) return;
        const chain = editor.chain().focus();
        if (level === 0) {
          chain.setParagraph().run();
        } else {
          chain.toggleHeading({ level }).run();
        }
      }}
    >
      {label}
    </ToolbarButton>
  );
}

export function Toolbar({
  editor,
  theme,
  canUndo,
  canRedo,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onFind,
  onToggleTheme,
  onInsertLink,
}: ToolbarProps) {
  return (
    <header className="flex flex-wrap items-center gap-0.5 border-b border-border bg-background px-2 py-1">
      <ToolbarButton label="Nuevo" shortcut="Ctrl+N" onClick={onNew}>
        <FilePlus />
      </ToolbarButton>
      <ToolbarButton label="Abrir" shortcut="Ctrl+O" onClick={onOpen}>
        <FolderOpen />
      </ToolbarButton>
      <ToolbarButton label="Guardar" shortcut="Ctrl+S" onClick={onSave}>
        <Save />
      </ToolbarButton>
      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onSaveAs}>
        Guardar como
      </Button>

      <Separator className="mx-1" />

      <ToolbarButton label="Deshacer" shortcut="Ctrl+Z" disabled={!canUndo} onClick={() => editor?.chain().focus().undo().run()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Rehacer" shortcut="Ctrl+Y" disabled={!canRedo} onClick={() => editor?.chain().focus().redo().run()}>
        <Redo2 />
      </ToolbarButton>

      <Separator className="mx-1" />

      <HeadingButton editor={editor} label="N" level={0} hint="Normal" />
      <HeadingButton editor={editor} label="H1" level={1} hint="Título 1" />
      <HeadingButton editor={editor} label="H2" level={2} hint="Título 2" />
      <HeadingButton editor={editor} label="H3" level={3} hint="Título 3" />

      <Separator className="mx-1" />

      <ToolbarButton
        label="Negrita"
        shortcut="Ctrl+B"
        pressed={Boolean(editor?.isActive("bold"))}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Cursiva"
        shortcut="Ctrl+I"
        pressed={Boolean(editor?.isActive("italic"))}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Subrayado"
        shortcut="Ctrl+U"
        pressed={Boolean(editor?.isActive("underline"))}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <Underline />
      </ToolbarButton>
      <ToolbarButton
        label="Enlace"
        shortcut="Ctrl+K"
        pressed={Boolean(editor?.isActive("link"))}
        onClick={onInsertLink}
      >
        <Link2 />
      </ToolbarButton>

      <Separator className="mx-1" />

      <ToolbarButton
        label="Alinear a la izquierda"
        pressed={Boolean(editor?.isActive({ textAlign: "left" })) || (!editor?.isActive({ textAlign: "center" }) && !editor?.isActive({ textAlign: "right" }))}
        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft />
      </ToolbarButton>
      <ToolbarButton
        label="Centrar"
        pressed={Boolean(editor?.isActive({ textAlign: "center" }))}
        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter />
      </ToolbarButton>
      <ToolbarButton
        label="Alinear a la derecha"
        pressed={Boolean(editor?.isActive({ textAlign: "right" }))}
        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight />
      </ToolbarButton>

      <Separator className="mx-1" />

      <ToolbarButton
        label="Lista con viñetas"
        pressed={Boolean(editor?.isActive("bulletList"))}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        pressed={Boolean(editor?.isActive("orderedList"))}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton label="Buscar" shortcut="Ctrl+F" onClick={onFind}>
          <Search />
        </ToolbarButton>
        <ToolbarButton
          label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </ToolbarButton>
      </div>
    </header>
  );
}
