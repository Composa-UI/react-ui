// Live preview fixture for GridSettingsDialog — the externalised, non-modal
// inspector dialog for per-track Column/Row sizing and secondary content
// alignment. It portals through InspectorDialog, so this launches it from a
// labelled trigger Button via controlled open/onClose state (the ModalFixture
// pattern). Fully controlled: onChange emits Partial<ElementGridSettings>
// patches that merge into local grid state, and onAddTrack appends a track
// (the host owns durable track identity), both re-rendering the dialog.
import { useRef, useState } from "react";
import { Settings2 } from "lucide-react";

import { GridSettingsDialog } from "@/components/ui3/GridSettingsDialog";
import { Button } from "@/components/ui3/Button";
import type { ElementGridSettings, ElementGridTrack } from "@/components/ui3/PropertyPanel";

const INITIAL_GRID: ElementGridSettings = {
  columns: [
    { id: "col-1", mode: "fixed", size: 120 },
    { id: "col-2", mode: "hug", size: 100 },
  ],
  rows: [
    { id: "row-1", mode: "fixed", size: 80 },
    { id: "row-2", mode: "fixed", size: 80 },
  ],
  rowGap: 12,
  columnGap: 12,
  justifyItems: "start",
  alignItems: "start",
  justifyContent: "start",
  alignContent: "start",
};

export default function GridSettingsDialogFixture() {
  const [open, setOpen] = useState(false);
  const [grid, setGrid] = useState<ElementGridSettings>(INITIAL_GRID);
  const nextTrackId = useRef(0);

  // Intent-only: the real host owns track identity and document mutation. Here
  // the fixture stands in for that host by appending a Fixed track.
  const addTrack = (axis: "row" | "column") => {
    const key = axis === "column" ? "columns" : "rows";
    const track: ElementGridTrack = {
      id: `${axis}-added-${nextTrackId.current++}`,
      mode: "fixed",
      size: 100,
    };
    setGrid(current => ({ ...current, [key]: [...current[key], track] }));
  };

  return (
    <GridSettingsDialog
      open={open}
      grid={grid}
      onChange={patch => setGrid(current => ({ ...current, ...patch }))}
      onAddTrack={addTrack}
      onClose={() => setOpen(false)}
      trigger={
        <Button
          label="Grid settings"
          variant="Secondary"
          iconLead="left"
          icon={<Settings2 size={14} strokeWidth={1.5} />}
          onClick={() => setOpen(o => !o)}
        />
      }
    />
  );
}
