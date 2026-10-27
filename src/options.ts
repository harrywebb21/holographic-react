import { resolveShaderOptions, type HolographicSettings, type HolographicPattern } from "./shader.js";

export type HolographicColors = readonly [string] | readonly [string, string] | readonly [string, string, string];
export type HolographicEffectOptions = HolographicSettings & {
  effect?: HolographicPattern;
  colors?: HolographicColors;
};
export const fullFoilMap = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><path fill="white" d="M0 0h1v1H0z"/></svg>');

function color(value: string): [number, number, number] {
  if (!/^#[a-f0-9]{3}([a-f0-9]{3})?$/i.test(value)) throw new Error(`Invalid holographic colour: ${value}. Use #RGB or #RRGGBB.`);
  const expanded = value.length === 4 ? value.slice(1).split("").map(letter => letter + letter).join("") : value.slice(1);
  const hex = parseInt(expanded, 16);
  return [(hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255];
}
export function normalizeEffectOptions(options: HolographicEffectOptions = {}): Required<HolographicSettings> {
  const { effect, colors, ...advanced } = options;
  const resolved = resolveShaderOptions({ ...advanced, style: effect ?? advanced.style, interactive: advanced.interactive ?? true });
  if (colors) {
    if (colors.length < 1 || colors.length > 3) throw new Error("Use one, two or three holographic colours.");
    resolved.primaryColour = color(colors[0]);
    resolved.colourMode = colors.length === 3 ? "tritone" : colors.length === 2 ? "duotone" : "solid";
    if (colors[1]) resolved.secondaryColour = color(colors[1]);
    if (colors[2]) resolved.tertiaryColour = color(colors[2]);
  }
  return resolved;
}
