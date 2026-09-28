import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Actions/IconButton",
  parameters: {
    docs: { description: { component: "A compact 24px icon-only button for toolbar and panel actions." } },
  },
  render: () => FIXTURES.IconButton(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
