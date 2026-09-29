import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/ExportDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal inspector dialog, docked beside the inspector rail, holding a target's saved export settings: filename suffix, color profile, image resampling, and overlapping-layer handling.",
      },
    },
  },
  render: () => FIXTURES.ExportDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
