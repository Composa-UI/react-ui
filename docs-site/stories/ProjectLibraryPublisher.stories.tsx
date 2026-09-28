import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/ProjectLibraryPublisher",
  parameters: {
    docs: {
      description: {
        component:
          "A modal that publishes selected project content — compositions, images, video, and audio — to the versioned project library, as a new item or a new version of an existing one.",
      },
    },
  },
  render: () => FIXTURES.ProjectLibraryPublisher(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
