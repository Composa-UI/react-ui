import { type ReactNode } from "react";
import { clsx } from "clsx";

export type ProjectsStateKind = "loading" | "failure" | "empty" | "search-empty" | "populated";
export type ProjectsViewMode = "grid" | "list";

export interface ProjectsHomeTemplateProps {
  /** The whole left navigation column — account chip, workspace switcher,
   *  search, nav list, Starred, brand. Host-composed; the template sizes the
   *  241px column and makes it its own scroll region. */
  sidebar: ReactNode;
  /** The page title in the top bar (e.g. "Recents"). */
  title: ReactNode;
  /** Top-bar right actions (e.g. a "Compose new video" / Share button). */
  headerActions?: ReactNode;
  /** The sort + view-mode row (sort Dropdown + grid/list SegmentedControl). */
  toolbar?: ReactNode;
  /** grid (cards) or list (rows). Default "grid". */
  viewMode?: ProjectsViewMode;
  /** The inventory state. Anything but "populated" renders `statePanel`
   *  centered instead of the collection (projects-home spec §3). */
  stateKind?: ProjectsStateKind;
  /** Content for a non-populated state — a loading skeleton, empty/ search-empty
   *  explanation, or a load-failure retry. Host-provided. */
  statePanel?: ReactNode;
  /** The collection when populated: cards (grid) or rows (list). Host renders
   *  the items; the template owns the grid track rule and the list column. */
  children?: ReactNode;
  className?: string;
}

/**
 * The authenticated pre-editor file surface (projects-home spec §2). A
 * screen-shape `template`: a two-pane shell (241px sidebar + scrolling content
 * pane) whose collection owns the canonical grid — at most five cards per row,
 * fewer only when the width can't honestly carry five. It holds no repository,
 * auth, or routing state; the host supplies inventory data and callbacks and
 * fills every slot.
 */
export function ProjectsHomeTemplate({
  sidebar,
  title,
  headerActions,
  toolbar,
  viewMode = "grid",
  stateKind = "populated",
  statePanel,
  children,
  className,
}: ProjectsHomeTemplateProps) {
  const populated = stateKind === "populated";
  return (
    <div
      className={clsx("bg-c-bg flex items-start w-full h-full overflow-hidden", className)}
      data-product-route="projects"
    >
      {/* THE grid track rule (projects-home spec §3, #15), one definition: a
          track can never be narrower than a fifth of the row minus its four
          32px gutters, so a sixth column can't fit — the max-5 cap — while the
          240px floor gives an honest 4 / 3 / 2 / 1 below ~1088px. */}
      <style>{`.composa-projects-tracks{display:grid;gap:32px;grid-template-columns:repeat(auto-fill,minmax(max(240px,(100% - 128px)/5),1fr))}`}</style>

      <aside className="w-[241px] h-full shrink-0 overflow-y-auto border-r border-c-border">{sidebar}</aside>

      <main className="bg-c-bg h-full flex flex-col flex-1 min-w-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="h-[49px] shrink-0 px-[32px] flex items-center justify-between border-b border-c-border">
            <div className="text-[20px] font-[550] text-c-text truncate min-w-0">{title}</div>
            {headerActions && <div className="flex items-center gap-[8px] shrink-0">{headerActions}</div>}
          </div>

          {toolbar && (
            <div className="h-[64px] shrink-0 pl-[32px] pr-[34px] flex items-center justify-end gap-[8px] border-b border-c-border">
              {toolbar}
            </div>
          )}

          <div className="pb-[32px] px-[32px] pt-[8px]">
            {populated ? (
              viewMode === "grid" ? (
                <div className="composa-projects-tracks w-full">{children}</div>
              ) : (
                <div className="flex flex-col w-full">{children}</div>
              )
            ) : (
              <div className="flex flex-col gap-[8px] items-center justify-center min-h-[60vh] px-[32px] text-center">
                {statePanel}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
