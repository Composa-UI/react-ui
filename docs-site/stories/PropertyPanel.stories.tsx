import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/PropertyPanel",
  parameters: {
    docs: {
      description: {
        component:
          "The capability-driven default inspector: renders the full, selection-aware property stack for the current mode — hosts pass data and callbacks, not sections.",
      },
    },
  },
  render: () => FIXTURES.PropertyPanel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
