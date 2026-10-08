import { type ReactNode } from "react";
import { clsx } from "clsx";

export interface LandingTemplateProps {
  /** Header left — the brand mark. Defaults to a "Composa" wordmark. */
  brand?: ReactNode;
  /** Header right — the action row (links, CTA, repo icon). The host owns the
   *  auth-state swap here (signed-out "Log in · CTA · GitHub" vs. authenticated
   *  "Continue as… · Not you? · GitHub"). Mark the collapsible redundant link
   *  with `data-landing-collapsible` and it hides below a 368px header. */
  headerActions?: ReactNode;
  /** Small tag above the hero title (e.g. `<Tag>Public beta</Tag>`). */
  beta?: ReactNode;
  /** Hero headline (h1). */
  title: ReactNode;
  /** Hero sub-copy. */
  subtitle?: ReactNode;
  /** Hero CTA row (primary CTA + optional "Not you?"). */
  heroActions?: ReactNode;
  /** The one media slot at the top — a stable 1320:693 frame the launch film
   *  will occupy. Fill it with a neutral placeholder until the film exists;
   *  never put transport over an empty frame (landing-page spec, DEC-073). */
  media?: ReactNode;
  /** The value / capability / final-CTA / FAQ sections — copy-only content the
   *  host provides. The template owns the page rhythm around them. */
  children?: ReactNode;
  /** Centered line between the sections and the footer (e.g. the
   *  "Not affiliated with Figma" disclaimer). */
  disclaimer?: ReactNode;
  /** Footer left — the wordmark. */
  footerBrand?: ReactNode;
  /** Footer social row (LinkedIn · GitHub). */
  footerSocials?: ReactNode;
  className?: string;
}

const MAX = "w-full max-w-[1320px] px-[24px]";

/**
 * The public marketing-page shell (landing-page spec §2). A screen-shape
 * `template`: it owns the chrome — the scroll container that makes the header
 * sticky, the sticky header with its 368px login-collapse, the hero scaffold,
 * page rhythm, disclaimer, and footer — and takes content through slots. It
 * holds no product/auth/routing state; the host wires CTAs and fills copy.
 */
export function LandingTemplate({
  brand,
  headerActions,
  beta,
  title,
  subtitle,
  heroActions,
  media,
  children,
  disclaimer,
  footerBrand,
  footerSocials,
  className,
}: LandingTemplateProps) {
  return (
    // The scroll container is what pins the header: it owns the scrollport and
    // its child grows with content (`min-h-full`), so `sticky top-0` stays put.
    <div
      className={clsx("bg-c-bg overflow-y-auto overflow-x-hidden font-['Inter',sans-serif] text-c-text", className)}
      style={{ height: "100dvh", scrollBehavior: "smooth" }}
    >
      {/* container-query login-collapse: a viewport media query can't see the
          scrollbar width, so the redundant link hides against the header's own
          content box instead (landing-page spec, DEC-081). */}
      <style>{`@container landing-header (max-width: 368px){[data-landing-collapsible]{display:none}}`}</style>
      <div className="flex flex-col items-start w-full min-h-full">
        <header
          className="bg-c-bg flex items-center sticky top-0 z-20 shrink-0 w-full drop-shadow-[0px_1px_0px_rgba(0,0,0,0.16)]"
          style={{ containerType: "inline-size", containerName: "landing-header" }}
        >
          <div className="h-[78.391px] w-full max-w-[1345px] mx-auto px-[24px] flex items-center justify-between py-[16px]">
            <div className="font-['IBM_Plex_Sans',sans-serif] text-[20px] font-semibold tracking-[-0.4px]">
              {brand ?? "Composa"}
            </div>
            <div className="flex items-center gap-[8px] min-w-0">{headerActions}</div>
          </div>
        </header>

        <main className="w-full flex flex-col items-center">
          {/* Hero — beta tag, title, sub-copy, CTA, then the one media slot. */}
          <section className="w-full bg-c-bg pb-[32px]">
            <div className="flex flex-col gap-[64px] items-center pt-[64px] w-full">
              <div className={MAX}>
                <div className="max-w-[660px]">
                  {beta}
                  <h1 className="font-['IBM_Plex_Sans',sans-serif] text-[64px] sm:text-[86px] leading-[1.05] sm:leading-[81.7px] tracking-[-1.72px] m-0">
                    {title}
                  </h1>
                  {subtitle && <div className="pt-[32px] text-[24px] leading-[32.4px]">{subtitle}</div>}
                  {heroActions && <div className="pt-[40px] flex gap-[12px] items-center">{heroActions}</div>}
                </div>
              </div>
              {media && (
                <div className={MAX}>
                  <div className="aspect-[1320/693] w-full overflow-clip rounded-[12px] shadow-[0px_0px_9.697px_0px_rgba(0,0,0,0.16)]">
                    {media}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Value / capability / final-CTA / FAQ — host-provided content. */}
          {children}

          {disclaimer && (
            <div className={clsx(MAX, "pb-[120px]")}>
              <p className="text-[16px] leading-[23.2px] text-c-text-secondary text-center m-0">{disclaimer}</p>
            </div>
          )}
        </main>

        <footer className="w-full pt-[121px] pb-[120px] border-t border-c-border">
          <div className={clsx(MAX, "mx-auto")}>
            <div className="font-['IBM_Plex_Sans',sans-serif] text-[20px] font-semibold tracking-[-0.4px]">
              {footerBrand ?? "Composa"}
            </div>
            {footerSocials && <div className="flex items-center gap-[8px] pt-[32px] max-w-[390px]">{footerSocials}</div>}
          </div>
        </footer>
      </div>
    </div>
  );
}
