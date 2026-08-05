import { describe, expect, it } from "vitest";
import { filterProjectLibraryEntries, type ProjectLibraryPublisherEntry } from "./ProjectLibraryPublisher";

const entries: ProjectLibraryPublisherEntry[] = [
  { id: "composition:intro", kind: "composition", name: "Intro", selected: true },
  { id: "asset:hero", kind: "image", name: "Hero portrait", detail: "Required by Intro", selected: true, required: true },
  { id: "asset:music", kind: "audio", name: "Launch theme", selected: false },
];

describe("ProjectLibraryPublisher inventory", () => {
  it("searches names and dependency details without changing controlled selection", () => {
    expect(filterProjectLibraryEntries(entries, "intro").map(item => item.id)).toEqual(["composition:intro", "asset:hero"]);
    expect(filterProjectLibraryEntries(entries, "launch").map(item => item.id)).toEqual(["asset:music"]);
    expect(entries.map(item => item.selected)).toEqual([true, true, false]);
  });
});
