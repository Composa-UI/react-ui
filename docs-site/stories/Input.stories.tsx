import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/Input",
  parameters: {
    docs: {
      description: {
        component:
          "Editable field for entering and editing a text value inline, with an optional label, hint, and inline affordances.",
      },
    },
  },
  render: () => FIXTURES.Input(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
