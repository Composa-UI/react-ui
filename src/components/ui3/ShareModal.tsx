import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link, MoreHorizontal, Play, BookOpen, ChevronDown, Check, Copy } from "lucide-react";
import { clsx } from "clsx";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  ModalDivider, ModalSection, MODAL_WIDTHS,
} from "./Dialog";
import { Button } from "./Button";
import { InputField } from "./Input";
import { Avatar, type AvatarColor } from "./Avatar";
import { ListCell, ListCellGroup } from "./ListCell";
import { RadioButton } from "./RadioButton";

// ─── Constants ────────────────────────────────────────────────────────────────

type AccessLevel = "can edit" | "can view";

interface SharePerson {
  id: string;
  name: string;
  color: AvatarColor;
  initial: string;
  access: AccessLevel | "Owner";
}

const FONT  = "font-[family-name:var(--composa-font-family)]";
const LABEL = clsx(FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px]");

// ─── Menu item styles (always dark surface) ────────────────────────────────────

const MENU_ITEM = clsx(
  "flex items-center gap-[4px] min-h-[24px] mx-[4px] px-[4px] rounded-c-md select-none",
  "cursor-pointer outline-none",
  FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px] text-white",
  "data-[highlighted]:bg-c-bg-brand",
);
const MENU_ITEM_MUTED    = "text-[rgba(255,255,255,0.4)]";
const MENU_ITEM_DANGER   = "text-c-text-danger data-[highlighted]:bg-c-bg-brand data-[highlighted]:text-white";

// ─── RoleMenu — Radix DropdownMenu + our dark menu styling ────────────────────

