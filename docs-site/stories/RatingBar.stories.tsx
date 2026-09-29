import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/RatingBar",
  parameters: {
    docs: {
      description: {
        component:
          "Thumbs up/down vote control for rating an AI response, with a trailing info affordance.",
      },
    },
  },
  render: () => FIXTURES.RatingBar(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
