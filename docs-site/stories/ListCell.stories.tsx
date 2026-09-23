// Story for ListCell — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Lists" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Lists/ListCell",
  parameters: {
    docs: { description: { component: "A mode-adaptive list / inspector row: a leading slot, label + sublabel, a trailing slot, and a shortcut. Interactive (role=button) when onClick is set. For menu surfaces use MenuRow." } },
  },
  render: () => FIXTURES.ListCell(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
