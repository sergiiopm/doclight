import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "doclight-zoom";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const STEP = 0.1;

function clampZoom(value: number) {
  return Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)) * 10) / 10;
}

function persist(value: number) {
  window.localStorage.setItem(STORAGE_KEY, String(value));
}

export function useZoom() {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    if (!Number.isNaN(stored) && stored >= MIN_ZOOM && stored <= MAX_ZOOM) {
      setZoom(clampZoom(stored));
    }
  }, []);

  const set = useCallback((value: number) => {
    const next = clampZoom(value);
    setZoom(next);
    persist(next);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => {
      const next = clampZoom(current + STEP);
      persist(next);
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => {
      const next = clampZoom(current - STEP);
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => set(1), [set]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      if (event.key === "+" || event.key === "=" || event.code === "NumpadAdd") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-" || event.key === "_" || event.code === "NumpadSubtract") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0" || event.code === "Numpad0") {
        event.preventDefault();
        reset();
      }
    }

    function onWheel(event: WheelEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      if (event.deltaY < 0) zoomIn();
      else zoomOut();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [reset, zoomIn, zoomOut]);

  return { zoom, set, zoomIn, zoomOut, reset };
}
