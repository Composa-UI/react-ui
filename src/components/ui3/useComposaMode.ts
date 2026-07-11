import { useEffect, useState } from "react";

function readComposaMode() {
  if (typeof document === "undefined") return undefined;
  return document.querySelector<HTMLElement>("[data-composa-mode]")?.dataset.composaMode || undefined;
}

/** Mirrors the active editor mode onto surfaces rendered through document.body portals. */
export function useComposaMode() {
  const [mode, setMode] = useState<string | undefined>(readComposaMode);

  useEffect(() => {
    const update = () => setMode(readComposaMode());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-composa-mode"],
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  return mode;
}
