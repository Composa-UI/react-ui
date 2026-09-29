import type { Meta, StoryObj } from "@storybook/react-vite";

import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/Chit",
  parameters: {
    docs: {
      description: {
        component:
          "Fixed 24px swatch that previews a fill's paint — solid color, opacity, gradient, image, or video — always on the light inspector surface.",
      },
    },
  },
  render: () => FIXTURES.Chit(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
