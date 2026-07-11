import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const ComposaModeContext = createContext<string | undefined>(undefined);

function nearestMode(anchor?: Element | null) {
  if (typeof document === "undefined") return undefined;
  return anchor?.closest<HTMLElement>("[data-composa-mode]")?.dataset.composaMode
    ?? document.querySelector<HTMLElement>("[data-composa-mode]")?.dataset.composaMode
    ?? undefined;
}

/** Anchors portalled descendants to the nearest themed shell, including mixed-root pages. */
export function ComposaModeProvider({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [mode, setMode] = useState<string>();
  useEffect(() => {
    const update = () => setMode(nearestMode(anchor.current?.parentElement));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-composa-mode"], subtree: true });
    return () => observer.disconnect();
  }, []);
  return <ComposaModeContext.Provider value={mode}><span ref={anchor} className="contents">{children}</span></ComposaModeContext.Provider>;
}

/** Mirrors provider mode, or the mode nearest the trigger active when the overlay opens. */
export function useComposaMode() {
  const provided = useContext(ComposaModeContext);
  const [anchored] = useState(() => nearestMode(typeof document === "undefined" ? null : document.activeElement));
  return provided ?? anchored;
}
