// Live preview fixture for Waveform — the presentational bar-waveform that stands
// in as the visual for an audio asset (e.g. an audio thumbnail in the Assets
// panel), where a flat colour swatch would read wrong for sound. Renders the REAL
// component as the annotation's own example: deterministic bars derived from a
// stable `seed` (the asset id/name), stretched to fill a sized thumbnail box.
// Colour comes from `currentColor`, so the bars inherit the c-* text token on the
// wrapper — tokens only, no hardcoded colors.
import { Waveform } from "@/components/ui3/Waveform";

export default function WaveformFixture() {
  return (
    <div
      style={{
        display: "flex",
        width: 220,
        height: 72,
        padding: "12px 14px",
        borderRadius: 8,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
      }}
    >
      <Waveform seed="audio-track-01.wav" className="text-c-icon-secondary" />
    </div>
  );
}
