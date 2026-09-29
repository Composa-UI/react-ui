import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/SlideInspector",
  parameters: {
    docs: {
      description: {
        component:
          "The slides-mode right rail: a fixed multiplayer/tabs header and slide-title bar over a scrolling Template style + Background stack.",
      },
    },
  },
  render: () => FIXTURES.SlideInspector(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
