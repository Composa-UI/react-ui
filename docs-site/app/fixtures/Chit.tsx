import { Chit } from "@/components/ui3/Chit";

// Fixed 24px swatch that previews a fill's paint. Shown here as the canonical
// solid-color Fill square, fed a brand token (Chit applies `color` as an inline
// background, so a `var(--color-*)` token stays token-based — no hardcoded hex).
export default function ChitFixture() {
  return <Chit type="Fill" variant="Square" color="var(--color-bg-brand)" />;
}
