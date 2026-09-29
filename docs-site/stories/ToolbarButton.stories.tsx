import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Actions/ToolbarButton",
  parameters: {
    docs: {
      description: {
        component:
          "Compact icon-only toolbar control that triggers an action or reflects a toggled-on state.",
      },
    },
  },
  render: () => FIXTURES.ToolbarButton(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
