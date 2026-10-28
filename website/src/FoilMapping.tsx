import { useState } from 'react';
import type { HolographicPattern } from 'holographic-react';
import { CodeBlock, Foil, Icon, SectionLabel } from './demos';
const treatments = [
 {id:'full',name:'Full coverage',mask:'full',invert:false,title:'Foil from edge to edge.',description:'A completely white mask lets the effect cover the whole surface. Useful for an all-over foil stock or a reflective background.'},
 {id:'artwork',name:'Artwork only',mask:'artwork',invert:false,title:'Let the artwork catch the light.',description:'White marks the illustration panel. The border, logo, and text stay clear, keeping the card easy to read.'},
 {id:'border',name:'Border only',mask:'border',invert:false,title:'A finish around the edges.',description:'A white frame on a black background creates a foil border. The illustration and text receive no overlay.'},
 {id:'lettering',name:'Logo & lettering',mask:'lettering',invert:false,title:'Make your mark shine.',description:'Only the logo, symbol, and title are white. The foil appears inside the letter shapes while the rest of the design stays untouched.'},
 {id:'inverted',name:'Inverted mask',mask:'artwork',invert:true,title:'Same mask. Opposite finish.',description:'Reuse the artwork mask with maskInvert enabled. The illustration stays clear, while the surrounding design receives foil.'},
];
export function FoilMapping() {
 const [selected,setSelected]=useState('artwork');
 const [effect,setEffect]=useState<HolographicPattern>('liquid');
 const [paused,setPaused]=useState(false);
 const [showCode,setShowCode]=useState(false);
 const treatment=treatments.find(item=>item.id===selected)!;
 const mask=`./foil-mask-${treatment.mask}.svg`;
 const code=`import { useHolographic } from 'holographic-react';

export function MappedFoilCard() {
  const { ref, containerStyle } = useHolographic({
    effect: '${effect}',
    colors: ['#97dbed', '#e5b9f3', '#d9f4ab'],
    intensity: 0.65,
    foilMap: '/foil-mask-${treatment.mask}.svg',
    maskMode: 'luminance',
    maskInvert: ${treatment.invert},
    maskScale: 1,
    vignetteIntensity: 0,
  });

  return (
    <div ref={ref} style={{ ...containerStyle, width: 300, aspectRatio: '3 / 4', borderRadius: 16 }}>
      <img src="/foil-demo-card.svg" alt="Afterlight collectible card" style={{ display: 'block', width: '100%' }} />
    </div>
  );
}`;
 return <section id="foil-mapping" className="mt-12">
  <SectionLabel>Foil mapping / Mask examples</SectionLabel><h2 className="text-[30px] tracking-[-.04em]">Choose where the light lands.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#929ba8]">One design, five foil treatments. In luminance mode, white receives foil and black stays clear. The mask is a separate image, aligned with your artwork.</p>
  <div className="mt-6 flex flex-wrap gap-2" aria-label="Foil mask examples">{treatments.map(item=><button key={item.id} aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)} className={`rounded-full border px-3.5 py-2 text-[11px] transition ${selected===item.id?'border-[#cceab8]/40 bg-[#cceab8]/10 text-[#cceab8]':'border-white/10 text-[#9199a5] hover:text-white'}`}>{item.name}</button>)}</div>
  <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#111216]">
   <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4"><div><h3 className="text-sm">{treatment.title}</h3><p className="mt-2 max-w-xl text-xs leading-6 text-[#8c96a4]">{treatment.description}</p></div><div className="flex items-center gap-4"><label className="flex items-center gap-2 text-[10px] text-[#9da6b2]">Finish<select aria-label="Mask example finish" value={effect} onChange={event=>setEffect(event.target.value as HolographicPattern)} className="rounded border border-white/15 bg-[#1a1d24] px-2 py-1.5 text-xs"><option value="liquid">Liquid</option><option value="stars">Stars</option><option value="waves">Waves</option><option value="chrome">Chrome</option></select></label><button onClick={()=>setPaused(!paused)} className="flex items-center gap-2 text-[10px] text-[#a2acb8]"><Icon name={paused?'play':'pause'} className="size-3"/>{paused?'Resume foil':'Pause foil'}</button></div></div>
   <div className="grid sm:grid-cols-2">
    <div className="border-b border-white/10 p-5 sm:border-r sm:border-b-0"><div className="mb-5 flex items-center justify-between font-mono text-[9px] tracking-wider text-[#909aa8]"><span>{treatment.invert?'EFFECTIVE MASK · INVERTED':'FOIL MASK · LUMINANCE'}</span><span>480 × 640</span></div><div className="grid min-h-[330px] place-items-center rounded-lg bg-[#090a0d] px-8 py-5"><img src={mask} alt={`${treatment.name}: white regions receive foil, black regions stay clear`} style={{filter:treatment.invert?'invert(1)':undefined}} className="block w-full max-w-[220px] rounded-lg border border-white/15"/></div><div className="mt-4 flex gap-5 text-[10px] text-[#8f99a7]"><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-white"/>Foil applies</span><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm border border-white/25 bg-black"/>Stays clear</span></div></div>
    <div className="p-5"><div className="mb-5 flex items-center justify-between font-mono text-[9px] tracking-wider text-[#909aa8]"><span>THE RESULT</span><span>HOVER TO INTERACT</span></div><div className="grid min-h-[330px] place-items-center rounded-lg bg-[radial-gradient(#ffffff09_1px,transparent_1px)] bg-size-[16px_16px] px-8 py-5"><Foil options={{effect,colors:['#97dbed','#e5b9f3','#d9f4ab'],intensity:.65,foilMap:mask,maskMode:'luminance',maskInvert:treatment.invert,maskScale:1,vignetteIntensity:0,paused}} className="w-full max-w-[220px] rounded-lg shadow-xl"><img src="./foil-demo-card.svg" alt={`Afterlight card with ${treatment.name.toLowerCase()} foil`} draggable={false} className="block aspect-[3/4] w-full"/></Foil></div><p className="mt-4 text-[10px] leading-5 text-[#8f99a7]">{treatment.invert?'The preview shows the effective mask after inversion. The downloaded source mask is unchanged.':'The mask and artwork use identical dimensions, so their details line up.'}</p></div>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4"><div className="flex flex-wrap gap-4 text-[11px]"><a href={mask} download className="text-[#bfd6af] hover:underline">Download mask ↗</a><a href="./foil-demo-card.svg" download className="text-[#8f9aa8] hover:text-white">Download artwork ↗</a></div><button onClick={()=>setShowCode(!showCode)} aria-expanded={showCode} className="flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-[11px] text-[#c3d9b3]"><Icon name="code" className="size-3"/>{showCode?'Hide mapping code':'Get mapping code'}</button></div>
  </div>
  {showCode&&<div className="mt-5"><CodeBlock code={code} title={`MappedFoilCard.tsx · ${treatment.name}`}/><p className="mt-3 text-xs leading-6 text-[#8e98a6]">Save the downloaded mask and artwork in your public folder. SVG masks need explicit width and height. Use maskScale and maskOffsetX/Y if your own assets need alignment.</p></div>}
 </section>;
}
