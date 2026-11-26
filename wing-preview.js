/* Compact renderer adapted from the WingBench project page's app.js.
   The mesh is its recorded nominal-load wing, without changes to the geometry. */
(() => {
  'use strict';
  const stage = document.querySelector('#wing-preview');
  const canvas = document.querySelector('#wing-preview-canvas');
  const button = stage?.querySelector('.wing-motion');
  const context = canvas?.getContext('2d');
  if (!stage || !context || !button) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  let visible = false;
  let loading = false;
  let vertices;
  let faces;
  let colors;
  let radialExtent = 1;
  let verticalExtent = 1;
  let width = 0;
  let height = 0;
  let yaw = -1.05;
  let frameId = 0;
  let lastFrame = 0;

  function draw() {
    if (!vertices || !width || !height) return;
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const ce = Math.cos(.70), se = Math.sin(.70);
    const factor = Math.min(width * .88 / radialExtent, height * .72 / verticalExtent);
    const projected = vertices.map(([x, y, z]) => {
      const xx = x * ca - y * sa, yy = x * sa + y * ca;
      return [xx, yy * se - z * ce, yy * ce + z * se];
    });
    const xs = projected.map(point => point[0]), ys = projected.map(point => point[1]);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const points = projected.map(([x, y, z]) => [(x - midX) * factor + width / 2, (y - midY) * factor + height * .46, z]);
    context.clearRect(0, 0, width, height);
    const shadow = context.createRadialGradient(width / 2, height * .83, 0, width / 2, height * .83, width * .38);
    shadow.addColorStop(0, 'rgba(38,66,89,.10)');
    shadow.addColorStop(1, 'rgba(38,66,89,0)');
    context.save();
    context.translate(width / 2, height * .83);
    context.scale(1, .12);
    context.translate(-width / 2, -height * .83);
    context.fillStyle = shadow;
    context.beginPath();
    context.arc(width / 2, height * .83, width * .38, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const ordered = faces.map((face, i) => ({face, i, z: face.reduce((sum, k) => sum + points[k][2], 0) / face.length}));
    ordered.sort((a, b) => a.z - b.z);
    context.lineJoin = 'round';
    context.lineWidth = .2;
    for (const {face, i} of ordered) {
      context.beginPath();
      face.forEach((k, j) => {
        const point = points[k];
        if (j === 0) context.moveTo(point[0], point[1]);
        else context.lineTo(point[0], point[1]);
      });
      context.closePath();
      context.fillStyle = colors[i];
      context.fill();
      context.strokeStyle = 'rgba(34,71,101,.18)';
      context.stroke();
    }
    stage.classList.add('is-ready');
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function frame(now) {
    frameId = 0;
    if (paused || !visible || document.hidden || !vertices) return;
    if (!lastFrame) lastFrame = now;
    const elapsed = now - lastFrame;
    if (elapsed >= 1000 / 30) {
      yaw = (yaw + Math.min(elapsed, 100) * .00022) % (Math.PI * 2);
      lastFrame = now;
      draw();
    }
    frameId = requestAnimationFrame(frame);
  }

  function updateMotion() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
    const label = paused ? 'Play wing animation' : 'Pause wing animation';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = paused
      ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6Z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    if (visible && !document.hidden && vertices && !paused) frameId = requestAnimationFrame(frame);
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      const response = await fetch('images/wingbench/wing.json');
      if (!response.ok) throw new Error('Wing unavailable');
      const mesh = await response.json();
      const min = [0, 1, 2].map(k => Math.min(...mesh.vertices.map(v => v[k])));
      const max = [0, 1, 2].map(k => Math.max(...mesh.vertices.map(v => v[k])));
      const center = min.map((v, k) => (v + max[k]) / 2);
      const scale = Math.max(...min.map((v, k) => max[k] - v));
      vertices = mesh.vertices.map(v => v.map((x, k) => (x - center[k]) / scale));
      radialExtent = 2 * Math.max(...vertices.map(([x, y]) => Math.hypot(x, y)));
      verticalExtent = radialExtent * Math.sin(.70) + 2 * Math.max(...vertices.map(v => Math.abs(v[2]))) * Math.cos(.70);
      faces = mesh.faces;
      colors = faces.map((face, i) => {
        const a = vertices[face[0]], b = vertices[face[1]], c = vertices[face[2]];
        const u = b.map((v, k) => v - a[k]), v = c.map((v, k) => v - a[k]);
        const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const length = Math.hypot(...normal) || 1;
        const [nx, ny, nz] = normal.map(v => v / length);
        const light = Math.max(0, Math.min(1, .35 + .53 * Math.abs(nz) + .15 * nx - .10 * ny));
        return i < faces.length / 2
          ? `rgb(${Math.round(53 + light * 78)},${Math.round(89 + light * 81)},${Math.round(117 + light * 82)})`
          : `rgb(${Math.round(38 + light * 46)},${Math.round(70 + light * 57)},${Math.round(95 + light * 63)})`;
      });
      resize();
      button.hidden = false;
      updateMotion();
    } catch {
      // The original static wing remains visible if the mesh cannot load.
      vertices = null;
      stage.classList.remove('is-ready');
      button.hidden = true;
    }
  }

  button.addEventListener('click', () => { paused = !paused; updateMotion(); });
  preference.addEventListener('change', event => { paused = event.matches; updateMotion(); });
  document.addEventListener('visibilitychange', updateMotion);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) load();
    updateMotion();
  }, {rootMargin: '80px'}).observe(stage);
})();
