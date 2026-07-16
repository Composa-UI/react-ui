import { type ReactNode } from "react";
import { clsx } from "clsx";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { PANEL_W } from "./Panel";
import { Tabs } from "./Tabs";

export type InspectorRailView = "inspector" | "agent";

export interface InspectorRailSwitcherProps {
  active: InspectorRailView;
  inspector: ReactNode;
  agent: ReactNode;
  onChange: (view: InspectorRailView) => void;
  className?: string;
}

/**
 * Canonical right-rail access seam. The host controls whether the inspector or
 * Agent is visible; each child retains ownership of its own internal navigation.
 */
export function InspectorRailSwitcher({
  active,
  inspector,
  agent,
  onChange,
  className,
}: InspectorRailSwitcherProps) {
  return (
    <aside
      aria-label="Inspector rail"
      className={clsx("h-full min-h-0 shrink-0 flex flex-col bg-c-bg ring-1 ring-inset ring-c-border-translucent", className)}
      style={{ width: PANEL_W }}
    >
      <div className="h-[36px] shrink-0 border-b border-c-border px-[8px] py-[6px]">
        <Tabs
          value={active}
          onChange={value => onChange(value as InspectorRailView)}
          tabs={[
            { value: "inspector", label: "Inspector", icon: <SlidersHorizontal size={14} strokeWidth={1.5} />, panelId: "composa-inspector-rail-panel" },
            { value: "agent", label: "Agent", icon: <Sparkles size={14} strokeWidth={1.5} />, panelId: "composa-agent-rail-panel" },
          ]}
        />
      </div>
      <div
        role="tabpanel"
        id={active === "agent" ? "composa-agent-rail-panel" : "composa-inspector-rail-panel"}
        aria-labelledby={`${active === "agent" ? "composa-agent-rail-panel" : "composa-inspector-rail-panel"}-tab`}
        className="min-h-0 flex-1"
      >
        {active === "agent" ? agent : inspector}
      </div>
    </aside>
  );
}
