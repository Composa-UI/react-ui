import { createRoot } from "react-dom/client";
import Playground from "./playground";
import "./styles/index.css";
import { TooltipProvider } from "./components/ui3/Tooltip";
import { ComposaModeProvider } from "./components/ui3/useComposaMode";

createRoot(document.getElementById("root")!).render(<ComposaModeProvider><TooltipProvider><Playground /></TooltipProvider></ComposaModeProvider>);
