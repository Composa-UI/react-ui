import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  AgentMarkdown,
  AgentPanel,
  agentThreadIsNearBottom,
  sizeAgentComposer,
  type AgentConversation,
  type AgentConversationSummary,
  type AgentPanelProps,
} from "./AgentPanel";
import { InspectorRailSwitcher } from "./InspectorRailSwitcher";
import { NavRail } from "./NavRail";
import { TooltipProvider } from "./Tooltip";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("./Tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
  TooltipProvider: ({ children }: { children: unknown }) => children,
}));

class TestResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = TestResizeObserver;

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

  it("renders safe semantic markdown without interpreting HTML or unsafe links", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AgentMarkdown content={"**Bold** and *italic* with `code` and [safe](https://example.com) and [unsafe](javascript:alert(1)).\n\n- one\n- two\n\n1. first\n2. second\n\n```ts\nconst x = 1;\n```\n<script>bad()</script>"} />);
    });
    expect(renderer!.root.findAllByType("strong")).toHaveLength(1);
    expect(renderer!.root.findAllByType("em")).toHaveLength(1);
    expect(renderer!.root.findAllByType("ul")).toHaveLength(1);
    expect(renderer!.root.findAllByType("ol")).toHaveLength(1);
    expect(renderer!.root.findAllByType("pre")).toHaveLength(1);
    const links = renderer!.root.findAllByType("a");
    expect(links).toHaveLength(1);
    expect(links[0].props).toMatchObject({ href: "https://example.com", target: "_blank", rel: "noreferrer" });
    expect(renderer!.root.findAllByType("script")).toHaveLength(0);
    expect(renderer!.toJSON()).toBeTruthy();
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

  it("uses near-bottom policy for appended messages and exposes browser-friendly scroll state", () => {
    const viewport = { scrollTop: 0, scrollHeight: 300, clientHeight: 200, dataset: {} as Record<string, string> };
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<TooltipProvider><AgentPanel {...props({ activeConversation })} /></TooltipProvider>, {
        createNodeMock: element => {
          const elementProps = element.props as { className?: string };
          if (element.type === "div" && String(elementProps.className).includes("agent-message-scroll")) return viewport;
          return null;
        },
      });
    });
    expect(viewport.scrollTop).toBe(300);
    expect(viewport.dataset.agentAutoScroll).toBe("bottom");
    viewport.scrollTop = 20;
    const scrollViewport = renderer!.root.find(node => node.type === "div" && String(node.props.className).includes("agent-message-scroll"));
    act(() => scrollViewport.props.onScroll({ currentTarget: viewport }));
    expect(viewport.dataset.agentAutoScroll).toBe("paused");
    viewport.scrollHeight = 400;
    const appended = { ...activeConversation, messages: [...activeConversation.messages, { id: "stream", type: "agent" as const, content: "Streaming", status: "streaming" as const }] };
    act(() => renderer!.update(<TooltipProvider><AgentPanel {...props({ activeConversation: appended })} /></TooltipProvider>));
    expect(viewport.scrollTop).toBe(20);
    expect(viewport.dataset.agentAutoScroll).toBe("paused");
    viewport.scrollTop = 198;
    act(() => scrollViewport.props.onScroll({ currentTarget: viewport }));
    const streamed = { ...appended, messages: [...appended.messages.slice(0, -1), { ...appended.messages[appended.messages.length - 1], content: "Streaming more" }] };
    act(() => renderer!.update(<TooltipProvider><AgentPanel {...props({ activeConversation: streamed })} /></TooltipProvider>));
    expect(viewport.scrollTop).toBe(400);
    expect(viewport.dataset.agentAutoScroll).toBe("bottom");
    act(() => renderer!.unmount());
  });
});

describe("Agent panel geometry helpers", () => {
  it("recognizes the near-bottom threshold", () => {
    expect(agentThreadIsNearBottom({ scrollTop: 152, scrollHeight: 400, clientHeight: 200 })).toBe(true);
    expect(agentThreadIsNearBottom({ scrollTop: 100, scrollHeight: 400, clientHeight: 200 })).toBe(false);
  });

  it("grows the controlled composer from one to four lines and then scrolls", () => {
    const style = { height: "", overflowY: "" } as CSSStyleDeclaration;
    const textarea = { scrollHeight: 24, style };
    expect(sizeAgentComposer(textarea)).toBe(38);
    expect(style).toMatchObject({ height: "38px", overflowY: "hidden" });
    textarea.scrollHeight = 62;
    expect(sizeAgentComposer(textarea)).toBe(62);
    expect(style).toMatchObject({ height: "62px", overflowY: "hidden" });
    textarea.scrollHeight = 120;
    expect(sizeAgentComposer(textarea)).toBe(78);
    expect(style).toMatchObject({ height: "78px", overflowY: "auto" });
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
