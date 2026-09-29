import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Feedback/GitHubPermissionCard",
  parameters: {
    docs: {
      description: {
        component:
          "Connector permission card for a pending GitHub tool call: shows the request JSON with Run / Always run / Cancel, then collapses to a decided summary row.",
      },
    },
  },
  render: () => FIXTURES.GitHubPermissionCard(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
