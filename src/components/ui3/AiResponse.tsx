import type { ReactNode } from "react";
import { clsx } from "clsx";
import { RatingBar, type RatingBarProps } from "./RatingBar";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── AiResponse ───────────────────────────────────────────────────────────────
// An agent response body with a trailing RatingBar. Pass inline content as
// children (bold, spans, links, etc.). In PR2 the message renderer feeds this
// AgentMarkdown output; here it renders whatever children it's given.

export interface AiResponseProps {
  children: ReactNode;
  /** Hide the trailing rating bar (e.g. streaming responses). */
  rating?: boolean;
  ratingProps?: RatingBarProps;
  className?: string;
}

export function AiResponse({ children, rating = true, ratingProps, className }: AiResponseProps) {
  return (
    <div className={clsx("flex flex-col items-start", className)}>
      <div className={clsx(FONT, "w-full text-[13px] leading-[20px] font-[450] tracking-[-0.032px] text-c-text")}>
        {children}
      </div>
      {rating && <RatingBar {...ratingProps} />}
    </div>
  );
}
