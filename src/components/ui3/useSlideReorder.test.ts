import { describe, expect, it } from "vitest";
import { reorderInsertion } from "./useSlideReorder";
const slots = ["a", "b", "c", "d"].map((id,index) => ({id,start:index*100,end:(index+1)*100}));
describe("slide insertion in the remaining list", () => {
  it("supports either edge and both directions", () => {
    expect(reorderInsertion(slots,["a"],180)).toEqual({targetIndex:1,position:200});
    expect(reorderInsertion(slots,["d"],-10)).toEqual({targetIndex:0,position:0});
    expect(reorderInsertion(slots,["a"],500)).toEqual({targetIndex:3,position:400});
  });
  it("excludes a noncontiguous moving group before computing the index", () => {
    expect(reorderInsertion(slots,["a","c"],190)).toEqual({targetIndex:1,position:300});
    expect(reorderInsertion(slots,["a","c"],500)).toEqual({targetIndex:2,position:400});
  });
  it("keeps an all-selected group at the sole possible insertion", () => {
    expect(reorderInsertion(slots,["a","b","c","d"],500)).toEqual({targetIndex:0,position:0});
  });
});
