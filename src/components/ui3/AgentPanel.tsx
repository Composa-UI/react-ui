import { Fragment, useEffect, useLayoutEffect, useRef, type KeyboardEvent, type MutableRefObject, type ReactNode } from "react";
import { SidePanel } from "./SidePanel";
import { clsx } from "clsx";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Diamond,
  FileText,
  Image,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  SquarePen,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "./Button";
import { Tag } from "./Tag";
import { LayerTypeIcon, type LayerIconType } from "./LayerTypeIcon";
import { ModelPicker } from "./ModelPicker";
import { RatingBar } from "./RatingBar";
import { ScrollArea } from "./Panel";
import { Tooltip } from "./Tooltip";
import { iconForSemantic } from "./IconSemantics";

export type AgentConversationTimeGroup = "today" | "yesterday" | "last-7-days" | "earlier";
export type AgentContextKind = "frame" | "text" | "shape" | "image" | "clip" | "video" | "audio" | "composition" | "selection";

export interface AgentContextReference {
  id: string;
  label: string;
  kind: AgentContextKind;
  count?: number;
  selectable?: boolean;
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
      /** Reasoning steps revealed when the work item is expanded (import parity). */
      steps?: readonly string[];
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

export interface AgentSuggestion {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface AgentPanelProps {
  /** Panel width in px (controlled). Share one value across the left rail so
   * the width survives switching tabs (Composa#664). */
  width?: number;
  /** Uncontrolled default when `width` is not provided. Default 240px. */
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
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
  /** New-chat suggestion prompts (import parity). Defaults provided when omitted. */
  suggestions?: readonly AgentSuggestion[];
  onSuggestionSelect?: (suggestion: AgentSuggestion) => void;
  /** Active model shown in the composer's ModelPicker. */
  model?: string;
  onModelClick?: () => void;
  className?: string;
}

const DEFAULT_SUGGESTIONS: readonly AgentSuggestion[] = [
  { id: "animate", label: "Animate this page", icon: <FileText size={15} strokeWidth={1.5} /> },
  { id: "find-motion", label: "Find what needs motion", icon: <Search size={15} strokeWidth={1.5} /> },
  { id: "learn", label: "Learn motion", icon: <Diamond size={15} strokeWidth={1.5} /> },
];

const FONT = "font-[family-name:var(--composa-font-family)]";
const GROUP_LABELS: Record<AgentConversationTimeGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "last-7-days": "Last 7 days",
  earlier: "Earlier",
};
const GROUP_ORDER: AgentConversationTimeGroup[] = ["today", "yesterday", "last-7-days", "earlier"];
const AUTO_SCROLL_THRESHOLD_PX = 48;
const COMPOSER_MIN_HEIGHT_PX = 38;
const COMPOSER_MAX_HEIGHT_PX = 78;

export function agentThreadIsNearBottom(
  metrics: Readonly<{ scrollTop: number; scrollHeight: number; clientHeight: number }>,
  threshold = AUTO_SCROLL_THRESHOLD_PX,
) {
  return metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <= threshold;
}

export function agentPanelEscapeIsEditableTarget(target: EventTarget | null) {
  const element = target as (EventTarget & {
    tagName?: string;
    isContentEditable?: boolean;
    getAttribute?: (name: string) => string | null;
  }) | null;
  const tagName = element?.tagName?.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select" || element?.isContentEditable) return true;
  const role = element?.getAttribute?.("role");
  return role === "textbox" || role === "searchbox" || role === "combobox" || role === "spinbutton";
}

export function sizeAgentComposer(
  textarea: Pick<HTMLTextAreaElement, "scrollHeight" | "style">,
) {
  textarea.style.height = "0px";
  const height = Math.max(COMPOSER_MIN_HEIGHT_PX, Math.min(COMPOSER_MAX_HEIGHT_PX, textarea.scrollHeight));
  textarea.style.height = `${height}px`;
  textarea.style.overflowY = textarea.scrollHeight > COMPOSER_MAX_HEIGHT_PX ? "auto" : "hidden";
  return height;
}

function safeLinkHref(href: string) {
  const normalized = href.trim();
  if (/^(https?:|mailto:)/i.test(normalized) || normalized.startsWith("/") || normalized.startsWith("#")) return normalized;
  return null;
}

function inlineMarkdown(content: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]\n]+\]\([^\s)\n]+\))/g;
  let cursor = 0;
  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(content.slice(cursor, index));
    const token = match[0];
    const key = `${keyPrefix}-${index}`;
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      nodes.push(<strong key={key} className="font-[650]">{token.slice(2, -2)}</strong>);
    } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key} className="rounded-c-sm bg-c-bg-secondary px-[3px] font-mono text-[10px]">{token.slice(1, -1)}</code>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = link ? safeLinkHref(link[2]) : null;
      nodes.push(href
        ? <a key={key} href={href} target={/^https?:/i.test(href) ? "_blank" : undefined} rel={/^https?:/i.test(href) ? "noreferrer" : undefined}
            className="text-c-text-brand underline underline-offset-2">{link![1]}</a>
        : <Fragment key={key}>{link?.[1] ?? token}</Fragment>);
    }
    cursor = index + token.length;
  }
  if (cursor < content.length) nodes.push(content.slice(cursor));
  return nodes;
}

