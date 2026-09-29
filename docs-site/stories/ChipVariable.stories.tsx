import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/ChipVariable",
  parameters: {
    docs: {
      description: {
        component:
          "Compact read-only chip that shows a variable value bound into an inspector input, with an optional detach control.",
      },
    },
  },
  render: () => FIXTURES.ChipVariable(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
