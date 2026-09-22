import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { sanitizeHref } from "@/lib/open-url";

interface LinkDialogProps {
  open: boolean;
  initial: string;
  onClose: () => void;
  onSubmit: (href: string) => void;
  onRemove: () => void;
}

export function LinkDialog({ open, initial, onClose, onSubmit, onRemove }: LinkDialogProps) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initial);
      setError(null);
    }
  }, [initial, open]);

  function submit() {
    const href = sanitizeHref(value) ?? sanitizeHref(`https://${value.trim()}`);
    if (!href || href.startsWith("#")) {
      setError("Introduce una URL http(s) o un correo mailto.");
      return;
    }
    onSubmit(href);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar enlace" : "Insertar enlace"}</DialogTitle>
          <DialogDescription>
            Ctrl+clic abre el enlace en el navegador. También puedes usar el menú contextual.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          placeholder="https://ejemplo.com"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          {initial ? (
            <Button type="button" variant="ghost" onClick={onRemove}>
              Quitar enlace
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button type="button" onClick={submit}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
