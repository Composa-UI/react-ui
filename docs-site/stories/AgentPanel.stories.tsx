import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/AgentPanel",
  parameters: {
    docs: {
      description: {
        component:
          "The Agent left-rail panel: a searchable conversation list that drills into a single streaming message thread with a context-aware composer.",
      },
    },
  },
  render: () => FIXTURES.AgentPanel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
