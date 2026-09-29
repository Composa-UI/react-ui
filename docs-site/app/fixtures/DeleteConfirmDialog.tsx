import { useState } from "react";

import { DeleteConfirmDialog } from "@/components/ui3/DeleteConfirmDialog";
import { Button } from "@/components/ui3/Button";

// DeleteConfirmDialog portals (Modal) and needs an open state, so it renders
// behind a trigger — click "Delete team" to open the real danger-confirm dialog.
// Copy is fully prop-driven; both Escape and a backdrop click fire onClose, so
// dismissal is treated as "cancel".
export default function DeleteConfirmDialogFixture() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        label="Delete team"
        variant="Destructive"
        onClick={() => setOpen(true)}
      />
      <DeleteConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Delete team?"
        message="This permanently deletes the team and its projects. This can't be undone."
        confirmLabel="Delete team"
      />
    </>
  );
}
