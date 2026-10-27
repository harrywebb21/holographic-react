export type HolographicPattern = "rainbow" | "glitter" | "prismatic" | "chrome" | "stars" | "waves" | "rings" | "ice" | "brushed" | "aurora" | "confetti" | "guilloche" | "hex" | "liquid" | "cyberpunk" | "splatter";
export type HolographicHighlight = "soft-band" | "soft-glow" | "streak" | "spotlight" | "cross" | "double" | "none";
export type HolographicColourMode = "spectrum" | "duotone" | "solid" | "tritone";

export interface HolographicShaderOptions {
  element: HTMLElement;
  interactionElement?: HTMLElement;
  foilMap: string;
  maskMode?: "alpha" | "luminance";
  intensity?: number;
  speed?: number;
  scale?: number;
  splatterDroplets?: number;
  splatterSize?: number;
  scanlineDensity?: number;
  glitchStrength?: number;
  edgeSoftness?: number;
  effectStrength?: number;
  sparkleSize?: number;
  brightness?: number;
  saturation?: number;
  density?: number;
  highlightWidth?: number;
  highlightStyle?: HolographicHighlight;
  highlightAngle?: number;
  highlightSoftness?: number;
  highlightIntensity?: number;
  diffractionFrequency?: number;
  waveCurvature?: number;
  sparkleDensity?: number;
  contrast?: number;
  rotation?: number;
  maskInvert?: boolean;
  maskOffsetY?: number;
  maskOffsetX?: number;
  maskScale?: number;
  iridescence?: number;
  diffraction?: number;
  microNoise?: number;
  specular?: number;
  fresnel?: number;
  vignetteIntensity?: number;
  hueStart?: number;
  hueRange?: number;
  colourMode?: HolographicColourMode;
  primaryColour?: [number, number, number];
  secondaryColour?: [number, number, number];
  tertiaryColour?: [number, number, number];
  style?: HolographicPattern;
  interactive?: boolean;
  autoResize?: boolean;
  reducedMotion?: boolean;
}

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_foil;
  uniform vec2 u_pointer;
  uniform float u_time;
  uniform float u_intensity;
  uniform float u_scale;
  uniform float u_splatterDroplets;
  uniform float u_splatterSize;
  uniform float u_scanlineDensity;
  uniform float u_glitchStrength;
  uniform float u_edgeSoftness;
  uniform float u_effectStrength;
  uniform float u_sparkleSize;
  uniform float u_brightness;
  uniform float u_saturation;
  uniform float u_density;
  uniform float u_highlightWidth;
  uniform float u_highlightStyle;
  uniform float u_highlightAngle;
  uniform float u_highlightSoftness;
  uniform float u_highlightIntensity;
  uniform float u_diffractionFrequency;
  uniform float u_waveCurvature;
  uniform float u_sparkleDensity;
  uniform float u_contrast;
  uniform float u_rotation;
  uniform float u_maskInvert;
  uniform float u_maskOffsetY;
  uniform float u_maskOffsetX;
  uniform float u_maskScale;
  uniform float u_iridescence;
  uniform float u_diffraction;
  uniform float u_micro_noise;
  uniform float u_specular;
  uniform float u_fresnel;
  uniform float u_vignetteIntensity;
  uniform float u_hue_start;
  uniform float u_hue_range;
  uniform float u_colour_mode;
  uniform vec3 u_colour_primary;
  uniform vec3 u_colour_secondary;
  uniform vec3 u_colour_tertiary;
  uniform float u_style;
  uniform float u_mask_mode;
  uniform vec2 u_resolution;
  uniform vec2 u_texture_size;

  vec3 hsv2rgb(vec3 c) {
    vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
    return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
  }

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec3 foilPalette(float phase) {
    // Every palette closes its loop with zero slope at each blend stop.
    // Otherwise fract() jumps from the last colour to the first as time advances.
    float cycle = fract(phase);
    float blend = 0.5 - 0.5 * cos(cycle * 6.2831853);
    float spectrumPhase = u_hue_range > 0.999 ? cycle : blend;
    float rangedHue = fract(u_hue_start + spectrumPhase * u_hue_range);
    vec3 spectrum = hsv2rgb(vec3(rangedHue, 0.78, 1.0));
    if (u_colour_mode > 0.5 && u_colour_mode < 1.5) {
      return mix(u_colour_primary, u_colour_secondary, blend);
    }
    if (u_colour_mode > 2.5) {
      float segment = cycle * 3.0;
      float weight = 0.5 - 0.5 * cos(fract(segment) * 3.14159265);
      if (segment < 1.0) return mix(u_colour_primary, u_colour_secondary, weight);
      if (segment < 2.0) return mix(u_colour_secondary, u_colour_tertiary, weight);
      return mix(u_colour_tertiary, u_colour_primary, weight);
    }
    if (u_colour_mode > 1.5) return u_colour_primary;
    return spectrum;
  }

  void main() {
    float surfaceAspect = u_resolution.x / max(u_resolution.y, 1.0);
    float textureAspect = u_texture_size.x / max(u_texture_size.y, 1.0);
    vec2 maskUv = v_uv;
    if (surfaceAspect > textureAspect) {
      maskUv.y = (maskUv.y - 0.5) * (textureAspect / surfaceAspect) + 0.5;
    } else {
      maskUv.x = (maskUv.x - 0.5) * (surfaceAspect / textureAspect) + 0.5;
    }
    maskUv = (maskUv - 0.5) * u_maskScale + 0.5 - vec2(u_maskOffsetX, u_maskOffsetY);
    float maskBounds = step(0.0, maskUv.x) * step(maskUv.x, 1.0) * step(0.0, maskUv.y) * step(maskUv.y, 1.0);
    vec2 centered = (v_uv - 0.5) * vec2(surfaceAspect, 1.0);
    float rotation = u_rotation * 0.0174532925;
    centered = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation)) * centered;
    vec2 uv = centered / vec2(surfaceAspect, 1.0) * u_scale + 0.5;
    vec2 detailUv = (uv - 0.5) * u_density + 0.5;
    vec4 foil = texture2D(u_foil, maskUv);
    vec2 tiltVector = (u_pointer - 0.5) * 2.0;
    float directionalShift = dot(v_uv - 0.5, tiltVector);
    float tilt = clamp(length(u_pointer - 0.5) * 2.0, 0.0, 1.0);
    float motion = u_time * 0.045;
    // Keep the base phase unwrapped. Wrapping before scaling creates moving seams
    // in effects that use only part of the colour cycle; atan also has a branch cut.
    float rawHue = (
      dot(uv - 0.5, vec2(0.62, 0.38)) + 0.5 + motion
    );
    float hue = fract(u_hue_start + rawHue * u_hue_range);

    // Distinct foil foundations, selected without changing existing pattern values.
    vec3 rainbowBase = foilPalette(rawHue);

    vec2 glitterCell = floor(detailUv * vec2(150.0, 190.0) * u_sparkleDensity);
    float glitterSeed = hash21(glitterCell);
    float glitterPulse = 0.5 + 0.5 * sin(u_time * 2.2 + glitterSeed * 35.0);
    float glitterSpark = pow(glitterSeed * glitterPulse, 18.0 / u_sparkleSize);
    vec3 glitterTint = foilPalette(fract(glitterSeed + rawHue * 0.18));
    vec3 glitterBase = vec3(0.58, 0.61, 0.67) + glitterTint * glitterSpark * 2.8;

    vec2 facetGrid = floor((detailUv + vec2(detailUv.y * 0.45, 0.0)) * vec2(10.0, 14.0));
    float facetSeed = hash21(facetGrid);
    float facetEdge = abs(fract((detailUv.x + detailUv.y * 0.7) * 11.0) - 0.5);
    float facetLight = mix(0.46, 1.18, facetSeed) + smoothstep(0.46, 0.5, facetEdge) * 0.35;
    vec3 prismaticBase = foilPalette(fract(rawHue * 0.32 + facetSeed * 0.76)) * facetLight;

    float chromeSweep = dot(uv - 0.5, normalize(vec2(0.35, 0.94))) + directionalShift * 0.55;
    float chromeBand = 0.24 + 0.76 * pow(0.5 + 0.5 * sin(chromeSweep * 13.0 * u_density - u_time * 0.32), 3.0);
    vec3 chromeTint = u_colour_mode > 0.5 ? foilPalette(rawHue) : vec3(0.92, 0.98, 1.06);
    vec3 chromeBase = chromeTint * chromeBand;

    vec3 baseColour = rainbowBase;
    if (u_style > 0.5 && u_style < 1.5) baseColour = glitterBase;
    if (u_style > 1.5 && u_style < 2.5) baseColour = prismaticBase;
    if (u_style > 2.5 && u_style < 3.5) baseColour = chromeBase;

    if (u_style > 3.5 && u_style < 4.5) {
      // Fixed, staggered foil stamps; only their reflections move with the light.
      vec2 starUv = (detailUv - 0.5) * vec2(surfaceAspect, 1.0) * 15.0 * u_sparkleDensity;
      starUv.x += mod(floor(starUv.y), 2.0) * 0.5;
      vec2 starCell = floor(starUv);
      float seed = hash21(starCell);
      vec2 starPoint = fract(starUv) - 0.5;
      float rotation = seed * 6.2831853;
      starPoint = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation)) * starPoint;
      float starAngle = atan(starPoint.y, starPoint.x);
      float sector = mod(starAngle + 1.5707963, 1.2566371) - 0.6283185;
      float radius = (0.13 + 0.12 * seed) * u_sparkleSize;
      float boundary = radius * 0.38 / max(cos(sector) - 1.15 * abs(sin(sector)), 0.15);
      float edge = max(0.008, 15.0 * u_scale * u_density * u_sparkleDensity * u_edgeSoftness / max(u_resolution.y, 1.0));
      float star = 1.0 - smoothstep(boundary - edge, boundary + edge, length(starPoint));
      float reflection = pow(0.5 + 0.5 * sin(seed * 23.0 + directionalShift * 14.0 + u_time * 0.8), 4.0);
      vec3 starTint = foilPalette(fract(rawHue + seed * 0.6));
      baseColour = rainbowBase * 0.28 + star * (starTint * (0.65 + reflection) + vec3(reflection * 0.7));
    }

    if (u_style > 4.5 && u_style < 5.5) {
      // Curved diagonal ribbons with sharp reflective edges and offset spectra.
      vec2 waveUv = (detailUv - 0.5) * vec2(surfaceAspect, 1.0);
      float curve = sin(waveUv.x * 7.0 + waveUv.y * 2.5) * 0.14 * u_waveCurvature;
      float sweep = (waveUv.x * 0.8 + waveUv.y + curve) * 9.0;
      float phase = fract(sweep + directionalShift * 1.8 + u_time * 0.12);
      float ribbon = smoothstep(0.08, 0.3, phase) * (1.0 - smoothstep(0.65, 0.92, phase));
      float slice = pow(max(0.0, 1.0 - abs(phase - 0.3) * 24.0), 3.0);
      float colourPhase = fract(sweep + u_time * 0.12);
      vec3 waveTint = foilPalette(fract(rawHue + floor(sweep) * 0.13 + colourPhase * 0.45));
      baseColour = waveTint * (0.22 + ribbon * 0.9) + vec3(0.9, 0.96, 1.0) * slice * 0.9;
    }

    if (u_style > 5.5 && u_style < 6.5) {
      vec2 ringUv = (detailUv - 0.5) * vec2(surfaceAspect, 1.0);
      float rings = length(ringUv) * 30.0 - u_time * 0.25;
      float ridge = pow(0.5 + 0.5 * sin((rings + directionalShift * 3.0) * 6.2831853), 7.0);
      baseColour = foilPalette(fract(rings * 0.15 + rawHue)) * (0.25 + ridge) + vec3(ridge * 0.3);
    }
    if (u_style > 6.5 && u_style < 7.5) {
      vec2 iceUv = (detailUv - 0.5) * vec2(surfaceAspect, 1.0) * 10.0;
      vec2 cell = floor(iceUv);
      vec2 point = fract(iceUv);
      float nearest = 8.0;
      float second = 8.0;
      float shard = 0.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 offset = vec2(float(x), float(y));
          vec2 neighbour = cell + offset;
          vec2 seedPoint = vec2(hash21(neighbour), hash21(neighbour + 19.3));
          float distanceToPoint = length(offset + seedPoint - point);
          if (distanceToPoint < nearest) { second = nearest; nearest = distanceToPoint; shard = hash21(neighbour + 4.7); }
          else if (distanceToPoint < second) { second = distanceToPoint; }
        }
      }
      float crack = 1.0 - smoothstep(0.015 * u_edgeSoftness, 0.075 * u_edgeSoftness, second - nearest);
      float reflection = 0.45 + 0.65 * pow(0.5 + 0.5 * sin(shard * 20.0 + directionalShift * 12.0), 3.0);
      baseColour = foilPalette(fract(rawHue * 0.4 + shard * 0.8)) * reflection + vec3(crack * 0.8);
    }
    if (u_style > 7.5 && u_style < 8.5) {
      float brushed = hash21(vec2(floor(detailUv.y * 900.0), 1.0));
      float sweep = pow(0.5 + 0.5 * sin(uv.x * 9.0 + directionalShift * 6.0 + u_time * 0.25), 4.0);
      baseColour = foilPalette(fract(rawHue * 0.4 + uv.y * 0.2)) * (0.25 + brushed * 0.35 + sweep);
    }

    if (u_style > 8.5 && u_style < 9.5) {
      float curtain = detailUv.x * 8.0 + sin(detailUv.y * 5.0 + u_time * 0.3) * 1.8;
      float veil = pow(0.5 + 0.5 * sin(curtain + directionalShift * 7.0), 3.0);
      baseColour = foilPalette(fract(rawHue * 0.4 + detailUv.y * 0.5 + (0.5 + 0.5 * sin(curtain)) * 0.25)) * (0.2 + veil * 1.1);
    }
    if (u_style > 9.5 && u_style < 10.5) {
      vec2 confettiUv = (detailUv - 0.5) * vec2(surfaceAspect, 1.0) * 24.0 * u_sparkleDensity;
      vec2 cell = floor(confettiUv);
      float seed = hash21(cell);
      vec2 p = fract(confettiUv) - 0.5;
      float a = seed * 6.2831853;
      p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
      vec2 d = abs(p) - vec2(0.12, 0.28) * u_sparkleSize;
      float stamp = 1.0 - smoothstep(0.0, 0.035 * u_edgeSoftness, max(d.x, d.y));
      float reflection = pow(0.5 + 0.5 * sin(seed * 30.0 + directionalShift * 16.0 + u_time), 3.0);
      baseColour = rainbowBase * 0.15 + stamp * foilPalette(fract(seed + rawHue * 0.3)) * (0.45 + reflection * 1.4);
    }
    if (u_style > 10.5 && u_style < 11.5) {
      vec2 p = (detailUv - 0.5) * vec2(surfaceAspect, 1.0);
      float radius = length(p);
      float theta = atan(p.y, p.x);
      float engraving = sin(radius * 170.0 + sin(theta * 12.0) * 5.0 + directionalShift * 8.0);
      float line = pow(0.5 + 0.5 * engraving, 6.0 / u_edgeSoftness);
      baseColour = foilPalette(fract(rawHue + radius * 0.8)) * (0.22 + line * 0.9);
    }
    if (u_style > 11.5 && u_style < 12.5) {
      vec2 p = (detailUv - 0.5) * vec2(surfaceAspect, 1.0) * 22.0;
      vec2 spacing = vec2(1.7320508, 3.0);
      vec2 a = mod(p, spacing) - spacing * 0.5;
      vec2 b = mod(p + spacing * 0.5, spacing) - spacing * 0.5;
      vec2 tile = dot(a, a) < dot(b, b) ? a : b;
      vec2 cell = floor(p - tile);
      float seed = hash21(cell);
      float edge = max(abs(tile.x) * 0.8660254 + abs(tile.y) * 0.5, abs(tile.y));
      float bevel = smoothstep(0.65, 0.85, edge);
      baseColour = foilPalette(fract(seed * 0.4 + rawHue)) * (0.4 + seed * 0.5) + vec3(bevel * 0.5);
    }
    if (u_style > 12.5 && u_style < 13.5) {
      vec2 p = (detailUv - 0.5) * vec2(surfaceAspect, 1.0);
      float flow = sin(p.x * 12.0 + sin(p.y * 9.0 + u_time * 0.2) * 2.0);
      flow += cos(p.y * 15.0 + sin(p.x * 7.0));
      float caustic = pow(1.0 - abs(sin(flow * 3.0 + u_time * 0.15)), 8.0 / u_edgeSoftness);
      baseColour = foilPalette(fract(rawHue + flow * 0.16)) * (0.25 + caustic * 1.2);
    }
    if (u_style > 13.5 && u_style < 14.5) {
      vec2 p = (detailUv - 0.5) * vec2(surfaceAspect, 1.0);
      float row = floor(p.y * 35.0);
      float tick = floor(u_time * 3.0);
      float glitch = step(0.88, hash21(vec2(row, tick))) * u_glitchStrength;
      p.x += (hash21(vec2(row + 7.0, tick)) - 0.5) * glitch * 0.3;
      vec2 grid = p * 18.0;
      vec2 cell = floor(grid);
      vec2 local = fract(grid);
      float seed = hash21(cell);
      float route = seed > 0.5 ? abs(local.x - 0.5) : abs(local.y - 0.5);
      float diagonal = abs(local.x + local.y - 1.0) * 0.7071;
      route = seed > 0.8 ? diagonal : route;
      float trace = 1.0 - smoothstep(0.025, 0.07 * u_edgeSoftness + 0.025, route);
      float node = 1.0 - smoothstep(0.06, 0.12, length(local - 0.5));
      float scan = 0.5 + 0.5 * sin(v_uv.y * 950.0 * u_scanlineDensity + u_time * 0.4);
      float pulse = pow(0.5 + 0.5 * sin(p.x * 8.0 + p.y * 4.0 - u_time + directionalShift * 6.0), 4.0);
      vec3 neon = foilPalette(fract(seed * 0.7 + rawHue * 0.3));
      baseColour = neon * (0.1 + trace * (0.45 + pulse) + node * 0.7) * (0.7 + scan * 0.3);
      baseColour += foilPalette(fract(rawHue + 0.5)) * glitch * (0.2 + scan * 0.5);
    }
    if (u_style > 14.5) {
      // Stable, irregular ink stamps with satellite droplets; reflections animate.
      vec2 splatUv = (detailUv - 0.5) * vec2(surfaceAspect, 1.0) * 9.0;
      vec2 cell = floor(splatUv);
      vec2 point = fract(splatUv);
      vec3 inkColour = vec3(0.0);
      float coverage = 0.0;
      float feather = max(0.006, 9.0 * u_scale * u_density / max(u_resolution.y, 1.0)) * u_edgeSoftness;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbour = vec2(float(x), float(y));
          vec2 stampCell = cell + neighbour;
          float seed = hash21(stampCell + 31.5);
          vec2 center = 0.2 + 0.6 * vec2(hash21(stampCell), hash21(stampCell + 9.3));
          vec2 p = point - neighbour - center;
          vec2 warped = p * vec2(0.75 + seed * 0.6, 1.2 - seed * 0.4);
          float angle = atan(warped.y, warped.x);
          float lobes = 1.0 + sin(angle * 3.0 + seed * 20.0) * 0.22 + cos(angle * 7.0 - seed * 13.0) * 0.13 + sin(angle * 11.0 + seed * 43.0) * 0.07;
          float radius = (0.13 + seed * 0.16) * u_splatterSize * lobes;
          float stamp = 1.0 - smoothstep(radius - feather, radius + feather, length(warped));
          for (int d = 0; d < 3; d++) {
            float dropSeed = hash21(stampCell + vec2(float(d) * 7.3, 42.0));
            float a = dropSeed * 6.2831853;
            vec2 offset = vec2(cos(a), sin(a)) * (0.28 + seed * 0.2) * u_splatterSize;
            float dropRadius = (0.025 + dropSeed * 0.045) * u_splatterSize;
            float drop = 1.0 - smoothstep(dropRadius - feather * 0.5, dropRadius + feather * 0.5, length(p - offset));
            stamp = max(stamp, drop * step(dropSeed, u_splatterDroplets));
          }
          float reflection = 0.65 + 0.55 * pow(0.5 + 0.5 * sin(seed * 18.0 + directionalShift * 9.0 + u_time * 0.4), 3.0);
          inkColour += foilPalette(fract(rawHue * 0.3 + seed)) * stamp * reflection;
          coverage += stamp;
        }
      }
      baseColour = rainbowBase * 0.12 + inkColour / max(1.0, coverage);
    }
    baseColour = mix(rainbowBase * 0.35, baseColour, u_effectStrength);

    // Iridescence is a broad, smooth colour shift rather than a texture.
    float iridescentPhase = fract(rawHue + dot(uv - 0.5, vec2(0.38, -0.24)));
    vec3 iridescentColour = foilPalette(iridescentPhase);
    float iridescentMix = u_iridescence * (u_style > 2.5 ? 0.28 : 0.58);
    vec3 colour = mix(baseColour, iridescentColour, iridescentMix);

    // Diffraction creates narrow spectral lines that move across the surface.
    float bandWave = sin((dot(uv, normalize(vec2(0.82, 0.57))) + directionalShift * 0.42) * 205.0 * u_diffractionFrequency + u_time * 0.7);
    float diffractionLine = pow(bandWave * 0.5 + 0.5, 14.0);
    float colourWave = sin(dot(uv, normalize(vec2(0.82, 0.57))) * 205.0 * u_diffractionFrequency + u_time * 0.7);
    vec3 spectralDiffraction = hsv2rgb(vec3(fract(hue + colourWave * 0.16), 1.0, 1.0));
    vec3 diffractionColour = u_colour_mode > 1.5 && u_colour_mode < 2.5 ? spectralDiffraction : foilPalette(fract(rawHue + colourWave * 0.16));
    colour += diffractionColour * diffractionLine * u_diffraction * 0.82;

    // Micro-noise adds fine grain and isolated foil flecks.
    float grain = hash21(floor(uv * vec2(310.0, 390.0)) + floor(u_time * 3.0));
    float microSpark = pow(grain, 22.0);
    colour *= 1.0 + (grain - 0.5) * u_micro_noise * 0.32;
    colour += vec3(1.0) * microSpark * u_micro_noise * 1.5;

    // Neutral reflections share intensity and width, independently of foil colours.
    vec2 lightPoint = (v_uv - u_pointer) * vec2(surfaceAspect, 1.0);
    float lightAngle = u_highlightAngle * 0.0174532925;
    vec2 lightAxis = vec2(cos(lightAngle), sin(lightAngle));
    float across = dot(lightPoint, lightAxis);
    float along = dot(lightPoint, vec2(-lightAxis.y, lightAxis.x));
    float width = max(0.02, u_highlightWidth);
    float softness = max(0.1, u_highlightSoftness);
    float highlight = pow(max(0.0, 1.0 - abs(across) * 2.4 / width), 12.0 / softness);
    if (u_highlightStyle > 0.5 && u_highlightStyle < 1.5) {
      highlight = exp(-dot(lightPoint, lightPoint) * 14.0 / (width * width * softness));
    }
    if (u_highlightStyle > 1.5 && u_highlightStyle < 2.5) {
      highlight = exp(-across * across * 1800.0 / (width * width * softness)) * exp(-along * along * 1.5 / width);
    }
    if (u_highlightStyle > 2.5 && u_highlightStyle < 3.5) {
      highlight = exp(-dot(lightPoint, lightPoint) * 80.0 / (width * width * softness));
    }
    if (u_highlightStyle > 3.5 && u_highlightStyle < 4.5) {
      float armA = exp(-across * across * 1200.0 / (width * width * softness)) * exp(-along * along * 25.0 / (width * width));
      float armB = exp(-along * along * 1200.0 / (width * width * softness)) * exp(-across * across * 25.0 / (width * width));
      highlight = max(armA, armB);
    }
    if (u_highlightStyle > 4.5 && u_highlightStyle < 5.5) {
      float separation = 0.065 * width;
      float first = exp(-((across - separation) * (across - separation)) * 1500.0 / (width * width * softness));
      float second = exp(-((across + separation) * (across + separation)) * 1500.0 / (width * width * softness));
      highlight = max(first, second * 0.65);
    }
    if (u_highlightStyle > 5.5) highlight = 0.0;
    colour += vec3(1.0) * highlight * u_specular * 1.25 * u_highlightIntensity;

    // Fresnel is isolated to the perimeter and strengthens as the card tilts.
    float edgeDistance = min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y));
    float edgeRim = pow(1.0 - smoothstep(0.0, 0.12, edgeDistance), 2.0);
    float fresnel = edgeRim * (0.08 + tilt * 0.32) * u_fresnel;
    colour += vec3(1.0) * fresnel * 0.35 * u_vignetteIntensity;
    float luminanceMask = dot(foil.rgb, vec3(0.299, 0.587, 0.114));
    float maskedLuminance = foil.a * luminanceMask;
    float foilMask = smoothstep(0.18, 0.82, mix(foil.a, maskedLuminance, u_mask_mode));
    foilMask = mix(foilMask, 1.0 - foilMask, u_maskInvert) * maskBounds;
    colour = max(vec3(0.0), (colour - 0.5) * u_contrast + 0.5);
    float luminance = dot(colour, vec3(0.2126, 0.7152, 0.0722));
    colour = max(vec3(0.0), mix(vec3(luminance), colour, u_saturation)) * u_brightness;
    float alpha = foilMask * u_intensity;
    gl_FragColor = vec4(colour, alpha);
  }
