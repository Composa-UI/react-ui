// Live-demo fixture for Tag — a short status word on a tinted surface.
// A Tag is presentational text: no click handler, no focus, no controlled
// value, so there is nothing to make stateful. The representative instance is
// the word flagged beside a heading, the place a tag belongs (use_when: "Beta").
import { Tag } from "@/components/ui3/Tag";

export default function TagFixture() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          font: "600 13px var(--composa-font-family, system-ui)",
          color: "var(--color-text)",
        }}
      >
        Motion presets
      </span>
      <Tag tone="brand" size="sm">
        Beta
      </Tag>
    </div>
  );
}
