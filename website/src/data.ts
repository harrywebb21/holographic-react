import type { UseHolographicOptions, HolographicPattern } from 'holographic-react';
export type Page = 'overview' | 'start' | 'playground' | 'examples' | 'api';
export const patterns: HolographicPattern[] = ['rainbow','glitter','prismatic','chrome','stars','waves','rings','ice','brushed','aurora','confetti','guilloche','hex','liquid','cyberpunk','splatter'];
export const palettes: { name: string; colors: [string, string, string] }[] = [
  { name: 'Opal', colors: ['#97dbed','#e5b9f3','#d9f4ab'] },
  { name: 'Acid', colors: ['#76a92c','#d4f778','#f5ffd8'] },
  { name: 'After hours', colors: ['#695bdb','#fa9dd2','#8be8e1'] },
  { name: 'Ember', colors: ['#f77845','#ffcc8d','#f09ac1'] },
  { name: 'Silver', colors: ['#8e9ba8','#f5f7fa','#b5bfca'] },
];
export const initialOptions: UseHolographicOptions = { effect: 'liquid', colors: palettes[0].colors, intensity: 0.55, speed: 0.35, scale: 1.2, density: 1, highlightStyle: 'soft-band', highlightIntensity: 0.7, highlightWidth: 1, highlightSoftness: 1, vignetteIntensity: 0.25, saturation: 1, brightness: 1, contrast: 1, iridescence: 0.8, diffraction: 0.3, microNoise: 0.1, fresnel: 0.3 };
export const examples = [
 { id:'collectible', label:'01 / COLLECTIBLES', title:'Make the rare feel rare.', description:'A foil finish for digital collectibles, reward reveals, and trading cards. Keep the artwork in HTML and let the shader catch the light.', effect:'liquid', colors:palettes[0].colors, intensity:0.55 },
 { id:'membership', label:'02 / MEMBERSHIPS', title:'A little status. A lot of shine.', description:'Give a membership or loyalty card a tactile finish. A quiet chrome reflection makes even a simple layout feel considered.', effect:'chrome', colors:palettes[4].colors, intensity:0.42 },
 { id:'ticket', label:'03 / EVENTS', title:'The night starts here.', description:'Turn a confirmation into a keepsake. A moving wave treatment gives digital tickets and event passes their own identity.', effect:'waves', colors:palettes[2].colors, intensity:0.5 },
 { id:'product', label:'04 / COMMERCE', title:'Put the spotlight on the drop.', description:'Use foil on a product tile or limited-edition release. The overlay is decorative and never blocks your links or buttons.', effect:'prismatic', colors:palettes[3].colors, intensity:0.3 },
 { id:'map', label:'05 / MAPS & EXPLORATION', title:'Make a place feel special.', description:'Highlight a neighbourhood, a discovered area, or a selected region. A foil mask keeps the effect inside the district while the map, markers, and controls stay interactive.', effect:'aurora', colors:['#9ee8c6','#a7bbf4','#e3bef5'], intensity:0.42 },
] as const;
export function codeFor(options: UseHolographicOptions, content = '<img src="/your-card.png" alt="Limited edition card" className="size-full object-cover" />') {
 const clean = Object.fromEntries(Object.entries(options).filter(([key,value]) => value !== undefined && !['interactionRef','foilMap'].includes(key)));
 const config = JSON.stringify(clean,null,2).replace(/"([a-zA-Z]+)":/g,'$1:').split('\n').map((line,i)=>i?`  ${line}`:line).join('\n');
 return `import { useHolographic } from 'holographic-react';\n\nexport function FoilCard() {\n  const { ref } = useHolographic(${config});\n\n  return (\n    <div ref={ref} className="relative isolate h-[400px] w-[280px] overflow-hidden rounded-2xl">\n      ${content}\n    </div>\n  );\n}`;
}
export const quickCode = `import { useHolographic } from 'holographic-react';

export function FoilCard() {
  const { ref, containerStyle } = useHolographic({
    effect: 'liquid',
    colors: ['#97dbed', '#e5b9f3', '#d9f4ab'],
    intensity: 0.55,
  });

  return (
    <div ref={ref} style={{ ...containerStyle, width: 280, height: 400 }}>
      <img src="/your-card.png" alt="Limited edition card" />
    </div>
  );
}`;
export const apiGroups = [
 { title:'Hook options', rows:[['effect','HolographicPattern','rainbow','One of the sixteen foil patterns. The hook also accepts the renderer’s style option.'],['colors','string[]','Spectrum','One, two, or three hex colours (#RGB or #RRGGBB). Takes precedence over raw colour settings.'],['foilMap','string','Full coverage','Mask image URL or data URL. Transparent areas can stay clear; use luminance mode for black-and-white masks.'],['enabled','boolean','true','Mount or remove the decorative overlay.'],['paused','boolean','false','Freeze animation and pointer response while keeping the canvas.'],['interactive','boolean','true','Allow pointer movement to change the reflection.'],['interactionRef','RefObject<HTMLElement | null>','Host element','Track pointer movement on another element, such as the surrounding card.'],['autoResize','boolean','true','Resize the canvas with its host using ResizeObserver.'],['reducedMotion','boolean','System preference','Follows prefers-reduced-motion when omitted. Renders a still frame, with pointer updates.']] },
 { title:'Surface & colour', rows:[['intensity','number','0.72','Overlay opacity, from 0 to 1.'],['speed','number','0.35','Animation speed. Use paused to freeze the entire effect.'],['scale / density','number','1.2 / 1','Pattern size and repetition. Keep above zero.'],['rotation','number','0','Pattern rotation in degrees.'],['brightness / saturation / contrast','number','1 / 1 / 1','Fine-tune the rendered colours.'],['effectStrength','number','1','Strength of the selected pattern.'],['iridescence / diffraction','number','0.8 / 0.55','Colour variation and diffraction strength.'],['microNoise / specular / fresnel','number','0.35 / 0.7 / 0.65','Grain, reflection and edge-light response.'],['vignetteIntensity','number','1','Strength of the edge treatment. Set to 0 to remove it.'],['hueStart / hueRange','number','0 / 1','Spectrum start and range in normalized turns (0–1).'],['colourMode','spectrum | solid | duotone | tritone','spectrum','Raw renderer palette mode. Prefer colors for hex input.'],['primaryColour / secondaryColour / tertiaryColour','[number, number, number]','Cyan / pink / yellow','Raw RGB colour channels normalized to 0–1.']] },
 { title:'Highlights', rows:[['highlightStyle','HolographicHighlight','soft-band','soft-band, soft-glow, streak, spotlight, cross, double, or none.'],['highlightIntensity','number','1','Pointer reflection strength.'],['highlightWidth / highlightSoftness','number','1 / 1','Width and falloff. Keep both above zero.'],['highlightAngle','number','45','Reflection angle in degrees.'],['edgeSoftness','number','1','Softens the pattern’s edge response.']] },
 { title:'Pattern details', rows:[['sparkleDensity / sparkleSize','number','1 / 1','Repetition and size of glitter and star detail.'],['waveCurvature','number','1','Curvature of the waves pattern.'],['diffractionFrequency','number','1','Frequency of diffraction detail.'],['glitchStrength / scanlineDensity','number','0.5 / 1','Cyberpunk distortion and scanline repetition.'],['splatterSize / splatterDroplets','number','1 / 0.7','Splatter shape size and smaller droplets.']] },
 { title:'Mask transforms', rows:[['maskMode','alpha | luminance','alpha','Alpha uses transparency. Luminance uses black-to-white brightness.'],['maskScale','number','1','Independent from foil scale. 0.5 shrinks the mask; 2 enlarges it.'],['maskOffsetX / maskOffsetY','number','0 / 0','Position offsets in normalized UV coordinates.'],['maskInvert','boolean','false','Reverse the mask coverage.']] },
];
