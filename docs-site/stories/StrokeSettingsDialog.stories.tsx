import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/StrokeSettingsDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal inspector dialog, anchored beside the inspector rail, for editing a selection's stroke style, join, and cap.",
      },
    },
  },
  render: () => FIXTURES.StrokeSettingsDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
