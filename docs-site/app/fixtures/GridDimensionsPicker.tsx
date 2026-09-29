// Live preview fixture for GridDimensionsPicker — the compact Figma-style grid
// face that opens a popover to edit column and row tracks (not a second
// Inspector section or dialog). The component owns its own trigger face and
// popover, so it renders inline; no launcher Button is needed. Fully
// controlled: onChange emits Partial<ElementGridSettings> patches that merge
// into local grid state, and onAddTrack appends a track (the host owns durable
// track identity), both re-rendering the face and popover editor.
import { useRef, useState } from "react";

import { GridDimensionsPicker } from "@/components/ui3/GridDimensionsPicker";
import type { ElementGridSettings, ElementGridTrack } from "@/components/ui3/PropertyPanel";

const INITIAL_GRID: ElementGridSettings = {
  columns: [
    { id: "col-1", mode: "fixed", size: 120 },
    { id: "col-2", mode: "fixed", size: 120 },
    { id: "col-3", mode: "hug", size: 100 },
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

export default function GridDimensionsPickerFixture() {
  const [grid, setGrid] = useState<ElementGridSettings>(INITIAL_GRID);
  const nextTrackId = useRef(0);

  // Intent-only: the real host owns durable track identity and document
  // mutation. Here the fixture stands in for that host by appending a Fixed
  // track on the requested axis.
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
    <GridDimensionsPicker
      grid={grid}
      onChange={patch => setGrid(current => ({ ...current, ...patch }))}
      onAddTrack={addTrack}
    />
  );
}
