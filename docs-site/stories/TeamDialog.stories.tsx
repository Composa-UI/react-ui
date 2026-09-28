import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/TeamDialog",
  parameters: {
    docs: {
      description: {
        component:
          "The workspace/team management dialog: a tabbed modal for viewing members and their roles (Members) and editing the team name and description (Settings).",
      },
    },
  },
  render: () => FIXTURES.TeamDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
