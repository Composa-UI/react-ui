import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  AgentMarkdown,
  AgentPanel,
  agentPanelEscapeIsEditableTarget,
  agentThreadIsNearBottom,
  sizeAgentComposer,
  type AgentConversation,
  type AgentConversationSummary,
  type AgentPanelProps,
} from "./AgentPanel";
import { InspectorRailSwitcher } from "./InspectorRailSwitcher";
import { PANEL_W } from "./Panel";
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
  it("renders media contexts with the canonical timeline glyph semantics (#749)", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = renderAgent(props({ activeConversation, context: { id: "video", label: "Demo.mp4", kind: "video" } }));
    });
    expect(renderer!.root.findByProps({ "data-icon-semantic": "media-video" })).toBeTruthy();
    act(() => renderer!.update(<TooltipProvider><AgentPanel {...props({ activeConversation, context: { id: "audio", label: "Score.wav", kind: "audio" } })} /></TooltipProvider>));
    expect(renderer!.root.findByProps({ "data-icon-semantic": "media-audio" })).toBeTruthy();
    act(() => renderer!.unmount());
  });

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
    act(() => composer.props.onKeyDown({ key: "Enter", shiftKey: false, nativeEvent: { isComposing: true }, preventDefault: () => calls.push("prevent") }));
    act(() => composer.props.onKeyDown({ key: "Enter", shiftKey: false, nativeEvent: { isComposing: false }, keyCode: 229, preventDefault: () => calls.push("prevent") }));
    act(() => composer.props.onKeyDown({ key: "Enter", shiftKey: true, preventDefault: () => calls.push("prevent") }));
    act(() => composer.props.onKeyDown({ key: "Enter", shiftKey: false, preventDefault: () => calls.push("prevent") }));
    act(() => composer.props.onKeyDown({ key: "Escape", shiftKey: false, preventDefault: () => calls.push("prevent") }));
    expect(calls).toEqual(["change:Next", "prevent", "submit", "prevent", "escape"]);
    const panel = renderer!.root.findByProps({ "aria-label": "Agent panel" });
    act(() => panel.props.onKeyDown({
      key: "Escape",
      target: { tagName: "INPUT" },
      nativeEvent: { isComposing: false },
      preventDefault: () => calls.push("prevent"),
    }));
    act(() => panel.props.onKeyDown({
      key: "Escape",
      target: { tagName: "DIV" },
      nativeEvent: { isComposing: true },
      preventDefault: () => calls.push("prevent"),
    }));
    expect(calls).toEqual(["change:Next", "prevent", "submit", "prevent", "escape"]);
    act(() => panel.props.onKeyDown({
      key: "Escape",
      target: { tagName: "BUTTON" },
      nativeEvent: { isComposing: false },
      preventDefault: () => calls.push("prevent"),
    }));
    expect(calls.slice(-2)).toEqual(["prevent", "escape"]);
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

  it("keeps unavailable historical context visible without exposing a selection action", () => {
    const calls: string[] = [];
    const unavailableContext = {
      id: "deleted-selection",
      label: "Deleted hero",
      kind: "frame" as const,
      selectable: false,
    };
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = renderAgent(props({
        activeConversation: {
          ...activeConversation,
          messages: [{
            id: "message-with-context",
            type: "user",
            content: "Review this",
            context: unavailableContext,
          }],
        },
        onSelectContext: value => calls.push(value.id),
      }));
    });
    expect(renderer!.root.findByProps({ role: "note", "aria-label": "Context unavailable Deleted hero" })).toBeTruthy();
    expect(buttons(renderer!.root, "Select context Deleted hero")).toHaveLength(0);
    expect(calls).toEqual([]);
    expect(unavailableContext).toEqual({
      id: "deleted-selection",
      label: "Deleted hero",
      kind: "frame",
      selectable: false,
    });
    act(() => renderer!.unmount());
  });

  it("renders the export new-chat suggestions and routes selection to the host", () => {
    const calls: string[] = [];
    const emptyThread: AgentConversation = { id: "new", title: "New chat", visibility: "private", messages: [] };
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = renderAgent(props({ activeConversation: emptyThread, onSuggestionSelect: suggestion => calls.push(suggestion.id) }));
    });
    const suggestionButton = (label: string) => renderer!.root.findAll(node =>
      node.type === "button" && node.findAll(child => child.children[0] === label).length > 0)
      .find(node => node.findAll(child => child.children[0] === label).length > 0);
    expect(suggestionButton("Animate this page")).toBeTruthy();
    expect(suggestionButton("Find what needs motion")).toBeTruthy();
    expect(suggestionButton("Learn motion")).toBeTruthy();
    act(() => suggestionButton("Animate this page")!.props.onClick());
    expect(calls).toEqual(["animate"]);
    act(() => renderer!.unmount());
  });

  it("draws context chip icons from the layer-list mapping, not a wrench (Composa#218)", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = renderAgent(props({ activeConversation })); });
    // The user message's frame context resolves to the layer-list frame icon.
    expect(renderer!.root.findAll(node => node.props["data-layer-icon-type"] === "frame").length).toBeGreaterThan(0);
    act(() => renderer!.unmount());
  });

  it("exposes a composer model picker and routes clicks", () => {
    const calls: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = renderAgent(props({ activeConversation, model: "Sonnet", onModelClick: () => calls.push("model") })); });
    const picker = renderer!.root.findByProps({ "aria-label": "Model: Sonnet" });
    act(() => picker.props.onClick());
    expect(calls).toEqual(["model"]);
    act(() => renderer!.unmount());
  });

  it("reveals reasoning steps for an expanded work message", () => {
    const withSteps: AgentConversation = {
      ...activeConversation,
      messages: [{ id: "work", type: "work", content: "Inspecting", status: "complete", durationMs: 2_000, steps: ["Step alpha", "Step beta"] }],
    };
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = renderAgent(props({ activeConversation: withSteps, expandedWorkMessageIds: ["work"] })); });
    expect(renderer!.root.findAll(node => node.children[0] === "Step alpha")).toHaveLength(1);
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

