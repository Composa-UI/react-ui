import type { Meta, StoryObj } from "@storybook/react-vite";

import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/Avatar",
  parameters: {
    docs: {
      description: {
        component:
          "Small identity atom that shows a user or workspace as initials, photo, org icon, or a +N overflow badge, with optional multiplayer presence status.",
      },
    },
  },
  render: () => FIXTURES.Avatar(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
