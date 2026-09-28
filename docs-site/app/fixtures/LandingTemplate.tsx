import { Github, Linkedin } from "lucide-react";
import { LandingTemplate } from "@/components/ui3/LandingTemplate";
import { Button } from "@/components/ui3/Button";
import { Tag } from "@/components/ui3/Tag";
import { IconButton } from "@/components/ui3/IconButton";

// The marketing shell with representative stub content in every slot: the media
// slot holds a neutral placeholder (the launch film's reserved frame), and the
// content well holds one copy-only value section.
export default function LandingTemplateFixture() {
  return (
    <LandingTemplate
      headerActions={
        <>
          <a href="#hero" data-landing-collapsible className="text-[14px] px-[8px] text-black no-underline">Log in</a>
          <Button label="Start composing" variant="Primary" onClick={() => undefined} />
          <IconButton label="GitHub" icon={<Github size={18} strokeWidth={1.5} />} onClick={() => undefined} />
        </>
      }
      beta={<Tag size="md">Public beta</Tag>}
      title="Composa"
      subtitle={
        <>
          <p className="m-0">Compose videos the way you build slides.</p>
          <p className="m-0 pt-[12px] text-[18px] text-black/55">It&rsquo;s like Figma met Keynote.</p>
        </>
      }
      heroActions={<Button label="Try Composa" variant="Primary" onClick={() => undefined} />}
      media={
        <div className="size-full grid place-items-center bg-gradient-to-br from-black/[0.04] to-black/[0.10] text-black/40 text-[13px]">
          Launch film goes here
        </div>
      }
      disclaimer="Not affiliated with Figma."
      footerSocials={
        <>
          <IconButton label="LinkedIn" icon={<Linkedin size={18} strokeWidth={1.5} />} onClick={() => undefined} />
          <IconButton label="GitHub" icon={<Github size={18} strokeWidth={1.5} />} onClick={() => undefined} />
        </>
      }
    >
      <div className="w-full max-w-[1320px] px-[24px] py-[80px]">
        <h2 className="font-['IBM_Plex_Sans',sans-serif] text-[32px] leading-[41.6px] tracking-[-0.32px] m-0 max-w-[540px]">
          Design and animate the scene. Compose the video.
        </h2>
        <p className="pt-[16px] text-[18px] leading-[25.2px] text-black/60 max-w-[540px] m-0">
          A copy-only value section — the host fills these; the template owns the rhythm around them.
        </p>
      </div>
    </LandingTemplate>
  );
}
