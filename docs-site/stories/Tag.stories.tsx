import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/Tag",
  parameters: {
    docs: {
      description: {
        component:
          "A short status word on a tinted surface, such as Beta, New, or Public beta.",
      },
    },
  },
  render: () => FIXTURES.Tag(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
