// Procedural 3D models for the store's products. Each model fills the box
// w × h × d given by the product's dimensions, standing on y = 0 and facing +z.
import * as THREE from 'three';

// Which model a product uses, from its name (and model name for variants).
export function realKind(name, model = '') {
  const n = (name + ' ' + model).toLowerCase();
  const t = [
    [/snack inox/, 'snackstand'], [/chawarma|shawarma/, 'shawarma'], [/friteuse/, 'fryer'], [/égouttoir|goutiar/, 'drainer'],
    [/coupe-frites|batata/, 'cutter'], [/tornado/, 'tornado'], [/panineuse|panini/, 'panini'], [/presse burger/, 'burgerpress'],
    [/grill/, 'grill'], [/plaque chauffante/, 'griddle'], [/salamandre/, 'salamander'], [/crêpière|crepiere/, 'crepe'],
    [/krampouz/, 'crepekit'], [/gaufrier|donuts|pancakes|cornets/, 'waffle'], [/machine à jus|sorbet/, 'dispenser'],
    [/centrifugeuse/, 'juicer'], [/mixeur/, 'blender'], [/percolateur|norvégienne/, 'urn'], [/bain-marie/, 'bainmarie'],
    [/four/, 'oven'], [/réchaud/, 'stove'], [/barbe à papa/, 'candyfloss'], [/popcorn/, 'popcorn'], [/fontaine à chocolat/, 'fountain'],
    [/hachoir/, 'mincer'], [/pondeuse|batteur/, 'planetary'], [/pétrin/, 'spiral'], [/robot|presmafood/, 'robot'],
    [/bac inox|gastro/, 'gastro'], [/chariot/, 'trolley'], [/hotte/, 'hood'], [/planche/, 'board'], [/plaque alu/, 'tray'],
    [/frigo/, 'drinksfridge'], [/vitrine/, 'showcase'], [/glaçons/, 'icemaker'], [/caisse/, 'till'], [/churros/, 'churros'],
    [/port moungi|marmite/, 'pot'],
  ];
  for (const [re, k] of t) if (re.test(n)) return k;
  return 'block';
}

const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5, metalness: 0 }, o));
const X = {
  steel: mat(0xc9cfd3, { metalness: 0.85, roughness: 0.3 }), steelL: mat(0xe6eaec, { metalness: 0.8, roughness: 0.18 }),
  steelD: mat(0x8d969b, { metalness: 0.85, roughness: 0.4 }), black: mat(0x1b1e21, { roughness: 0.55 }), iron: mat(0x0d0e10, { roughness: 0.5 }),
  white: mat(0xf1f2f0, { roughness: 0.4 }), red: mat(0xc0322a, { roughness: 0.4 }), blue: mat(0x2d6fd0, { roughness: 0.4 }),
  oil: mat(0xe0a020, { roughness: 0.15, metalness: 0.2 }), glass: mat(0xd6eef7, { transparent: true, opacity: 0.25, roughness: 0.05 }),
  glow: mat(0xeaf6ff, { emissive: 0xcfeeff, emissiveIntensity: 0.5 }), lamp: mat(0xffb46b, { emissive: 0xff8a30, emissiveIntensity: 1.1 }),
  heat: mat(0xff5a1f, { emissive: 0xff3a10, emissiveIntensity: 0.9 }), meat: mat(0x9a4a2a, { roughness: 0.7 }),
  juiceO: mat(0xf39a1e, { transparent: true, opacity: 0.8, roughness: 0.1 }), juiceR: mat(0xd0303a, { transparent: true, opacity: 0.8, roughness: 0.1 }),
  juiceG: mat(0x7cc242, { transparent: true, opacity: 0.8, roughness: 0.1 }), choc: mat(0x4a2614, { roughness: 0.25 }),
  wood: mat(0xb5834f, { roughness: 0.7 }), stone: mat(0x1a1c1f, { roughness: 0.15, metalness: 0.2 }), pink: mat(0xf2a0c4, { roughness: 0.4 }),
  yellow: mat(0xf3c330, { roughness: 0.4 }), green: mat(0x4f9a3a, { roughness: 0.5 }), plastic: mat(0xe7e3d6, { roughness: 0.45 }),
};

