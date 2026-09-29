import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/SlidesPanel",
  parameters: {
    docs: {
      description: {
        component:
          "The Compositions left-rail panel — a scrollable, data-driven list of slide thumbnails that drives slide selection, rename, and the new-slide action.",
      },
    },
  },
  render: () => FIXTURES.SlidesPanel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
