'use client';

import { useEffect, useRef } from 'react';

// Dependency-free WebGL flowing-gradient backdrop. A full-screen fragment
// shader animates a soft color field mixed from the active theme's --primary
// plus two accent hues. Robust by design: if WebGL is unavailable or shader
// compilation fails it silently renders nothing (the CSS .b-aurora behind it
// remains the fallback). Honors prefers-reduced-motion (renders one static
// frame instead of animating).

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  float t = uT * 0.08;
  float a = sin(uv.x * 3.0 + t) + sin(uv.y * 2.5 - t * 1.2);
  float b = sin((uv.x + uv.y) * 2.0 + t * 0.7);
  float m = (a + b) * 0.25 + 0.5;
  vec3 col = mix(uC1, uC2, smoothstep(0.15, 0.85, m));
  float g = sin(uv.y * 2.2 - t) * 0.5 + 0.5;
  col = mix(col, uC3, smoothstep(0.5, 1.0, g) * 0.45);
  float d = distance(uv, vec2(0.5));
  col *= 1.0 - d * 0.55;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Read a CSS color string → normalized RGB via a 1×1 canvas (handles oklch). */
function cssToRgb(color: string): [number, number, number] {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d');
    if (!ctx) return [0.4, 0.3, 0.9];
    ctx.fillStyle = '#000';
    ctx.fillStyle = color; // ignored if invalid → stays #000
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  } catch {
    return [0.4, 0.3, 0.9];
  }
}

function primaryRgb(): [number, number, number] {
  const probe = document.createElement('div');
  probe.style.color = 'var(--primary)';
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const col = getComputedStyle(probe).color;
  probe.remove();
  return cssToRgb(col || 'oklch(0.55 0.18 265)');
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function WebglGradient({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false }) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Full-screen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uT = gl.getUniformLocation(prog, 'uT');
    const uC1 = gl.getUniformLocation(prog, 'uC1');
    const uC2 = gl.getUniformLocation(prog, 'uC2');
    const uC3 = gl.getUniformLocation(prog, 'uC3');

    const applyColors = () => {
      const c1 = primaryRgb();
      gl.uniform3f(uC1, c1[0], c1[1], c1[2]);
      gl.uniform3f(uC2, 0.545, 0.361, 0.965); // #8b5cf6 violet
      gl.uniform3f(uC3, 0.925, 0.286, 0.6); // #ec4899 pink
    };
    applyColors();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let running = false;
    let elapsed = 0; // ms of *animated* time (excludes paused spans → no jump on resume)
    let last = 0;
    let onScreen = true;

    const draw = () => {
      gl.uniform1f(uT, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      // Cap DPR at 1.5: the field is soft/blurred, so extra device pixels are
      // wasted fill-rate (≈44% fewer fragment ops than 2× on retina displays).
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      if (!running) draw(); // keep the paused/static frame correct after a resize
    };
    const frame = (now: number) => {
      elapsed += now - last;
      last = now;
      draw();
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    // Only burn GPU while the hero canvas is on-screen AND the tab is visible.
    const sync = () => (onScreen && !document.hidden ? play() : pause());

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(canvas);
    const onVis = () => sync();
    document.addEventListener('visibilitychange', onVis);

    if (reduced) draw(); // one static frame, no loop
    else play();

    // Re-tint when the theme (class/attribute) changes (redraw if currently paused).
    const mo = new MutationObserver(() => {
      applyColors();
      if (!running) draw();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
