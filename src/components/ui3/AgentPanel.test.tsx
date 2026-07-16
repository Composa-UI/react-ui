import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AgentPanel, type AgentConversation, type AgentConversationSummary, type AgentPanelProps } from "./AgentPanel";
import { InspectorRailSwitcher } from "./InspectorRailSwitcher";
import { NavRail } from "./NavRail";
import { TooltipProvider } from "./Tooltip";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("./Tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
  TooltipProvider: ({ children }: { children: unknown }) => children,
}));

const conversations: AgentConversationSummary[] = [
  { id: "today", title: "Today chat", visibility: "private", updatedAt: Date.now(), preview: "Latest message", timeGroup: "today" },
  { id: "earlier", title: "Earlier chat", visibility: "private", updatedAt: 1, preview: "Older message", timeGroup: "earlier" },
];

const activeConversation: AgentConversation = {
  id: "today",
  title: "Today chat",
  visibility: "private",
  messages: [
    { id: "user", type: "user", content: "Review this", context: { id: "frame", label: "Hero", kind: "frame" } },
    { id: "work", type: "work", content: "Inspecting the selection", status: "complete", durationMs: 2_000 },
    { id: "agent", type: "agent", content: "The hierarchy is sound.", status: "complete" },
    { id: "action", type: "action", title: "Generated result", description: "Awaiting a real host action.", status: "ready" },
    { id: "warning", type: "error", content: "Provider unavailable", severity: "warning" },
  ],
};

function props(overrides: Partial<AgentPanelProps> = {}): AgentPanelProps {
  return {
    conversations,
    activeConversation: null,
    search: "",
    composerValue: "",
    onSearchChange: () => undefined,
    onNewConversation: () => undefined,
    onOpenConversation: () => undefined,
    onBack: () => undefined,
    onComposerChange: () => undefined,
    onSubmit: () => undefined,
    ...overrides,
  };
}

function button(root: ReactTestInstance, label: string) {
  return root.find(node => node.type === "button" && node.props["aria-label"] === label);
}

function buttons(root: ReactTestInstance, label: string) {
  return root.findAll(node => node.type === "button" && node.props["aria-label"] === label);
}

function renderAgent(panelProps: AgentPanelProps) {
  return create(<TooltipProvider><AgentPanel {...panelProps} /></TooltipProvider>);
}

describe("AgentPanel controlled contracts", () => {
  it("groups controlled summaries and routes search, new, and open actions to the host", () => {
    const calls: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = renderAgent(props({
        onSearchChange: value => calls.push(`search:${value}`),
        onNewConversation: () => calls.push("new"),
        onOpenConversation: id => calls.push(`open:${id}`),
      }));
    });

    expect(renderer!.root.findByProps({ id: "agent-group-today" }).children).toContain("Today");
    expect(renderer!.root.findByProps({ id: "agent-group-earlier" }).children).toContain("Earlier");
    act(() => renderer!.root.findByProps({ "aria-label": "Search chats" }).props.onChange({ target: { value: "hero" } }));
    act(() => button(renderer!.root, "New chat").props.onClick());
    act(() => button(renderer!.root, "Open chat Earlier chat").props.onClick());
    expect(calls).toEqual(["search:hero", "new", "open:earlier"]);
    act(() => renderer!.unmount());
  });

  it("renders every persisted message variant without inventing action controls", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = renderAgent(props({ activeConversation })); });
    expect(renderer!.root.findByProps({ "aria-label": "Conversation messages" })).toBeTruthy();
    expect(renderer!.root.findByProps({ "aria-label": "Generated result" })).toBeTruthy();
    expect(renderer!.root.findAll(node => node.type === "button" && node.props.children === "Add to timeline")).toHaveLength(0);
    expect(renderer!.root.findByProps({ role: "status" })).toBeTruthy();
    expect(button(renderer!.root, "Expand work details")).toBeTruthy();
    act(() => renderer!.unmount());
  });

  it("owns composer key semantics while leaving value and effects controlled", () => {
    const calls: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = renderAgent(props({
        activeConversation,
        composerValue: "Make a change",
        onComposerChange: value => calls.push(`change:${value}`),
        onSubmit: () => calls.push("submit"),
        onEscape: () => calls.push("escape"),
      }));
    });
    const composer = renderer!.root.findByProps({ "aria-label": "Ask for changes" });
    act(() => composer.props.onChange({ target: { value: "Next" } }));
    act(() => composer.props.onKeyDown({ key: "Enter", shiftKey: true, preventDefault: () => calls.push("prevent") }));
    act(() => composer.props.onKeyDown({ key: "Enter", shiftKey: false, preventDefault: () => calls.push("prevent") }));
    act(() => composer.props.onKeyDown({ key: "Escape", shiftKey: false, preventDefault: () => calls.push("prevent") }));
    expect(calls).toEqual(["change:Next", "prevent", "submit", "prevent", "escape"]);
    expect(renderer!.root.findByProps({ "aria-label": "Voice input unavailable: Coming soon" })).toBeTruthy();
    act(() => renderer!.unmount());
  });

  it("projects and dismisses current context without mutating the supplied model", () => {
    const context = { id: "selection", label: "Hero", kind: "frame" as const };
    const calls: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = renderAgent(props({
        activeConversation,
        context,
        onDismissContext: () => calls.push("dismiss"),
        onSelectContext: value => calls.push(`select:${value.id}`),
      }));
    });
    const contextButtons = buttons(renderer!.root, "Select context Hero");
    act(() => contextButtons[contextButtons.length - 1].props.onClick());
    act(() => button(renderer!.root, "Remove context Hero").props.onClick());
    expect(calls).toEqual(["select:selection", "dismiss"]);
    expect(context).toEqual({ id: "selection", label: "Hero", kind: "frame" });
    act(() => renderer!.unmount());
  });
});

describe("canonical rail access", () => {
  it("switches Inspector and Agent through one controlled seam", () => {
    const calls: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<InspectorRailSwitcher active="inspector" inspector={<div data-view="inspector" />} agent={<div data-view="agent" />}
        onChange={view => calls.push(view)} />);
    });
    expect(renderer!.root.findByProps({ "data-view": "inspector" })).toBeTruthy();
    expect(renderer!.root.findAllByProps({ "data-view": "agent" })).toHaveLength(0);
    act(() => renderer!.root.findByProps({ id: "composa-agent-rail-panel-tab" }).props.onClick());
    expect(calls).toEqual(["agent"]);
    act(() => renderer!.update(<InspectorRailSwitcher active="agent" inspector={<div data-view="inspector" />} agent={<div data-view="agent" />}
      onChange={view => calls.push(view)} />));
    expect(renderer!.root.findByProps({ "data-view": "agent" })).toBeTruthy();
    expect(renderer!.root.findByProps({ "aria-label": "Inspector rail" }).props.style.width).toBe(240);
    act(() => renderer!.unmount());
  });

  it("keeps the default left rail canonical to Composition and Assets", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NavRail />); });
    const labels = renderer!.root.findAll(node => node.type === "button" && node.props["aria-label"]).map(node => node.props["aria-label"]);
    expect(labels).toContain("Comp");
    expect(labels).toContain("Assets");
    expect(labels).not.toContain("Agent");
    act(() => renderer!.unmount());
  });
});
