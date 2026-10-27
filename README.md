# holographic-react

Interactive WebGL foil effects for React. Sixteen patterns, custom colours, neutral pointer highlights, independent mask sizing, and live settings updates. No CSS file, Shopify dependency, animation library, or WebGL framework is required.

This project is prepared as standalone source. It has not been published to npm and has no Git repository initialized. The package name is a working name; registry availability has not been checked. No open-source licence has been granted yet (`UNLICENSED`); choose your licence before public distribution.

## Try it

From this directory:

```sh
npm install
npm run build
npm test
npm pack
```

`npm pack` creates `holographic-react-0.1.0.tgz`. Install that archive into another React project:

```sh
npm install /path/to/holographic-react-0.1.0.tgz
```

React is a peer dependency and stays out of the bundle. React 18 and 19 are supported by the peer range; browser verification currently uses React 19. The build requires Node 20.19+ (or a supported newer version).

## The hook

```tsx
import { useHolographic } from "holographic-react";

export function FoilCard() {
  const { ref, containerStyle, status, error } = useHolographic({
    effect: "liquid",
    colors: ["#76a92c", "#d4f778", "#f5ffd8"],
    intensity: 0.7,
    speed: 0.4,
    density: 0.9,
    highlightStyle: "soft-band",
  });

  return (
    <div ref={ref} style={{ ...containerStyle, width: 260, height: 370, borderRadius: 16 }}>
      <img src="/card.png" alt="Limited edition trading card" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {error && <p role="alert">{error.message}</p>}
      {status === "unsupported" && <p>Foil preview unavailable.</p>}
    </div>
  );
}
```

The hook returns a stable callback `ref`, `containerStyle`, `status`, and `error`. Give the container a real size; the canvas fills it automatically. Keep important content accessible in ordinary HTML: the decorative canvas is hidden from assistive technology and never intercepts clicks.

Tailwind works too; use the same hook and attach `ref` to your container:

```tsx
<div ref={ref} className="relative isolate h-[370px] w-[260px] overflow-hidden rounded-2xl">
  <img src="/card.png" alt="Trading card" className="size-full object-cover" />
</div>
```

The hook handles mounting, cleanup, resizing, pointer events, document visibility, React Strict Mode, and reduced-motion preferences. Changing visual settings updates the existing renderer. Changing the mask, interaction element, or enabled state recreates it safely. Unsupported WebGL leaves the underlying content intact. Effects only start in the browser, so server rendering is safe; call the hook from a client component in frameworks that distinguish server and client components.

## Options

| Option | What it does |
| --- | --- |
| `effect` | Choose a foil pattern; defaults to `rainbow`. |
| `colors` | One hex colour gives a solid foil, two give a smooth two-colour loop, three give a three-colour loop. Omit for a spectrum. Accepts `#RGB` and `#RRGGBB`. |
| `foilMap` | Optional mask URL or data URL. White/opaque areas receive foil. Use `maskMode: "luminance"` for black-and-white masks. Omit for full coverage. |
| `enabled` | `false` removes the overlay. Defaults to `true`. |
| `paused` | Freezes animation and pointer response without removing the overlay. |
| `intensity`, `speed` | Overlay opacity (0–1) and automatic animation speed. |
| `scale`, `density`, `rotation` | Pattern scale, repetition density, and rotation in degrees. |
| `maskScale`, `maskOffsetX`, `maskOffsetY`, `maskInvert` | Independent mask transforms. `maskScale: 1` is the original cover size; `0.5` enlarges it and `2` shrinks it. Offsets are normalized UV coordinates. |
| `highlightStyle`, `highlightIntensity`, `highlightWidth`, `highlightAngle`, `highlightSoftness` | Neutral pointer reflection. |
| `reducedMotion` | Defaults to the OS/browser preference and follows changes. Set explicitly to override. |
| `interactive` | Pointer interaction; defaults to `true` in the hook. |
| `interactionRef` | Optional React ref for a larger pointer-interaction area. |

All renderer settings are also accepted, including saturation, brightness, contrast, iridescence, diffraction, grain, edge reflectivity and vignette strength. Pattern controls include sparkle density/size, wave curvature, glitch strength/scanline density and splatter size/droplets. See the exported `HolographicSettings` type for the full list. Keep divisor controls such as width, softness, density and scale above zero. `hueStart` and `hueRange` use normalized turns (0–1), while rotation and highlight angle use degrees. Raw `primaryColour`/`secondaryColour`/`tertiaryColour` values use RGB tuples normalized to 0–1; the `colors` convenience option takes precedence when present.

The hook's mask scale is independent of the pattern scale. There is no React state synchronization or shared slider state between separate hook instances.

### Patterns

`rainbow`, `glitter`, `prismatic`, `chrome`, `stars`, `waves`, `rings`, `ice`, `brushed`, `aurora`, `confetti`, `guilloche`, `hex`, `liquid`, `cyberpunk`, `splatter`.

### Highlights

`soft-band`, `soft-glow`, `streak`, `spotlight`, `cross`, `double`, `none`.

## Without React

```ts
import { HolographicShader } from "holographic-react/core";

const foil = new HolographicShader({
  element: document.querySelector<HTMLElement>(".card")!,
  foilMap: "/foil-mask.png",
  maskMode: "luminance",
  style: "stars",
  interactive: true,
});

const supported = await foil.init(); // false when WebGL is unavailable
foil.updateOptions({ intensity: 0.5, density: 1.5 });
foil.stop();
foil.start();
// On removal:
foil.destroy();
```

The core entry has no React import. Position and size the host yourself (`position: relative; overflow: hidden`); canvas positioning is provided by the renderer. The core uses `style` for the pattern name; the hook also accepts the friendlier `effect` alias. A renderer is terminal after `destroy()`; create a new instance to mount again.

Mask images from other origins need an appropriate CORS response. No telemetry or network calls are made apart from loading the mask image you supply. WebGL rendering uses the local GPU. The renderer targets modern browsers with WebGL, ResizeObserver, and matchMedia event support.

## Standalone project structure

- `src/`: renderer, hook, and public TypeScript API.
- `tests/`: bundled API, options, loading, cleanup and reduced-motion checks.
- `examples/FoilCard.tsx`: a complete component with effect and intensity controls.
- `vite.config.ts`: separate React and React-free bundles, with React externalized.
- `dist/`: generated ESM bundles, source maps and type declarations.

For development, `npm run dev` watches and rebuilds the package. This library has no production build dependency on the original Motech app or theme files.
