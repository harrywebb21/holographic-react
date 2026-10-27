import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { HolographicShader } from "./shader.js";
import { fullFoilMap, normalizeEffectOptions, type HolographicEffectOptions } from "./options.js";

export interface UseHolographicOptions extends HolographicEffectOptions {
  /** Optional white/black or transparent foil mask. Omit for full coverage. */
  foilMap?: string;
  /** Removes the overlay when false. */
  enabled?: boolean;
  /** Freezes the overlay and pointer response without removing it. */
  paused?: boolean;
  /** Attach pointer interaction to another element, such as an entire card. */
  interactionRef?: RefObject<HTMLElement | null>;
}
export type HolographicStatus = "idle" | "loading" | "ready" | "unsupported" | "error";
export interface UseHolographicResult<T extends HTMLElement> {
  ref: (element: T | null) => void;
  containerStyle: CSSProperties;
  status: HolographicStatus;
  error: Error | null;
}
const containerStyle: CSSProperties = { position: "relative", isolation: "isolate", overflow: "hidden" };

export function useHolographic<T extends HTMLElement = HTMLDivElement>(options: UseHolographicOptions = {}): UseHolographicResult<T> {
  const [element, setElement] = useState<T | null>(null);
  const [state, setState] = useState<{ status: HolographicStatus; error: Error | null }>({ status: "idle", error: null });
  const instanceRef = useRef<HolographicShader | null>(null);
  const readyRef = useRef(false);
  const latest = useRef(options);
  latest.current = options;
  const ref = useCallback((node: T | null) => setElement(node), []);
  let validationError = "";
  try { normalizeEffectOptions(options); }
  catch (error) { validationError = error instanceof Error ? error.message : String(error); }
  const { enabled = true, foilMap = fullFoilMap, interactive = true, autoResize = true, interactionRef } = options;

  useEffect(() => {
    if (!element || !enabled) { setState({ status: "idle", error: null }); return; }
    if (validationError) { setState({ status: "error", error: new Error(validationError) }); return; }
    let active = true;
    let instance: HolographicShader;
    try {
      instance = new HolographicShader({ ...normalizeEffectOptions(latest.current), element, foilMap, interactionElement: interactionRef?.current ?? element, interactive, autoResize });
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) });
      return;
    }
    instanceRef.current = instance;
    readyRef.current = false;
    setState({ status: "loading", error: null });
    const visibility = () => {
      if (!readyRef.current) return;
      if (document.hidden || latest.current.paused) instance.stop();
      else instance.start();
    };
    document.addEventListener("visibilitychange", visibility);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => { if (latest.current.reducedMotion === undefined) instance.updateOptions({ reducedMotion: media.matches }); };
    media.addEventListener("change", motion);
    void instance.init().then(supported => {
      if (!active) return;
      readyRef.current = supported;
      setState({ status: supported ? "ready" : "unsupported", error: null });
      visibility();
    }).catch(error => {
      if (active) setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) });
    });
    return () => {
      active = false;
      readyRef.current = false;
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", motion);
      instance.destroy();
      if (instanceRef.current === instance) instanceRef.current = null;
    };
  }, [element, enabled, foilMap, interactive, autoResize, interactionRef, validationError]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    try {
      const { interactive: _interactive, autoResize: _autoResize, ...liveOptions } = normalizeEffectOptions(options);
      instance.updateOptions(liveOptions);
      if (options.paused || document.hidden) instance.stop();
      else if (readyRef.current) instance.start();
    } catch (error) {
      instance.stop();
      setState(current => current.status === "error" ? current : { status: "error", error: error instanceof Error ? error : new Error(String(error)) });
    }
  });
  return { ref, containerStyle, ...state };
}
