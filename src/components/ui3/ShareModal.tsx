import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Link, Users, ChevronRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { Modal, ModalHeader, ModalBody, MODAL_WIDTHS } from "./Dialog";
import { Button } from "./Button";
import { InputField } from "./Input";
import { Avatar, type AvatarColor } from "./Avatar";
import { Menu, MenuRow, PopoverMenu } from "./Menu";

// ─── Types ──────────────────────────────────────────────────────────────────────
// Rebuilt to match Figma node 288-5750 (Editor-Study / project share). The same
// UX drives both project and team sharing — the only difference is the header
// (`variant`), per the owner's decision.

/** Which entity is being shared — switches the header/context only. */
export type ShareVariant = "project" | "team";

/** Per-person access level (owner is rendered as static, non-editable text). */
export type ShareAccess = "can edit" | "can view";

export interface SharePerson {
  id: string;
  name: string;
  /** Appends a muted "(you)" after the name. */
  you?: boolean;
  /** Renders static "owner" text instead of an editable role menu. */
  owner?: boolean;
  /** Editable role — used when the person is not the owner. */
  access?: ShareAccess;
  /** Avatar identity colour (used when no photo `src`). */
  color?: AvatarColor;
  initial?: string;
  /** Avatar photo. */
  src?: string;
}

export interface ShareScopeOption {
  value: string;
  label: string;
}

const FONT  = "font-[family-name:var(--composa-font-family)]";
// body/medium — Inter Medium 11px, matches Figma body text on every row.
const LABEL = clsx(FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px]");

const HEADER_TITLE: Record<ShareVariant, string> = {
  project: "Share this project",
  team:    "Invite to team",
};

// ─── RoleMenu — editable access for non-owner people ─────────────────────────────
// Reuses the DS dark Menu / MenuRow (Menu.tsx) — the same pattern as the rest of
// the system's overflow menus — rather than a bespoke surface.

function RoleMenu({
  access,
  onChangeAccess,
  onRemove,
}: {
  access: ShareAccess;
  onChangeAccess: (access: ShareAccess) => void;
  onRemove: () => void;
}) {
  return (
    <PopoverMenu
      directTrigger
      align="right"
      trigger={
        <button
          type="button"
          aria-haspopup="menu"
          className={clsx(
            "flex items-center gap-[2px] h-[24px] pl-[6px] pr-[4px] rounded-c-md",
            "hover:bg-c-bg-hover outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring",
          )}
        >
          <span className={clsx(LABEL, "text-c-text")}>{access}</span>
          <ChevronDown size={10} strokeWidth={2} className="text-c-icon-secondary" />
        </button>
      }
    >
      {close => (
        <Menu>
          <MenuRow
            type="checkmark"
            label="Can edit"
            checked={access === "can edit"}
            onClick={() => { onChangeAccess("can edit"); close(); }}
          />
          <MenuRow
            type="checkmark"
            label="Can view"
            checked={access === "can view"}
            onClick={() => { onChangeAccess("can view"); close(); }}
          />
          <MenuRow type="divider" />
          <MenuRow label="Resend invite" onClick={() => close()} />
          <MenuRow label="Remove" destructive onClick={() => { onRemove(); close(); }} />
        </Menu>
      )}
    </PopoverMenu>
  );
}

// ─── Row primitive ──────────────────────────────────────────────────────────────
// A 36px row: 24px leading slot + label + trailing. Used for both the access-scope
// row and each person, so their leading glyphs / avatars and labels align.

// Rest carries Radix-injected trigger props (onClick, data-state, aria-*, …) when
// the row is used as a menu trigger.
type ShareRowProps = {
  leading: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
  interactive?: boolean;
  ariaLabel?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "ref">;

// forwardRef + prop spread so the interactive variant can serve as a Radix
// PopoverMenu `asChild` trigger (a plain component would swallow the ref/props).
const ShareRow = forwardRef<HTMLButtonElement, ShareRowProps>(function ShareRow(
  { leading, children, trailing, interactive = false, ariaLabel, ...rest },
  ref,
) {
  const inner = (
    <>
      <span className="shrink-0 flex items-center justify-center size-[24px] text-c-icon">
        {leading}
      </span>
      <span className="flex-1 min-w-0 flex items-center gap-[3px] overflow-hidden">
        {children}
      </span>
      {trailing && <span className="shrink-0 flex items-center">{trailing}</span>}
    </>
  );

  if (interactive) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        className={clsx(
          "flex items-center gap-[8px] h-[36px] w-full pl-[6px] pr-[8px] rounded-c-md text-left",
          "hover:bg-c-bg-hover outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring",
        )}
        {...rest}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-[8px] h-[36px] pl-[6px] pr-[8px] rounded-c-md">
      {inner}
    </div>
  );
});

