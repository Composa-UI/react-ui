import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/DeleteConfirmDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A small danger-confirm dialog: a title, one message line, and a right-aligned Cancel + red Destructive confirm for irreversible actions.",
      },
    },
  },
  render: () => FIXTURES.DeleteConfirmDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