`;

const highlightValues: Record<HolographicHighlight, number> = {
  "soft-band": 0, "soft-glow": 1, streak: 2, spotlight: 3, cross: 4, double: 5, none: 6,
};

const patternValues: Record<HolographicPattern, number> = {
  rainbow: 0,
  glitter: 1,
  prismatic: 2,
  chrome: 3,
  stars: 4,
  waves: 5,
  rings: 6,
  ice: 7,
  brushed: 8,
  aurora: 9,
  confetti: 10,
  guilloche: 11,
  hex: 12,
  liquid: 13,
  cyberpunk: 14,
  splatter: 15,
};

const shaderCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string) {
  const cached = shaderCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => {
      shaderCache.delete(url);
      reject(new Error(`Unable to load holographic foil map: ${url}`));
    };
    image.src = url;
  });
  if (shaderCache.size >= 32) {
    const oldest = shaderCache.keys().next().value;
    if (oldest) shaderCache.delete(oldest);
  }
  shaderCache.set(url, promise);
  return promise;
}

export type HolographicSettings = Omit<HolographicShaderOptions, "element" | "interactionElement" | "foilMap">;
export function resolveShaderOptions(options: HolographicSettings = {}): Required<HolographicSettings> {
  return {
      intensity: options.intensity ?? 0.72,
      speed: options.speed ?? 0.35,
      scale: options.scale ?? 1.2,
      splatterDroplets: options.splatterDroplets ?? 0.7,
      splatterSize: options.splatterSize ?? 1,
      scanlineDensity: options.scanlineDensity ?? 1,
      glitchStrength: options.glitchStrength ?? 0.5,
      edgeSoftness: options.edgeSoftness ?? 1,
      effectStrength: options.effectStrength ?? 1,
      sparkleSize: options.sparkleSize ?? 1,
      brightness: options.brightness ?? 1,
      saturation: options.saturation ?? 1,
      density: options.density ?? 1,
      highlightWidth: options.highlightWidth ?? 1,
      highlightStyle: options.highlightStyle ?? "soft-band",
      highlightAngle: options.highlightAngle ?? 45,
      highlightSoftness: options.highlightSoftness ?? 1,
      highlightIntensity: options.highlightIntensity ?? 1,
      diffractionFrequency: options.diffractionFrequency ?? 1,
      waveCurvature: options.waveCurvature ?? 1,
      sparkleDensity: options.sparkleDensity ?? 1,
      contrast: options.contrast ?? 1,
      rotation: options.rotation ?? 0,
      maskInvert: options.maskInvert ?? false,
      maskOffsetY: options.maskOffsetY ?? 0,
      maskOffsetX: options.maskOffsetX ?? 0,
      maskScale: options.maskScale ?? 1,
      iridescence: options.iridescence ?? 0.8,
      diffraction: options.diffraction ?? 0.55,
      microNoise: options.microNoise ?? 0.35,
      specular: options.specular ?? 0.7,
      fresnel: options.fresnel ?? 0.65,
      vignetteIntensity: options.vignetteIntensity ?? 1,
      hueStart: options.hueStart ?? 0,
      hueRange: options.hueRange ?? 1,
      colourMode: options.colourMode ?? "spectrum",
      primaryColour: options.primaryColour ?? [0.0, 0.85, 1.0],
      secondaryColour: options.secondaryColour ?? [1.0, 0.24, 0.82],
      tertiaryColour: options.tertiaryColour ?? [1.0, 0.85, 0.4],
      style: options.style ?? "rainbow",
      maskMode: options.maskMode ?? "alpha",
      interactive: options.interactive ?? false,
      autoResize: options.autoResize ?? true,
      reducedMotion: options.reducedMotion ?? (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  };
}

export class HolographicShader {
  private options: Required<HolographicSettings>;
  private readonly element: HTMLElement;
  private readonly interactionElement: HTMLElement;
  private readonly surface: HTMLElement;
  private readonly foilMap: string;
  private canvas?: HTMLCanvasElement;
  private gl?: WebGLRenderingContext;
  private program?: WebGLProgram;
  private texture?: WebGLTexture;
  private positionBuffer?: WebGLBuffer;
  private disposed = false;
  private initializing?: Promise<boolean>;
  private textureRequest = 0;
  private textureSize = { width: 1, height: 1 };
  private animationFrame = 0;
  private resizeObserver?: ResizeObserver;
  private running = false;
  private lastFrameTime = 0;
  private elapsedSeconds = 0;
  private pointer = { x: 0.5, y: 0.5 };
  private readonly pointerMove = (event: PointerEvent) => {
    const bounds = this.interactionElement.getBoundingClientRect();
    this.setPointer(
      Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
      Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1),
    );
  };
  private readonly pointerLeave = () => this.setPointer(0.5, 0.5);

  constructor(options: HolographicShaderOptions) {
    this.element = options.element;
    this.interactionElement = options.interactionElement ?? options.element;
    this.surface = options.element;
    this.foilMap = options.foilMap;
    this.options = resolveShaderOptions(options);
  }

  init(): Promise<boolean> {
    if (this.disposed) return Promise.resolve(false);
    if (this.initializing) return this.initializing;
    this.initializing = this.initialize();
    return this.initializing;
  }

  private async initialize(): Promise<boolean> {
    const canvas = document.createElement("canvas");
    canvas.className = "motech-holographic-shader__canvas";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "4" });
    this.canvas = canvas;
    this.surface.append(canvas);
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) { canvas.remove(); this.canvas = undefined; return false; }
    this.gl = gl;
    try {
      this.program = this.createProgram(gl);
      const image = await loadImage(this.foilMap);
      if (this.disposed) return false;
      this.textureSize = { width: image.naturalWidth, height: image.naturalHeight };
      this.texture = this.createTexture(gl, image);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      this.bindEvents();
      this.resize();
      this.element.classList.add("is-holographic-ready");
      this.start();
      return true;
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  setPointer(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.invalidate();
  }

  updateOptions(options: Partial<Omit<HolographicSettings, "interactive" | "autoResize">>) {
    this.options = resolveShaderOptions({ ...this.options, ...options });
    this.lastFrameTime = performance.now();
    this.invalidate();
  }

  private invalidate() {
    if (this.running && !this.animationFrame) this.animationFrame = requestAnimationFrame(this.render);
  }

  setIntensity(intensity: number) {
    this.updateOptions({ intensity: Math.min(Math.max(intensity, 0), 1) });
  }

  async setFoilMap(url: string) {
    if (!this.gl || this.disposed) return;
    const request = ++this.textureRequest;
    const image = await loadImage(url);
    if (!this.gl || this.disposed || request !== this.textureRequest) return;
    if (this.texture) this.gl.deleteTexture(this.texture);
    this.textureSize = { width: image.naturalWidth, height: image.naturalHeight };
    this.texture = this.createTexture(this.gl, image);
    this.invalidate();
  }


  start() {
    if (this.disposed || this.running || !this.gl || !this.program) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.render);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
  }

  resize() {
    if (!this.canvas || !this.gl) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(this.surface.clientWidth * pixelRatio));
    const height = Math.max(1, Math.round(this.surface.clientHeight * pixelRatio));
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this.invalidate();
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.textureRequest++;
    this.stop();
    this.unbindEvents();
    if (this.gl && this.texture) this.gl.deleteTexture(this.texture);
    if (this.gl && this.program) this.gl.deleteProgram(this.program);
    if (this.gl && this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
    this.positionBuffer = undefined;
    this.resizeObserver?.disconnect();
    this.canvas?.remove();
    this.element.classList.remove("is-holographic-ready");
    this.canvas = undefined;
    this.gl = undefined;
    this.program = undefined;
    this.texture = undefined;
  }

  private readonly render = (timestamp: number) => {
    if (!this.running || !this.canvas || !this.gl || !this.program || !this.texture) return;
    const gl = this.gl;
    this.animationFrame = 0;
    if (!this.options.reducedMotion) this.elapsedSeconds += Math.max(0, timestamp - this.lastFrameTime) / 1000 * this.options.speed;
    this.lastFrameTime = timestamp;
    const elapsed = this.elapsedSeconds;
    this.resize();
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_foil"), 0);
    gl.uniform2f(gl.getUniformLocation(this.program, "u_pointer"), this.pointer.x, this.pointer.y);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_time"), elapsed);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_intensity"), this.options.intensity);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_scale"), this.options.scale);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_splatterDroplets"), this.options.splatterDroplets);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_splatterSize"), this.options.splatterSize);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_scanlineDensity"), this.options.scanlineDensity);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_glitchStrength"), this.options.glitchStrength);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_edgeSoftness"), this.options.edgeSoftness);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_effectStrength"), this.options.effectStrength);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_sparkleSize"), this.options.sparkleSize);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_brightness"), this.options.brightness);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_saturation"), this.options.saturation);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_density"), this.options.density);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_highlightWidth"), this.options.highlightWidth);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_highlightStyle"), highlightValues[this.options.highlightStyle]);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_highlightAngle"), this.options.highlightAngle);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_highlightSoftness"), this.options.highlightSoftness);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_highlightIntensity"), this.options.highlightIntensity);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_diffractionFrequency"), this.options.diffractionFrequency);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_waveCurvature"), this.options.waveCurvature);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_sparkleDensity"), this.options.sparkleDensity);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_contrast"), this.options.contrast);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_rotation"), this.options.rotation);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_maskInvert"), this.options.maskInvert ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_maskOffsetY"), this.options.maskOffsetY);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_maskOffsetX"), this.options.maskOffsetX);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_maskScale"), this.options.maskScale);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_iridescence"), this.options.iridescence);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_diffraction"), this.options.diffraction);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_micro_noise"), this.options.microNoise);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_specular"), this.options.specular);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_fresnel"), this.options.fresnel);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_vignetteIntensity"), this.options.vignetteIntensity);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_hue_start"), this.options.hueStart);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_hue_range"), this.options.hueRange);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_colour_mode"), this.options.colourMode === "tritone" ? 3 : this.options.colourMode === "duotone" ? 1 : this.options.colourMode === "solid" ? 2 : 0);
    gl.uniform3f(gl.getUniformLocation(this.program, "u_colour_primary"), ...this.options.primaryColour);
    gl.uniform3f(gl.getUniformLocation(this.program, "u_colour_secondary"), ...this.options.secondaryColour);
    gl.uniform3f(gl.getUniformLocation(this.program, "u_colour_tertiary"), ...this.options.tertiaryColour);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_style"), patternValues[this.options.style]);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_mask_mode"), this.options.maskMode === "luminance" ? 1 : 0);
    gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), this.canvas.width, this.canvas.height);
    gl.uniform2f(gl.getUniformLocation(this.program, "u_texture_size"), this.textureSize.width, this.textureSize.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!this.options.reducedMotion && this.options.speed !== 0 && !this.animationFrame) this.animationFrame = requestAnimationFrame(this.render);
  };

  private createProgram(gl: WebGLRenderingContext) {
    const vertex = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
    let fragment: WebGLShader | undefined;
    let program: WebGLProgram | null = null;
    try {
      fragment = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (!program) throw new Error("Unable to create holographic shader program.");
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Unknown shader link error.");
      const position = gl.createBuffer();
      if (!position) throw new Error("Unable to create holographic position buffer.");
      this.positionBuffer = position;
      gl.bindBuffer(gl.ARRAY_BUFFER, position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      return program;
    } catch (error) {
      if (program) gl.deleteProgram(program);
      throw error;
    } finally {
      gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }

  private createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Unable to create holographic shader.");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error.";
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  private createTexture(gl: WebGLRenderingContext, image: HTMLImageElement) {
    const texture = gl.createTexture();
    if (!texture) throw new Error("Unable to create holographic foil texture.");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
  }

  private bindEvents() {
    if (this.options.interactive) {
      this.interactionElement.addEventListener("pointermove", this.pointerMove);
      this.interactionElement.addEventListener("pointerleave", this.pointerLeave);
    }
    if (this.options.autoResize) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.surface);
    }
  }

  private unbindEvents() {
    this.interactionElement.removeEventListener("pointermove", this.pointerMove);
    this.interactionElement.removeEventListener("pointerleave", this.pointerLeave);
  }
}