function RoleMenu({
  personId,
  access,
  onChangeAccess,
  onRemove,
}: {
  personId: string;
  access: AccessLevel | "Owner";
  onChangeAccess: (id: string, access: AccessLevel) => void;
  onRemove: (id: string) => void;
}) {
  if (access === "Owner") {
    return (
      <span className={clsx(LABEL, "text-c-text pr-[8px]")}>Owner</span>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {/* Trigger styled like our Dropdown component — no-stroke variant */}
        <button className={clsx(
          "flex items-center gap-[2px] h-[24px] pl-[6px] pr-[4px] rounded-c-md",
          "hover:bg-c-bg-hover outline-none",
        )}>
          <span className={clsx(LABEL, "text-c-text")}>{access}</span>
          <ChevronDown size={10} strokeWidth={2} className="text-c-icon-secondary" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        {/* Menu surface — always dark, matches our Menu component */}
        <DropdownMenu.Content
          sideOffset={4}
          align="end"
          className="z-[60] py-[8px] rounded-c-lg shadow-c-400 ring-1 ring-inset ring-c-border-translucent"
          style={{ backgroundColor: "var(--color-bg-menu)", minWidth: 160 }}
          data-composa-mode="dark"
        >
          {/* Can edit */}
          <DropdownMenu.Item
            className={MENU_ITEM}
            onSelect={() => onChangeAccess(personId, "can edit")}
          >
            <span className="flex items-center justify-center size-[24px]">
              {access === "can edit" && <Check size={12} strokeWidth={2.5} />}
            </span>
            Can edit
          </DropdownMenu.Item>

          {/* Can view */}
          <DropdownMenu.Item
            className={MENU_ITEM}
            onSelect={() => onChangeAccess(personId, "can view")}
          >
            <span className="flex items-center justify-center size-[24px]">
              {access === "can view" && <Check size={12} strokeWidth={2.5} />}
            </span>
            Can view
          </DropdownMenu.Item>

          {/* Divider */}
          <DropdownMenu.Separator className="h-px my-[8px] bg-c-border-menu" />

          {/* Resend invite */}
          <DropdownMenu.Item
            className={MENU_ITEM}
            onSelect={() => {}}
          >
            <span className="size-[24px]" />
            Resend invite
          </DropdownMenu.Item>

          {/* Remove — destructive */}
          <DropdownMenu.Item
            className={clsx(MENU_ITEM, MENU_ITEM_DANGER)}
            onSelect={() => onRemove(personId)}
          >
            <span className="size-[24px]" />
            Remove
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── PersonRow ────────────────────────────────────────────────────────────────
// Composed from ListCell + Avatar (leading) + RoleMenu (trailing).
// Avatar size="default" (24px) matches Figma leading slot spec.

function PersonRow({
  person,
  onChangeAccess,
  onRemove,
}: {
  person: SharePerson;
  onChangeAccess: (id: string, access: AccessLevel) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <ListCell
      size="large"
      label={person.name}
      leading={
        <Avatar
          color={person.color}
          initial={person.initial}
          size="default"
          shape="circle"
        />
      }
      trailing={
        <RoleMenu
          personId={person.id}
          access={person.access}
          onChangeAccess={onChangeAccess}
          onRemove={onRemove}
        />
      }
    />
  );
}

// ─── ShareModal ───────────────────────────────────────────────────────────────

export function ShareModal({
  open,
  onClose,
  filename = "Untitled",
}: {
  open: boolean;
  onClose: () => void;
  filename?: string;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole]                  = useState<AccessLevel>("can edit");
  const [accessType, setAccessType]   = useState<"anyone" | "invited">("invited");
  const [expanded, setExpanded]       = useState(false);

  const [people, setPeople] = useState<SharePerson[]>([
    { id: "1", name: "Lizzy Lasagna (you)", color: "purple", initial: "L", access: "Owner"    },
    { id: "2", name: "Alan Anabelle",       color: "blue",   initial: "A", access: "can edit" },
    { id: "3", name: "Bobby Bucalini",      color: "green",  initial: "B", access: "can edit" },
    { id: "4", name: "Pedro Penne",         color: "yellow", initial: "P", access: "can edit" },
  ]);

  const handleChangeAccess = (id: string, access: AccessLevel) =>
    setPeople(prev => prev.map(p => p.id === id ? { ...p, access } : p));

  const handleRemove = (id: string) =>
    setPeople(prev => prev.filter(p => p.id !== id));

  const visiblePeople = expanded ? people : people.slice(0, 4);
  const hasMore = people.length > 4;

  return (
    <Modal open={open} onClose={onClose} width={MODAL_WIDTHS.standard} backdrop>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <ModalHeader
        title={`Share "${filename}"`}
        onClose={onClose}
        actions={
          <Button
            variant="Link"
            label="Copy link"
            size="small"
            icon={<Link size={12} strokeWidth={1.5} />}
            iconLead="left"
          />
        }
      />

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <ModalBody scrollable>

        {/* Invite row — input with inline dropdown pill, matching 24px height */}
        <div className="flex items-center gap-[8px] px-[12px] py-[10px]">
          <div className="flex-1 min-w-0">
            <InputField
              placeholder="Invite by name, email, or team…"
              value={inviteEmail}
              onChange={setInviteEmail}
              inlineDropdown={{ value: inviteRole }}
            />
          </div>
          <Button variant="Primary" label="Invite" />
        </div>

        <ModalDivider />

        {/* Access type — px-[12px] aligns visually with ListCell content (4px group + 8px cell = 12px) */}
        <ModalSection className="px-[12px] py-[8px] gap-[6px]">
          <label className="flex items-center gap-[8px] cursor-pointer h-[28px]">
            <RadioButton
              checked={accessType === "anyone"}
              onChange={() => setAccessType("anyone")}
            />
            <span className={clsx(LABEL, "text-c-text")}>Anyone can view this file</span>
          </label>
          <label className="flex items-center gap-[8px] cursor-pointer h-[28px]">
            <RadioButton
              checked={accessType === "invited"}
              onChange={() => setAccessType("invited")}
            />
            <span className={clsx(LABEL, "text-c-text")}>Only invited people can access</span>
          </label>
        </ModalSection>

        <ModalDivider />

        {/* People list — ListCell + Avatar (24px default) + RoleMenu */}
        <ListCellGroup className="py-[4px]">
          {visiblePeople.map(person => (
            <PersonRow
              key={person.id}
              person={person}
              onChangeAccess={handleChangeAccess}
              onRemove={handleRemove}
            />
          ))}
        </ListCellGroup>

        {hasMore && (
          <button
            onClick={() => setExpanded(v => !v)}
            className={clsx(
              "flex items-center gap-[4px] px-[12px] py-[6px] w-full",
              LABEL, "text-c-text-secondary hover:bg-c-bg-hover",
            )}
          >
            <MoreHorizontal size={12} strokeWidth={1.5} />
            {expanded ? "Less" : `${people.length - 4} more`}
          </button>
        )}

        <ModalDivider />

        {/* Action rows */}
        <ListCellGroup className="py-[4px]">
          <ListCell
            size="large"
            label="Start open session"
            leading={<Play size={16} strokeWidth={1.5} />}
            onClick={() => {}}
          />
          <ListCell
            size="large"
            label="Publish template"
            leading={<BookOpen size={16} strokeWidth={1.5} />}
            onClick={() => {}}
          />
        </ListCellGroup>

      </ModalBody>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <ModalFooter align="between">
        <div className="flex items-center gap-[8px]">
          <Button
            variant="Link"
            label="Copy link"
            icon={<Link size={12} strokeWidth={1.5} />}
            iconLead="left"
          />
          <Button variant="Ghost" label="Get Embed" />
        </div>
        <Button variant="Primary" label="Done" onClick={onClose} />
      </ModalFooter>
    </Modal>
  );
}
