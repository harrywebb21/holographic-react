import { useState } from "react";
import { useHolographic, type HolographicPattern } from "holographic-react";

export function FoilCard() {
  const [effect, setEffect] = useState<HolographicPattern>("liquid");
  const [intensity, setIntensity] = useState(0.7);
  const { ref, containerStyle, status, error } = useHolographic({
    effect,
    colors: ["#76a92c", "#d4f778", "#f5ffd8"],
    intensity,
    density: 0.9,
  });

  return <section>
    <div ref={ref} style={{ ...containerStyle, width: 260, height: 370, borderRadius: 16, background: "#15201a", color: "white" }}>
      <h2 style={{ padding: 24 }}>Your card</h2>
    </div>
    <label>Effect <select value={effect} onChange={event => setEffect(event.target.value as HolographicPattern)}>
      <option value="liquid">Liquid</option><option value="stars">Stars</option><option value="splatter">Splatter</option>
    </select></label>
    <label>Intensity <input type="range" min={0} max={1} step={0.1} value={intensity} onChange={event => setIntensity(event.target.valueAsNumber)} /></label>
    {status === "unsupported" && <p>WebGL is unavailable. The card content still works.</p>}
    {error && <p role="alert">{error.message}</p>}
  </section>;
}
