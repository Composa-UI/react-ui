import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { RatingBar } from "./RatingBar";
import { MultiChoiceCard } from "./MultiChoiceCard";
import { UndoCard } from "./UndoCard";
import { WorkedLabel } from "./WorkedLabel";
import { GitHubPermissionCard } from "./GitHubPermissionCard";
import { UserBubble } from "./UserBubble";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function byLabel(root: ReactTestInstance, label: string) {
  return root.findByProps({ "aria-label": label });
}

function textOf(node: ReactTestInstance): string {
  return node.findAll(() => true)
    .flatMap(child => child.children)
    .filter((child): child is string => typeof child === "string")
    .join("");
}

describe("RatingBar", () => {
  it("toggles a single vote and clears it on re-press (uncontrolled)", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<RatingBar />); });
    const up = () => byLabel(renderer!.root, "Thumbs up");
    expect(up().props["aria-pressed"]).toBe(false);
    act(() => up().props.onClick());
    expect(up().props["aria-pressed"]).toBe(true);
    expect(byLabel(renderer!.root, "Thumbs down").props["aria-pressed"]).toBe(false);
    act(() => up().props.onClick());
    expect(up().props["aria-pressed"]).toBe(false);
  });

  it("routes votes to a controlled host", () => {
    const onVote = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<RatingBar vote={null} onVote={onVote} />); });
    act(() => byLabel(renderer!.root, "Thumbs down").props.onClick());
    expect(onVote).toHaveBeenCalledWith("down");
  });
});

describe("MultiChoiceCard", () => {
  it("marks one choice active at a time", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<MultiChoiceCard question="Pick" choices={[{ letter: "A", label: "One" }, { letter: "B", label: "Two" }]} />);
    });
    const pressed = () => renderer!.root.findAll(node => node.type === "button" && node.props["aria-pressed"] === true);
    expect(pressed()).toHaveLength(0);
    act(() => renderer!.root.findAll(n => n.type === "button")[0].props.onClick());
    expect(pressed()).toHaveLength(1);
  });
});

describe("UndoCard", () => {
  it("flips version label and action between undo and redo", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<UndoCard />); });
    const paragraph = () => renderer!.root.findByType("p");
    expect(textOf(paragraph())).toContain("Current version");
    act(() => renderer!.root.findByType("button").props.onClick());
    expect(textOf(paragraph())).toContain("Reverted");
  });
});

describe("WorkedLabel", () => {
  it("expands reasoning steps on toggle", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<WorkedLabel seconds="4s" steps={["Alpha step", "Beta step"]} />); });
    const stepsVisible = () => renderer!.root.findAll(n => typeof n.children[0] === "string" && n.children[0] === "Alpha step");
    expect(stepsVisible()).toHaveLength(0);
    act(() => renderer!.root.findByType("button").props.onClick());
    expect(stepsVisible()).toHaveLength(1);
  });

  it("disables the toggle while thinking", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<WorkedLabel thinking />); });
    expect(renderer!.root.findByType("button").props.disabled).toBe(true);
  });
});

describe("GitHubPermissionCard", () => {
  it("collapses to a decision summary after Run and notifies the host", () => {
    const onRun = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<GitHubPermissionCard toolName="list_issues" onRun={onRun} />); });
    // Pending: Run button present.
    const run = renderer!.root.findAll(n => n.type === "button").find(n => textOf(n).includes("Run") && !textOf(n).includes("Always"));
    expect(run).toBeTruthy();
    act(() => run!.props.onClick());
    expect(onRun).toHaveBeenCalledOnce();
    // Collapsed: shows the decision label, no more action buttons.
    const hasRan = renderer!.root.findAll(n => typeof n.children[0] === "string" && n.children[0] === "Ran");
    expect(hasRan.length).toBeGreaterThan(0);
  });
});

describe("UserBubble chips", () => {
  it("renders the element chip label and a github connector chip", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<UserBubble text="Hi" chip={{ type: "element", label: "Hero frame", kind: "frame" }} />); });
    expect(textOf(renderer!.root)).toContain("Hero frame");
    act(() => { renderer = create(<UserBubble text="Hi" chip={{ type: "github" }} />); });
    expect(textOf(renderer!.root)).toContain("GitHub");
  });
});
