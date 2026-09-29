import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/UserBubble",
  parameters: {
    docs: {
      description: {
        component:
          "Right-aligned user message in the Agent chat thread: a text bubble with an optional context chip above it and a 24px avatar to its right.",
      },
    },
  },
  render: () => FIXTURES.UserBubble(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
