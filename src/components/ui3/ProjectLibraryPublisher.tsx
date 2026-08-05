import { AudioLines, Image, Library, PanelsTopLeft, Search, Video } from "lucide-react";
import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Dialog";
import { InputField } from "./Input";

export type ProjectLibraryEntryKind = "composition" | "image" | "video" | "audio";

export interface ProjectLibraryPublisherEntry {
  id: string;
  kind: ProjectLibraryEntryKind;
  name: string;
  detail?: string;
  selected: boolean;
  /** Required transitive dependencies stay selected and explain why. */
  required?: boolean;
}

export interface ProjectLibraryPublishedItem {
  id: string;
  name: string;
  latestVersion: number;
  archived: boolean;
}

export interface ProjectLibraryPublisherProps {
  open: boolean;
  entries: readonly ProjectLibraryPublisherEntry[];
  publishedItems?: readonly ProjectLibraryPublishedItem[];
  targetItemId?: string | null;
  description: string;
  publishing?: boolean;
  error?: string | null;
  onClose: () => void;
  onEntryChange: (id: string, selected: boolean) => void;
  onTargetItemChange: (id: string | null) => void;
  onDescriptionChange: (value: string) => void;
  onPublish: () => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
}

const GROUPS: readonly { kind: ProjectLibraryEntryKind; label: string }[] = [
  { kind: "composition", label: "Compositions" },
  { kind: "image", label: "Images" },
  { kind: "video", label: "Video" },
  { kind: "audio", label: "Audio" },
];

const icon = (kind: ProjectLibraryEntryKind) => kind === "composition" ? PanelsTopLeft : kind === "image" ? Image : kind === "video" ? Video : AudioLines;

export function filterProjectLibraryEntries(entries: readonly ProjectLibraryPublisherEntry[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  return normalized ? entries.filter(entry => `${entry.name} ${entry.detail ?? ""}`.toLocaleLowerCase().includes(normalized)) : [...entries];
}

export function ProjectLibraryPublisher({
  open, entries, publishedItems = [], targetItemId = null, description, publishing = false, error,
  onClose, onEntryChange, onTargetItemChange, onDescriptionChange, onPublish, onArchive, onRestore,
}: ProjectLibraryPublisherProps) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterProjectLibraryEntries(entries, query), [entries, query]);
  const selectedCount = entries.filter(entry => entry.selected).length;
  const target = targetItemId ? publishedItems.find(item => item.id === targetItemId && !item.archived) : undefined;
  const nextVersion = target ? target.latestVersion + 1 : 1;

  return <Modal open={open} onClose={onClose} width={520} closeOnBackdrop={!publishing}>
    <ModalHeader title="Publish to project library" onClose={publishing ? undefined : onClose} />
    <ModalBody className="flex max-h-[560px] flex-col">
      <div className="flex shrink-0 flex-col gap-[12px] border-b border-c-border p-[16px]">
        <InputField value={query} onChange={setQuery} placeholder="Search compositions and media" leadingIcon={<Search size={12} />} />
        <label className="flex flex-col gap-[4px] font-[family-name:var(--composa-font-family)] text-[11px] text-c-text">
          Publish as
          <select
            aria-label="Publish as"
            value={targetItemId ?? ""}
            disabled={publishing}
            onChange={event => onTargetItemChange(event.target.value || null)}
            className="h-[28px] rounded-c-md bg-c-bg-secondary px-[8px] text-[11px] outline-none ring-1 ring-inset ring-c-border-translucent focus:ring-c-focus-ring"
          >
            <option value="">New library item · v1</option>
            {publishedItems.filter(item => !item.archived).map(item => <option key={item.id} value={item.id}>{item.name} · new v{item.latestVersion + 1}</option>)}
          </select>
        </label>
        <InputField label={`Version ${nextVersion} description (optional)`} multiline value={description} onChange={onDescriptionChange} placeholder="What changed in this version?" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[8px] py-[8px]">
        {GROUPS.map(group => {
          const groupEntries = visible.filter(entry => entry.kind === group.kind);
          if (!groupEntries.length) return null;
          return <section key={group.kind} aria-label={group.label} className="pb-[8px]">
            <h3 className="px-[8px] py-[6px] font-[family-name:var(--composa-font-family)] text-[9px] font-[550] uppercase tracking-[0.05em] text-c-text-secondary">{group.label}</h3>
            {groupEntries.map(entry => {
              const EntryIcon = icon(entry.kind);
              return <div key={entry.id} className="flex min-h-[40px] items-center gap-[8px] rounded-c-md px-[8px] hover:bg-c-bg-hover">
                <Checkbox checked={entry.selected} disabled={publishing || entry.required} label={`${entry.selected ? "Remove" : "Add"} ${entry.name}`} onChange={selected => onEntryChange(entry.id, selected)} />
                <EntryIcon size={14} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--composa-font-family)] text-[11px] font-[450] text-c-text">{entry.name}</p>
                  {(entry.detail || entry.required) && <p className="truncate font-[family-name:var(--composa-font-family)] text-[9px] text-c-text-secondary">{entry.required ? "Required dependency" : entry.detail}</p>}
                </div>
              </div>;
            })}
          </section>;
        })}
        {!visible.length && <div className="flex h-[96px] items-center justify-center text-[11px] text-c-text-secondary">No matching content</div>}

        {!!publishedItems.length && <section aria-label="Published items" className="mt-[4px] border-t border-c-border pt-[8px]">
          <h3 className="px-[8px] py-[6px] font-[family-name:var(--composa-font-family)] text-[9px] font-[550] uppercase tracking-[0.05em] text-c-text-secondary">Published items</h3>
          {publishedItems.map(item => <div key={item.id} className="flex min-h-[36px] items-center gap-[8px] px-[8px]">
            <Library size={14} strokeWidth={1.5} className="text-c-icon-secondary" />
            <span className={clsx("min-w-0 flex-1 truncate text-[11px]", item.archived ? "text-c-text-tertiary" : "text-c-text")}>{item.name} · v{item.latestVersion}</span>
            <button type="button" disabled={publishing || (!item.archived && !onArchive) || (item.archived && !onRestore)} onClick={() => item.archived ? onRestore?.(item.id) : onArchive?.(item.id)} className="rounded-c-sm px-[6px] py-[4px] text-[11px] text-c-text-secondary hover:bg-c-bg-hover disabled:opacity-40">{item.archived ? "Restore" : "Archive"}</button>
          </div>)}
        </section>}
      </div>
      {error && <p role="alert" className="shrink-0 border-t border-c-border px-[16px] py-[8px] text-[11px] text-c-text-danger">{error}</p>}
    </ModalBody>
    <ModalFooter align="between">
      <span className="text-[11px] text-c-text-secondary">{selectedCount} selected · {target ? `new v${nextVersion}` : "new item"}</span>
      <div className="flex gap-[8px]"><Button label="Cancel" variant="Secondary" disabled={publishing} onClick={onClose} /><Button label={publishing ? "Publishing…" : `Publish ${selectedCount}`} variant="Primary" disabled={publishing || selectedCount === 0} onClick={onPublish} /></div>
    </ModalFooter>
  </Modal>;
}
