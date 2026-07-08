// HSB(V) ↔ hex conversions shared by the ColorDialog picker and consumers
// (composa-editor seeds the dialog from stored hex; the picker commits hex).
// Hex values are 6-char, UPPERCASE, WITHOUT the leading # (dialog convention).

export function hsbToHex(hue: number, saturation: number, brightness: number): string {
  const h = ((hue % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const v = Math.max(0, Math.min(100, brightness)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];

  const toByte = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `${toByte(r1)}${toByte(g1)}${toByte(b1)}`.toUpperCase();
}

export function hexToHsb(hex: string): { brightness: number; hue: number; saturation: number } {
  const clean = hex.replace(/^#/, "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  if ([r, g, b].some(Number.isNaN)) return { brightness: 100, hue: 0, saturation: 0 };

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  hue = ((hue % 360) + 360) % 360;

  return {
    brightness: Math.round(max * 100),
    hue: Math.round(hue),
    saturation: Math.round(max === 0 ? 0 : (delta / max) * 100),
  };
}
