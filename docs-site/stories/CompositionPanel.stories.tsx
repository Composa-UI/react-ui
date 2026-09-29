import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/CompositionPanel",
  parameters: {
    docs: {
      description: {
        component:
          "The default left-rail content: a draggable vertical split of the Slides list over the Layers tree.",
      },
    },
  },
  render: () => FIXTURES.CompositionPanel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
