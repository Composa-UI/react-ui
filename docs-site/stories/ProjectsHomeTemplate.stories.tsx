import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Templates/ProjectsHomeTemplate",
  parameters: {
    docs: { description: { component: "The authenticated pre-editor file surface: a two-pane shell whose collection shows at most five cards per row." } },
  },
  render: () => FIXTURES.ProjectsHomeTemplate(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
