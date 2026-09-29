// Live preview fixture for AnchoredInspectorOverlay — the shared anchored-overlay
// boundary. It renders no chrome itself, so this fixture supplies a header
// (title + close) and a small interactive body via `children`, and launches the
// surface from a labelled trigger Button through controlled `open`/`onClose`
// state (the ModalFixture pattern for components that portal). `side="bottom"`
// keeps the portalled surface inside the preview pane rather than off its left
// edge (the component default is side="left").
import { useState } from "react";
import { Type, X } from "lucide-react";

import { AnchoredInspectorOverlay } from "@/components/ui3/AnchoredInspectorOverlay";
import { Button } from "@/components/ui3/Button";
import { NumericInput } from "@/components/ui3/Input";

export default function AnchoredInspectorOverlayFixture() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(48);
  return (
    <AnchoredInspectorOverlay
      open={open}
      onClose={() => setOpen(false)}
      ariaLabel="Type settings"
      side="bottom"
      align="start"
      trigger={
        <Button
          label="Type settings"
          variant="Secondary"
          icon={<Type size={14} strokeWidth={1.5} />}
          iconLead="left"
          onClick={() => setOpen(o => !o)}
        />
      }
    >
      <div style={{ display: "grid", gap: 10, padding: 12, width: 216 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
            Type settings
          </span>
          <Button
            ariaLabel="Close"
            variant="Ghost"
            size="small"
            iconLead="center"
            icon={<X size={14} strokeWidth={1.5} />}
            onClick={() => setOpen(false)}
          />
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--color-text-secondary)" }}>
          An edge-aware surface portalled beside its trigger. The host owns every
          control inside it.
        </p>
        <NumericInput ariaLabel="Font size" value={size} min={8} max={144} suffix="px" onChange={setSize} />
      </div>
    </AnchoredInspectorOverlay>
  );
}
