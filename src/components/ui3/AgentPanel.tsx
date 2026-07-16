import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Image,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "./Button";
import { Panel, ScrollArea } from "./Panel";
import { Tooltip } from "./Tooltip";

export type AgentConversationTimeGroup = "today" | "yesterday" | "last-7-days" | "earlier";
export type AgentContextKind = "frame" | "text" | "shape" | "image" | "clip" | "composition" | "selection";

export interface AgentContextReference {
  id: string;
  label: string;
  kind: AgentContextKind;
  count?: number;
}

export interface AgentConversationSummary {
  id: string;
  title: string;
  visibility: "private";
  updatedAt: number;
  preview: string;
  timeGroup: AgentConversationTimeGroup;
  leading?: ReactNode;
}

export interface AgentAction {
  id: string;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
}

export type AgentPanelMessage =
  | {
      id: string;
      type: "user";
      content: string;
      context?: AgentContextReference | null;
    }
  | {
      id: string;
      type: "agent";
      content: string;
      status?: "streaming" | "complete" | "stopped";
    }
  | {
      id: string;
      type: "work";
      content: string;
      status: "running" | "complete" | "stopped";
      durationMs?: number;
    }
  | {
      id: string;
      type: "action";
      title: string;
      description: string;
      status: "pending" | "ready" | "complete" | "error";
      preview?: ReactNode;
      actions?: readonly AgentAction[];
    }
  | {
      id: string;
      type: "error";
      content: string;
      severity: "warning" | "error";
      retryAction?: AgentAction;
    };

export interface AgentConversation {
  id: string;
  title: string;
  visibility: "private";
  messages: readonly AgentPanelMessage[];
}

export interface AgentPanelProps {
  conversations: readonly AgentConversationSummary[];
  activeConversation: AgentConversation | null;
  search: string;
  composerValue: string;
  context?: AgentContextReference | null;
  expandedWorkMessageIds?: readonly string[];
  storageNotice?: string;
  sending?: boolean;
  focusTarget?: "panel" | "search" | "composer" | null;
  focusRequestKey?: string | number;
  onSearchChange: (value: string) => void;
  onNewConversation: () => void;
  onOpenConversation: (conversationId: string) => void;
  onBack: () => void;
  onConversationOptions?: (conversationId: string) => void;
  onComposerChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onEscape?: () => void;
  onDismissContext?: () => void;
  onSelectContext?: (context: AgentContextReference) => void;
  onToggleWorkMessage?: (messageId: string) => void;
  onAttachmentRequest?: () => void;
  onImageRequest?: () => void;
  className?: string;
}

const FONT = "font-[family-name:var(--composa-font-family)]";
const GROUP_LABELS: Record<AgentConversationTimeGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "last-7-days": "Last 7 days",
  earlier: "Earlier",
};
const GROUP_ORDER: AgentConversationTimeGroup[] = ["today", "yesterday", "last-7-days", "earlier"];

function IconButton({
  label,
  children,
  disabled = false,
  onClick,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        "size-[24px] shrink-0 rounded-c-md flex items-center justify-center outline-none",
        "text-c-icon hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring",
        disabled && "cursor-not-allowed text-c-text-disabled",
      )}
    >
      {children}
    </button>
  );
}

function BetaBadge() {
  return (
    <span className={clsx(FONT, "h-[16px] px-[5px] inline-flex items-center rounded-c-sm bg-c-bg-selected text-c-text-brand text-[9px] font-[550] leading-[14px]")}>
      Beta
    </span>
  );
}

function PrivateBadge() {
  return (
    <span className={clsx(FONT, "text-[9px] leading-[14px] text-c-text-secondary")}>
      Private
    </span>
  );
}

