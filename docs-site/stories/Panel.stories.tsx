import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/Panel",
  parameters: {
    docs: {
      description: {
        component:
          "The right-rail surface — a fixed-width bordered column that stacks the panel-section children it is given, top-to-bottom.",
      },
    },
  },
  render: () => FIXTURES.Panel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
