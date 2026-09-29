import { useState } from "react";

import { ChipVariable } from "@/components/ui3/ChipVariable";
import { Button } from "@/components/ui3/Button";

// A variable-bound value inside an inspector input: the chip is read-only and
// its detach control unbinds the variable. Detaching hides the chip; a small
// button re-binds it so the affordance stays demonstrable.
export default function ChipVariableFixture() {
  const [bound, setBound] = useState(true);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {bound ? (
        <ChipVariable value="opacity" state="Selected" onDetach={() => setBound(false)} />
      ) : (
        <Button label="Bind variable" variant="Secondary" size="small" onClick={() => setBound(true)} />
      )}
    </div>
  );
}
