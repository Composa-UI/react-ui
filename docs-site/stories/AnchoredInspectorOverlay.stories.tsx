import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/AnchoredInspectorOverlay",
  parameters: {
    docs: {
      description: {
        component:
          "The shared anchored-overlay boundary on Radix Popover: it captures the launch rect before mounting, then portals a positioned, edge-aware, optionally draggable/resizable surface. Modal by default; defaults to 240px wide, side=\"left\".",
      },
    },
  },
  render: () => FIXTURES.AnchoredInspectorOverlay(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
