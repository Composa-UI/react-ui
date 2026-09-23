// Story for Notification — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Overlays" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/Notification",
  parameters: {
    docs: { description: { component: "A toast: a dark pill with a leading icon + message and one or two stacked action buttons. Announced politely to assistive tech." } },
  },
  render: () => FIXTURES.Notification(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
