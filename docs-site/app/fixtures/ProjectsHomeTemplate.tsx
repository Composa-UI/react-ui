import { useState } from "react";
import { Search } from "lucide-react";
import { ProjectsHomeTemplate, type ProjectsViewMode } from "@/components/ui3/ProjectsHomeTemplate";
import { Button } from "@/components/ui3/Button";
import { SegmentedControl } from "@/components/ui3/SegmentedControl";

const NAV = ["Recents", "Drafts", "All projects", "Trash"];
const CARDS = ["Product launch", "Q3 recap", "Onboarding flow", "Brand system", "Explainer", "Teaser cut"];

function SidebarStub() {
  return (
    <div className="flex flex-col h-full p-[8px] gap-[2px]">
      <div className="h-[40px] flex items-center px-[8px] text-[13px] font-[550] text-c-text">Just me</div>
      <div className="h-[24px] mx-[4px] mb-[6px] rounded-c-md bg-c-bg-secondary flex items-center gap-[6px] px-[8px]">
        <Search size={13} strokeWidth={1.5} className="text-c-icon shrink-0" />
        <span className="text-[11px] text-c-text-tertiary">Search</span>
      </div>
      {NAV.map((n, i) => (
        <div
          key={n}
          className={
            "h-[28px] rounded-[5px] flex items-center px-[8px] text-[13px] " +
            (i === 0 ? "bg-c-bg-selected text-c-text" : "text-c-text-secondary hover:bg-c-bg-hover")
          }
        >
          {n}
        </div>
      ))}
      <div className="flex-1" />
      <div className="px-[8px] py-[6px] text-[13px] font-[550] text-c-text">Composa</div>
    </div>
  );
}

function ProjectCard({ name }: { name: string }) {
  return (
    <div className="flex flex-col">
      <div className="relative aspect-[16/9] rounded-[13px] bg-c-bg-secondary">
        <div aria-hidden className="absolute inset-0 rounded-[13px] border border-c-border pointer-events-none" />
      </div>
      <div className="pt-[12px] text-[13px] font-[550] text-c-text truncate">{name}</div>
      <div className="text-[11px] text-c-text-secondary">Edited 2 days ago</div>
    </div>
  );
}

export default function ProjectsHomeTemplateFixture() {
  const [view, setView] = useState<ProjectsViewMode>("grid");
  return (
    <div style={{ height: 520 }}>
      <ProjectsHomeTemplate
        sidebar={<SidebarStub />}
        title="Recents"
        headerActions={<Button label="Compose new video" variant="Primary" size="large" onClick={() => undefined} />}
        toolbar={
          <SegmentedControl
            ariaLabel="View mode"
            value={view}
            onChange={v => setView(v as ProjectsViewMode)}
            segments={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]}
          />
        }
        viewMode={view}
        stateKind="populated"
      >
        {CARDS.map(name => <ProjectCard key={name} name={name} />)}
      </ProjectsHomeTemplate>
    </div>
  );
}
