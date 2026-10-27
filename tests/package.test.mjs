import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHolographicOptions, useHolographic } from "../dist/index.js";
import { HolographicShader } from "../dist/core.js";

function fixture(t, { supported = true, deferredImage = false, failedImage = false, reduced = false } = {}) {
  const names = ["window", "document", "Image", "ResizeObserver", "requestAnimationFrame", "cancelAnimationFrame"];
  const before = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => { for (const [name, descriptor] of before) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } });
  const calls = { draws: 0, deletedPrograms: 0, deletedBuffers: 0, deletedTextures: 0, observers: 0, disconnected: 0, uniforms: {} };
  const frames = new Map();
  let frame = 0;
  const images = [];
  const gl = new Proxy({
    createShader: () => ({}), getShaderParameter: () => true, createProgram: () => ({}), getProgramParameter: () => true,
    createBuffer: () => ({}), createTexture: () => ({}), getAttribLocation: () => 0, getUniformLocation: (_program, name) => name,
    uniform1f: (name, value) => { calls.uniforms[name] = value; },
    drawArrays: () => calls.draws++, deleteProgram: () => calls.deletedPrograms++, deleteBuffer: () => calls.deletedBuffers++, deleteTexture: () => calls.deletedTextures++,
  }, { get: (target, name) => name in target ? target[name] : String(name).toUpperCase() === name ? 1 : () => {} });
  const canvases = [];
  const listeners = new Map();
  const classes = new Set();
  const host = {
    clientWidth: 260, clientHeight: 370,
    append: canvas => canvases.push(canvas),
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: type => listeners.delete(type),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 260, height: 370 }),
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
  };
  Object.assign(globalThis, {
    window: { devicePixelRatio: 1, matchMedia: () => ({ matches: reduced }) },
    document: { createElement: () => { const canvas = { style: {}, width: 0, height: 0, setAttribute() {}, getContext: () => supported ? gl : null, remove() { const i = canvases.indexOf(canvas); if (i >= 0) canvases.splice(i, 1); } }; return canvas; } },
    Image: class { naturalWidth = 1; naturalHeight = 1; set src(value) { this.url = value; images.push(this); if (!deferredImage) queueMicrotask(() => failedImage ? this.onerror?.() : this.onload?.()); } },
    ResizeObserver: class { constructor() { calls.observers++; } observe() {} disconnect() { calls.disconnected++; } },
    requestAnimationFrame: callback => { frames.set(++frame, callback); return frame; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const flush = () => { const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(performance.now() + 16); };
  const create = options => new HolographicShader({ element: host, foilMap: `data:fixture-${Math.random()}`, interactive: true, ...options });
  return { create, calls, frames, canvases, images, listeners, classes, flush };
}

test("the built API imports without a browser and exposes a hook", () => {
  assert.equal(typeof window, "undefined");
  assert.equal(typeof useHolographic, "function");
  assert.equal(typeof HolographicShader, "function");
  assert.ok(readFileSync(new URL("../dist/index.js", import.meta.url), "utf8").startsWith('"use client";'));
  assert.doesNotMatch(readFileSync(new URL("../dist/core.js", import.meta.url), "utf8"), /from\s+["']react["']/);
});

test("friendly colours normalize to the correct blend modes and options reset", () => {
  assert.equal(createHolographicOptions({ effect: "liquid", colors: ["#fff"] }).colourMode, "solid");
  assert.deepEqual(createHolographicOptions({ colors: ["#fff"] }).primaryColour, [1, 1, 1]);
  assert.equal(createHolographicOptions({ colors: ["#000000", "#ffffff"] }).colourMode, "duotone");
  const options = createHolographicOptions({ effect: "splatter", colors: ["#76a92c", "#d4f778", "#f5ffd8"], scale: 2 });
  assert.equal(options.style, "splatter");
  assert.equal(options.colourMode, "tritone");
  assert.equal(options.maskScale, 1);
  assert.equal(createHolographicOptions().style, "rainbow");
  assert.throws(() => createHolographicOptions({ colors: ["pink"] }), /Invalid holographic colour/);
});

test("destroying during mask loading cannot append a ghost canvas", async t => {
  const f = fixture(t, { deferredImage: true });
  const shader = f.create();
  const pending = shader.init();
  assert.equal(f.canvases.length, 1);
  shader.destroy();
  assert.equal(f.canvases.length, 0);
  f.images[0].onload();
  assert.equal(await pending, false);
  assert.equal(f.frames.size, 0);
  assert.equal(f.calls.deletedPrograms, 1);
  assert.equal(f.calls.deletedBuffers, 1);
});

test("repeated initialization uses one canvas and complete cleanup", async t => {
  const f = fixture(t);
  const shader = f.create();
  const first = shader.init();
  assert.equal(shader.init(), first);
  assert.equal(await first, true);
  assert.equal(f.canvases.length, 1);
  assert.equal(f.listeners.size, 2);
  f.flush();
  assert.equal(f.calls.draws, 1);
  shader.destroy(); shader.destroy();
  assert.equal(f.canvases.length, 0);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.frames.size, 0);
  assert.equal(f.calls.deletedTextures, 1);
  assert.equal(f.calls.deletedPrograms, 1);
  assert.equal(f.calls.deletedBuffers, 1);
  assert.equal(f.calls.disconnected, 1);
});

test("unsupported WebGL and failed masks leave the content untouched", async t => {
  const f = fixture(t, { supported: false });
  assert.equal(await f.create().init(), false);
  assert.equal(f.canvases.length, 0);
});
test("failed mask loading releases the program and canvas", async t => {
  const f = fixture(t, { failedImage: true });
  await assert.rejects(f.create().init(), /Unable to load/);
  assert.equal(f.canvases.length, 0);
  assert.equal(f.calls.deletedPrograms, 1);
});

test("reduced motion draws once and responds to pointer and options without a loop", async t => {
  const f = fixture(t, { reduced: true });
  const shader = f.create();
  assert.equal(await shader.init(), true);
  f.flush();
  assert.equal(f.frames.size, 0);
  shader.setPointer(0.2, 0.8); f.flush();
  assert.equal(f.calls.draws, 2);
  assert.equal(f.frames.size, 0);
  shader.updateOptions({ intensity: 0.3 }); f.flush();
  assert.equal(f.calls.uniforms.u_intensity, 0.3);
  assert.equal(f.frames.size, 0);
  shader.destroy();
});

test("paused renderers do not redraw from pointer movement", async t => {
  const f = fixture(t);
  const shader = f.create(); await shader.init();
  shader.stop(); shader.setPointer(0.1, 0.9);
  assert.equal(f.frames.size, 0);
  shader.start();
  assert.equal(f.frames.size, 1);
  shader.destroy();
});
