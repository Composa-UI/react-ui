import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/AutoLayoutSpacingIcon",
  parameters: {
    docs: {
      description: {
        component:
          "Decorative lead glyph that maps a Gap or Padding spacing dimension to its canonical Inspector/canvas icon.",
      },
    },
  },
  render: () => FIXTURES.AutoLayoutSpacingIcon(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
