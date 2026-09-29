// Live preview fixture for Input — the text InputField primitive as it appears
// in an inspector field: a label above, a controlled value, a leading glyph
// column, and a hint line below. InputField is value-controlled only
// (defaultValue renders empty), so it binds value + onChange via useState.
// Styling stays on the component's own c-* tokens — no hardcoded colors.
import { useState } from "react";
import { Type } from "lucide-react";

import { InputField } from "@/components/ui3/Input";

export default function InputFixture() {
  const [name, setName] = useState("Hero headline");
  return (
    <div style={{ width: 240 }}>
      <InputField
        label="Layer name"
        value={name}
        onChange={setName}
        placeholder="Untitled layer"
        leadingIcon={<Type size={14} strokeWidth={1.5} />}
        hint="Shown in the layers list."
      />
    </div>
  );
}
