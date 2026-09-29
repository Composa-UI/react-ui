import { useState } from "react";

import { AnimationStylesDialog, type AnimationStyleGroup } from "@/components/ui3/AnimationStylesDialog";
import { Dropdown } from "@/components/ui3/Dropdown";

// Capability-truthful style groups for a Build in phase. More than one group so
// the category-filter row renders; every option is a supported style, no inert
// design-only rows.
const GROUPS: AnimationStyleGroup[] = [
  {
    label: "Fade",
    options: [
      { value: "fade-in", label: "Fade in" },
      { value: "fade-in-up", label: "Fade in up" },
      { value: "fade-in-down", label: "Fade in down" },
    ],
  },
  {
    label: "Move",
    options: [
      { value: "slide-in-left", label: "Slide in left" },
      { value: "slide-in-right", label: "Slide in right" },
    ],
  },
  {
    label: "Scale",
    options: [
      { value: "scale-in", label: "Scale in" },
      { value: "pop-in", label: "Pop in" },
    ],
  },
];

const LABELS: Record<string, string> = Object.fromEntries(
  GROUPS.flatMap(group => group.options.map(option => [option.value, option.label])),
);

export default function AnimationStylesDialogFixture() {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState("fade-in");

  return (
    <AnimationStylesDialog
      open={open}
      onClose={() => setOpen(false)}
      title="Build in styles"
      trigger={
        <Dropdown
          ariaLabel="Build in style"
          value={LABELS[style]}
          onClick={() => setOpen(true)}
        />
      }
      groups={GROUPS}
      value={style}
      onSelect={value => {
        setStyle(value);
        setOpen(false);
      }}
    />
  );
}