function relativeTime(updatedAt: number, now = Date.now()) {
  const delta = Math.max(0, now - updatedAt);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ContextIcon({ kind }: { kind: AgentContextKind }) {
  if (kind === "text") return <span aria-hidden className={clsx(FONT, "text-[11px] font-[550]")}>T</span>;
  if (kind === "image") return <Image size={13} strokeWidth={1.5} />;
  if (kind === "composition") return <Sparkles size={13} strokeWidth={1.5} />;
  return <Wrench size={13} strokeWidth={1.5} />;
}

function ContextChip({
  context,
  dismissible = false,
  onSelect,
  onDismiss,
}: {
  context: AgentContextReference;
  dismissible?: boolean;
  onSelect?: () => void;
  onDismiss?: () => void;
}) {
  const label = context.count && context.count > 1 ? `${context.count} elements` : context.label;
  return (
    <span className="inline-flex max-w-full items-center rounded-c-md bg-c-bg-secondary text-c-text ring-1 ring-inset ring-c-border-translucent">
      <button
        type="button"
        onClick={onSelect}
        disabled={!onSelect}
        aria-label={onSelect ? `Select context ${label}` : undefined}
        className={clsx(
          FONT,
          "h-[24px] min-w-0 flex items-center gap-[4px] pl-[6px] pr-[7px] text-[9px] leading-[14px]",
          onSelect && "hover:bg-c-bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring",
        )}
      >
        <span className="size-[14px] shrink-0 flex items-center justify-center text-c-icon"><ContextIcon kind={context.kind} /></span>
        <span className="truncate">{label}</span>
      </button>
      {dismissible && (
        <button
          type="button"
          aria-label={`Remove context ${label}`}
          onClick={onDismiss}
          className="size-[20px] mr-[2px] shrink-0 rounded-c-sm flex items-center justify-center text-c-icon hover:bg-c-bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring"
        >
          <X size={12} strokeWidth={1.5} />
        </button>
      )}
    </span>
  );
}

function ConversationCard({
  conversation,
  onOpen,
}: {
  conversation: AgentConversationSummary;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open chat ${conversation.title}`}
      className="w-full min-h-[64px] rounded-c-md px-[8px] py-[7px] flex items-start gap-[8px] text-left outline-none hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring"
    >
      <span className="size-[24px] shrink-0 rounded-full bg-c-bg-secondary flex items-center justify-center text-c-icon">
        {conversation.leading ?? <CircleUserRound size={15} strokeWidth={1.5} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-[4px]">
          <span className={clsx(FONT, "min-w-0 flex-1 truncate text-[11px] font-[550] leading-[16px] text-c-text")}>{conversation.title}</span>
          <PrivateBadge />
        </span>
        <span className={clsx(FONT, "block text-[9px] leading-[14px] text-c-text-tertiary")}>{relativeTime(conversation.updatedAt)}</span>
        <span className={clsx(FONT, "block truncate text-[9px] leading-[14px] text-c-text-secondary")}>{conversation.preview || "No messages yet"}</span>
      </span>
    </button>
  );
}

function UserMessage({ message, onSelectContext }: { message: Extract<AgentPanelMessage, { type: "user" }>; onSelectContext?: AgentPanelProps["onSelectContext"] }) {
  return (
    <div className="flex flex-col items-end gap-[4px]">
      {message.context && <ContextChip context={message.context} onSelect={onSelectContext ? () => onSelectContext(message.context!) : undefined} />}
      <div className={clsx(FONT, "max-w-[196px] rounded-c-lg bg-c-bg-selected px-[8px] py-[6px] text-[11px] leading-[16px] text-c-text whitespace-pre-wrap break-words")}>
        {message.content}
      </div>
    </div>
  );
}

function WorkMessage({
  message,
  expanded,
  onToggle,
}: {
  message: Extract<AgentPanelMessage, { type: "work" }>;
  expanded: boolean;
  onToggle?: () => void;
}) {
  if (message.status === "running" || expanded) {
    return (
      <div className={clsx(FONT, "rounded-c-md bg-c-bg-secondary px-[8px] py-[6px] text-[9px] leading-[14px] text-c-text-secondary whitespace-pre-wrap")}>
        <div className="flex items-center gap-[4px]">
          <Wrench size={12} strokeWidth={1.5} className={message.status === "running" ? "animate-pulse" : ""} />
          <span>{message.status === "running" ? "Working" : message.status === "stopped" ? "Stopped" : "Work details"}</span>
          {message.status !== "running" && onToggle && (
            <button type="button" aria-label="Collapse work details" onClick={onToggle} className="ml-auto size-[20px] flex items-center justify-center rounded-c-sm hover:bg-c-bg-hover">
              <ChevronDown size={12} />
            </button>
          )}
        </div>
        <div className="mt-[4px]">{message.content}</div>
      </div>
    );
  }
  const duration = message.durationMs === undefined ? "" : ` for ${Math.max(1, Math.round(message.durationMs / 1000))}s`;
  return (
    <button
      type="button"
      aria-label="Expand work details"
      onClick={onToggle}
      disabled={!onToggle}
      className={clsx(FONT, "w-full h-[28px] px-[8px] rounded-c-md flex items-center gap-[5px] text-[9px] text-c-text-secondary bg-c-bg-secondary hover:bg-c-bg-hover")}
    >
      <Wrench size={12} strokeWidth={1.5} />
      <span>Worked{duration}</span>
      <ChevronRight size={12} className="ml-auto" />
    </button>
  );
}

function ActionMessage({ message }: { message: Extract<AgentPanelMessage, { type: "action" }> }) {
  return (
    <section aria-label={message.title} className="overflow-hidden rounded-c-lg bg-c-bg-secondary ring-1 ring-inset ring-c-border-translucent">
      {message.preview && <div className="aspect-video bg-c-bg-inverse overflow-hidden">{message.preview}</div>}
      <div className="p-[8px]">
        <h3 className={clsx(FONT, "m-0 text-[11px] font-[550] leading-[16px] text-c-text")}>{message.title}</h3>
        <p className={clsx(FONT, "m-0 mt-[2px] text-[9px] leading-[14px] text-c-text-secondary")}>{message.description}</p>
        {!!message.actions?.length && (
          <div className="mt-[8px] flex flex-wrap gap-[4px]">
            {message.actions.map(action => <Button key={action.id} label={action.label} size="small" variant="Secondary" disabled={action.disabled} onClick={action.onSelect} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function ErrorMessage({ message }: { message: Extract<AgentPanelMessage, { type: "error" }> }) {
  const warning = message.severity === "warning";
  return (
    <div
      role={warning ? "status" : "alert"}
      className={clsx(
        FONT,
        "rounded-c-md px-[8px] py-[7px] text-[9px] leading-[14px] ring-1 ring-inset",
        warning ? "bg-c-bg-secondary text-c-text ring-c-border-warning" : "bg-c-bg-secondary text-c-text-danger ring-c-border-danger",
      )}
    >
      <div className="flex items-start gap-[5px]">
        <AlertTriangle size={13} strokeWidth={1.5} className="mt-px shrink-0" />
        <span>{message.content}</span>
      </div>
      {message.retryAction && <Button className="mt-[6px]" label={message.retryAction.label} size="small" variant="Secondary" disabled={message.retryAction.disabled} onClick={message.retryAction.onSelect} />}
    </div>
  );
}

function Message({
  message,
  expanded,
  onToggleWork,
  onSelectContext,
}: {
  message: AgentPanelMessage;
  expanded: boolean;
  onToggleWork?: () => void;
  onSelectContext?: AgentPanelProps["onSelectContext"];
}) {
  if (message.type === "user") return <UserMessage message={message} onSelectContext={onSelectContext} />;
  if (message.type === "work") return <WorkMessage message={message} expanded={expanded} onToggle={onToggleWork} />;
  if (message.type === "action") return <ActionMessage message={message} />;
  if (message.type === "error") return <ErrorMessage message={message} />;
  return (
    <div className={clsx(FONT, "text-[11px] leading-[16px] text-c-text whitespace-pre-wrap break-words")} aria-live={message.status === "streaming" ? "polite" : undefined}>
      {message.content}
      {message.status === "streaming" && <span aria-hidden className="ml-[2px] inline-block h-[12px] w-px animate-pulse bg-c-text" />}
      {message.status === "stopped" && <span className="block mt-[2px] text-[9px] text-c-text-secondary">Stopped</span>}
    </div>
  );
}

export function AgentPanel({
  conversations,
  activeConversation,
  search,
  composerValue,
  context,
  expandedWorkMessageIds = [],
  storageNotice,
  sending = false,
  focusTarget,
  focusRequestKey,
  onSearchChange,
  onNewConversation,
  onOpenConversation,
  onBack,
  onConversationOptions,
  onComposerChange,
  onSubmit,
  onStop,
  onEscape,
  onDismissContext,
  onSelectContext,
  onToggleWorkMessage,
  onAttachmentRequest,
  onImageRequest,
  className,
}: AgentPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = composerValue.trim().length > 0 && !sending;
  const expanded = new Set(expandedWorkMessageIds);

  useEffect(() => {
    if (focusTarget === "panel") panelRef.current?.focus();
    if (focusTarget === "search") searchRef.current?.focus();
    if (focusTarget === "composer") composerRef.current?.focus();
  }, [focusTarget, focusRequestKey]);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (sending) onStop?.();
      else if (canSubmit) onSubmit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape?.();
    }
  };

  const visibleGroups = GROUP_ORDER.map(group => ({
    group,
    conversations: conversations.filter(conversation => conversation.timeGroup === group),
  })).filter(entry => entry.conversations.length);

  return (
    <Panel className={clsx("h-full overflow-hidden", className)}>
      <div ref={panelRef} tabIndex={-1} aria-label="Agent panel" className="h-full min-h-0 flex flex-col outline-none">
        {activeConversation ? (
          <>
            <header className="h-[52px] shrink-0 px-[8px] border-b border-c-border flex items-center gap-[6px]">
              <IconButton label="Back to chats" onClick={onBack}><ArrowLeft size={16} strokeWidth={1.5} /></IconButton>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[4px]">
                  <h2 className={clsx(FONT, "m-0 truncate text-[11px] font-[550] leading-[16px] text-c-text")}>{activeConversation.title}</h2>
                  <BetaBadge />
                </div>
                <PrivateBadge />
              </div>
              {onConversationOptions && <IconButton label="Conversation options" onClick={() => onConversationOptions(activeConversation.id)}><MoreHorizontal size={16} strokeWidth={1.5} /></IconButton>}
            </header>
            <ScrollArea className="px-[12px] py-[12px]">
              <div role="log" aria-label="Conversation messages" aria-live="polite" className="min-h-full flex flex-col justify-end gap-[12px]">
                {!activeConversation.messages.length && (
                  <div className="my-auto px-[12px] text-center">
                    <Sparkles size={20} strokeWidth={1.5} className="mx-auto text-c-icon" />
                    <p className={clsx(FONT, "mt-[8px] mb-0 text-[11px] leading-[16px] text-c-text")}>What would you like help with?</p>
                    <p className={clsx(FONT, "mt-[2px] mb-0 text-[9px] leading-[14px] text-c-text-secondary")}>Your editor context can be attached when you send.</p>
                  </div>
                )}
                {activeConversation.messages.map(message => (
                  <Message
                    key={message.id}
                    message={message}
                    expanded={expanded.has(message.id)}
                    onToggleWork={onToggleWorkMessage ? () => onToggleWorkMessage(message.id) : undefined}
                    onSelectContext={onSelectContext}
                  />
                ))}
              </div>
            </ScrollArea>
            <div className="shrink-0 border-t border-c-border p-[8px]">
              {storageNotice && <div role="status" className={clsx(FONT, "mb-[6px] text-[9px] leading-[14px] text-c-text-warning")}>{storageNotice}</div>}
              {context && (
                <div className="mb-[6px]">
                  <ContextChip context={context} dismissible={!!onDismissContext} onSelect={onSelectContext ? () => onSelectContext(context) : undefined} onDismiss={onDismissContext} />
                </div>
              )}
              <div className="rounded-c-lg bg-c-bg-secondary ring-1 ring-inset ring-c-border-translucent focus-within:ring-c-focus-ring">
                <textarea
                  ref={composerRef}
                  aria-label="Ask for changes"
                  placeholder="Ask for changes"
                  rows={1}
                  value={composerValue}
                  onChange={event => onComposerChange(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  className={clsx(FONT, "block min-h-[38px] max-h-[80px] w-full resize-none overflow-y-auto bg-transparent px-[8px] pt-[7px] text-[11px] leading-[16px] text-c-text placeholder:text-c-text-tertiary outline-none")}
                />
                <div className="h-[28px] px-[4px] pb-[4px] flex items-center gap-[2px]">
                  <IconButton label="Add attachment" disabled={!onAttachmentRequest} onClick={onAttachmentRequest}><Plus size={15} strokeWidth={1.5} /></IconButton>
                  <IconButton label="Add image" disabled={!onImageRequest} onClick={onImageRequest}><Image size={15} strokeWidth={1.5} /></IconButton>
                  <Tooltip label="Coming soon" direction="Top">
                    <span tabIndex={0} aria-label="Voice input unavailable: Coming soon"><IconButton label="Voice input coming soon" disabled><Mic size={15} strokeWidth={1.5} /></IconButton></span>
                  </Tooltip>
                  <span className="flex-1" />
                  <IconButton
                    label={sending ? "Stop response" : "Send message"}
                    disabled={sending ? !onStop : !canSubmit}
                    onClick={sending ? onStop : onSubmit}
                  >
                    {sending ? <span className="size-[9px] rounded-[1px] bg-current" /> : <Send size={15} strokeWidth={1.5} />}
                  </IconButton>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <header className="h-[40px] shrink-0 px-[12px] border-b border-c-border flex items-center gap-[6px]">
              <h2 className={clsx(FONT, "m-0 text-[11px] font-[550] leading-[16px] text-c-text")}>Chats</h2>
              <BetaBadge />
              <span className="flex-1" />
              <IconButton label="New chat" onClick={onNewConversation}><Plus size={16} strokeWidth={1.5} /></IconButton>
            </header>
            <div className="shrink-0 p-[8px]">
              <div className="h-[24px] rounded-c-md bg-c-bg-secondary flex items-center gap-[5px] px-[7px] focus-within:ring-1 focus-within:ring-c-focus-ring">
                <Search size={13} strokeWidth={1.5} className="text-c-icon shrink-0" />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Search chats"
                  placeholder="Search chats"
                  value={search}
                  onChange={event => onSearchChange(event.target.value)}
                  className={clsx(FONT, "min-w-0 flex-1 bg-transparent text-[11px] leading-[16px] text-c-text placeholder:text-c-text-tertiary outline-none")}
                />
                {search && <button type="button" aria-label="Clear chat search" onClick={() => onSearchChange("")} className="size-[18px] flex items-center justify-center rounded-c-sm text-c-icon hover:bg-c-bg-hover"><X size={12} /></button>}
              </div>
            </div>
            {storageNotice && <div role="status" className={clsx(FONT, "mx-[12px] mb-[4px] text-[9px] leading-[14px] text-c-text-warning")}>{storageNotice}</div>}
            <ScrollArea className="px-[4px] pb-[8px]">
              {!conversations.length ? (
                <div className="h-full min-h-[220px] px-[20px] flex flex-col items-center justify-center text-center">
                  <Sparkles size={22} strokeWidth={1.5} className="text-c-icon" />
                  <p className={clsx(FONT, "mt-[8px] mb-0 text-[11px] leading-[16px] text-c-text")}>{search ? "No matching chats" : "Start a conversation"}</p>
                  <p className={clsx(FONT, "mt-[2px] mb-[10px] text-[9px] leading-[14px] text-c-text-secondary")}>
                    {search ? "Try a different title or message." : "Get help with the current project and selection."}
                  </p>
                  {!search && <Button label="New chat" variant="Primary" iconLead="left" icon={<Plus size={14} />} onClick={onNewConversation} />}
                </div>
              ) : (
                visibleGroups.map(({ group, conversations: grouped }) => (
                  <section key={group} aria-labelledby={`agent-group-${group}`}>
                    <h3 id={`agent-group-${group}`} className={clsx(FONT, "m-0 px-[8px] pt-[8px] pb-[2px] text-[9px] font-[550] leading-[14px] text-c-text-secondary")}>{GROUP_LABELS[group]}</h3>
                    {grouped.map(conversation => <ConversationCard key={conversation.id} conversation={conversation} onOpen={() => onOpenConversation(conversation.id)} />)}
                  </section>
                ))
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </Panel>
  );
}
