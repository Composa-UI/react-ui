import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/MultiChoiceCard",
  parameters: {
    docs: {
      description: {
        component:
          "An inline single-select choice card for an agent response: pick one lettered option and it highlights in place.",
      },
    },
  },
  render: () => FIXTURES.MultiChoiceCard(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
