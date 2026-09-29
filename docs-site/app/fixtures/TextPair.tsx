import { TextPair } from "@/components/ui3/TextPair";

// Live preview fixture for TextPair — the read-only label + value primitive as
// it appears in an inspector property block: the horizontal default (value
// truncates), a prominent value, a muted label, and a vertical (stacked) pair.
// Presentational only — no interactive/controlled props — so it renders
// directly. The containing row/panel owns any semantic labelling; styling stays
// on the component's own c-* tokens.
export default function TextPairFixture() {
  return (
    <div style={{ display: "grid", gap: 8, width: 200 }}>
      <TextPair label="Opacity" value="80%" />
      <TextPair label="Blend" value="Normal" prominentValue />
      <TextPair label="Radius" value="8 px" mutedLabel />
      <TextPair layout="vertical" label="Layer name" value="Hero headline" />
    </div>
  );
}
