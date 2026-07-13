import { describe, expect, it } from "vitest";
import { shouldHandleCreationToolbarShortcut } from "./CreationToolbar";

type FakeTarget = EventTarget & {
  tagName?: string;
  isContentEditable?: boolean;
  parentElement?: FakeTarget | null;
  getAttribute?: (name: string) => string | null;
};

const target = (options: { tag?: string; role?: string; editable?: boolean; parent?: FakeTarget } = {}): FakeTarget => ({
  ...(options.tag ? { tagName: options.tag } : {}),
  ...(options.editable ? { isContentEditable: true } : {}),
  parentElement: options.parent ?? null,
  getAttribute: name => name === "role" ? options.role ?? null : null,
}) as FakeTarget;

const keyEvent = (eventTarget: FakeTarget, options: {
  path?: FakeTarget[]; prevented?: boolean; composing?: boolean; keyCode?: number; meta?: boolean;
} = {}) => ({
  target: eventTarget, defaultPrevented: options.prevented ?? false, isComposing: options.composing ?? false,
  keyCode: options.keyCode ?? 0, metaKey: options.meta ?? false, ctrlKey: false, altKey: false,
  composedPath: () => options.path ?? [eventTarget],
}) as unknown as KeyboardEvent;

describe("CreationToolbar shortcut ownership", () => {
  it("leaves all global shortcuts to a host application when requested", () => {
    expect(shouldHandleCreationToolbarShortcut(keyEvent(target({ tag: "div" })), "host")).toBe(false);
  });

  it("allows safe global canvas shortcuts and rejects editable descendants and composites", () => {
    expect(shouldHandleCreationToolbarShortcut(keyEvent(target({ tag: "div" })), "global")).toBe(true);
    const editor = target({ tag: "div", editable: true });
    const child = target({ tag: "span", parent: editor });
    expect(shouldHandleCreationToolbarShortcut(keyEvent(child), "global")).toBe(false);
    expect(shouldHandleCreationToolbarShortcut(keyEvent(target(), { path: [target(), editor] }), "global")).toBe(false);
    expect(shouldHandleCreationToolbarShortcut(keyEvent(target({ tag: "select" })), "global")).toBe(false);
    expect(shouldHandleCreationToolbarShortcut(keyEvent(target({ role: "combobox" })), "global")).toBe(false);
  });

  it("rejects handled, modified, and composing events including legacy keyCode 229", () => {
    const canvas = target({ tag: "div" });
    expect(shouldHandleCreationToolbarShortcut(keyEvent(canvas, { prevented: true }), "global")).toBe(false);
    expect(shouldHandleCreationToolbarShortcut(keyEvent(canvas, { meta: true }), "global")).toBe(false);
    expect(shouldHandleCreationToolbarShortcut(keyEvent(canvas, { composing: true }), "global")).toBe(false);
    expect(shouldHandleCreationToolbarShortcut(keyEvent(canvas, { keyCode: 229 }), "global")).toBe(false);
  });
});
