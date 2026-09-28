import { useState } from "react";

import { ImageAdjustDialog } from "@/components/ui3/ImageAdjustDialog";
import { Button } from "@/components/ui3/Button";

// A representative source image for the crop preview. Encoded inline so the
// fixture is self-contained (no network) and carries no #hex literals — the
// SVG uses named colors only.
const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0" stop-color="rebeccapurple"/>
           <stop offset="1" stop-color="teal"/>
         </linearGradient>
       </defs>
       <rect width="400" height="400" fill="url(#g)"/>
       <circle cx="200" cy="160" r="72" fill="white" opacity="0.92"/>
       <rect x="104" y="250" width="192" height="160" rx="96" fill="white" opacity="0.92"/>
     </svg>`,
  );

// ImageAdjustDialog portals through Modal (focus-trapped, scrim, Esc to close),
// so — like ModalFixture — it renders behind a labelled trigger and is opened
// via useState. src is supplied so the preview is drag-to-pan and Save enabled.
export default function ImageAdjustDialogFixture() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        label="Adjust profile picture"
        variant="Secondary"
        onClick={() => setOpen(true)}
      />
      <ImageAdjustDialog
        open={open}
        onClose={() => setOpen(false)}
        src={SAMPLE_IMAGE}
        shape="circle"
        saveLabel="Save image"
        title="Adjust profile picture"
        onSave={() => setOpen(false)}
      />
    </>
  );
}