export function AgentMarkdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${index}`} data-agent-markdown="code" className="my-[4px] overflow-x-auto rounded-c-md bg-c-bg-inverse p-[7px] text-c-text-on-inverse">
          <code className="font-mono text-[10px] leading-[14px]" data-language={language || undefined}>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const unordered = /^[-*]\s+/.test(line);
    const ordered = /^\d+\.\s+/.test(line);
    if (unordered || ordered) {
      const items: string[] = [];
      const itemPattern = unordered ? /^[-*]\s+(.*)$/ : /^\d+\.\s+(.*)$/;
      while (index < lines.length) {
        const match = itemPattern.exec(lines[index]);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={`list-${index}`} data-agent-markdown={ordered ? "ordered-list" : "unordered-list"}
          className={clsx("my-[4px] pl-[18px]", ordered ? "list-decimal" : "list-disc")}>
          {items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `list-${index}-${itemIndex}`)}</li>)}
        </List>,
      );
      continue;
    }
    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !lines[index].startsWith("```") &&
      !/^[-*]\s+/.test(lines[index]) && !/^\d+\.\s+/.test(lines[index])) {
      paragraph.push(lines[index++]);
    }
    blocks.push(<p key={`paragraph-${index}`} data-agent-markdown="paragraph" className="m-0 my-[4px]">
      {inlineMarkdown(paragraph.join("\n"), `paragraph-${index}`)}
    </p>);
  }
  return <div data-agent-markdown-root="">{blocks}</div>;
}

function messageRenderSignature(message: AgentPanelMessage) {
  if (message.type === "action") return `${message.id}:${message.status}:${message.title}:${message.description}`;
  if (message.type === "user") return `${message.id}:user:${message.content}`;
  if (message.type === "error") return `${message.id}:error:${message.severity}:${message.content}`;
  return `${message.id}:${message.type}:${message.status}:${message.content}`;
}

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

