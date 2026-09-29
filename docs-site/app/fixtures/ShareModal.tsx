import { useState } from "react";

import {
  ShareModal,
  type SharePerson,
  type ShareScopeOption,
  type PendingShareInvitation,
} from "@/components/ui3/ShareModal";
import { Button } from "@/components/ui3/Button";

// ShareModal portals (Modal) and needs an open state, so it renders behind a
// trigger — click "Share project" to open the real share dialog (ModalFixture
// pattern). Every handler is wired, so the dialog is fully interactive: the
// access-scope row is a menu, each non-owner carries an editable role menu, and
// the pending invite offers Revoke. Roster, scope, and pending edits are held
// locally and committed through the callbacks.
const SCOPE_OPTIONS: ShareScopeOption[] = [
  { value: "workspace", label: "Anyone in the workspace" },
  { value: "link", label: "Anyone with the link" },
  { value: "invited", label: "Only people invited" },
];

export default function ShareModalFixture() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("workspace");
  const [people, setPeople] = useState<SharePerson[]>([
    { id: "you", name: "Sam Rivera", you: true, owner: true, color: "purple", initial: "S" },
    { id: "avery", name: "Avery Chen", access: "can edit", color: "blue", initial: "A" },
    { id: "jordan", name: "Jordan Lee", access: "can view", color: "green", initial: "J" },
  ]);
  const [pending, setPending] = useState<PendingShareInvitation[]>([
    { id: "p1", email: "morgan@example.com" },
  ]);

  return (
    <>
      <Button label="Share project" variant="Secondary" onClick={() => setOpen(true)} />
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        variant="project"
        people={people}
        scopeOptions={SCOPE_OPTIONS}
        scopeValue={scope}
        scopeLabel={SCOPE_OPTIONS.find(o => o.value === scope)?.label ?? "Anyone in the workspace"}
        onScopeChange={setScope}
        onCopyLink={() => undefined}
        onInvite={email =>
          setPending(prev => [...prev, { id: `p${prev.length + 1}`, email }])
        }
        onChangeAccess={(id, access) =>
          setPeople(prev => prev.map(p => (p.id === id ? { ...p, access } : p)))
        }
        onRemovePerson={id => setPeople(prev => prev.filter(p => p.id !== id))}
        pendingInvitations={pending}
        onRevokeInvitation={id => setPending(prev => prev.filter(p => p.id !== id))}
      />
    </>
  );
}
