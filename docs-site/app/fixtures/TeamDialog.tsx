import { useState } from "react";

import {
  TeamDialog,
  type TeamTab,
  type TeamMember,
} from "@/components/ui3/TeamDialog";
import { Button } from "@/components/ui3/Button";

// TeamDialog portals (Modal) and needs an open state, so it renders behind a
// trigger — click "Manage team" to open the real dialog (ModalFixture pattern).
// The tab is controlled locally so both views are reachable: Members shows the
// "Team · N members" summary with per-member role menus (the Owner row is static
// text; editable rows open Can edit / Can view + Remove), and Settings shows the
// team name and About sections with their wired "Change name" / "Add a
// description" link actions. Roster and role edits are held locally and
// committed through the callbacks.
export default function TeamDialogFixture() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TeamTab>("members");
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "you", name: "Sam Rivera", email: "sam@example.com", role: "Owner", isYou: true, avatarColor: "purple", initial: "S" },
    { id: "avery", name: "Avery Chen", email: "avery@example.com", role: "can edit", avatarColor: "blue", initial: "A" },
    { id: "jordan", name: "Jordan Lee", email: "jordan@example.com", role: "can view", avatarColor: "green", initial: "J" },
    { id: "morgan", name: "Morgan Diaz", email: "morgan@example.com", role: "can view", pending: true, avatarColor: "grey", initial: "M" },
  ]);

  return (
    <>
      <Button label="Manage team" variant="Secondary" onClick={() => setOpen(true)} />
      <TeamDialog
        open={open}
        onClose={() => setOpen(false)}
        tab={tab}
        onTabChange={setTab}
        teamName="Acme Design"
        members={members}
        onChangeName={() => undefined}
        onAddDescription={() => undefined}
        onChangeMemberRole={(id, role) =>
          setMembers(prev => prev.map(m => (m.id === id ? { ...m, role } : m)))
        }
        onRemoveMember={id => setMembers(prev => prev.filter(m => m.id !== id))}
      />
    </>
  );
}
