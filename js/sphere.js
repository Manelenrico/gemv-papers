/* G-EMV papers: la esfera de la portada (index.html), el mismo codigo, con el numero de puntos, la distancia de enlace y la escala como parametros. Respeta prefers-reduced-motion: con reduccion de movimiento dibuja un solo fotograma. */
function gemvSphere(cv, N, LINK, SCALE) {
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // points on a sphere (Fibonacci)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pts = [];
  for (let i = 0; i < N; i++) {
    // random points on the sphere, a little thickness: organic, not a lattice
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    const s = 0.97 + rnd() * 0.05;
    pts.push([Math.cos(th) * r * s, u * s, Math.sin(th) * r * s]);
  }
  // links to near neighbours, computed once
  const links = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const dx = pts[i][0]-pts[j][0], dy = pts[i][1]-pts[j][1], dz = pts[i][2]-pts[j][2];
    if (dx*dx + dy*dy + dz*dz < LINK) links.push([i, j]);
  }
  let W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', size); size();
  const proj = new Array(N), strain = new Float32Array(N);
  // ink when calm, a warm red when strained
  // ink -> pale red -> vivid red
  const mix = (e, a) => {
    let r, g, b;
    if (e < 0.4) { const u = e / 0.4; r = 20 + 215 * u; g = 20 + 130 * u; b = 20 + 120 * u; }
    else { const u = (e - 0.4) / 0.6; r = 235 - 15 * u; g = 150 - 125 * u; b = 140 - 115 * u; }
    return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + a.toFixed(3) + ')';
  };
  function frame(ms) {
    const t = ms / 1000;
    ctx.clearRect(0, 0, W, H);
    const R = Math.min(W, H) * 0.36, cx = W / 2, cy = H / 2;
    const a = t * 0.12, b = 0.35 + Math.sin(t * 0.07) * 0.15;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    for (let i = 0; i < N; i++) {
      const [x, y, z] = pts[i];
      // slow breathing deformation: the body away from and back to its shape
      // every so often the body is pushed further from its shape, then returns
      const push = 1 + 0.45 * Math.pow(Math.max(0, Math.sin(t * 0.11)), 3);
      const dv = push * (0.10 * Math.sin(1.7 * x + t * 0.55)
                  + 0.08 * Math.sin(2.3 * y - t * 0.43)
                  + 0.06 * Math.sin(2.9 * z + t * 0.31));
      const k = 1 + dv + 0.03 * Math.sin(t * 0.9);
      // how far this point is from its balance, beyond the usual: 0 calm, 1 strained
      const e0 = Math.min(1, Math.max(0, (Math.abs(dv) - 0.12) / 0.15));
      strain[i] = e0 * e0 * (3 - 2 * e0);
      let X = x * k, Y = y * k, Z = z * k;
      let X1 = X * ca + Z * sa, Z1 = -X * sa + Z * ca;
      let Y1 = Y * cb - Z1 * sb, Z2 = Y * sb + Z1 * cb;
      const p = 3.2 / (3.2 + Z2);
      proj[i] = [cx + X1 * R * p, cy + Y1 * R * p, Z2];
    }
    ctx.lineWidth = Math.max(0.35, 0.6 * SCALE);
    for (const [i, j] of links) {
      const zi = (proj[i][2] + proj[j][2]) / 2;
      const el = (strain[i] + strain[j]) / 2;
      ctx.strokeStyle = mix(el, 0.10 + 0.22 * (1 - (zi + 1.2) / 2.4) + 0.2 * el);
      ctx.beginPath(); ctx.moveTo(proj[i][0], proj[i][1]); ctx.lineTo(proj[j][0], proj[j][1]); ctx.stroke();
    }
    for (let i = 0; i < N; i++) {
      const z = proj[i][2], near = 1 - (z + 1.2) / 2.4;
      const e = strain[i];
      ctx.fillStyle = mix(e, Math.min(1, 0.25 + 0.65 * near + 0.25 * e));
      ctx.beginPath(); ctx.arc(proj[i][0], proj[i][1], Math.max(0.45, (0.7 + 1.2 * near + 1.1 * e) * SCALE), 0, Math.PI * 2); ctx.fill();
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* la esfera pequena de la cabecera de cada paper: 150 puntos (la portada, 760), enlaces a la distancia equivalente */
(function () { var c = document.getElementById('sphere-mini'); if (c) gemvSphere(c, 150, 0.0135 * 760 / 150, 0.5); })();
