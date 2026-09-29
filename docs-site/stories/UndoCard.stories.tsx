import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/UndoCard",
  parameters: {
    docs: {
      description: {
        component:
          "Version-status card shown below an agent canvas edit: a state label plus a Secondary Undo/Redo toggle.",
      },
    },
  },
  render: () => FIXTURES.UndoCard(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
