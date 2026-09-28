import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/AutoLayoutSettingsDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal inspector dialog, docked beside the inspector rail, holding an auto-layout frame's three secondary settings: stroke inclusion, canvas stacking, and text-baseline alignment.",
      },
    },
  },
  render: () => FIXTURES.AutoLayoutSettingsDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
