import { clsx } from "clsx";
import { Modal, ModalHeader, ModalBody, ModalFooter, MODAL_WIDTHS } from "./Dialog";
import { Button } from "./Button";

// DeleteConfirmDialog — a small confirmation dialog with a danger (red) confirm
// button (Editor-Study node 288-6360).
//
// The Figma node shows the eventual subscription-cancellation copy, but there is
// no membership/billing model yet, so this ships as the simpler generic
// destructive-confirm the app needs today: a message + [Cancel] + a red confirm.
// Copy is fully prop-driven so the same dialog serves team / project / any
// destructive confirm. (Flagged to Samuel: revisit copy once billing lands.)

const FONT = "font-[family-name:var(--composa-font-family)]";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Danger (red) confirm button — the default. Set false for a neutral confirm. */
  destructive?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Delete?",
  message = "Are you sure you want to delete? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
}: DeleteConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} width={MODAL_WIDTHS.dialog} backdrop>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody scrollable={false} padding>
        <p className={clsx(FONT, "[font-size:var(--composa-body-medium-size)] [line-height:var(--composa-body-medium-line)] [font-weight:var(--composa-body-medium-weight)] [letter-spacing:var(--composa-body-medium-letter-spacing)] text-c-text")}>
          {message}
        </p>
      </ModalBody>
      <ModalFooter align="end">
        <Button variant="Ghost" label={cancelLabel} onClick={onClose} />
        <Button
          variant={destructive ? "Destructive" : "Primary"}
          label={confirmLabel}
          onClick={() => { onConfirm(); }}
        />
      </ModalFooter>
    </Modal>
  );
}
