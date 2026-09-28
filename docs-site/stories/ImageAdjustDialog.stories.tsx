import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/ImageAdjustDialog",
  parameters: {
    docs: {
      description: {
        component:
          "The crop-and-zoom step of the image-picker flow: a compact dialog that masks a chosen image to a circle (profile picture) or square (team icon) and emits the committed transform on Save.",
      },
    },
  },
  render: () => FIXTURES.ImageAdjustDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