// ─── ShareModal ───────────────────────────────────────────────────────────────

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  /** "project" → "Share this project"; "team" → "Invite to team". */
  variant?: ShareVariant;
  /** Override the header title (defaults to the per-variant text above). */
  title?: string;
  /** People with access. Owner rows render static "owner"; others get a role menu. */
  people?: SharePerson[];
  /** Current access-scope label, e.g. "Anyone in Just me". */
  scopeLabel?: string;
  /** Options offered by the access-scope menu. */
  scopeOptions?: ShareScopeOption[];
  /** Selected scope option value (controlled). */
  scopeValue?: string;
  onScopeChange?: (value: string) => void;
  onCopyLink?: () => void;
  onInvite?: (value: string) => void;
  onChangeAccess?: (id: string, access: ShareAccess) => void;
  onRemovePerson?: (id: string) => void;
}

// Placeholder scope options — no real permissions model yet (owner: "we have no
// membership right now"). Flagged in the PR pending the real model.
const DEFAULT_SCOPE_OPTIONS: ShareScopeOption[] = [
  { value: "workspace", label: "Anyone in the workspace" },
  { value: "link",      label: "Anyone with the link" },
  { value: "invited",   label: "Only people invited" },
];

export function ShareModal({
  open,
  onClose,
  variant = "project",
  title,
  people,
  scopeLabel = "Anyone in Just me",
  scopeOptions = DEFAULT_SCOPE_OPTIONS,
  scopeValue,
  onScopeChange,
  onCopyLink,
  onInvite,
  onChangeAccess,
  onRemovePerson,
}: ShareModalProps) {
  const [invite, setInvite] = useState("");

  // Uncontrolled fallbacks so the component is usable without wiring every prop.
  const [internalPeople, setInternalPeople] = useState<SharePerson[]>([
    { id: "you", name: "Samuel", you: true, owner: true, color: "purple", initial: "S" },
  ]);
  const roster = people ?? internalPeople;

  const handleChangeAccess = (id: string, access: ShareAccess) => {
    onChangeAccess?.(id, access);
    if (!people) setInternalPeople(prev => prev.map(p => p.id === id ? { ...p, access } : p));
  };
  const handleRemove = (id: string) => {
    onRemovePerson?.(id);
    if (!people) setInternalPeople(prev => prev.filter(p => p.id !== id));
  };

  const handleInvite = () => {
    const value = invite.trim();
    if (!value) return;
    onInvite?.(value);
    setInvite("");
  };

  return (
    <Modal open={open} onClose={onClose} width={MODAL_WIDTHS.standard} backdrop>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <ModalHeader
        title={title ?? HEADER_TITLE[variant]}
        onClose={onClose}
        actions={
          <Button
            variant="Link"
            label="Copy link"
            size="small"
            icon={<Link size={12} strokeWidth={1.5} />}
            iconLead="left"
            onClick={onCopyLink}
          />
        }
      />

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <ModalBody scrollable>
        <div className="flex flex-col px-[16px] py-[8px]">
          {/* Invite form */}
          <div className="flex items-center gap-[8px] py-[8px]">
            <div className="flex-1 min-w-0">
              <InputField
                autoFocus
                size="large"
                placeholder="Add emails, names, or user groups"
                value={invite}
                onChange={setInvite}
              />
            </div>
            <Button
              variant="Primary"
              size="large"
              label="Invite"
              disabled={!invite.trim()}
              onClick={handleInvite}
            />
          </div>

          {/* Who has access */}
          <div className="flex flex-col pt-[4px]">
            <div className="flex items-center h-[28px] pl-[6px]">
              <span className={clsx(LABEL, "text-c-text-secondary")}>Who has access</span>
            </div>

            {/* Access-scope row — menu trigger */}
            <PopoverMenu
              directTrigger
              align="left"
              trigger={
                <ShareRow
                  interactive
                  ariaLabel="Change who can access"
                  leading={<Users size={16} strokeWidth={1.5} />}
                  trailing={
                    <span className="flex items-center gap-[2px] text-c-text">
                      <span className={LABEL}>can access</span>
                      <ChevronRight size={12} strokeWidth={2} className="text-c-icon-secondary" />
                    </span>
                  }
                >
                  <span className={clsx(LABEL, "text-c-text truncate")}>{scopeLabel}</span>
                </ShareRow>
              }
            >
              {close => (
                <Menu>
                  {scopeOptions.map(option => (
                    <MenuRow
                      key={option.value}
                      type="checkmark"
                      label={option.label}
                      checked={scopeValue === option.value}
                      onClick={() => { onScopeChange?.(option.value); close(); }}
                    />
                  ))}
                </Menu>
              )}
            </PopoverMenu>

            {/* People */}
            {roster.map(person => (
              <ShareRow
                key={person.id}
                leading={
                  <Avatar
                    src={person.src}
                    color={person.color ?? "blue"}
                    initial={person.initial ?? person.name.charAt(0)}
                    size="default"
                    shape="circle"
                  />
                }
                trailing={
                  person.owner ? (
                    <span className={clsx(LABEL, "text-c-text pr-[8px]")}>owner</span>
                  ) : (
                    <RoleMenu
                      access={person.access ?? "can edit"}
                      onChangeAccess={access => handleChangeAccess(person.id, access)}
                      onRemove={() => handleRemove(person.id)}
                    />
                  )
                }
              >
                <span className={clsx(LABEL, "text-c-text truncate")}>{person.name}</span>
                {person.you && <span className={clsx(LABEL, "text-c-text-secondary")}>(you)</span>}
              </ShareRow>
            ))}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
