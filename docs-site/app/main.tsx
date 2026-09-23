import { createRoot } from "react-dom/client";
// The real design-system styles: tokens (light + [data-composa-mode="dark"]),
// fonts, and the Tailwind c-* utilities the components render with. Imported so
// the live previews resolve exactly as they do in the app.
import "@/styles/index.css";
import "./docs.css";
import App from "./App";
import { TooltipProvider } from "@/components/ui3/Tooltip";
import { ComposaModeProvider } from "@/components/ui3/useComposaMode";

createRoot(document.getElementById("root")!).render(
  <ComposaModeProvider>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </ComposaModeProvider>,
);
