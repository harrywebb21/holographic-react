# holographic-react documentation

A standalone React + Vite + Tailwind documentation website using the published `holographic-react` npm package. No dependency on the Shopify theme or Motech workspace.

## Run

Requires Node 20.19+ (or a supported newer version).

```sh
cd website
npm ci
npm run dev
```

Open http://127.0.0.1:5174. If that port is busy, Vite prints the next available port.

## Production

```sh
npm run build
npm run preview
```

Deploy the `website/dist` directory to a static host. Set the project root to `website`, install command to `npm ci`, build command to `npm run build`, and output directory to `dist`. The relative Vite base and hash navigation support root domains and subdirectories without rewrite rules. No API keys, environment variables, or backend are required.

## Pages

- Overview: interactive Saturn collectible, selectable finishes, and two more live component previews.
- Getting started: installation, React and Tailwind usage, custom colours, masks, accessibility, and lifecycle advice.
- Playground: sixteen patterns, five editable palettes, grouped controls, conditional pattern controls, local mask upload, a map surface, pause/reset, and copyable React output.
- Use cases: collectible, membership, event pass, product tile, and interactive illustrated map demonstrations with finish recipes.
- API reference: searchable hook options, return values, documented renderer defaults, and a React-free example.

Illustrations are local SVG and HTML. Uploaded mask images stay in the browser and are not sent to a server. Demos pause offscreen and follow the package's reduced-motion handling. Example code uses placeholder artwork paths; replace these with your own assets.

## Files

- `src/App.tsx`: pages, navigation, controls, documentation.
- `src/demos.tsx`: live foil surfaces, SVG illustrations, code panels, copy helpers.
- `src/data.ts`: presets, code generation, API descriptions.
- `src/styles.css`: Tailwind entry, design tokens, and base accessibility rules.

MIT, like the parent package. See `../LICENSE`.

The map example supports district-only or whole-map foil, selectable markers, zoom, and drag-to-pan after zooming. `public/demo-map.svg` and `public/district-mask.svg` are downloadable sample artwork, not live geographic tiles. Map and mask transform together. For geographic map libraries, a regional mask must be kept in sync with the camera projection.

Foil-mapping examples compare full coverage, artwork only, border only, logo and lettering, and an inverted mask. Every treatment displays the effective mask beside a live result, provides downloadable SVG assets with explicit dimensions, and generates matching React code. The extra geographic mapping recipes were replaced by these foil-mask examples.
