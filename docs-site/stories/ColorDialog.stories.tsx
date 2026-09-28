import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/ColorDialog",
  parameters: {
    docs: {
      description: {
        component:
          "The shared color/fill picker: a non-modal inspector dialog for authoring a solid color, gradient, image, video, or drop-zone fill, anchored to the swatch that opened it.",
      },
    },
  },
  render: () => FIXTURES.ColorDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
