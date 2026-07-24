import { useState, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Users, ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";
import { Modal, ModalHeader, ModalBody, MODAL_WIDTHS } from "./Dialog";
import { Tabs } from "./Tabs";
import { Avatar, type AvatarColor } from "./Avatar";

// TeamDialog — the workspace/team management dialog (Editor-Study nodes 288-6192
// "Settings" and 288-6301 / 288-6397 "Members"). Both Figma nodes are the SAME
// dialog with different active tabs, so this is one component with a `tab` prop
// that switches between the Members and Settings views. The app opens it from the
// header chevron menu (#287) on either tab and wires the callbacks.
//
// Layout mirrors the app's Account SettingsDialog (two columns: a team-icon
// column + a field/content column) but WITHOUT the section dividers — per the
// Figma, sections are separated by whitespace only.
//
// DATA HONESTY: like the app SettingsDialog, this is presentational. It renders
// only what the host supplies; every "Change …" affordance is a callback the app
// owns. No identity or membership is fabricated here.

const FONT    = "font-[family-name:var(--composa-font-family)]";
const HEADING = clsx(FONT, "text-[14px] font-medium leading-[24px] tracking-[-0.006px] text-c-text");
const VALUE   = clsx(FONT, "text-[11px] font-medium leading-[16px] tracking-[0.055px]");
const CAPTION = clsx(FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px] text-c-text-secondary");
const LABEL   = clsx(FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px]");

// Multiplayer identity grey (Figma variable color/multiplayergrey). Multiplayer
// identity colours are fixed and mode-independent — same convention as the fixed
// AVATAR_COLORS constants in Avatar.tsx.
const MULTIPLAYER_GREY = "#667799";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TeamTab  = "members" | "settings";
export type TeamRole = "can edit" | "can view" | "Owner";

const roleLabel = (role: TeamRole) =>
  role === "Owner" ? "Owner" : role === "can edit" ? "Can edit" : "Can view";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: TeamRole;
  /** Photo avatar — overrides the coloured initial */
  avatarSrc?: string;
  avatarColor?: AvatarColor;
  initial?: string;
  /** Appends a muted "(You)" after the name */
  isYou?: boolean;
  /** De-emphasised row — e.g. a pending invite */
  pending?: boolean;
}

// ─── TeamIcon — square team glyph (photo or coloured Users icon) ──────────────

function TeamIcon({ src, size = 80 }: { src?: string; size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-c-lg flex items-center justify-center"
      style={{ width: size, height: size, backgroundColor: src ? undefined : MULTIPLAYER_GREY }}
    >
      {src
        ? <img src={src} alt="" className="size-full object-cover" />
        : <Users size={Math.round(size * 0.36)} strokeWidth={1.75} className="text-white" />}
    </div>
  );
}

// ─── Settings tab ─────────────────────────────────────────────────────────────

// A blue link affordance (e.g. "Change name"). Disabled until the host wires it,
// rendered muted so it never looks like a working control that drops the action.
function LinkAction({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={clsx(
        VALUE, "text-left bg-transparent border-0 p-0",
        onClick ? "text-c-text-brand hover:underline cursor-pointer" : "text-c-text-disabled cursor-not-allowed",
      )}
    >
      {label}
    </button>
  );
}

// One settings section: heading + optional value line + optional link/children.
// No divider (per Figma) — sections are separated by the pt-[24px] lead-in.
function SettingsSection({
  title,
  value,
  first,
  children,
}: {
  title: string;
  value?: string;
  first?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={clsx("flex flex-col items-start w-full", !first && "pt-[24px]")}>
      <p className={HEADING}>{title}</p>
      {value && <p className={clsx(VALUE, "pt-[12px] text-c-text")}>{value}</p>}
      {children && <div className="pt-[12px] flex flex-col items-start">{children}</div>}
    </div>
  );
}

interface TeamSettingsCallbacks {
  onChangeName?: () => void;
  onAddDescription?: () => void;
}

