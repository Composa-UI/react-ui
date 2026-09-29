import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Templates/LandingTemplate",
  parameters: {
    docs: { description: { component: "The public marketing-page shell: sticky header, a hero with one media slot, a content well, and a footer." } },
  },
  render: () => FIXTURES.LandingTemplate(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
