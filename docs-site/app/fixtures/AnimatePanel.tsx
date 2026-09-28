// Live preview fixture for AnimatePanel — the Animate tab body. It is an inline
// rail panel (a ScrollArea of two PanelSections), so it renders directly inside a
// sized, rail-width container rather than behind a trigger. The host owns the data
// model; here small local state stands in for it so the demo is interactive:
// selecting "element" with a focused card auto-expands one animation to show the
// expanded surface, while the comp transition card reflects a wired Fade.
import { useState } from "react";

import {
  AnimatePanel,
  type CompTransitionSettings,
  type ObjectAnimationItem,
} from "@/components/ui3/AnimatePanel";

export default function AnimatePanelFixture() {
  const [transition, setTransition] = useState<CompTransitionSettings>({
    style: "fade",
    direction: "right",
    durationMs: 300,
    easing: "ease-out",
  });
  const [anims, setAnims] = useState<ObjectAnimationItem[]>([
    { id: "title", elementId: "title", n: 1, name: "Title", kind: "In", duration: "0.6s", style: "fade-in", buildDuration: "600ms", focused: true, selected: true },
    { id: "body", elementId: "body", n: 2, name: "Body", kind: "In", duration: "0.4s", style: "slide-in", buildDuration: "400ms", direction: "up" },
    { id: "cta", elementId: "cta", n: 3, name: "CTA", kind: "Action", duration: "0.5s", style: "pulse", intensity: "medium" },
  ]);

  return (
    <div style={{ width: 272, height: 420, overflow: "hidden", borderRadius: 8, border: "1px solid var(--color-border)" }}>
      <AnimatePanel
        selectionType="element"
        anims={anims}
        compTransition={transition}
        compTransitionCallbacks={{
          onStyleChange: style => setTransition(t => ({ ...t, style })),
          onDirectionChange: direction => setTransition(t => ({ ...t, direction })),
          onDurationChange: durationMs => setTransition(t => ({ ...t, durationMs })),
          onEasingChange: easing => setTransition(t => ({ ...t, easing })),
        }}
        objectAnimationCallbacks={{
          onAdd: () => undefined,
          onRemove: id => setAnims(list => list.filter(a => a.id !== id)),
          onStyleChange: (id, style) => setAnims(list => list.map(a => (a.id === id ? { ...a, style } : a))),
          onReorder: () => undefined,
        }}
      />
    </div>
  );
}
