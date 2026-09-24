import type { ReactNode } from "react";
import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { applyTextTransform, getLinkHref, getTransformRange, type TransformMode } from "@/lib/text-transform";
import { openExternalUrl } from "@/lib/open-url";

interface EditorContextMenuProps {
  editor: Editor | null;
  locale: string;
  onInsertLink: () => void;
  children: ReactNode;
}

interface MenuState {
  hasSelection: boolean;
  href: string | null;
}

function exec(command: "cut" | "copy" | "paste") {
  document.execCommand(command);
}

export function EditorContextMenu({ editor, locale, onInsertLink, children }: EditorContextMenuProps) {
  const [menu, setMenu] = useState<MenuState>({ hasSelection: false, href: null });

  function transform(mode: TransformMode) {
    if (editor) applyTextTransform(editor, mode, locale);
  }

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger
        className="relative block h-full"
        onContextMenu={() => {
          setMenu({
            hasSelection: Boolean(editor && getTransformRange(editor)),
            href: editor ? getLinkHref(editor) : null,
          });
        }}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <ContextMenuItem onSelect={() => exec("cut")}>Cortar</ContextMenuItem>
        <ContextMenuItem onSelect={() => exec("copy")}>Copiar</ContextMenuItem>
        <ContextMenuItem onSelect={() => exec("paste")}>Pegar</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!menu.hasSelection}>Transformar texto</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={() => transform("uppercase")}>Mayúsculas</ContextMenuItem>
            <ContextMenuItem onSelect={() => transform("lowercase")}>Minúsculas</ContextMenuItem>
            <ContextMenuItem onSelect={() => transform("capitalize")}>Capitalizadas</ContextMenuItem>
            <ContextMenuItem onSelect={() => transform("sentence")}>
              1ª letra en mayús.
              <ContextMenuShortcut>Shift+F3</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem
          disabled={!menu.hasSelection}
          onSelect={() => editor?.chain().focus().unsetColor().unsetBackgroundColor().removeEmptyTextStyle().run()}
        >
          Quitar colores
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onInsertLink}>{menu.href ? "Editar enlace" : "Insertar enlace"}</ContextMenuItem>
        {menu.href ? (
          <>
            <ContextMenuItem onSelect={() => void openExternalUrl(menu.href!)}>Abrir enlace</ContextMenuItem>
            <ContextMenuItem onSelect={() => void navigator.clipboard.writeText(menu.href!)}>
              Copiar enlace
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
