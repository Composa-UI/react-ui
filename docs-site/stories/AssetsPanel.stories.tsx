import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/AssetsPanel",
  parameters: {
    docs: {
      description: {
        component:
          "The Assets left-rail panel — a per-project media library to browse, filter, search, and insert uploaded images, video, and audio.",
      },
    },
  },
  render: () => FIXTURES.AssetsPanel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
