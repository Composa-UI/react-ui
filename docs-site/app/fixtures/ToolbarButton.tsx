import { useState } from "react";
import { Bold } from "lucide-react";

import { ToolbarButton } from "@/components/ui3/ToolbarButton";

// Icon-only toolbar control used as a binary formatting toggle: its on state is
// driven by the `active` prop, flipped here with local state.
export default function ToolbarButtonFixture() {
  const [bold, setBold] = useState(true);
  return (
    <ToolbarButton
      icon={<Bold size={16} strokeWidth={1.5} />}
      active={bold}
      onClick={() => setBold(b => !b)}
    />
  );
}
