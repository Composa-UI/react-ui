// Live preview fixture for IconSemantics — the headless semantic→Lucide-glyph map
// that keeps every inspector field and panel showing one consistent icon. The
// module renders no DOM of its own, so the fixture demonstrates its purpose:
// resolve a small, representative spread of Composa editor semantics (layer type,
// layout, alignment, sizing, media) through `iconForSemantic` and render each
// returned LucideIcon beside its semantic key. The glyphs are decorative
// (aria-hidden); the semantic label carries the accessible text. Tokens only —
// icons inherit currentColor and swatches use c-* text/border tokens, no hex.
import { iconForSemantic, type ComposaIconSemantic } from "@/components/ui3/IconSemantics";

const SEMANTICS: ComposaIconSemantic[] = [
  "frame",
  "text",
  "image",
  "layout-horizontal",
  "align-center-x",
  "sizing-fill",
  "media-video",
  "opacity",
];

export default function IconSemanticsFixture() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        width: 320,
        color: "var(--color-text-secondary)",
      }}
    >
      {SEMANTICS.map(semantic => {
        const Icon = iconForSemantic(semantic);
        return (
          <div
            key={semantic}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: 8,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
            }}
          >
            <Icon size={18} strokeWidth={1.5} aria-hidden />
            <span style={{ fontSize: 10, lineHeight: 1.2, textAlign: "center" }}>{semantic}</span>
          </div>
        );
      })}
    </div>
  );
}
