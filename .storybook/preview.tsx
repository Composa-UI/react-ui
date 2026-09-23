import type { Preview, Decorator } from "@storybook/react-vite";
import { useEffect } from "storybook/preview-api";
// The real design-system styles: tokens (light + [data-composa-mode="dark"]),
// fonts, and the Tailwind c-* utilities the components render with — imported so
// stories resolve exactly as they do in the app and the docs previews.
import "../src/styles/index.css";
import { TooltipProvider } from "../src/components/ui3/Tooltip";
import { ComposaModeProvider } from "../src/components/ui3/useComposaMode";

// Toolbar globalType: flip data-composa-mode light/dark for every story.
const withComposaMode: Decorator = (Story, context) => {
  const mode = context.globals.composaMode as "light" | "dark";

  // Mirror the mode onto <html> too, so Radix overlays (menus, tooltips,
  // modals) that portal to document.body still resolve the right theme.
  useEffect(() => {
    const el = document.documentElement;
    if (mode === "dark") el.setAttribute("data-composa-mode", "dark");
    else el.removeAttribute("data-composa-mode");
  }, [mode]);

  return (
    <div
      data-composa-mode={mode === "dark" ? "dark" : undefined}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <ComposaModeProvider>
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      </ComposaModeProvider>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  globalTypes: {
    composaMode: {
      description: "Composa color mode",
      defaultValue: "light",
      toolbar: {
        title: "Mode",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withComposaMode],
};

export default preview;
