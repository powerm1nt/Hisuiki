const DARK_CHROME_LUMINANCE = 0.02;
const MAX_UNSCRIMMED_LUMINANCE = 0.1833;
const MAX_PEAK_LUMINANCE = 0.3;
const LUMINANCE_GRID = 6;
const SCRIM_BOOST = 0.1;
const LUMINANCE_PERCENTILE = 0.97;

export interface PaletteSample {
  hue: number;
  saturation: number;
  luminance: number;
  peakLuminance: number;
}

export function setCssVars(vars: Record<string, string>): void {
  const root = document.documentElement.style;
  for (const [key, value] of Object.entries(vars)) root.setProperty(key, value);
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function luminanceChannel(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * luminanceChannel(r / 255) +
    0.7152 * luminanceChannel(g / 255) +
    0.0722 * luminanceChannel(b / 255)
  );
}

const contrastRatio = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  const m = l - c / 2;
  const r = Math.round((rgb[0] + m) * 255);
  const g = Math.round((rgb[1] + m) * 255);
  const b = Math.round((rgb[2] + m) * 255);
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return { hex, r, g, b };
}

const hsl = (hue: number, saturation: number, lightness: number): string =>
  hslToRgb(hue, saturation, lightness).hex;

function ensureContrast(
  hue: number,
  saturation: number,
  lightness: number,
  backgroundLuminance: number,
  minContrast: number,
): string {
  let l = lightness;
  for (let i = 0; i < 30; i++) {
    const { hex, r, g, b } = hslToRgb(hue, saturation, l);
    if (
      contrastRatio(relativeLuminance(r, g, b), backgroundLuminance) >=
        minContrast ||
      l >= 0.97
    ) {
      return hex;
    }
    l += 0.02;
  }
  return hslToRgb(hue, saturation, l).hex;
}

function toRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildPaletteVars(
  hue: number,
  intensity: number,
): Record<string, string> {
  const scale = (base: number) =>
    clamp(base * (0.6 + 0.4 * intensity), 0.15, 0.85);
  const accent = ensureContrast(
    hue,
    scale(0.68),
    0.6,
    DARK_CHROME_LUMINANCE,
    3.0,
  );
  const accentStrong = ensureContrast(
    hue,
    scale(0.72),
    0.69,
    DARK_CHROME_LUMINANCE,
    4.5,
  );

  return {
    "--color-accent": accent,
    "--color-accent-strong": accentStrong,
    "--color-accent-soft": toRgba(accent, 0.16),
    "--color-accent-muted": hsl(hue, scale(0.49), 0.44),
    "--color-text-secondary": ensureContrast(
      hue,
      scale(0.64),
      0.88,
      DARK_CHROME_LUMINANCE,
      4.5,
    ),
    "--color-text-muted": ensureContrast(
      hue,
      scale(0.4),
      0.73,
      DARK_CHROME_LUMINANCE,
      4.5,
    ),
    "--color-text-faint": ensureContrast(
      hue,
      scale(0.25),
      0.53,
      DARK_CHROME_LUMINANCE,
      3.0,
    ),
    "--color-surface": hsl(hue, clamp(scale(0.2), 0.05, 0.22), 0.1),
    "--color-surface-veil": toRgba(hsl(hue, scale(0.6), 0.118), 0.55),
  };
}

function computeScrimOpacity(
  meanLuminance: number,
  peakLuminance: number,
): number {
  const forMean =
    meanLuminance <= MAX_UNSCRIMMED_LUMINANCE
      ? 0
      : 1 - MAX_UNSCRIMMED_LUMINANCE / meanLuminance;
  const forPeak =
    peakLuminance <= MAX_PEAK_LUMINANCE
      ? 0
      : 1 - MAX_PEAK_LUMINANCE / peakLuminance;

  const needed = Math.max(forMean, forPeak);

  if (needed === 0) return 0;
  return clamp(needed + SCRIM_BOOST, 0, 0.82);
}

function samplePixels(
  img: HTMLImageElement,
  sampleSize: number,
): PaletteSample | null {
  try {
    const scale = Math.min(
      1,
      sampleSize / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let sumSin = 0;
    let sumCos = 0;
    let weight = 0;
    let sumLuminance = 0;
    let opaqueCount = 0;

    const cells = LUMINANCE_GRID * LUMINANCE_GRID;
    const cellLuminance = new Float64Array(cells);
    const cellCount = new Uint32Array(cells);

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! < 128) continue; // skip transparent pixels
      const r = data[i]! / 255;
      const g = data[i + 1]! / 255;
      const b = data[i + 2]! / 255;

      const pixelLuminance =
        0.2126 * luminanceChannel(r) +
        0.7152 * luminanceChannel(g) +
        0.0722 * luminanceChannel(b);
      sumLuminance += pixelLuminance;
      opaqueCount++;

      const pixel = i >> 2;
      const column = Math.min(
        LUMINANCE_GRID - 1,
        (((pixel % canvas.width) * LUMINANCE_GRID) / canvas.width) | 0,
      );
      const row = Math.min(
        LUMINANCE_GRID - 1,
        ((((pixel / canvas.width) | 0) * LUMINANCE_GRID) / canvas.height) | 0,
      );
      const cell = row * LUMINANCE_GRID + column;
      cellLuminance[cell] = cellLuminance[cell]! + pixelLuminance;
      cellCount[cell] = cellCount[cell]! + 1;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      if (l < 0.08 || l > 0.92) continue; // skip near-black/near-white
      const d = max - min;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      if (s < 0.15) continue; // skip near-neutral pixels

      let h: number;
      if (d === 0) h = 0;
      else if (max === r) h = 60 * (((((g - b) / d) % 6) + 6) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);

      const rad = (h * Math.PI) / 180;
      sumSin += Math.sin(rad) * s;
      sumCos += Math.cos(rad) * s;
      weight += s;
    }

    if (opaqueCount === 0) return null;
    const luminance = sumLuminance / opaqueCount;

    const regions: number[] = [];
    for (let cell = 0; cell < cellCount.length; cell++) {
      if (cellCount[cell]! > 0)
        regions.push(cellLuminance[cell]! / cellCount[cell]!);
    }
    regions.sort((a, b) => a - b);

    const peakLuminance =
      regions.length > 0
        ? regions[
            Math.min(
              regions.length - 1,
              Math.round(LUMINANCE_PERCENTILE * (regions.length - 1)),
            )
          ]!
        : luminance;

    if (weight === 0) {
      // Greyscale photo: no hue to report, but the luminance still matters.
      return { hue: 0, saturation: 0, luminance, peakLuminance };
    }

    let hue = (Math.atan2(sumSin, sumCos) * 180) / Math.PI;
    if (hue < 0) hue += 360;
    return {
      hue,
      saturation: Math.min(1, weight / (data.length / 4)),
      luminance,
      peakLuminance,
    };
  } catch {
    return null;
  }
}

export function extractDominant(
  source: string | HTMLImageElement,
  sampleSize = 48,
): Promise<PaletteSample | null> {
  if (typeof source !== "string")
    return Promise.resolve(samplePixels(source, sampleSize));

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onerror = () => resolve(null);
    img.onload = () => resolve(samplePixels(img, sampleSize));

    img.src = source;
  });
}

let generation = 0;

export async function applyPaletteFrom(
  source: string | HTMLImageElement,
): Promise<number | null> {
  const current = ++generation;

  const sample = await extractDominant(source);
  if (!sample || current !== generation) return null;

  setCssVars(buildPaletteVars(sample.hue, sample.saturation));

  return computeScrimOpacity(sample.luminance, sample.peakLuminance);
}
