import { useState } from "react";

import { Modal, ModalHeader, ModalBody, ModalFooter, MODAL_WIDTHS } from "@/components/ui3/Dialog";
import { Button } from "@/components/ui3/Button";
import { InputField } from "@/components/ui3/Input";

// Dialog (the Modal family) portals to document.body with a Radix focus trap,
// Escape handling and an aria-modal scrim, so it renders behind a trigger —
// click "Share project" to open the real dialog. Composed from ModalHeader /
// ModalBody / ModalFooter at the "standard" (480) width preset; the title binds
// to RadixDialog.Title for assistive tech, and both Escape and a backdrop click
// fire onClose.
export default function DialogFixture() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <>
      <Button
        label="Share project"
        variant="Secondary"
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} width={MODAL_WIDTHS.standard}>
        <ModalHeader title="Share project" onClose={() => setOpen(false)} />
        <ModalBody padding>
          <div style={{ display: "grid", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              Invite a collaborator by email. They'll get edit access to this
              project and its overlays.
            </p>
            <InputField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button label="Cancel" variant="Secondary" onClick={() => setOpen(false)} />
          <Button label="Invite" variant="Primary" onClick={() => setOpen(false)} />
        </ModalFooter>
      </Modal>
    </>
  );
}
