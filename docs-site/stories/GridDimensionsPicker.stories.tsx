import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/GridDimensionsPicker",
  parameters: {
    docs: {
      description: {
        component:
          "A compact grid face that opens a popover to edit column and row tracks — the Figma-style dimensions picker, not a second Inspector section or dialog.",
      },
    },
  },
  render: () => FIXTURES.GridDimensionsPicker(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
