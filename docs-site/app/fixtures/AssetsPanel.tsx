import { useState } from "react";

import {
  AssetsPanel,
  type AssetFilter,
  type AssetItem,
  type AssetLibrary,
} from "@/components/ui3/AssetsPanel";

// AssetsPanel is the fully-controlled Assets left-rail: a per-project media
// library that browses, filters, searches, and inserts uploaded media. It holds
// no bytes and runs no upload/drag-drop side effects — it emits callbacks and
// the host owns persistence. This fixture wires the view props locally so the
// surface is live: click a card to highlight it (panel-local), type in Search or
// switch the type filter to narrow the grid. Insert/Delete/Upload are no-ops
// here, exactly as a presentational demo should be. Assets are grouped under two
// libraries to show the labelled <section> grid the composite is built for.
//
// TOKENS ONLY: card `tint` fallbacks are token-based CSS-var gradients, never
// hardcoded hex, so the preview retints in light and dark.
const LIBRARIES: AssetLibrary[] = [
  { id: "brand", name: "Brand kit" },
  { id: "footage", name: "Footage" },
];

const ASSETS: AssetItem[] = [
  {
    id: "hero-cover",
    name: "hero-cover.png",
    kind: "image",
    tint: "linear-gradient(135deg,var(--color-c-bg-brand),var(--color-c-bg-selected))",
    libraryId: "brand",
    inUseCount: 2,
  },
  {
    id: "logo-loop",
    name: "logo-loop.gif",
    kind: "image",
    tint: "linear-gradient(135deg,var(--color-c-bg-assistive),var(--color-c-bg-brand))",
    libraryId: "brand",
  },
  {
    id: "intro-clip",
    name: "intro-clip.mp4",
    kind: "video",
    tint: "linear-gradient(135deg,var(--color-c-bg-inverse),var(--color-c-bg-secondary))",
    duration: "0:24",
    libraryId: "footage",
  },
  {
    id: "ambient-loop",
    name: "ambient-loop.mp3",
    kind: "audio",
    duration: "1:12",
    libraryId: "footage",
  },
  {
    id: "b-roll-drone",
    name: "b-roll-drone.mp4",
    kind: "video",
    status: "uploading",
    progress: 62,
    libraryId: "footage",
  },
];

export default function AssetsPanelFixture() {
  const [selectedId, setSelectedId] = useState<string | null>("hero-cover");
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [query, setQuery] = useState("");

  return (
    <div style={{ height: 440, display: "flex" }}>
      <AssetsPanel
        defaultWidth={264}
        assets={ASSETS}
        libraries={LIBRARIES}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        onOpenLibrary={() => undefined}
        onUpload={() => undefined}
        onDropFiles={() => undefined}
        onInsert={() => undefined}
        onAddToTimeline={() => undefined}
        onRename={() => undefined}
        onDelete={() => undefined}
        onRetry={() => undefined}
      />
    </div>
  );
}
