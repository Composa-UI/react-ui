import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/ShareModal",
  parameters: {
    docs: {
      description: {
        component:
          "A standard-width share dialog: invite people by email, set the access scope, and manage each person's role; an optional stacked card exposes Export.",
      },
    },
  },
  render: () => FIXTURES.ShareModal(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
