import { isTauri } from "@/lib/is-tauri";

export function sanitizeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  if (/[\s<>]/.test(trimmed)) return null;
  if (/^(javascript|vbscript|data|file):/i.test(trimmed)) return null;
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("#") && !trimmed.includes(":")) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export async function openExternalUrl(url: string) {
  const safe = sanitizeHref(url);
  if (!safe || safe.startsWith("#")) return;

  if (isTauri()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(safe);
    return;
  }

  window.open(safe, "_blank", "noopener,noreferrer");
}
