// Live preview fixture for GeneratedControlsDialog — renders the REAL component
// from src. This is a non-modal, rail-anchored overlay, so (like ModalFixture)
// it is launched from a labelled trigger Button and its open state lives on the
// always-mounted wrapper. The dialog owns no value store — it projects host
// state and emits onChange(controlId, value) — so the manifest values live here
// and are echoed back through onChange, matching the component's contract.
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import {
  GeneratedControlsDialog,
  type GeneratedControlsValue,
} from "@/components/ui3/GeneratedControlsDialog";

// The color control is document data, not styling, but per the tokens-only rule
// we never author a hex literal: seed the Tint from the --color-bg-brand token,
// resolved at render so it tracks light/dark. ColorInput needs a real hex value.
function brandTint(): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--color-bg-brand")
    .trim();
}

export default function GeneratedControlsDialogFixture() {
  const [open, setOpen] = useState(false);
  // One representative control per manifest kind: number, color, text, boolean,
  // enum, asset. The host projects native document state; committing a field
  // routes through onChange(controlId, value) back into this record.
  const [values, setValues] = useState<Record<string, number | string | boolean>>(() => ({
    radius: 8,
    tint: brandTint(),
    label: "Glow",
    shadow: true,
    blend: "screen",
    texture: "",
  }));

  const value: GeneratedControlsValue = {
    id: "glow",
    title: "Glow",
    controls: [
      {
        id: "radius",
        kind: "number",
        label: "Radius",
        description: "Blur radius of the glow",
        value: values.radius as number,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
      },
      {
        id: "tint",
        kind: "color",
        label: "Tint",
        description: "Glow color",
        value: values.tint as string,
      },
      {
        id: "label",
        kind: "text",
        label: "Label",
        description: "Layer name shown in the timeline",
        value: values.label as string,
      },
      {
        id: "shadow",
        kind: "boolean",
        label: "Shadow",
        description: "Cast a drop shadow behind the layer",
        value: values.shadow as boolean,
      },
      {
        id: "blend",
        kind: "enum",
        label: "Blend",
        description: "How the glow composites over the canvas",
        value: values.blend as string,
        options: [
          { value: "normal", label: "Normal" },
          { value: "multiply", label: "Multiply" },
          { value: "screen", label: "Screen" },
        ],
      },
      {
        id: "texture",
        kind: "asset",
        label: "Texture",
        description: "Overlay texture image",
        value: values.texture as string,
        displayValue: (values.texture as string) || undefined,
      },
    ],
  };

  return (
    <GeneratedControlsDialog
      value={value}
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <Button
          label="Edit glow"
          variant="Secondary"
          icon={<Sparkles size={14} strokeWidth={1.5} />}
          iconLead="left"
          onClick={() => setOpen(true)}
        />
      }
      onChange={(controlId, next) => setValues(state => ({ ...state, [controlId]: next }))}
      onChooseAsset={controlId => setValues(state => ({ ...state, [controlId]: "Grain.png" }))}
    />
  );
}
