import { describe, expect, it } from "vitest";
import { slideItemKeyboardAction } from "./SlidesPanel";

describe("SlidesPanel keyboard ownership", () => {
  it("keeps rename, activation, and roving navigation distinct", () => {
    expect(slideItemKeyboardAction("Enter")).toBe("rename");
    expect(slideItemKeyboardAction(" ")).toBe("activate");
    expect(slideItemKeyboardAction("ArrowDown")).toBe("navigate");
    expect(slideItemKeyboardAction("Home")).toBe("navigate");
  });
});
