// Live preview fixture for ProjectLibraryPublisher — renders the REAL component
// from src. This is a Modal-based overlay that portals to document.body, so
// (like ModalFixture) it is launched from a labelled trigger Button and its open
// state lives on the always-mounted wrapper. The publisher owns no data model —
// entries, publishedItems, targetItemId, description, publishing and error are
// all controlled props — so that state lives here and is committed back through
// the onEntryChange / onTargetItemChange / onDescriptionChange / onArchive /
// onRestore callbacks, matching the component's fully-controlled contract.
import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import {
  ProjectLibraryPublisher,
  type ProjectLibraryPublishedItem,
  type ProjectLibraryPublisherEntry,
} from "@/components/ui3/ProjectLibraryPublisher";

export default function ProjectLibraryPublisherFixture() {
  const [open, setOpen] = useState(false);

  // Opened from a composition: that composition and its transitive media arrive
  // pre-selected, and the dependencies are marked required so their checkboxes
  // lock and read "Required dependency".
  const [entries, setEntries] = useState<readonly ProjectLibraryPublisherEntry[]>([
    { id: "comp-intro", kind: "composition", name: "Intro title card", detail: "Animated · 4s", selected: true },
    { id: "comp-lower", kind: "composition", name: "Lower third", detail: "Animated · 2s", selected: false },
    { id: "img-logo", kind: "image", name: "Logo mark", detail: "PNG · 512×512", selected: true, required: true },
    { id: "vid-hero", kind: "video", name: "Hero loop", detail: "1080p · 12s", selected: false },
    { id: "aud-bed", kind: "audio", name: "Ambient bed", detail: "Stereo · 30s", selected: true, required: true },
  ]);

  const [publishedItems, setPublishedItems] = useState<readonly ProjectLibraryPublishedItem[]>([
    { id: "brand-kit", name: "Brand kit", latestVersion: 3, archived: false },
    { id: "legacy-intro", name: "Legacy intro", latestVersion: 1, archived: true },
  ]);

  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const setArchived = (id: string, archived: boolean) =>
    setPublishedItems(items => items.map(item => (item.id === id ? { ...item, archived } : item)));

  return (
    <>
      <Button
        label="Publish to library"
        variant="Secondary"
        icon={<Upload size={14} strokeWidth={1.5} />}
        iconLead="left"
        onClick={() => setOpen(true)}
      />
      <ProjectLibraryPublisher
        open={open}
        entries={entries}
        publishedItems={publishedItems}
        targetItemId={targetItemId}
        description={description}
        onClose={() => setOpen(false)}
        onEntryChange={(id, selected) =>
          setEntries(list => list.map(entry => (entry.id === id ? { ...entry, selected } : entry)))
        }
        onTargetItemChange={setTargetItemId}
        onDescriptionChange={setDescription}
        onPublish={() => setOpen(false)}
        onArchive={id => setArchived(id, true)}
        onRestore={id => setArchived(id, false)}
      />
    </>
  );
}
