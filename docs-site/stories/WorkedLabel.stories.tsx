import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/WorkedLabel",
  parameters: {
    docs: {
      description: {
        component:
          'Agent work indicator above a response: animated "Thinking…" while running, then an expandable "Worked for {seconds}" that reveals the reasoning steps.',
      },
    },
  },
  render: () => FIXTURES.WorkedLabel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
