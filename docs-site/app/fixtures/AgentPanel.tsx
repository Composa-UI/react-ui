import { useMemo, useState } from "react";

import {
  AgentPanel,
  type AgentConversation,
  type AgentConversationSummary,
  type AgentContextReference,
} from "@/components/ui3/AgentPanel";

// AgentPanel is the fully-controlled left-rail chat surface: it holds no chat
// state and keys the whole view on `activeConversation` (null -> searchable
// list, a value -> the message thread). This fixture wires every required
// callback locally so both levels are live — open a card to drill into the
// thread, use Back to return, filter the list with search, and type in the
// composer (Enter/Send clears the draft, which is what the host would persist).
const CONTEXT: AgentContextReference = {
  id: "sel-hero",
  label: "Hero banner",
  kind: "frame",
  selectable: true,
};

const CONVERSATIONS: readonly AgentConversationSummary[] = [
  {
    id: "hero",
    title: "Animate the hero banner",
    visibility: "private",
    updatedAt: Date.now() - 6 * 60_000,
    preview: "Stagger the headline and CTA fade-in.",
    timeGroup: "today",
  },
  {
    id: "loop",
    title: "Loop the background clip",
    visibility: "private",
    updatedAt: Date.now() - 27 * 60 * 60_000,
    preview: "Make the video layer loop seamlessly.",
    timeGroup: "yesterday",
  },
];

const THREAD: AgentConversation = {
  id: "hero",
  title: "Animate the hero banner",
  visibility: "private",
  messages: [
    { id: "m1", type: "user", content: "Add a staggered fade-in to the headline and button.", context: CONTEXT },
    { id: "m2", type: "work", content: "Inspecting the hero frame", status: "complete", durationMs: 3200 },
    {
      id: "m3",
      type: "agent",
      content: "Done — the **headline** fades in first, then the button follows ~120ms later.",
      status: "complete",
    },
  ],
};

export default function AgentPanelFixture() {
  const [activeId, setActiveId] = useState<string | null>("hero");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return CONVERSATIONS;
    return CONVERSATIONS.filter(
      c => c.title.toLowerCase().includes(query) || c.preview.toLowerCase().includes(query),
    );
  }, [search]);

  const active = activeId === THREAD.id ? THREAD : null;

  return (
    <div style={{ height: 440, display: "flex" }}>
      <AgentPanel
        defaultWidth={300}
        conversations={filtered}
        activeConversation={active}
        search={search}
        composerValue={draft}
        context={active ? CONTEXT : null}
        storageNotice="Chats are stored on this device only."
        onSearchChange={setSearch}
        onNewConversation={() => {
          setDraft("");
          setActiveId(null);
        }}
        onOpenConversation={setActiveId}
        onBack={() => setActiveId(null)}
        onComposerChange={setDraft}
        onSubmit={() => setDraft("")}
        onDismissContext={() => undefined}
      />
    </div>
  );
}