export function buildReal(g, kind, w, h, d) {
  const B = (W, H, D, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(Math.max(W, 0.004), Math.max(H, 0.004), Math.max(D, 0.004)), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const C = (r, H, m, x, y, z, rx = 0, rz = 0, seg = 28, r2) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 == null ? r : r2, H, seg), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = true; g.add(o); return o; };
  const knobs = (n, y, z, x0 = -w * 0.3, x1 = w * 0.3, m = X.black) => { for (let i = 0; i < n; i++) C(Math.min(0.025, w / 12), 0.025, m, n === 1 ? 0 : x0 + (x1 - x0) * i / (n - 1), y, z, Math.PI / 2, 0, 16); };
  const feet = (hh = 0.04) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(0.018, hh, X.black, sx * (w / 2 - 0.04), hh / 2, sz * (d / 2 - 0.04), 0, 0, 10); return hh; };
  const legs = (top) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(0.04, top, 0.04, X.steel, sx * (w / 2 - 0.03), top / 2, sz * (d / 2 - 0.03)); B(w - 0.06, 0.02, d - 0.06, X.steel, 0, Math.min(0.18, top * 0.25), 0); };
  const cab = (top, doors = 2) => { B(w, top - 0.06, d, X.steel, 0, (top - 0.06) / 2 + 0.06, 0); feet(0.06);
    const dw = w / doors; for (let i = 0; i < doors; i++) { const cx = -w / 2 + dw * (i + 0.5); B(dw - 0.03, top - 0.2, 0.012, X.steelL, cx, top / 2 + 0.03, d / 2 + 0.006); B(0.015, Math.min(0.2, top * 0.3), 0.02, X.black, cx + dw / 2 - 0.06, top * 0.55, d / 2 + 0.02); } };
  const n = (s) => Math.max(1, Math.round(s));

  switch (kind) {
    case 'fryer': { // counter or floor fryer, one tank per 30 cm
      const floor = h > 0.7, base = floor ? h - 0.32 : 0; if (floor) cab(base);
      const bh = floor ? 0.32 : h, tanks = n(w / 0.3);
      B(w, bh * 0.7, d, X.steel, 0, base + bh * 0.35, 0); B(w, 0.012, d, X.steelL, 0, base + bh * 0.7, 0);
      for (let i = 0; i < tanks; i++) { const cx = -w / 2 + w * (i + 0.5) / tanks, tw = w / tanks - 0.05;
        B(tw, 0.01, d * 0.55, X.oil, cx, base + bh * 0.705, d * 0.08);
        B(tw * 0.9, 0.06, d * 0.45, X.steelD, cx, base + bh * 0.74, d * 0.08);
        C(0.01, d * 0.35, X.black, cx, base + bh * 0.8, d * 0.38, Math.PI / 2.4);
        B(tw, bh * 0.28, d * 0.22, X.steelL, cx, base + bh * 0.84, -d / 2 + d * 0.11);
        C(0.02, 0.02, X.black, cx, base + bh * 0.84, -d / 2 + d * 0.22 + 0.01, Math.PI / 2, 0, 14);
        B(0.015, 0.015, 0.01, X.heat, cx + tw * 0.25, base + bh * 0.9, -d / 2 + d * 0.22 + 0.005); }
      break; }
    case 'griddle': case 'grill': {
      const floor = h > 0.7, base = floor ? h - 0.25 : 0; if (floor) cab(base); const bh = floor ? 0.25 : h;
      B(w, bh * 0.6, d, X.steel, 0, base + bh * 0.3, 0);
      B(w - 0.04, 0.025, d - 0.12, X.iron, 0, base + bh * 0.6 + 0.012, 0.03);
      if (kind === 'grill') for (let i = 0; i < n((w - 0.08) / 0.03); i++) B(0.012, 0.015, d - 0.16, X.steelD, -w / 2 + 0.05 + i * 0.03, base + bh * 0.6 + 0.032, 0.03);
      B(w, bh * 0.35, 0.02, X.steelL, 0, base + bh * 0.6 + bh * 0.17, -d / 2 + 0.01);
      for (const s of [-1, 1]) B(0.012, bh * 0.25, d - 0.04, X.steelL, s * (w / 2 - 0.006), base + bh * 0.72, 0);
      B(w - 0.02, bh * 0.4, 0.01, X.red, 0, base + bh * 0.3, d / 2 + 0.003);
      knobs(n(w / 0.25), base + bh * 0.3, d / 2 + 0.015); break; }
    case 'panini': {
      B(w, h * 0.35, d, X.steel, 0, h * 0.175, 0); B(w - 0.02, h * 0.28, 0.01, X.red, 0, h * 0.17, d / 2 + 0.003); knobs(w > 0.5 ? 2 : 1, h * 0.17, d / 2 + 0.015);
      B(w - 0.04, 0.02, d - 0.08, X.iron, 0, h * 0.36, 0.01);
      for (let i = 0; i < 12; i++) B(0.008, 0.01, d - 0.1, X.black, -w / 2 + 0.04 + i * (w - 0.08) / 11, h * 0.38, 0.01);
      const lid = new THREE.Group(); lid.position.set(0, h * 0.4, -d / 2 + 0.04); lid.rotation.x = -1; g.add(lid);
      const L = d - 0.06; const lb = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.05, L), X.steelL); lb.position.set(0, 0, L / 2); lb.castShadow = true; lid.add(lb);
      const li = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.015, L), X.iron); li.position.set(0, -0.03, L / 2); lid.add(li);
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, w * 0.8, 12), X.black); hd.rotation.z = Math.PI / 2; hd.position.set(0, 0.07, L); lid.add(hd); break; }
    case 'shawarma': {
      B(w, h * 0.18, d, X.steel, 0, h * 0.09, 0); B(w - 0.04, 0.02, d - 0.05, X.steelD, 0, h * 0.185, 0.01);
      C(0.02, 0.02, X.red, w * 0.3, h * 0.08, d / 2 + 0.01, Math.PI / 2, 0, 14);
      const ph = h * 0.75, pz = -d / 2 + 0.08; B(w * 0.5, ph, 0.08, X.steel, 0, h * 0.2 + ph / 2, pz);
      for (let i = 0; i < 4; i++) B(w * 0.36, ph / 4 - 0.03, 0.01, X.heat, 0, h * 0.2 + ph * (i + 0.5) / 4, pz + 0.045);
      for (const s of [-1, 1]) { const dr = B(w * 0.2, ph, 0.015, X.white, s * w * 0.33, h * 0.2 + ph / 2, pz + 0.08); dr.rotation.y = s * 0.5; }
      B(0.06, ph, 0.05, X.red, w / 2 - 0.05, h * 0.2 + ph / 2, pz);
      C(0.012, h * 0.85, X.steelL, 0, h * 0.2 + h * 0.4, pz + 0.22);
      C(Math.min(0.13, w * 0.18), ph * 0.7, X.meat, 0, h * 0.2 + ph * 0.45, pz + 0.22, 0, 0, 24, Math.min(0.09, w * 0.12));
      C(0.08, 0.008, X.steelL, 0, h * 0.21, pz + 0.22); break; }
    case 'salamander': {
      B(w, h, d * 0.9, X.steel, 0, h / 2, -d * 0.05); B(w - 0.06, h * 0.55, 0.01, X.iron, -0.05, h * 0.45, d * 0.4);
      B(w - 0.1, h * 0.06, 0.01, X.heat, -0.05, h * 0.68, d * 0.41); B(w - 0.12, 0.01, d * 0.6, X.steelD, -0.05, h * 0.3, 0.05);
      B(0.12, h * 0.8, 0.01, X.black, w / 2 - 0.07, h * 0.5, d * 0.41); knobs(2, h * 0.6, d * 0.42, w / 2 - 0.07, w / 2 - 0.07); break; }
    case 'crepe': {
      const plates = n(w / 0.42); B(w, h * 0.7, d, X.black, 0, h * 0.35, 0);
      for (let i = 0; i < plates; i++) { const cx = -w / 2 + w * (i + 0.5) / plates; C(Math.min(d, w / plates) * 0.46, 0.03, X.iron, cx, h * 0.7 + 0.015, 0, 0, 0, 40); }
      B(w * 0.5, 0.06, 0.01, X.blue, 0, h * 0.4, d / 2 + 0.003); knobs(plates, h * 0.25, d / 2 + 0.015); break; }
    case 'crepekit': { B(w * 0.9, 0.012, d * 0.2, X.wood, 0, 0.006, -d * 0.2); C(0.01, d * 0.6, X.wood, w * 0.2, 0.02, 0.05, Math.PI / 2); B(w * 0.5, 0.004, 0.08, X.steelL, -w * 0.15, 0.004, d * 0.25); break; }
    case 'waffle': {
      B(w, h * 0.35, d, X.steel, 0, h * 0.175, 0); B(w - 0.02, h * 0.25, 0.01, X.black, 0, h * 0.17, d / 2 + 0.003); knobs(2, h * 0.17, d / 2 + 0.015, -w * 0.2, w * 0.2, X.steelL);
      const plates = w > 0.45 ? 2 : 1;
      for (let i = 0; i < plates; i++) { const cx = plates === 1 ? 0 : (i ? 1 : -1) * w * 0.24, pw = plates === 1 ? w - 0.08 : w * 0.42;
        B(pw, 0.03, d * 0.55, X.iron, cx, h * 0.37, d * 0.1);
        const lid = new THREE.Group(); lid.position.set(cx, h * 0.39, -d * 0.18); lid.rotation.x = -1.2; g.add(lid);
        const lb = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.04, d * 0.55), X.iron); lb.position.set(0, 0, d * 0.27); lb.castShadow = true; lid.add(lb);
        const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.16, 10), X.wood); hd.rotation.x = Math.PI / 2; hd.position.set(0, 0, d * 0.6); lid.add(hd); }
      break; }
    case 'dispenser': { // juice / slush machine: one bowl per ~22 cm
      const bowls = Math.min(4, n(w / 0.22)), bh = h * 0.35; B(w, bh, d, X.steel, 0, bh / 2, 0); B(w, 0.04, d * 0.35, X.steelD, 0, 0.02, d * 0.3);
      for (let i = 0; i < bowls; i++) { const cx = -w / 2 + w * (i + 0.5) / bowls, bw = w / bowls - 0.03;
        B(bw, h * 0.55, d * 0.85, X.glass, cx, bh + h * 0.275, 0); B(bw - 0.02, h * 0.4, d * 0.8, [X.juiceO, X.juiceR, X.juiceG][i % 3], cx, bh + h * 0.2, 0);
        B(bw, h * 0.05, d * 0.86, X.black, cx, bh + h * 0.575, 0);
        B(0.05, 0.08, 0.05, X.red, cx, bh - 0.02, d / 2 + 0.02); B(0.02, 0.07, 0.03, X.red, cx, bh + 0.04, d / 2 + 0.04); }
      break; }
    case 'juicer': case 'blender': {
      const bh = h * 0.35; B(w * 0.8, bh, d * 0.8, kind === 'juicer' ? X.steel : X.black, 0, bh / 2, 0); knobs(1, bh * 0.5, d * 0.4 + 0.01, 0, 0, X.steelL);
      if (kind === 'juicer') { C(w * 0.36, h * 0.35, X.glass, 0, bh + h * 0.17, 0); C(w * 0.1, h * 0.3, X.steelL, 0, bh + h * 0.45, 0); C(0.02, 0.06, X.steelL, 0, bh * 0.8, d * 0.45, Math.PI / 2); }
      else { C(w * 0.3, h * 0.55, X.glass, 0, bh + h * 0.28, 0, 0, 0, 20, w * 0.22); C(w * 0.26, h * 0.3, X.juiceR, 0, bh + h * 0.16, 0, 0, 0, 20, w * 0.21); C(w * 0.31, 0.04, X.black, 0, bh + h * 0.57, 0); }
      break; }
    case 'urn': case 'pot': {
      const r = Math.min(w, d) / 2 - 0.01, gas = kind === 'urn' && h > 0.75;
      C(r, h * 0.88, X.steel, 0, h * 0.44, 0, 0, 0, 36); C(r * 1.03, 0.03, X.steelL, 0, h * 0.89, 0, 0, 0, 36); C(r * 0.95, 0.04, X.steelL, 0, h * 0.92, 0, 0, 0, 36);
      C(0.03, 0.04, X.black, 0, h * 0.96, 0, 0, 0, 12);
      for (const s of [-1, 1]) B(0.03, 0.04, 0.12, X.black, s * (r + 0.02), h * 0.8, 0);
      if (kind === 'urn') { C(0.015, 0.08, X.steelL, 0, h * 0.15, r + 0.04, Math.PI / 2); B(0.03, 0.05, 0.03, X.black, 0, h * 0.17, r + 0.08); }
      if (gas || kind === 'urn') C(r * 1.02, h * 0.1, X.steelD, 0, h * 0.05, 0, 0, 0, 36);
      break; }
    case 'bainmarie': {
      const pans = n(w / 0.32); B(w, h * 0.8, d, X.steel, 0, h * 0.4, 0); B(w, 0.012, d, X.steelL, 0, h * 0.8, 0);
      for (let i = 0; i < pans; i++) { const cx = -w / 2 + w * (i + 0.5) / pans; B(w / pans - 0.04, 0.02, d - 0.1, X.steelD, cx, h * 0.81, 0); B(w / pans - 0.05, 0.05, d - 0.12, X.glass, cx, h * 0.85, 0); }
      knobs(1, h * 0.4, d / 2 + 0.015, w * 0.35, w * 0.35, X.red); break; }
    case 'oven': {
      const decks = h > 1.1 ? 2 : 1, ob = h > 1.1 ? h * 0.25 : 0; if (ob) legs(ob);
      const dh = (h - ob) / decks;
      for (let k = 0; k < decks; k++) { const y0 = ob + k * dh;
        B(w, dh - 0.01, d, X.steel, 0, y0 + dh / 2, 0); B(w * 0.72, dh * 0.7, 0.015, X.black, -w * 0.12, y0 + dh * 0.5, d / 2 + 0.006);
        B(w * 0.66, dh * 0.55, 0.01, X.lamp, -w * 0.12, y0 + dh * 0.5, d / 2 + 0.002);
        for (let i = 0; i < 3; i++) B(w * 0.6, 0.006, d * 0.7, X.steelD, -w * 0.12, y0 + dh * (0.3 + i * 0.2), 0);
        B(w * 0.2, dh * 0.8, 0.012, X.black, w * 0.37, y0 + dh * 0.5, d / 2 + 0.006); knobs(3, 0, 0); for (let i = 0; i < 3; i++) C(0.022, 0.025, X.steelL, w * 0.37, y0 + dh * (0.25 + i * 0.25), d / 2 + 0.02, Math.PI / 2, 0, 14);
        B(w * 0.5, 0.02, 0.03, X.steelL, -w * 0.12, y0 + dh * 0.92, d / 2 + 0.03); }
      break; }
    case 'stove': { B(w, h * 0.7, d, X.steel, 0, h * 0.35, 0); C(Math.min(w, d) * 0.25, 0.03, X.iron, 0, h * 0.72, 0); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; B(0.012, 0.03, Math.min(w, d) * 0.5, X.iron, 0, h * 0.75, 0).rotation.y = a; } knobs(1, h * 0.35, d / 2 + 0.015, 0, 0, X.red); break; }
    case 'candyfloss': { B(w * 0.7, h * 0.4, d * 0.6, X.pink, 0, h * 0.2, d * 0.15); B(w * 0.5, h * 0.15, 0.01, X.white, 0, h * 0.22, d * 0.45 + 0.005); C(Math.min(w, d) * 0.47, h * 0.35, X.steelL, 0, h * 0.55, 0, 0, 0, 40, Math.min(w, d) * 0.4); C(Math.min(w, d) * 0.15, h * 0.1, X.pink, 0, h * 0.7, 0); break; }
    case 'popcorn': {
      B(w, h * 0.08, d, X.red, 0, h * 0.04, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(0.025, h * 0.72, 0.025, X.steel, sx * (w / 2 - 0.02), h * 0.44, sz * (d / 2 - 0.02));
      B(w - 0.02, h * 0.6, d - 0.02, X.glass, 0, h * 0.42, 0); B(w - 0.06, h * 0.12, d - 0.06, X.yellow, 0, h * 0.14, 0);
      C(Math.min(w, d) * 0.22, h * 0.15, X.steelL, 0, h * 0.6, 0); B(w, h * 0.12, d, X.yellow, 0, h * 0.86, 0);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.12, 4), X.red); roof.rotation.y = Math.PI / 4; roof.position.y = h * 0.98; roof.castShadow = true; g.add(roof); break; }
    case 'fountain': { const r = Math.min(w, d) / 2; C(r * 0.8, h * 0.25, X.steel, 0, h * 0.125, 0, 0, 0, 32); C(r, 0.05, X.choc, 0, h * 0.27, 0, 0, 0, 32);
      for (let i = 0; i < 4; i++) { const y = h * (0.4 + i * 0.15), rr = r * (0.75 - i * 0.15); C(rr, 0.02, X.choc, 0, y, 0, 0, 0, 28); C(rr * 0.9, h * 0.12, X.choc, 0, y - h * 0.065, 0, 0, 0, 24, rr * 0.3); }
      C(0.02, h * 0.7, X.steelL, 0, h * 0.6, 0); break; }
    case 'mincer': {
      const floor = h > 0.75, base = floor ? h - 0.45 : 0; if (floor) cab(base, 1); const bh = h - base;
      B(w * 0.6, bh * 0.45, d * 0.8, X.steel, 0, base + bh * 0.225, 0); C(Math.min(w, d) * 0.12, d * 0.55, X.steelL, 0, base + bh * 0.58, d * 0.15, Math.PI / 2);
      C(Math.min(w, d) * 0.14, 0.03, X.steelD, 0, base + bh * 0.58, d * 0.44, Math.PI / 2); C(0.05, bh * 0.25, X.steelL, 0, base + bh * 0.75, 0);
      B(w * 0.8, 0.02, d * 0.5, X.steelL, 0, base + bh * 0.9, 0); B(0.02, 0.03, 0.01, X.red, w * 0.25, base + bh * 0.3, d * 0.4 + 0.005); break; }
    case 'planetary': {
      const r = Math.min(w, d) * 0.3; B(w * 0.8, h * 0.08, d * 0.9, X.white, 0, h * 0.04, 0); B(w * 0.35, h * 0.7, d * 0.3, X.white, 0, h * 0.4, -d * 0.3);
      B(w * 0.6, h * 0.22, d * 0.8, X.white, 0, h * 0.86, 0.02); B(w * 0.3, 0.04, 0.01, X.red, 0, h * 0.86, d * 0.42 + 0.01);
      C(r, h * 0.3, X.steelL, 0, h * 0.33, d * 0.08, 0, 0, 32, r * 0.75); C(r * 0.95, h * 0.28, X.steelD, 0, h * 0.5, d * 0.08, 0, 0, 16).material = new THREE.MeshStandardMaterial({ color: 0xc9cfd3, metalness: 0.8, roughness: 0.3, wireframe: true });
      C(0.03, h * 0.12, X.steel, 0, h * 0.69, d * 0.08); break; }
    case 'spiral': {
      const r = Math.min(w, d) * 0.42; B(w * 0.9, h * 0.35, d * 0.9, X.white, 0, h * 0.175, 0);
      C(r, h * 0.28, X.steelL, 0, h * 0.49, d * 0.04, 0, 0, 36); C(r * 0.92, 0.02, X.plastic, 0, h * 0.62, d * 0.04, 0, 0, 30);
      B(w * 0.35, h * 0.55, d * 0.3, X.white, 0, h * 0.62, -d * 0.32); B(w * 0.7, h * 0.2, d * 0.65, X.white, 0, h * 0.89, -d * 0.08);
      B(w * 0.4, h * 0.08, 0.01, X.blue, 0, h * 0.9, d * 0.25 + 0.005); C(0.025, 0.02, X.red, w * 0.12, h * 0.9, d * 0.26, Math.PI / 2, 0, 14);
      C(0.015, h * 0.3, X.steelD, 0, h * 0.62, d * 0.04, 0, 0.4); break; }
    case 'robot': { B(w * 0.8, h * 0.4, d * 0.8, X.steel, 0, h * 0.2, 0); C(Math.min(w, d) * 0.33, h * 0.4, X.glass, 0, h * 0.6, 0); C(Math.min(w, d) * 0.34, 0.03, X.black, 0, h * 0.81, 0); C(0.04, h * 0.18, X.black, w * 0.15, h * 0.88, 0); knobs(2, h * 0.2, d * 0.4 + 0.01, -0.04, 0.04, X.red); break; }
    case 'gastro': { const wall = 0.008; B(w, 0.012, d, X.steelL, 0, h - 0.006, 0); B(w - 0.02, wall, d - 0.02, X.steel, 0, wall / 2, 0);
      for (const s of [-1, 1]) { B(wall, h, d - 0.02, X.steel, s * (w / 2 - 0.01), h / 2, 0); B(w - 0.02, h, wall, X.steel, 0, h / 2, s * (d / 2 - 0.01)); } break; }
    case 'trolley': {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B(0.025, h - 0.1, 0.025, X.steel, sx * (w / 2 - 0.02), 0.1 + (h - 0.1) / 2, sz * (d / 2 - 0.02)); C(0.04, 0.03, X.black, sx * (w / 2 - 0.04), 0.045, sz * (d / 2 - 0.04), 0, Math.PI / 2, 14); }
      const lv = h > 0.6 ? 3 : 1; for (let i = 0; i < lv; i++) B(w, 0.025, d, X.steelL, 0, lv === 1 ? 0.12 : 0.15 + i * (h - 0.25) / (lv - 1), 0);
      C(0.014, w * 0.9, X.steel, 0, h - 0.02, -d / 2 + 0.02, 0, Math.PI / 2, 10); break; }
    case 'hood': {
      B(w, h * 0.7, d, X.steel, 0, h * 0.65, 0); B(w, h * 0.3, d, X.steelL, 0, h * 0.15, 0);
      for (let i = 0; i < n(w / 0.5); i++) B(0.45, 0.01, d * 0.5, X.steelD, -w / 2 + 0.27 + i * 0.5, 0.004, 0);
      B(w - 0.06, 0.012, 0.012, X.lamp, 0, 0.005, d / 2 - 0.04); break; }
    case 'board': B(w, h, d, X.white, 0, h / 2, 0); B(w * 0.7, 0.002, 0.02, X.blue, 0, h + 0.001, -d * 0.4); break;
    case 'tray': B(w, Math.max(h, 0.015), d, X.steelL, 0, Math.max(h, 0.015) / 2, 0); break;
    case 'drinksfridge': case 'showcase': {
      if (kind === 'drinksfridge') { B(w, h, d, X.white, 0, h / 2, 0); B(w - 0.08, h * 0.75, 0.01, X.glow, 0, h * 0.42, d / 2 - 0.015); B(w - 0.04, h * 0.8, 0.015, X.glass, 0, h * 0.42, d / 2 + 0.006);
        for (let i = 1; i < 4; i++) { B(w - 0.12, 0.01, d - 0.12, X.steelD, 0, h * 0.06 + i * h * 0.19, 0); for (let k = 0; k < 4; k++) C(0.03, 0.12, [X.red, X.juiceO, X.green, X.blue][k], -w / 2 + 0.12 + k * (w - 0.24) / 3, h * 0.06 + i * h * 0.19 + 0.07, 0, 0, 0, 12); }
        B(w, h * 0.12, d, X.blue, 0, h * 0.94, 0); }
      else { const bh = h * 0.55; B(w, bh, d, X.white, 0, bh / 2, 0); B(w - 0.04, h * 0.42, d - 0.06, X.glass, 0, bh + h * 0.21, 0);
        B(w - 0.06, 0.01, d - 0.12, X.glow, 0, bh + 0.01, 0); B(w - 0.06, 0.01, d * 0.6, X.glass, 0, bh + h * 0.22, -d * 0.1); B(w, 0.03, d * 0.5, X.white, 0, h - 0.015, -d * 0.2);
        for (let k = 0; k < 4; k++) B((w - 0.2) / 4 - 0.04, 0.05, 0.2, k % 2 ? X.meat : X.yellow, -w / 2 + 0.1 + (k + 0.5) * (w - 0.2) / 4, bh + 0.04, 0.05); }
      break; }
    case 'icemaker': { B(w, h, d, X.steel, 0, h / 2, 0); B(w * 0.8, h * 0.35, 0.012, X.black, 0, h * 0.7, d / 2 + 0.006); B(w * 0.75, h * 0.3, 0.008, X.glass, 0, h * 0.7, d / 2 + 0.012);
      B(w * 0.3, 0.05, 0.01, X.blue, 0, h * 0.45, d / 2 + 0.006); B(w, 0.03, d, X.white, 0, h - 0.015, 0); break; }
    case 'till': { B(w, h - 0.04, d, X.black, 0, (h - 0.04) / 2, 0); B(w + 0.04, 0.04, d + 0.04, X.stone, 0, h - 0.02, 0);
      B(w * 0.5, h * 0.25, 0.005, X.white, 0, h * 0.55, d / 2 + 0.003); B(w * 0.3, 0.03, 0.005, X.white, 0, h * 0.42, d / 2 + 0.003); break; }
    case 'churros': { B(w, 0.02, d, X.steelL, 0, 0.01, 0); for (const s of [-1, 1]) B(0.03, h, 0.03, X.steel, s * (w / 2 - 0.03), h / 2, -d * 0.2);
      C(Math.min(w, d) * 0.25, h * 0.45, X.steelL, 0, h * 0.4, 0.02); B(w, 0.03, 0.05, X.steel, 0, h * 0.95, -d * 0.2); C(0.012, h * 0.3, X.steelL, 0, h * 0.8, 0.02); B(0.12, 0.02, 0.02, X.black, 0.06, h * 0.97, 0.02); break; }
    case 'burgerpress': { B(w, 0.03, d, X.steelD, 0, 0.015, 0); C(Math.min(w, d) * 0.35, h * 0.15, X.steelL, 0, h * 0.12, d * 0.1); C(0.025, h * 0.8, X.steel, 0, h * 0.45, -d * 0.35);
      C(Math.min(w, d) * 0.33, 0.05, X.steelL, 0, h * 0.55, d * 0.1); B(0.03, 0.03, d * 0.7, X.black, w * 0.3, h * 0.8, 0).rotation.x = -0.3; break; }
    case 'tornado': { B(w, 0.02, d, X.white, 0, 0.01, 0); for (const s of [-1, 1]) B(0.02, h * 0.8, d * 0.8, X.white, s * (w / 2 - 0.02), h * 0.4, 0);
      C(0.008, w * 0.9, X.steelL, 0, h * 0.5, 0, 0, Math.PI / 2, 8); C(0.04, 0.05, X.yellow, -w * 0.1, h * 0.5, 0, 0, Math.PI / 2, 16); B(0.02, 0.1, 0.02, X.black, w / 2 + 0.02, h * 0.55, 0); break; }
    case 'drainer': { B(w, h * 0.55, d, X.steel, 0, h * 0.275, 0); B(w - 0.04, 0.01, d - 0.04, X.yellow, 0, h * 0.56, 0); B(0.03, h * 0.4, 0.03, X.steelL, 0, h * 0.75, -d / 2 + 0.03);
      B(w, h * 0.12, d * 0.3, X.steelL, 0, h * 0.94, -d / 2 + d * 0.15); B(w - 0.06, 0.01, d * 0.22, X.lamp, 0, h * 0.875, -d / 2 + d * 0.15); break; }
    case 'cutter': { B(w, 0.02, d, X.steelL, 0, 0.01, 0); B(0.04, h * 0.9, 0.04, X.steel, 0, h * 0.45, -d / 2 + 0.03); B(Math.min(w, 0.13), Math.min(h, 0.13), 0.13, X.steelL, 0, h * 0.25, 0.03); C(0.012, h * 0.7, X.black, 0, h, 0.07, Math.PI / 2.6, 0, 8); break; }
    case 'snackstand': { const sh = Math.min(0.9, h); cab(sh, 3); B(w, 0.04, d, X.steelL, 0, sh, 0); if (h > 1.4) { B(w, 0.15, d * 0.8, X.steel, 0, h - 0.07, 0.05); for (const s of [-1, 1]) B(0.04, h - sh, 0.04, X.steel, s * (w / 2 - 0.03), sh + (h - sh) / 2, -d / 2 + 0.03); } break; }
    default: { B(w, h, d, X.steel, 0, h / 2, 0); B(w - 0.04, Math.min(0.08, h * 0.2), 0.01, X.black, 0, h * 0.75, d / 2 + 0.006); }
  }
}
