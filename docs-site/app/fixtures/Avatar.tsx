import { Building2 } from "lucide-react";

import { Avatar, AvatarWithStatus } from "@/components/ui3/Avatar";

// Small identity atom: a compact multiplayer presence stack showing the main
// content forms — a live collaborator (initial + audio presence), a plain
// initial, an org/workspace icon slot, and a "+N" overflow badge.
export default function AvatarFixture() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <AvatarWithStatus initial="H" color="blue" status="audio" />
      <Avatar initial="M" color="green" />
      <Avatar color="purple" icon={<Building2 size={14} color="white" strokeWidth={1.5} />} />
      <Avatar overflow={4} />
    </div>
  );
}
