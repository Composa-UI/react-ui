import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/GitHubToolResultCard",
  parameters: {
    docs: {
      description: {
        component:
          "Connector result card for a completed GitHub tool call: a GitHub header, the tool name marked done with a brand-colored success check, and an optional result summary below.",
      },
    },
  },
  render: () => FIXTURES.GitHubToolResultCard(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