describe("AgentPanel message surfaces", () => {
  // Composa#661: the user bubble was painted with `bg-c-bg-selected` — the pale
  // blue the layer/slide rows use behind a SELECTED row — so ordinary message
  // text looked like it had been dragged over and highlighted.
  it("gives the user bubble a neutral surface, not the selection tint", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = renderAgent(props({ activeConversation })); });

    const bubble = renderer!.root.find(node => node.type === "div" && node.props.children === "Review this");
    expect(String(bubble.props.className)).toContain("bg-c-bg-secondary");
    expect(String(bubble.props.className)).not.toContain("bg-c-bg-selected");
    act(() => renderer!.unmount());
  });

  it("paints no message in the thread with the row-selection tint", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = renderAgent(props({ activeConversation })); });

    const thread = renderer!.root.findByProps({ "aria-label": "Conversation messages" });
    // Guard: the thread really rendered its messages, so the absence below means
    // something rather than proving an empty subtree has no tint.
    expect(thread.findAll(node => node.props.children === "Review this").length).toBeGreaterThan(0);
    expect(thread.findAll(node => String(node.props.className ?? "").includes("bg-c-bg-selected"))).toHaveLength(0);
    act(() => renderer!.unmount());
  });
});

describe("Agent panel geometry helpers", () => {
  it("leaves Escape with native and ARIA edit controls", () => {
    expect(agentPanelEscapeIsEditableTarget({ tagName: "INPUT" } as unknown as EventTarget)).toBe(true);
    expect(agentPanelEscapeIsEditableTarget({
      tagName: "DIV",
      getAttribute: (name: string) => name === "role" ? "combobox" : null,
    } as unknown as EventTarget)).toBe(true);
    expect(agentPanelEscapeIsEditableTarget({ tagName: "BUTTON" } as unknown as EventTarget)).toBe(false);
  });

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
    expect(renderer!.root.findByProps({ "aria-label": "Inspector rail" }).props.style.width).toBe(PANEL_W);
    act(() => renderer!.unmount());
  });

  it("makes Agent a first-class left-rail destination in order Comp · Agent · Assets (Composa#211)", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NavRail />); });
    // Nav destination buttons carry aria-label; the brand button ("Composa") is
    // excluded so we assert only the ordered destinations.
    const labels = renderer!.root
      .findAll(node => node.type === "button" && node.props["aria-label"])
      .map(node => node.props["aria-label"])
      .filter(label => label !== "Composa");
    expect(labels).toEqual(["Comp", "Agent", "Assets"]);
    act(() => renderer!.unmount());
  });
});
