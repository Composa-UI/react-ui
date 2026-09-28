import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/InspectorDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal floating inspector dialog: a draggable surface anchored to its trigger (or a named element) and portalled above the canvas, opening with a 40px title bar. Defaults to 320px wide.",
      },
    },
  },
  render: () => FIXTURES.InspectorDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
