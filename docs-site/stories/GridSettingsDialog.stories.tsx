import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/GridSettingsDialog",
  parameters: {
    docs: {
      description: {
        component:
          "An anchored, non-modal inspector dialog for editing grid column/row tracks and secondary content alignment, floated beside the inspector rail.",
      },
    },
  },
  render: () => FIXTURES.GridSettingsDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
