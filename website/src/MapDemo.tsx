import { useRef, useState, type PointerEvent } from 'react';
import type { UseHolographicOptions } from 'holographic-react';
import { Foil } from './demos';
const locations = [
 {id:'gallery',name:'The Light House',kind:'Gallery / Creative Quarter',district:'Creative Quarter',path:'m300 125 145 20 98 80-48 115-148-25-95-90z',x:44,y:38},
 {id:'studio',name:'Studio North',kind:'Design studio / Old Town',district:'Old Town',path:'M585 78 740 70 815 160 760 229 627 211 560 153Z',x:72,y:24},
 {id:'cafe',name:'Common Ground',kind:'Coffee & conversation / West End',district:'West End',path:'M171 370 288 349 363 429 318 519 166 540 119 460Z',x:27,y:73},
];
const districtMasks = Object.fromEntries(locations.map(location => [location.id,
 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="black"/><path d="'+location.path+'" fill="white"/></svg>')
]));
export const mapCode = `import { useState } from 'react';
import { useHolographic } from 'holographic-react';

export function FoilMap() {
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(0);
  const districts = [
    { name: 'Creative Quarter', path: 'm300 125 145 20 98 80-48 115-148-25-95-90z' },
    { name: 'Old Town', path: 'M585 78 740 70 815 160 760 229 627 211 560 153Z' },
    { name: 'West End', path: 'M171 370 288 349 363 429 318 519 166 540 119 460Z' },
  ];
  // Use the same polygon for the outline and the white mask area.
  const districtMask = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">' +
    '<rect width="900" height="600" fill="black"/>' +
    '<path d="' + districts[selected].path + '" fill="white"/></svg>'
  );
  const { ref, containerStyle } = useHolographic({
    effect: 'aurora',
    colors: ['#9ee8c6', '#a7bbf4', '#e3bef5'],
    intensity: 0.42,
    foilMap: districtMask,
    maskMode: 'luminance',
    vignetteIntensity: 0,
  });

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Transform the map and its foil together. */}
      <div style={{ transform: \`scale(\${zoom})\` }}>
        <div ref={ref} style={containerStyle}>
          <img src="/demo-map.svg" alt="Illustrated city map" style={{ width: '100%', display: 'block' }} />
          <svg viewBox="0 0 900 600" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
            <path d={districts[selected].path} fill="none" stroke="#b8f2cd" strokeWidth="2" strokeDasharray="5 5" />
          </svg>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 10 }}>
        {districts.map((district, index) => (
          <button key={district.name} aria-pressed={selected === index} onClick={() => setSelected(index)}>
            {district.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => setZoom(value => Math.min(2, value + 0.25))}
        style={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}
      >
        Zoom in
      </button>
    </div>
  );
}`;
export function mapCodeFor(options:UseHolographicOptions={}) {
 const settings={effect:'aurora',colors:['#9ee8c6','#a7bbf4','#e3bef5'],intensity:.42,vignetteIntensity:0,...options,foilMap:options.foilMap||'__DISTRICT_MASK__',maskMode:options.maskMode||'luminance'};
 return mapCode.replace(/useHolographic\(\{[\s\S]*?\}\);/,`useHolographic(${JSON.stringify(settings,null,2).replace('"__DISTRICT_MASK__"','districtMask')});`);
}
const routes = [
 {name:'Riverside walk',path:'M243 438 196 413 182 362 225 299 310 275 396 228'},
 {name:'After-dark loop',path:'M396 228 448 159 571 133 648 144 694 205 655 267 513 343 391 347 310 275 396 228'},
];
function maskFor(markup:string){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="black"/>'+markup+'</svg>');}
export function MapDemo({options={},variant='district'}:{options?:UseHolographicOptions;variant?:'district'|'route'|'discovery'}) {
 const [route,setRoute]=useState(0);
 const [discovered,setDiscovered]=useState(['gallery']);
 const [zoom,setZoom]=useState(1);
 const [pan,setPan]=useState({x:0,y:0});
 const [selected,setSelected]=useState('gallery');
 const [coverage,setCoverage]=useState<'district'|'whole'>('district');
 const drag=useRef<{x:number;y:number;panX:number;panY:number}|null>(null);
 const chosen=locations.find(location=>location.id===selected)!;
 const isSelected=(id:string)=>variant==='discovery'?discovered.includes(id):selected===id;
 function select(id:string){setSelected(id);if(variant==='discovery')setDiscovered(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);}
 const variantMask=variant==='route'?maskFor('<path d="'+routes[route].path+'" fill="none" stroke="white" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>'):variant==='discovery'?maskFor(locations.filter(location=>discovered.includes(location.id)).map(location=>'<path d="'+location.path+'" fill="white"/>').join('')):districtMasks[selected];
 function start(event:PointerEvent<HTMLDivElement>){if((event.target as HTMLElement).closest('button, [role="button"]'))return;drag.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y};event.currentTarget.setPointerCapture(event.pointerId);}
 function move(event:PointerEvent<HTMLDivElement>){if(!drag.current)return;const bounds=event.currentTarget.getBoundingClientRect();const maxX=bounds.width*(zoom-1)/2;const maxY=bounds.height*(zoom-1)/2;setPan({x:Math.max(-maxX,Math.min(maxX,drag.current.panX+event.clientX-drag.current.x)),y:Math.max(-maxY,Math.min(maxY,drag.current.panY+event.clientY-drag.current.y))});}
 function zoomTo(value:number){setZoom(Math.min(2,Math.max(1,value)));setPan({x:0,y:0});}
 return <div className="w-full overflow-hidden rounded-xl border border-white/15 bg-[#171e24] shadow-2xl">
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#141b21] px-4 py-3"><span className="font-mono text-[9px] tracking-[.14em] text-[#c4d2d7]">{variant==='route'?'LUMA / CITY TRAILS':variant==='discovery'?'LUMA / DISCOVERY':'LUMA / CITY EXPLORER'}</span><div className="flex gap-1">{variant==='route'?routes.map((item,index)=><button key={item.name} aria-pressed={route===index} onClick={()=>setRoute(index)} className={`rounded px-2 py-1 text-[9px] ${route===index?'bg-[#eec7a4]/15 text-[#f0d7bf]':'text-[#778c98] hover:text-white'}`}>{item.name}</button>):variant==='discovery'?<button onClick={()=>setDiscovered(['gallery'])} className="rounded bg-white/5 px-2 py-1 text-[9px] text-[#9db7a5]">Reset discoveries</button>:(['district','whole'] as const).map(mode=><button key={mode} aria-pressed={coverage===mode} onClick={()=>setCoverage(mode)} className={`rounded px-2 py-1 text-[9px] ${coverage===mode?'bg-[#b9e9cf]/15 text-[#c6f0d8]':'text-[#778c98] hover:text-white'}`}>{mode==='district'?'District foil':'Whole map'}</button>)}</div></div>
  <div className="relative touch-none overflow-hidden" aria-label="Interactive illustrated city map. Use the zoom controls, then drag to pan." onPointerDown={start} onPointerMove={move} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} style={{cursor:zoom>1?'grab':'default'}}>
   <div style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:'center'}}>
    <Foil options={{effect:variant==='route'?'waves':variant==='discovery'?'stars':'aurora',colors:variant==='route'?['#f6b676','#efd6af','#f5a0bf']:variant==='discovery'?['#95d993','#d7f5a8','#8fe8d1']:['#9ee8c6','#a7bbf4','#e3bef5'],intensity:variant==='route'?.75:.42,vignetteIntensity:0,...options,foilMap:variant==='district'&&coverage==='whole'?undefined:(options.foilMap||variantMask),maskMode:options.maskMode||'luminance'}} className="w-full">
     <img src="./demo-map.svg" alt="Illustrated city map showing the Creative Quarter beside Luma River" draggable={false} className="block aspect-[3/2] w-full select-none"/>
     <svg viewBox="0 0 900 600" role="group" aria-label={variant==='discovery'?'Discoverable districts':'Selectable districts'} className="pointer-events-none absolute inset-0 z-10 size-full">
      {variant!=='route'&&locations.map(location=><path key={location.id} d={location.path} role="button" tabIndex={0} aria-label={`${variant==='discovery'?'Toggle discovery of':'Select'} ${location.district} district`} aria-pressed={isSelected(location.id)} onClick={()=>select(location.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(location.id);}}} fill={isSelected(location.id)?'#b8f2cd12':'transparent'} stroke={isSelected(location.id)?'#c6f5d9':'#9ab2bb55'} strokeWidth={isSelected(location.id)?2.5:1} strokeDasharray={isSelected(location.id)?'5 5':undefined} className="pointer-events-auto cursor-pointer outline-none transition-colors hover:fill-white/10 focus-visible:fill-white/10 focus-visible:stroke-[#e1ffce] focus-visible:stroke-[5] focus-visible:[stroke-dasharray:0]"/>)}
      {variant==='route'&&<path d={routes[route].path} fill="none" stroke="#fff1d6" strokeOpacity=".8" strokeWidth="3" strokeDasharray="7 8" strokeLinecap="round"/>}
     </svg>
     {locations.map(location=><button key={location.id} onClick={()=>select(location.id)} aria-label={`${variant==='discovery'?'Discover':'Select'} ${location.name}`} aria-pressed={isSelected(location.id)} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 p-1.5 shadow-lg transition hover:scale-125 ${isSelected(location.id)?'border-[#c5f5d8] bg-[#d7f5e4] text-[#19332c]':'border-[#8cacc3] bg-[#1e3946] text-[#c7dfec]'}`} style={{left:`${location.x}%`,top:`${location.y}%`}}><svg aria-hidden="true" viewBox="0 0 12 12" className="size-2" fill="currentColor"><path d="m6 0 1.6 4.4L12 6l-4.4 1.6L6 12 4.4 7.6 0 6l4.4-1.6z"/></svg></button>)}
    </Foil>
   </div>
   <div className="absolute top-3 right-3 z-20 flex flex-col rounded-md border border-white/15 bg-[#121b22]/95 text-[#c2d2dc]"><button aria-label="Zoom map in" disabled={zoom>=2} onClick={()=>zoomTo(zoom+.25)} className="px-3 py-1.5 text-base hover:bg-white/10 disabled:opacity-30">+</button><button aria-label="Zoom map out" disabled={zoom<=1} onClick={()=>zoomTo(zoom-.25)} className="border-t border-white/10 px-3 py-1.5 text-base hover:bg-white/10 disabled:opacity-30">−</button><button aria-label="Reset map view" onClick={()=>zoomTo(1)} className="border-t border-white/10 px-2 py-2 font-mono text-[8px] hover:bg-white/10">↺</button></div>
   <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded border border-white/10 bg-[#121b22]/90 px-3 py-2 font-mono text-[8px] text-[#c0d1d9]">{Math.round(zoom*100)}% · {zoom>1?'DRAG TO EXPLORE':'ZOOM TO EXPLORE'}</div>
  </div>
  <div aria-live="polite" className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#141b21] px-4 py-3"><div><p className="text-xs text-[#d0dfdf]">{variant==='route'?routes[route].name:variant==='discovery'?`${discovered.length} of ${locations.length} districts discovered`:chosen.name}</p><p className="mt-1 text-[9px] text-[#7a909b]">{variant==='route'?'A foil trace along the selected trail':variant==='discovery'?'Click a district or marker to reveal or hide its foil':chosen.kind}</p></div><span className="font-mono text-[8px] tracking-wider text-[#65808a]">ILLUSTRATED MAP</span></div>
 </div>;
}
