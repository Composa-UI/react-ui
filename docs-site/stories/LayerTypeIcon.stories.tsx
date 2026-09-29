import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/LayerTypeIcon",
  parameters: {
    docs: {
      description: {
        component:
          "Canonical element-type glyph shown beside a layer in the Layers panel and the element timeline.",
      },
    },
  },
  render: () => FIXTURES.LayerTypeIcon(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