function SettingsView({
  teamName,
  teamIconSrc,
  callbacks,
}: {
  teamName?: string;
  teamIconSrc?: string;
  callbacks: TeamSettingsCallbacks;
}) {
  return (
    <div className="flex items-start pt-[24px]">
      <TeamIcon src={teamIconSrc} />
      <div className="flex flex-col items-start pl-[32px] w-full max-w-[472px]">
        <SettingsSection title="Team name" value={teamName ?? "Not set"} first>
          <LinkAction label="Change name" onClick={callbacks.onChangeName} />
        </SettingsSection>

        <SettingsSection title="About">
          <LinkAction label="Add a description" onClick={callbacks.onAddDescription} />
        </SettingsSection>
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

// Role control: "Owner" renders as static text; editable roles open a menu
// (Can edit / Can view + Remove). Mirrors ShareModal's RoleMenu styling.
function RoleControl({
  member,
  onChangeRole,
  onRemove,
}: {
  member: TeamMember;
  onChangeRole?: (id: string, role: TeamRole) => void;
  onRemove?: (id: string) => void;
}) {
  if (member.role === "Owner") {
    return <span className={clsx(LABEL, "text-c-text pr-[8px]")}>Owner</span>;
  }
  // No wiring → static role text (honest: not a working control).
  if (!onChangeRole && !onRemove) {
    return <span className={clsx(LABEL, "text-c-text-secondary pr-[8px]")}>{roleLabel(member.role)}</span>;
  }

  const MENU_ITEM = clsx(
    "flex items-center gap-[4px] min-h-[24px] mx-[4px] px-[4px] rounded-c-md select-none",
    "cursor-pointer outline-none",
    FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px] text-white",
    "data-[highlighted]:bg-c-bg-brand",
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-[2px] h-[24px] pl-[6px] pr-[4px] rounded-c-md hover:bg-c-bg-hover outline-none">
          <span className={clsx(LABEL, "text-c-text")}>{roleLabel(member.role)}</span>
          <ChevronDown size={10} strokeWidth={2} className="text-c-icon-secondary" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          align="end"
          className="z-[60] py-[8px] rounded-c-lg shadow-c-400 ring-1 ring-inset ring-c-border-translucent"
          style={{ backgroundColor: "var(--color-bg-menu)", minWidth: 160 }}
          data-composa-mode="dark"
        >
          {(["can edit", "can view"] as const).map(role => (
            <DropdownMenu.Item key={role} className={MENU_ITEM} onSelect={() => onChangeRole?.(member.id, role)}>
              <span className="flex items-center justify-center size-[24px]">
                {member.role === role && <Check size={12} strokeWidth={2.5} />}
              </span>
              {role === "can edit" ? "Can edit" : "Can view"}
            </DropdownMenu.Item>
          ))}
          {onRemove && (
            <>
              <DropdownMenu.Separator className="h-px my-[8px] bg-c-border-menu" />
              <DropdownMenu.Item
                className={clsx(MENU_ITEM, "text-c-text-danger data-[highlighted]:text-white")}
                onSelect={() => onRemove(member.id)}
              >
                <span className="size-[24px]" />
                Remove
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MemberRow({
  member,
  onChangeRole,
  onRemove,
}: {
  member: TeamMember;
  onChangeRole?: (id: string, role: TeamRole) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className={clsx("flex items-center gap-[12px] py-[8px]", member.pending && "opacity-60")}>
      <Avatar
        src={member.avatarSrc}
        color={member.avatarColor ?? "grey"}
        initial={member.initial ?? member.name[0]?.toUpperCase()}
        size="large"
        shape="circle"
      />
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className={clsx(VALUE, "text-c-text truncate")}>
          {member.name}
          {member.isYou && <span className="text-c-text-secondary font-[450]"> (You)</span>}
        </span>
        {member.email && (
          <span className={clsx(FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px] text-c-text-secondary truncate")}>
            {member.email}
          </span>
        )}
      </div>
      <div className="shrink-0">
        <RoleControl member={member} onChangeRole={onChangeRole} onRemove={onRemove} />
      </div>
    </div>
  );
}

function MembersView({
  teamName,
  teamIconSrc,
  members,
  onChangeRole,
  onRemove,
}: {
  teamName?: string;
  teamIconSrc?: string;
  members: TeamMember[];
  onChangeRole?: (id: string, role: TeamRole) => void;
  onRemove?: (id: string) => void;
}) {
  const empty = members.length <= 1;
  const caption = empty
    ? "Manage permissions by adjusting team members' roles. To manage their seat, head to the admin dashboard instead."
    : `${teamName ?? "Team"} · ${members.length} members`;

  return (
    <div className="flex items-start pt-[24px]">
      <TeamIcon src={teamIconSrc} />
      <div className="flex flex-col items-start pl-[32px] w-full max-w-[472px]">
        <p className={clsx(CAPTION, empty && "leading-[20px]")}>{caption}</p>
        <div className="pt-[8px] w-full flex flex-col">
          {members.map(member => (
            <MemberRow key={member.id} member={member} onChangeRole={onChangeRole} onRemove={onRemove} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TeamDialog ───────────────────────────────────────────────────────────────

export interface TeamDialogProps extends TeamSettingsCallbacks {
  open: boolean;
  onClose: () => void;
  /** Active tab (controlled). Defaults to "settings" uncontrolled. */
  tab?: TeamTab;
  onTabChange?: (tab: TeamTab) => void;
  teamName?: string;
  /** Photo used for the team icon; falls back to the coloured Users glyph. */
  teamIconSrc?: string;
  members?: TeamMember[];
  onChangeMemberRole?: (id: string, role: TeamRole) => void;
  onRemoveMember?: (id: string) => void;
}

export function TeamDialog({
  open,
  onClose,
  tab,
  onTabChange,
  teamName,
  teamIconSrc,
  members = [],
  onChangeMemberRole,
  onRemoveMember,
  ...settings
}: TeamDialogProps) {
  const [internalTab, setInternalTab] = useState<TeamTab>("settings");
  const activeTab = tab ?? internalTab;
  const setTab = (next: string) => {
    if (tab === undefined) setInternalTab(next as TeamTab);
    onTabChange?.(next as TeamTab);
  };

  return (
    <Modal open={open} onClose={onClose} width={650} backdrop className="min-h-[480px]">
      <ModalHeader
        variant="tabs"
        title="Team"
        onClose={onClose}
        tabs={
          <Tabs
            value={activeTab}
            onChange={setTab}
            tabs={[
              { value: "members", label: "Members" },
              { value: "settings", label: "Settings" },
            ]}
          />
        }
      />
      <ModalBody className="px-[24px] py-[8px]">
        {activeTab === "settings" ? (
          <SettingsView teamName={teamName} teamIconSrc={teamIconSrc} callbacks={settings} />
        ) : (
          <MembersView
            teamName={teamName}
            teamIconSrc={teamIconSrc}
            members={members}
            onChangeRole={onChangeMemberRole}
            onRemove={onRemoveMember}
          />
        )}
      </ModalBody>
    </Modal>
  );
}
