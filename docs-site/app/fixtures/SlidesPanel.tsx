// Live preview fixture for SlidesPanel — the Compositions left-rail: a scrollable,
// data-driven list of slide thumbnails that drives slide selection, rename, and the
// new-slide action. Renders the REAL component fully controlled: selection and the
// project title live in local state, so clicking a row selects it and committing the
// header rename updates the title. New slide is a no-op; wiring the per-slide
// callbacks surfaces the right-click Rename / Duplicate / Delete menu. One SlideData
// drives each row, so the list shows the selected, in-view, group (expanded),
// sub-slide, stacked, and motion variants at once.
//
// TOKENS ONLY: thumbnail `tint` fallbacks are token-based CSS-var gradients, never
// hardcoded hex, so the preview retints in light and dark.
import { useState } from "react";

import { SlidesPanel, type SlideData } from "@/components/ui3/SlidesPanel";

export default function SlidesPanelFixture() {
  const [title, setTitle] = useState("Product review");
  const [selected, setSelected] = useState(0);

  const rows: Omit<SlideData, "selected" | "onClick">[] = [
    { n: 1, tint: "linear-gradient(135deg,var(--color-c-bg-brand),var(--color-c-bg-selected))" },
    { n: 2, inView: true, tint: "linear-gradient(135deg,var(--color-c-bg-assistive),var(--color-c-bg-brand))" },
    { n: 3, group: true, expanded: true, tint: "linear-gradient(135deg,var(--color-c-bg-inverse),var(--color-c-bg-secondary))" },
    { n: 4, sub: true, motion: true, tint: "linear-gradient(135deg,var(--color-c-bg-selected),var(--color-c-bg-brand))" },
    { n: 5, stacked: true, tint: "linear-gradient(135deg,var(--color-c-bg-secondary),var(--color-c-bg-inverse))" },
  ];

  const slides: SlideData[] = rows.map((row, i) => ({
    ...row,
    selected: i === selected,
    onClick: () => setSelected(i),
  }));

  return (
    <div style={{ height: 380, display: "flex" }}>
      <SlidesPanel
        title={title}
        slides={slides}
        aspectRatio={16 / 9}
        onTitleChange={setTitle}
        onNewSlide={() => undefined}
        onRenameRequest={() => undefined}
        onSlideDuplicate={() => undefined}
        onSlideDelete={() => undefined}
      />
    </div>
  );
}