// The editor's "Beta" flag, now the shared `Tag` at its editor size rather than
// a private copy of one. Kept as a named local so the two call sites below read
// the same as they did, and so "what does Beta look like" stays one answer.
function BetaBadge() {
  return <Tag size="sm" tone="brand">Beta</Tag>;
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

// Composa#218: a context chip's icon must match the icon the layer list uses for
// that object type — so a frame reads as a frame, not a wrench. Route every kind
// through the shared LayerTypeIcon mapping.
const CONTEXT_KIND_TO_LAYER: Record<Exclude<AgentContextKind, "video" | "audio">, LayerIconType> = {
  frame: "frame",
  text: "text",
  shape: "shape",
  image: "image",
  clip: "image",
  composition: "frame",
  selection: "frame",
};

function ContextIcon({ kind }: { kind: AgentContextKind }) {
  if (kind === "video" || kind === "audio") {
    const semantic = kind === "video" ? "media-video" : "media-audio";
    const Icon = iconForSemantic(semantic);
    return <Icon data-icon-semantic={semantic} size={13} strokeWidth={1.5} />;
  }
  return <LayerTypeIcon type={CONTEXT_KIND_TO_LAYER[kind]} size={13} strokeWidth={1.5} />;
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
  const selectable = context.selectable !== false && !!onSelect;
  const content = (
    <>
      <span className="size-[14px] shrink-0 flex items-center justify-center text-c-icon"><ContextIcon kind={context.kind} /></span>
      <span className="truncate">{label}</span>
    </>
  );
  return (
    <span className="inline-flex max-w-full items-center rounded-c-md bg-c-bg-secondary text-c-text ring-1 ring-inset ring-c-border-translucent">
      {selectable ? (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Select context ${label}`}
          className={clsx(
            FONT,
            "h-[24px] min-w-0 flex items-center gap-[4px] pl-[6px] pr-[7px] text-[9px] leading-[14px]",
            "hover:bg-c-bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring",
          )}
        >
          {content}
        </button>
      ) : (
        <span
          role={context.selectable === false ? "note" : undefined}
          aria-label={context.selectable === false ? `Context unavailable ${label}` : undefined}
          className={clsx(
            FONT,
            "h-[24px] min-w-0 flex items-center gap-[4px] pl-[6px] pr-[7px] text-[9px] leading-[14px]",
            context.selectable === false && "text-c-text-secondary",
          )}
        >
          {content}
        </span>
      )}
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
    <div className="flex items-end justify-end gap-[8px]">
      <div className="min-w-0 flex flex-col items-end gap-[4px]">
        {message.context && <ContextChip
          context={message.context}
          onSelect={message.context.selectable !== false && onSelectContext ? () => onSelectContext(message.context!) : undefined}
        />}
        {/* Neutral surface, NOT `bg-c-bg-selected` (Composa#661): that is the
            selection tint the layer/slide rows paint behind a selected row, so
            the same wash behind message text read as a text selection. The
            canonical UserBubble already uses the secondary surface. */}
        <div className={clsx(FONT, "max-w-[196px] rounded-c-lg bg-c-bg-secondary px-[8px] py-[6px] text-[11px] leading-[16px] text-c-text whitespace-pre-wrap break-words")}>
          {message.content}
        </div>
      </div>
      <span aria-hidden className="size-[24px] shrink-0 overflow-hidden rounded-full bg-c-bg-secondary flex items-center justify-center text-c-icon">
        <CircleUserRound size={15} strokeWidth={1.5} />
      </span>
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
        {!!message.steps?.length && (
          <div className="mt-[6px] ml-[1px] pl-[2px] border-l-2 border-c-border flex flex-col gap-[2px]">
            {message.steps.map((step, index) => (
              <p key={index} className="pl-[8px] text-[9px] leading-[14px] text-c-text-tertiary">{step}</p>
            ))}
          </div>
        )}
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

// Composa-App/Composa#221 (superseded): the owner chose the export's new-chat
// design — a brand-tinted glyph, a prompt, and tappable suggestion cards —
// instead of matching the assets empty-state.
function NewChatEmptyState({
  suggestions,
  onSelect,
}: {
  suggestions: readonly AgentSuggestion[];
  onSelect: (suggestion: AgentSuggestion) => void;
}) {
  return (
    <div className="my-auto flex flex-col items-center gap-[16px] px-[12px] py-[8px]">
      <div className="flex flex-col items-center gap-[10px]">
        <span className="flex items-center justify-center rounded-full bg-c-bg-selected p-[8px] text-c-text-brand">
          <SquarePen size={18} strokeWidth={1.5} />
        </span>
        <p className={clsx(FONT, "m-0 text-[13px] font-[550] leading-[18px] text-c-text text-center")}>What do you want to do?</p>
      </div>
      <div className="w-full flex flex-col gap-[8px]">
        {suggestions.map(suggestion => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSelect(suggestion)}
            className={clsx(
              FONT,
              "w-full flex items-center gap-[8px] p-[8px] rounded-c-lg text-left outline-none",
              "ring-1 ring-inset ring-c-border hover:bg-c-bg-hover focus-visible:ring-c-focus-ring",
            )}
          >
            <span className="size-[24px] shrink-0 flex items-center justify-center text-c-icon">{suggestion.icon ?? <Sparkles size={15} strokeWidth={1.5} />}</span>
            <span className="min-w-0 flex-1 truncate text-[11px] leading-[16px] font-[450] text-c-text">{suggestion.label}</span>
          </button>
        ))}
      </div>
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
      <AgentMarkdown content={message.content} />
      {message.status === "streaming" && <span aria-hidden className="ml-[2px] inline-block h-[12px] w-px animate-pulse bg-c-text" />}
      {message.status === "stopped" && <span className="block mt-[2px] text-[9px] text-c-text-secondary">Stopped</span>}
      {(message.status === "complete" || message.status === undefined) && <RatingBar />}
    </div>
  );
}

export function AgentPanel({
  width,
  defaultWidth,
  onWidthChange,
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
  suggestions,
  onSuggestionSelect,
  model = "Default",
  onModelClick,
  className,
}: AgentPanelProps) {
  const resolvedSuggestions = suggestions ?? DEFAULT_SUGGESTIONS;
  const handleSuggestion = (suggestion: AgentSuggestion) => {
    if (onSuggestionSelect) onSuggestionSelect(suggestion);
    else onComposerChange(suggestion.label);
  };
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const threadViewportRef = useRef<HTMLDivElement>(null);
  const threadNearBottomRef = useRef(true);
  const previousConversationIdRef = useRef<string | null>(null);
  const canSubmit = composerValue.trim().length > 0 && !sending;
  const expanded = new Set(expandedWorkMessageIds);
  const messageSignature = activeConversation?.messages.map(messageRenderSignature).join("\u0000") ?? "";

  useEffect(() => {
    if (focusTarget === "panel") panelRef.current?.focus();
    if (focusTarget === "search") searchRef.current?.focus();
    if (focusTarget === "composer") composerRef.current?.focus();
  }, [focusTarget, focusRequestKey]);

  useLayoutEffect(() => {
    if (composerRef.current) sizeAgentComposer(composerRef.current);
  }, [composerValue, activeConversation?.id]);

  useLayoutEffect(() => {
    const viewport = threadViewportRef.current;
    if (!activeConversation) {
      previousConversationIdRef.current = null;
      threadNearBottomRef.current = true;
      return;
    }
    if (!viewport) return;
    const changedConversation = previousConversationIdRef.current !== activeConversation.id;
    previousConversationIdRef.current = activeConversation.id;
    if (changedConversation) threadNearBottomRef.current = true;
    if (threadNearBottomRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      viewport.dataset.agentAutoScroll = "bottom";
    } else {
      viewport.dataset.agentAutoScroll = "paused";
    }
  }, [activeConversation?.id, messageSignature]);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent?.isComposing || event.keyCode === 229) return;
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
    // Left-column panel: same outer shell as CompositionPanel / AssetsPanel —
    // a right-border-only column (no top/left inset ring) so the Agent panel sits
    // flush with its siblings' top-left edges (Composa#211 director feedback).
    <SidePanel className={className} width={width} defaultWidth={defaultWidth} onWidthChange={onWidthChange}>
      <div
        ref={panelRef}
        tabIndex={-1}
        aria-label="Agent panel"
        onKeyDown={event => {
          if (
            event.key !== "Escape" ||
            event.nativeEvent?.isComposing ||
            event.keyCode === 229 ||
            agentPanelEscapeIsEditableTarget(event.target)
          ) return;
          event.preventDefault();
          onEscape?.();
        }}
        className="h-full min-h-0 flex flex-col outline-none"
      >
        {activeConversation ? (
          <>
            {/* Composa-App/Composa#220: chat header shares the 40px standard fixed
                header height (matches the history header + PropertyPanel sections)
                and lays out on a single line — no stacked "Private" descriptor. */}
            <header className="h-[40px] shrink-0 px-[8px] border-b border-c-border flex items-center gap-[6px]">
              <IconButton label="Back to chats" onClick={onBack}><ArrowLeft size={16} strokeWidth={1.5} /></IconButton>
              <h2 className={clsx(FONT, "min-w-0 flex-1 m-0 truncate text-[11px] font-[550] leading-[16px] text-c-text")}>{activeConversation.title}</h2>
              <BetaBadge />
              {onConversationOptions && <IconButton label="Conversation options" onClick={() => onConversationOptions(activeConversation.id)}><MoreHorizontal size={16} strokeWidth={1.5} /></IconButton>}
            </header>
            <ScrollArea viewportRef={threadViewportRef as MutableRefObject<HTMLDivElement | null>}
              onScroll={() => {
                const viewport = threadViewportRef.current;
                if (!viewport) return;
                threadNearBottomRef.current = agentThreadIsNearBottom(viewport);
                viewport.dataset.agentAutoScroll = threadNearBottomRef.current ? "bottom" : "paused";
              }}
              className="agent-message-scroll px-[12px] py-[12px]">
              <div role="log" aria-label="Conversation messages" aria-live="polite" data-agent-message-signature={messageSignature}
                className="min-h-full flex flex-col justify-end gap-[12px]">
                {!activeConversation.messages.length && (
                  <NewChatEmptyState suggestions={resolvedSuggestions} onSelect={handleSuggestion} />
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
                  <ContextChip
                    context={context}
                    dismissible={!!onDismissContext}
                    onSelect={context.selectable !== false && onSelectContext ? () => onSelectContext(context) : undefined}
                    onDismiss={onDismissContext}
                  />
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
                  data-agent-composer-lines="1-4"
                  className={clsx(FONT, "block min-h-[38px] max-h-[78px] w-full resize-none overflow-hidden bg-transparent px-[8px] pt-[7px] text-[11px] leading-[16px] text-c-text placeholder:text-c-text-tertiary outline-none")}
                />
                <div className="h-[28px] px-[4px] pb-[4px] flex items-center gap-[2px]">
                  <IconButton label="Add attachment" disabled={!onAttachmentRequest} onClick={onAttachmentRequest}><Plus size={15} strokeWidth={1.5} /></IconButton>
                  <ModelPicker value={model} disabled={!onModelClick} onClick={onModelClick} />
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
            <header className="h-[40px] shrink-0 pl-[16px] pr-[8px] border-b border-c-border flex items-center gap-[6px]">
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
    </SidePanel>
  );
}
