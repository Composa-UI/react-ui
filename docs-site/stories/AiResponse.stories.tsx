import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/AiResponse",
  parameters: {
    docs: {
      description: {
        component:
          "An agent response in the chat thread: left-aligned message body with a trailing thumbs up/down rating bar.",
      },
    },
  },
  render: () => FIXTURES.AiResponse(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
