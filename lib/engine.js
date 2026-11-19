// Hassen Equipment · Pack 3D Designer: 3D engine (three.js) and catalogue logic.
// It drives the DOM rendered by the React components in /components.
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { supabase } from './supabase';

const THREE = { ...T, OrbitControls, RoomEnvironment, RoundedBoxGeometry };
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
let started = false;

export async function startEngine() {
  if (started) return;
  started = true;
  let EMBED = [];
  let SITE = {};
  try { const r = await fetch(BASE + '/data/site.json', { cache: 'no-store' }); if (r.ok) SITE = await r.json(); } catch (e) {}
  if (!SITE || typeof SITE !== 'object' || Array.isArray(SITE)) SITE = {};
  if (!Array.isArray(SITE.equip)) { try { const r = await fetch(BASE + '/data/equipment.json', { cache: 'no-store' }); if (r.ok) SITE.equip = await r.json(); } catch (e) {} }
  // Store database (same products as the online store and its admin panel).
  let DB = false;
  try {
    const [c, p, k] = await Promise.all([
      supabase.from('categories').select('id,slug'),
      supabase.from('products').select('*, product_models(*)').eq('active', true).order('sort'),
      supabase.from('packs').select('*, pack_items(model_id,qty)').eq('active', true).order('sort'),
    ]);
    if (!p.error && !k.error) {
      DB = true;
      const slug = Object.fromEntries((c.data || []).map((x) => [x.id, x.slug]));
      SITE.equip = (p.data || []).map((pr) => ({
        id: pr.id, name: pr.name, cat: slug[pr.category_id] || '', types: pr.project_types || [],
        models: (pr.product_models || []).filter((m) => m.active).sort((a, b) => a.sort - b.sort).map((m) => ({
          id: m.id, name: m.name, price: m.price == null ? null : Number(m.price),
          w: Number(m.width_m) || 0.6, d: Number(m.depth_m) || 0.6, h: Number(m.height_m) || 0.9,
          top: !!m.on_counter, photo: (m.images && m.images[0]) || '',
        })),
      })).filter((g) => g.models.length);
      const snack = (k.data || []).find((x) => x.slug === 'pack-snack-6');
      SITE.packOverrides = snack ? { pack_snack6: { name: snack.name, price: Number(snack.price), types: snack.project_types?.length ? snack.project_types : ['fastfood'] } } : { pack_snack6: { hidden: true } };
      SITE.packs = (k.data || []).filter((x) => x.slug !== 'pack-snack-6').map((x) => ({
        id: x.id, name: x.name, price: Number(x.price), types: x.project_types || [], items: (x.pack_items || []).map((i) => ({ id: i.model_id, qty: i.qty })),
      }));
    }
  } catch (e) {}
  EMBED = SITE.equip || [];
(function(){
"use strict";
/* ---------- Config ---------- */
let SELLER_WHATSAPP = "213556554548"; // رقم الواتساب تاع البائع، مثلاً "213555123456"
const fmt = n => Math.round(n).toLocaleString('en-US') + ' DA';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const TYPES = [
 {id:'fastfood',fr:'Fast Food',ar:'فاست فود',em:'🍔'},{id:'pizzeria',fr:'Pizzeria',ar:'بيتزيريا',em:'🍕'},
 {id:'cafeteria',fr:'Cafétéria',ar:'كافيتيريا',em:'☕'},{id:'creperie',fr:'Crêperie',ar:'كريبري',em:'🥞'},
 {id:'patisserie',fr:'Pâtisserie',ar:'حلويات',em:'🍰'},{id:'restaurant',fr:'Restaurant',ar:'مطعم',em:'🍽️'}];
const typeOf = () => TYPES.find(t=>t.id===S.type)||TYPES[0];
const GAMMES = {eco:{ar:'اقتصادية',k:.82},std:{ar:'متوسطة (Standard)',k:1},pro:{ar:'ممتازة (Premium)',k:1.35}};
const WALL_AR = {back:'الخلفي',right:'الأيمن',front:'الأمامي',left:'الأيسر'};
const CATS = {cuisson:'الطهي · Cuisson',froid:'التبريد · Froid',prep:'التحضير · Préparation',boissons:'المشروبات والحلويات',service:'الخدمة والقاعة',hyg:'الغسيل والتخزين'};

const CATALOG = [
 {id:'snack2m',name:'Snack inox 2 m avec hotte',cat:'pack',w:2,d:.7,h:2.1,surfH:.9,p:null,kind:'snack',surface:1,packOnly:1},
 {id:'plaque_gaz',name:'Plaque chauffante gaz',cat:'pack',w:.6,d:.5,h:.22,p:null,kind:'griddle',top:1,packOnly:1},
 {id:'friteuse_elec',name:'Friteuse électrique 11 L · Comaf Star',cat:'pack',w:.32,d:.5,h:.32,p:null,kind:'fryertop',top:1,packOnly:1},
 {id:'egouttoir',name:'Égouttoir à frites (local)',cat:'pack',w:.4,d:.5,h:.3,p:null,kind:'drainer',top:1,packOnly:1},
 {id:'coupe_frites',name:'Coupe-frites (local)',cat:'pack',w:.22,d:.3,h:.5,p:null,kind:'cutter',top:1,packOnly:1},
 {id:'panini',name:'Presse panini · Comaf',cat:'pack',w:.4,d:.42,h:.3,p:null,kind:'panini',top:1,packOnly:1},
];
const DEF = Object.fromEntries(CATALOG.map(c=>[c.id,c]));
const PACKS = {
 pack_snack6:{name:'Pack Snack 6 pièces',price:169000,base:'snack2m',types:['fastfood'],
  riders:[['plaque_gaz',-.69,.05],['friteuse_elec',-.22,.05],['egouttoir',.15,.05],['coupe_frites',.47,.1],['panini',.79,.05]]}};
const layer = d => d.mount?'m':d.top?'t':'f';
const packList = P => P.list || [P.base,...P.riders.map(r=>r[0])];
function ridersOf(P,b){ const a=b.q*Math.PI/2, c=Math.cos(a), s=Math.sin(a);
  return P.riders.map(([id,dx,dz])=>({id,x:b.x+c*dx+s*dz,z:b.z-s*dx+c*dz,q:b.q})); }
// الصور الحقيقية: حط الصورة في public/images وزيد السطر هنا، مثلاً plaque_gaz:BASE+'/images/plaque_gaz.jpg'
const PHOTOS = {
 snack2m:BASE+'/images/snack2m.jpg',
 panini:BASE+'/images/panini.jpg',
};
const COLD = ['frigo','table_refrig','congel','vitrine','chambre_froide','table_pizza'];

const RECIPES = { fastfood:{wall:['pack:pack_snack6'],counter:[],seats:0} };
const recipeOf = () => RECIPES[S.type]||{wall:[],counter:[],seats:0};

/* ---------- State ---------- */
const STYLES={noir:{name:'Noir & Or',wall:0x2a2b2e,floor:['#2c2c2f','#3a3a3e','#1d1d20'],led:0xffb43a,sw:'linear-gradient(135deg,#111 0 55%,#f5b41f 55% 60%,#2c2c2f 60%)'},
 bois:{name:'Bois chaud',wall:0x6e4a2c,floor:['#8d8a85','#a19d97','#77736d'],led:0xffc067,sw:'linear-gradient(135deg,#6e4a2c 0 55%,#ffc067 55% 60%,#9a958f 60%)'},
 blanc:{name:'Blanc',wall:0xe9e7e2,floor:['#d8d6d2','#e6e4df','#c4c1bb'],led:0xfff1d6,sw:'linear-gradient(135deg,#f1efea 0 55%,#ffe9b8 55% 60%,#cfccc6 60%)'}};
const S = {style:'noir',type:'fastfood',L:8,W:5,H:3,door:{wall:'front',t:2,w:1.2},win:{wall:'front',t:5.4,w:2.6},gamme:'std',items:[]};
let uidSeq = 1, selected = null, lastUnfit = [], opts = {inst:false,tva:false};

const unitPrice = (def) => (def.perM||def.p) * GAMMES[S.gamme].k;
const priceOf = (it) => { const d=DEF[it.id]; if(it.pack) return 0; if(d.p==null&&!d.perM) return null; return d.perM ? d.perM*(it.w||d.w)*GAMMES[S.gamme].k : unitPrice(d); };
const mountY = () => Math.min(2.0, S.H - 0.55);

/* ---------- Geometry helpers ---------- */
function walls(){ const L=S.L,W=S.W; return {
  back:{o:[-L/2,-W/2],dir:[1,0],n:[0,1],q:0,len:L},
  right:{o:[L/2,-W/2],dir:[0,1],n:[-1,0],q:3,len:W},
  front:{o:[L/2,W/2],dir:[-1,0],n:[0,-1],q:2,len:L},
  left:{o:[-L/2,W/2],dir:[0,-1],n:[1,0],q:1,len:W,rev:1}};}
const wallPoint = (wl,t,off) => [wl.o[0]+wl.dir[0]*t+wl.n[0]*off, wl.o[1]+wl.dir[1]*t+wl.n[1]*off];
function wallBox(wl,t,w,depth){ const a=wallPoint(wl,t-w/2,0), b=wallPoint(wl,t+w/2,depth);
  return {x0:Math.min(a[0],b[0]),x1:Math.max(a[0],b[0]),z0:Math.min(a[1],b[1]),z1:Math.max(a[1],b[1])}; }
function fpOf(it){ const d=DEF[it.id], w=it.w||d.w, odd=it.q%2; const hx=(odd?d.d:w)/2, hz=(odd?w:d.d)/2;
  return {x0:it.x-hx,x1:it.x+hx,z0:it.z-hz,z1:it.z+hz}; }
const ov = (a,b,e=.005) => a.x0<b.x1-e && a.x1>b.x0+e && a.z0<b.z1-e && a.z1>b.z0+e;
const inRoom = f => f.x0>=-S.L/2-1e-6 && f.x1<=S.L/2+1e-6 && f.z0>=-S.W/2-1e-6 && f.z1<=S.W/2+1e-6;
function obstacles(){ const ws=walls(), out=[];
  if(ws[S.door.wall]) { const b=wallBox(ws[S.door.wall],S.door.t,S.door.w+.2,1.2); b.kind='door'; out.push(b); }
  if(ws[S.win.wall]) { const b=wallBox(ws[S.win.wall],S.win.t,S.win.w,.8); b.tallOnly=1; out.push(b); }
  return out; }
function fits(it,items,obst){ const d=DEF[it.id], f=fpOf(it); if(!inRoom(f)) return false;
  if(!d.top) for(const o of obst){ if(o.tallOnly && !(d.h>1.05||d.mount)) continue; if(ov(f,o)) return false; }
  for(const o of items){ if(layer(DEF[o.id])!==layer(d)) continue; if(ov(f,fpOf(o))) return false; }
  return true; }
function clampItem(it){ const f=fpOf(it);
  if(f.x0<-S.L/2) it.x+=-S.L/2-f.x0; if(f.x1>S.L/2) it.x-=f.x1-S.L/2;
  if(f.z0<-S.W/2) it.z+=-S.W/2-f.z0; if(f.z1>S.W/2) it.z-=f.z1-S.W/2; }

/* ---------- AI layout ---------- */
function placeOnWall(id,order,items,obst,ok){ const d=DEF[id], ws=walls();
  for(const wn of order){ const wl=ws[wn]; if(d.w>wl.len) continue; const ts=[];
    for(let t=d.w/2; t<=wl.len-d.w/2+1e-6; t+=.05) ts.push(t); if(wl.rev) ts.reverse();
    for(const t of ts){ const [x,z]=wallPoint(wl,t,d.d/2); const it={id,x,z,q:wl.q};
      if(fits(it,items,obst) && (!ok||ok(fpOf(it)))){ it._wall=wn; it._t=t; return it; } } }
  return null; }

function suggest(){
  const R=recipeOf(), items=[], obst=obstacles(), unfit=[]; const area=S.L*S.W;
  let wallList=[...(R.big&&area>=60?R.big:[]),...R.wall], counter=[...R.counter], counterLine=null;
  // counter line between kitchen and customers
  if(counter.length && S.W>=3.6){
    const dm=Math.max(...counter.map(id=>DEF[id].d));
    let cz=-S.W/2+.8+1.1+dm/2; const custDepth=S.W/2-(cz+dm/2);
    if(custDepth<1.2 && R.seats) cz=S.W/2-1.2-dm/2;
    if(cz-dm/2 >= -S.W/2+1.6){
      while(counter.length && counter.reduce((s,id)=>s+DEF[id].w+.05,0)>S.L-1.9) wallList.push(counter.pop());
      const tot=counter.reduce((s,id)=>s+DEF[id].w+.05,0)-.05; let x=-S.L/2+.95+ Math.max(0,(S.L-1.9-tot)/2)*0.6;
      for(const id of counter){ const d=DEF[id]; const it={id,x:x+d.w/2,z:cz+(dm-d.d)/2,q:0}; x+=d.w+.05;
        if(fits(it,items,obst)) items.push(it); else wallList.push(id); }
      counterLine={front:cz+dm/2,back:cz-dm/2};
    } else wallList.push(...counter);
  } else wallList.push(...counter);
  const kitchenOk = counterLine ? f => f.z1<=counterLine.front+.01 : null;
  // cooking line first on the back wall, then the rest
  const isCook=id=>id.startsWith('pack:')||!!DEF[id].cook;
  wallList.sort((a,b)=>isCook(b)-isCook(a));
  for(const id of wallList){
    if(id.startsWith('pack:')){ const pid=id.slice(5), P=PACKS[pid], o=['back','right','left'];
      const b=placeOnWall(P.base,o,items,obst,kitchenOk)||placeOnWall(P.base,o,items,obst,null);
      if(b){ const pk='k'+(uidSeq++); b.pack=pk; b.packId=pid; items.push(b); ridersOf(P,b).forEach(r=>items.push({...r,pack:pk,packId:pid})); } else unfit.push(P.base);
      continue; } const order=isCook(id)?['back','right','left']:['back','right','left','front'];
    const it=placeOnWall(id,order,items,obst,kitchenOk)||placeOnWall(id,order,items,obst,null);
    if(it) items.push(it); else unfit.push(id); }
  // hood(s) over each cooking group
  const ws=walls(), groups={};
  for(const it of items) if(DEF[it.id].cook && it._wall){ const g=groups[it._wall]||(groups[it._wall]={a:1e9,b:-1e9});
    const w=DEF[it.id].w; g.a=Math.min(g.a,it._t-w/2); g.b=Math.max(g.b,it._t+w/2); }
  for(const wn in groups){ const wl=ws[wn], g=groups[wn]; const hw=Math.min(wl.len,Math.ceil((g.b-g.a+.2)*2)/2);
    const tc=Math.min(Math.max((g.a+g.b)/2,hw/2),wl.len-hw/2); const [x,z]=wallPoint(wl,tc,.5); items.push({id:'hotte',x,z,q:wl.q,w:hw}); }
  // customer seating
  if(R.seats){ const z0=counterLine?counterLine.front+1.0:-S.W/2+1; let n=0;
    const target=Math.max(0,Math.floor((S.W/2-z0)*S.L/4.2));
    for(let z=z0+.8; z+.8<=S.W/2-.1 && n<target; z+=1.75)
      for(let x=-S.L/2+.9; x+.8<=S.L/2-.1 && n<target; x+=1.75){ const it={id:'salle',x,z,q:0}; if(fits(it,items,obst)){items.push(it);n++;} } }
  S.items=items.map(it=>({uid:uidSeq++,id:it.id,x:+it.x.toFixed(3),z:+it.z.toFixed(3),q:it.q,...(it.w?{w:it.w}:{}),...(it.pack?{pack:it.pack,packId:it.packId}:{})}));
  lastUnfit=unfit; select(null); rebuildItems(); refresh();
  toast(!S.items.length?`ما زال ما كانش Pack جاهز لـ <b>${esc(typeOf().fr)}</b>. زيد المعدات من الـCatalogue.`:`تصميم مقترح: ${S.items.length} قطع · <b class="num">${fmt(totals().ttc)}</b>`+(unfit.length?` · ${unfit.length} ما دخلوش`:''));
}

/* ---------- Three.js scene ---------- */
const vp=$('#viewport');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.85;
const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(42,1,.05,200);
const roomG=new THREE.Group(), itemsG=new THREE.Group(); scene.add(roomG,itemsG);
try{ const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromScene(new THREE.RoomEnvironment(),.04).texture; }catch(e){}
scene.add(new THREE.HemisphereLight(0xffffff,0x8a8f92,scene.environment?.12:.75));
const sun=new THREE.DirectionalLight(0xffffff,scene.environment?.9:.85); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-.0005; scene.add(sun,sun.target);

// pointer handler registered before OrbitControls so it can disable orbiting when grabbing an item
const ray=new THREE.Raycaster(), mouse=new THREE.Vector2(), floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0), dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
let drag=null, down=null;
function setMouse(e){ const r=renderer.domElement.getBoundingClientRect(); mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(mouse,camera); }
function pick(){ const hits=ray.intersectObjects(itemsG.children,true); for(const h of hits){ let o=h.object; while(o&&!o.userData.uid) o=o.parent; if(o) return o.userData.uid; } return null; }
vp.appendChild(renderer.domElement);
renderer.domElement.addEventListener('pointerdown',e=>{ setMouse(e); down={x:e.clientX,y:e.clientY};
  const uid=pick(); if(uid){ select(uid); const it=S.items.find(i=>i.uid===uid); const p=new THREE.Vector3(); ray.ray.intersectPlane(floorPlane,p);
    const d=DEF[it.id]; dragPlane.constant=-groupOf(uid).position.y; ray.ray.intersectPlane(dragPlane,p);
    const riders=d.surface?S.items.filter(r=>DEF[r.id].top&&surfaceY(r)>0&&(()=>{const f=fpOf(it);return r.x>f.x0&&r.x<f.x1&&r.z>f.z0&&r.z<f.z1;})()).map(r=>({r,ox:r.x-it.x,oz:r.z-it.z})):[];
    drag={it,dx:it.x-p.x,dz:it.z-p.z,moved:false,riders}; controls.enabled=false; renderer.domElement.setPointerCapture(e.pointerId); } });
renderer.domElement.addEventListener('pointermove',e=>{ if(!drag) return; setMouse(e); const p=new THREE.Vector3(); if(!ray.ray.intersectPlane(dragPlane,p)) return;
  const it=drag.it; it.x=Math.round((p.x+drag.dx)/.05)*.05; it.z=Math.round((p.z+drag.dz)/.05)*.05; clampItem(it); drag.moved=true;
  const g=groupOf(it.uid); g.position.x=it.x; g.position.z=it.z;
  for(const {r,ox,oz} of drag.riders){ r.x=it.x+ox; r.z=it.z+oz; const rg=groupOf(r.uid); rg.position.x=r.x; rg.position.z=r.z; } markCollisions(); });
renderer.domElement.addEventListener('pointerup',e=>{ if(drag){ const m=drag.moved; drag=null; controls.enabled=true; if(m) refresh(); return; }
  if(down && Math.hypot(e.clientX-down.x,e.clientY-down.y)<5) select(null); down=null; });
const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.maxPolarAngle=Math.PI/2.05; controls.minDistance=2; controls.maxDistance=60;

// materials
const mat = (c,o={}) => new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:0},o));
const M = {
  steel:mat(0xc9cfd3,{metalness:.85,roughness:.3}), steelL:mat(0xe3e7e9,{metalness:.8,roughness:.2}), steelD:mat(0x8d969b,{metalness:.85,roughness:.4}),
  iron:mat(0x0b0c0e,{roughness:.55,envMapIntensity:.35}), ironRib:mat(0x232629,{roughness:.4,envMapIntensity:.5}),
  led:new THREE.MeshBasicMaterial({color:0xffc24a}),
  lamp:mat(0xffb46b,{emissive:0xff9a40,emissiveIntensity:1.2}), ledR:mat(0xff3b2f,{emissive:0xff2a1a,emissiveIntensity:1}),
  black:mat(0x1d2124,{roughness:.6}), white:mat(0xf2f3f1,{roughness:.45}), wood:mat(0x9b6a43,{roughness:.7}), woodL:mat(0xc99a6b,{roughness:.65}),
  stone:mat(0x3a3f43,{roughness:.35}), accent:mat(0xc94a14,{roughness:.45}), glass:mat(0xbfe3f0,{transparent:true,opacity:.28,roughness:.05,metalness:.1}),
  glow:mat(0xdff3ff,{emissive:0xbfe8ff,emissiveIntensity:.55}), red:mat(0xb2302a), orange:mat(0xf09a2a,{transparent:true,opacity:.75}),
  green:mat(0x5d9b3c), yellow:mat(0xe8c24a), seat:mat(0x2e3b40,{roughness:.6}), meat:mat(0xa8332e,{roughness:.55}), frame:mat(0x2c3236,{metalness:.3})};
function box(g,w,h,d,m,x,y,z){ const r=Math.min(.012,w/2-.002,h/2-.002,d/2-.002); const o=new THREE.Mesh(r>.004&&THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=o.receiveShadow=true; g.add(o); return o; }
function cyl(g,r,h,m,x,y,z,rx=0,rz=0,seg=24){ const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m); o.position.set(x,y,z); o.rotation.set(rx,0,rz); o.castShadow=true; g.add(o); return o; }
function cabinet(g,w,d,h,doors=0){ box(g,w,.08,d-.06,M.black,0,.04,-.02); box(g,w,h-.12,d-.02,M.steel,0,.08+(h-.12)/2,0); box(g,w,.04,d,M.steelL,0,h-.02,0);
  if(doors){ const dw=w/doors; for(let i=0;i<doors;i++){ const cx=-w/2+dw*(i+.5); box(g,dw-.03,h-.28,.012,M.steelL,cx,.1+(h-.28)/2+.02,d/2); box(g,.02,.18,.03,M.black,cx+dw/2-.08,h*.55,d/2+.02);} } }
function stand(g,w,d){ const h=.86; box(g,w,.04,d,M.steelL,0,h-.02,0); for(const sx of[-1,1])for(const sz of[-1,1]) cyl(g,.02,h-.04,M.steel,sx*(w/2-.04),(h-.04)/2,sz*(d/2-.04),0,0,10); box(g,w-.08,.02,d-.08,M.steel,0,.18,0); return h; }

function buildModel(it){ const d=DEF[it.id], g=new THREE.Group(), w=it.w||d.w, dd=d.d, h=d.h;
  switch(d.kind){
  case 'fryer': cabinet(g,w,dd,.85,2); for(const s of[-1,1]){ box(g,w*.38,.02,dd*.55,M.black,s*w*.22,.86,.03); box(g,w*.3,.01,dd*.4,M.orange,s*w*.22,.875,.03); cyl(g,.012,.25,M.black,s*w*.22,.95,dd*.25,Math.PI/2.6,0,8); }
    box(g,w,.14,.08,M.steel,0,.92,-dd/2+.04); break;
  case 'plancha': cabinet(g,w,dd,.85,2); box(g,w-.06,.03,dd-.18,M.black,0,.865,.05); box(g,w,.14,.06,M.steel,0,.92,-dd/2+.03); for(let i=0;i<3;i++) cyl(g,.022,.03,M.black,-w/3+i*w/3,.6,dd/2+.01,Math.PI/2,0,12); break;
  case 'burners': cabinet(g,w,dd,.85); box(g,w-.12,.38,.012,M.steelD,0,.42,dd/2); box(g,w-.25,.12,.014,M.glass,0,.45,dd/2+.002);
    for(const sx of[-1,1])for(const sz of[-1,1]){ cyl(g,.1,.02,M.black,sx*w*.24,.87,sz*dd*.22); cyl(g,.05,.03,M.steelD,sx*w*.24,.88,sz*dd*.22);} break;
  case 'hood': { const y=mountY(); box(g,w,.38,dd,M.steel,0,y+.31,0); box(g,w,.12,dd,M.steelL,0,y+.06,0); box(g,w-.1,.02,dd-.25,M.steelD,0,y+.005,0);
    const top=y+.5; if(S.H-top>.05) box(g,.35,S.H-top,.35,M.steel,0,top+(S.H-top)/2,-dd/2+.25); break; }
  case 'table': stand(g,w,dd); box(g,w,.12,.02,M.steelL,0,.92,-dd/2+.01); break;
  case 'refcounter': cabinet(g,w,dd,.88,3); box(g,w,.12,.02,M.steelL,0,.94,-dd/2+.01); break;
  case 'pizzatable': cabinet(g,w,dd,.88,2); box(g,w,.04,dd-.25,M.stone,0,.9,.1); box(g,w,.14,.26,M.steel,0,.97,-dd/2+.13);
    const ing=[M.red,M.yellow,M.green,M.white,M.meat,M.yellow]; ing.forEach((m,i)=>box(g,w/6-.03,.03,.18,m,-w/2+w/12+i*w/6,1.04,-dd/2+.13)); break;
  case 'fridge': box(g,w,h,dd,M.steel,0,h/2,0); box(g,w-.08,h-.3,.02,M.glow,0,h/2-.05,dd/2-.03); box(g,w-.06,h-.26,.015,M.glass,0,h/2-.05,dd/2+.005);
    box(g,w,.18,.02,M.accent,0,h-.1,dd/2+.005); box(g,.025,.5,.04,M.black,w/2-.08,h/2,dd/2+.03);
    for(let i=1;i<5;i++) box(g,w-.12,.015,dd-.15,M.steelD,0,i*(h-.3)/5,0); break;
  case 'chest': box(g,w,h-.06,dd,M.white,0,(h-.06)/2,0); box(g,w,.06,dd,M.white,0,h-.03,0); box(g,w*.3,.03,.04,M.steelD,0,h-.12,dd/2+.02); break;
  case 'vitrine': box(g,w,.85,dd,M.steel,0,.425,0); box(g,w,.04,dd,M.steelL,0,.87,0); box(g,w-.04,.42,dd-.18,M.glass,0,1.1,.06);
    box(g,w-.04,.03,dd-.06,M.steelL,0,1.33,0); for(let i=0;i<5;i++) box(g,(w-.2)/5-.05,.05,.25,i%2?M.meat:M.yellow,-w/2+.1+(i+.5)*(w-.2)/5,.92,.08); break;
  case 'icemaker': box(g,w,h,dd,M.steel,0,h/2,0); box(g,w-.06,h*.4,.015,M.steelD,0,h*.35,dd/2); box(g,w*.4,.03,.04,M.black,0,h*.56,dd/2+.02); break;
  case 'coldroom': box(g,w,h,dd,M.white,0,h/2,0); box(g,.85,1.9,.04,M.steelL,-w/2+.6,.95,dd/2+.02); box(g,.04,.35,.06,M.black,-w/2+.95,1,dd/2+.05);
    box(g,.25,.12,.03,M.accent,w/2-.3,h-.25,dd/2+.02); break;
  case 'oven': for(const sx of[-1,1])for(const sz of[-1,1]) box(g,.05,.65,.05,M.black,sx*(w/2-.08),.325,sz*(dd/2-.08)); box(g,w-.1,.04,dd-.1,M.black,0,.3,0);
    for(let i=0;i<2;i++){ const y=.65+i*.4; box(g,w,.38,dd,M.steel,0,y+.19,0); box(g,w-.25,.14,.02,M.black,0,y+.2,dd/2+.002); box(g,w-.4,.025,.04,M.accent,0,y+.33,dd/2+.02); }
    cyl(g,.08,S.H-1.45-0.1>0.3?.5:.3,M.steelD,0,1.6,-dd/4); break;
  case 'mixer': box(g,w,.5,dd,M.white,0,.25,0); box(g,.18,.6,.18,M.white,0,.8,-dd/2+.12); box(g,w*.8,.16,.45,M.white,0,1.12,0); cyl(g,.2,.3,M.steelL,0,.66,.08); break;
  case 'billot': for(const sx of[-1,1])for(const sz of[-1,1]) box(g,.06,.62,.06,M.wood,sx*(w/2-.06),.31,sz*(dd/2-.06)); box(g,w,.3,dd,M.woodL,0,.77,0); break;
  case 'mincer': cabinet(g,w,dd,.86,1); box(g,.3,.25,.4,M.steelL,0,.99,0); cyl(g,.07,.3,M.steel,0,1.05,.2,Math.PI/2); cyl(g,.12,.12,M.steel,0,1.2,-.05); break;
  case 'espresso': cabinet(g,w,dd,.86,2); box(g,w*.85,.42,.5,M.steelL,0,1.08,-.05); box(g,w*.85,.06,.5,M.accent,0,1.32,-.05);
    for(const s of[-1,1]){ cyl(g,.05,.08,M.black,s*w*.2,.98,.22); box(g,.12,.02,.15,M.black,s*w*.2,.88,.24); } break;
  case 'juice': stand(g,w,dd); box(g,.38,.22,.36,M.steelL,0,.97,0); cyl(g,.13,.32,M.orange,0,1.24,0); cyl(g,.14,.04,M.steel,0,1.42,0); break;
  case 'crepe': stand(g,w,dd); box(g,w-.06,.12,.45,M.steel,0,.92,0); for(const s of[-1,1]) cyl(g,.19,.03,M.black,s*w*.24,.995,0,0,0,32); break;
  case 'softserve': box(g,w,1.1,dd,M.steel,0,.55,0); box(g,w,.38,dd-.1,M.steelL,0,1.29,-.05); for(const s of[-1,1]) cyl(g,.1,.06,M.steelD,s*.14,1.5,-.12);
    box(g,w-.1,.12,.12,M.accent,0,1.0,dd/2+.04); box(g,w-.1,.03,.2,M.black,0,.72,dd/2+.05); break;
  case 'counter': box(g,w,h-.04,dd,M.wood,0,(h-.04)/2,0); box(g,w+.04,.04,dd+.06,M.stone,0,h-.02,.02); box(g,w,.12,.012,M.accent,0,h-.2,dd/2+.002);
    box(g,.35,.25,.25,M.black,w/2-.35,h+.12,-.05); break;
  case 'seating': cyl(g,.4,.04,M.woodL,0,.74,0,0,0,32); cyl(g,.04,.72,M.frame,0,.36,0,0,0,10); cyl(g,.22,.02,M.frame,0,.01,0);
    for(let i=0;i<4;i++){ const a=i*Math.PI/2, c=new THREE.Group(); c.rotation.y=a; c.position.set(Math.sin(a)*.62,0,Math.cos(a)*.62);
      box(c,.42,.04,.42,M.seat,0,.45,0); box(c,.42,.42,.04,M.seat,0,.66,.2); for(const sx of[-1,1])for(const sz of[-1,1]) box(c,.03,.45,.03,M.frame,sx*.18,.225,sz*.18); g.add(c);} break;
  case 'sink': stand(g,w,dd); box(g,w,.2,dd,M.steel,0,.76,0); box(g,w,.04,dd,M.steelL,0,.88,0); for(const s of[-1,1]) box(g,w*.38,.02,dd*.6,M.steelD,s*w*.22,.905,.02);
    cyl(g,.015,.35,M.steelL,0,1.07,-dd/2+.08,0,0,8); cyl(g,.015,.2,M.steelL,0,1.24,-dd/2+.17,Math.PI/2,0,8); box(g,w,.25,.02,M.steelL,0,1.01,-dd/2+.01); break;
  case 'dishwasher': cabinet(g,w,dd,.85,1); box(g,w-.02,.55,dd-.04,M.steelL,0,1.15,0); box(g,w*.6,.03,.04,M.black,0,1.38,dd/2); break;
  case 'shelf': for(const sx of[-1,1])for(const sz of[-1,1]) box(g,.03,h,.03,M.steel,sx*(w/2-.02),h/2,sz*(dd/2-.02));
    for(let i=0;i<4;i++){ box(g,w,.02,dd,M.steelL,0,.15+i*.53,0); if(i) for(let k=0;k<3;k++) box(g,.22,.18,.25,[M.white,M.yellow,M.green][(i+k)%3],-w/3+k*w/3,.25+i*.53,0);} break;
  case 'snack': {
    for(const sx of[-1,1])for(const sz of[-1,1]){ cyl(g,.035,.03,M.black,sx*(w/2-.08),.035,sz*(dd/2-.1),Math.PI/2,0,12); box(g,.05,.04,.05,M.steelL,sx*(w/2-.08),.075,sz*(dd/2-.1)); }
    box(g,w,.78,dd,M.steel,0,.49,0);
    const nw=w*.2; box(g,nw-.04,.62,.02,M.steelD,-w/2+nw/2+.02,.44,dd/2-.12); box(g,nw-.04,.015,dd-.2,M.steelL,-w/2+nw/2+.02,.45,0);
    box(g,nw-.04,.62,.01,M.iron,-w/2+nw/2+.02,.44,dd/2-.135);
    const dw=(w-nw-.06)/2; for(let i=0;i<2;i++){ const cx=-w/2+nw+.02+dw*(i+.5)+i*.02; box(g,dw,.62,.015,M.steelL,cx,.44,dd/2+.004+i*.012);
      const k=new THREE.Mesh(new THREE.SphereGeometry(.022,16,12),M.steelL); k.position.set(cx+(i?dw*.3:-dw*.3),.55,dd/2+.03+i*.012); g.add(k); }
    box(g,w-.06,.13,.012,M.steelL,0,.8,dd/2+.004);
    box(g,w+.04,.04,dd+.04,M.steelL,0,.9,.01); box(g,w-.04,.012,.012,M.led,0,.865,dd/2+.02);
    box(g,w-.12,.86,.03,M.steel,0,1.35,-dd/2+.03);
    box(g,w+.06,.13,dd+.02,M.steel,0,1.86,.02);
    const fr=box(g,w+.06,.16,.03,M.steelL,0,1.87,dd/2+.06); fr.rotation.x=-.55;
    box(g,w+.06,.03,dd*.75,M.steelL,0,1.94,-.05);
    for(let i=0;i<9;i++) box(g,(w-.2)/9-.03,.02,dd*.55,i%2?M.steelD:M.iron,-w/2+.1+(i+.5)*(w-.2)/9,1.785,-.02);
    for(let i=0;i<4;i++) box(g,.12,.01,.12,M.led,-w/2+w*(i+.5)/4,1.772,.12);
    cyl(g,.09,.14,M.white,-.15,2.02,-.1,0,0,24); break; }
  case 'griddle': box(g,w,.15,dd,M.steel,0,.075,0); box(g,w-.05,.02,dd-.1,M.black,0,.16,.02); for(const s of[-1,1]) box(g,.015,.07,dd-.06,M.steelL,s*(w/2-.01),.2,0);
    box(g,w,.07,.015,M.steelL,0,.2,-dd/2+.01); for(let i=0;i<3;i++) cyl(g,.018,.03,M.black,-w/3+i*w/3,.08,dd/2+.01,Math.PI/2,0,12); break;
  case 'fryertop': box(g,w,.22,dd,M.steel,0,.11,0); box(g,w-.05,.01,dd-.18,M.black,0,.225,.04); box(g,w-.08,.01,dd-.24,M.orange,0,.232,.04);
    box(g,w,.1,.12,M.steelL,0,.27,-dd/2+.06); box(g,.02,.02,.01,M.ledR,w/4,.28,-dd/2+.125); cyl(g,.022,.02,M.black,-w/5,.28,-dd/2+.125,Math.PI/2,0,12);
    cyl(g,.01,.22,M.black,0,.3,.12,-Math.PI/3,0,8); break;
  case 'drainer': box(g,w,.16,dd,M.steel,0,.08,0); box(g,w-.04,.01,dd-.04,M.yellow,0,.165,0); box(g,.03,.32,.03,M.steelL,0,.32,-dd/2+.03);
    box(g,w,.05,.14,M.steelL,0,.49,-dd/2+.1); box(g,w-.06,.01,.1,M.lamp,0,.462,-dd/2+.1); break;
  case 'cutter': box(g,w,.02,dd,M.steelL,0,.01,0); box(g,.04,.48,.04,M.steel,0,.25,-dd/2+.03); box(g,.13,.13,.13,M.steelL,0,.12,.03);
    cyl(g,.012,.38,M.black,0,.5,.07,Math.PI/2.6,0,8); break;
  case 'panini': { box(g,w,.11,dd,M.steel,0,.055,0); box(g,w-.02,.08,.01,M.iron,0,.06,dd/2+.003); box(g,w-.02,.008,.012,M.red,0,.016,dd/2+.005);
    cyl(g,.02,.016,M.iron,0,.062,dd/2+.012,Math.PI/2,0,20); cyl(g,.008,.01,M.ledR,w*.24,.066,dd/2+.01,Math.PI/2,0,10); box(g,.012,.026,.01,M.iron,-w*.24,.062,dd/2+.01);
    box(g,w-.04,.025,dd-.1,M.iron,0,.123,.01); for(let i=0;i<12;i++) box(g,.008,.012,dd-.13,M.ironRib,-w/2+.04+i*(w-.08)/11,.141,.01);
    box(g,w-.06,.07,.05,M.steelL,0,.15,-dd/2+.035);
    const lid=new THREE.Group(); lid.position.set(0,.2,-dd/2+.05); lid.rotation.x=-.95; g.add(lid); const L=dd-.08;
    box(lid,w-.04,.035,L,M.steelL,0,0,L/2); box(lid,w-.04,.015,L,M.iron,0,-.025,L/2); for(let i=0;i<12;i++) box(lid,.008,.01,L-.03,M.ironRib,-w/2+.04+i*(w-.08)/11,-.036,L/2);
    for(const sx of[-1,1]) cyl(lid,.007,.09,M.steelL,sx*w*.42,.045,L-.01,0,0,8);
    cyl(lid,.016,w*.88,M.iron,0,.09,L-.01,0,Math.PI/2,14); break; }
  case 'generic': { const tx=photoTex(it.id), fr=tx?new THREE.MeshStandardMaterial({map:tx,roughness:.45,envMapIntensity:.4}):M.steelL;
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),[M.steel,M.steel,M.steelL,M.steel,fr,M.steel]); o.position.y=h/2; o.castShadow=o.receiveShadow=true; g.add(o); break; }
  default: box(g,w,h,dd,M.steel,0,h/2,0);
  }
  // footprint outline
  const y=d.mount?mountY()-.01:.012; const pts=[[-w/2,-dd/2],[w/2,-dd/2],[w/2,dd/2],[-w/2,dd/2]].map(p=>new THREE.Vector3(p[0],y,p[1]));
  const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xc94a14})); line.visible=false; line.name='outline'; g.add(line);
  const pad=new THREE.Mesh(new THREE.PlaneGeometry(w,dd),new THREE.MeshBasicMaterial({color:0xc94a14,transparent:true,opacity:.18,depthWrite:false}));
  pad.rotation.x=-Math.PI/2; pad.position.y=y+.002; pad.visible=false; pad.name='pad'; g.add(pad);
  g.position.set(it.x,surfaceY(it),it.z); g.rotation.y=it.q*Math.PI/2; g.userData.uid=it.uid; return g; }
function surfaceY(it){ const d=DEF[it.id]; if(!d.top) return 0; let y=0;
  for(const o of S.items){ const od=DEF[o.id]; if(!od.surface) continue; const f=fpOf(o); if(it.x>f.x0&&it.x<f.x1&&it.z>f.z0&&it.z<f.z1) y=Math.max(y,od.surfH||od.h); } return y; }
function restack(){ for(const it of S.items) if(DEF[it.id].top){ const g=groupOf(it.uid); if(g) g.position.y=surfaceY(it); } }

const groupOf = uid => itemsG.children.find(g=>g.userData.uid===uid);
function rebuildItems(){ while(itemsG.children.length) itemsG.remove(itemsG.children[0]); for(const it of S.items) itemsG.add(buildModel(it)); markCollisions(); }
function rebuildOne(it){ const g=groupOf(it.uid); if(g) itemsG.remove(g); itemsG.add(buildModel(it)); markCollisions(); }
function collisions(){ const bad=new Set(), obst=obstacles().filter(o=>o.kind==='door');
  for(let i=0;i<S.items.length;i++){ const a=S.items[i], fa=fpOf(a), la=layer(DEF[a.id]);
    for(const o of obst) if(la==='f' && ov(fa,o)) bad.add(a.uid);
    for(let j=i+1;j<S.items.length;j++){ const b=S.items[j]; if(la!==layer(DEF[b.id])) continue; if(ov(fa,fpOf(b))){bad.add(a.uid);bad.add(b.uid);} } }
  return bad; }
function markCollisions(){ restack(); const bad=collisions();
  for(const g of itemsG.children){ const u=g.userData.uid, l=g.getObjectByName('outline'), p=g.getObjectByName('pad'); const isBad=bad.has(u), isSel=u===selected;
    l.visible=p.visible=isBad||isSel; const c=isBad?0xd8352c:0xc94a14; l.material.color.setHex(c); p.material.color.setHex(c); }
  return bad; }

// room
const wallMats={}, wallPhotoMats={}, wallPhotos={}; let ledMeshes={};
function buildRoom(){ while(roomG.children.length) roomG.remove(roomG.children[0]);
  const L=S.L,W=S.W,H=S.H,T=.12;
  const ST=STYLES[S.style]||STYLES.noir; ledMeshes={};
  const cv=document.createElement('canvas'); cv.width=cv.height=256; const cx=cv.getContext('2d'); cx.fillStyle=ST.floor[2]; cx.fillRect(0,0,256,256);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){ const g=cx.createLinearGradient(i*128,j*128,i*128+128,j*128+128); g.addColorStop(0,ST.floor[0]); g.addColorStop(1,ST.floor[1]); cx.fillStyle=g; cx.fillRect(i*128+2,j*128+2,124,124); }
  const tex=new THREE.CanvasTexture(cv); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(L/1.2,W/1.2); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=8;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(L,W),new THREE.MeshStandardMaterial({map:tex,roughness:.18,metalness:.15,envMapIntensity:1.1})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; roomG.add(floor);
  const base=new THREE.Mesh(new THREE.BoxGeometry(L+2*T,.06,W+2*T),mat(0x9aa2a6)); base.position.y=-.031; roomG.add(base);
  const ws=walls();
  for(const wn in ws){ const wl=ws[wn]; const m=wallMats[wn]=mat(ST.wall,{transparent:true,opacity:1,roughness:.8,envMapIntensity:.08}); const ops=[];
    if(S.door.wall===wn) ops.push({a:S.door.t-S.door.w/2,b:S.door.t+S.door.w/2,lo:0,hi:Math.min(2.2,H-.2),door:1});
    if(S.win.wall===wn) ops.push({a:S.win.t-S.win.w/2,b:S.win.t+S.win.w/2,lo:1.1,hi:Math.min(2.2,H-.2)});
    ops.forEach(o=>{o.a=Math.max(0,o.a);o.b=Math.min(wl.len,o.b);});
    const br=[0,wl.len,...ops.flatMap(o=>[o.a,o.b])].sort((a,b)=>a-b);
    const seg=(t0,t1,y0,y1)=>{ if(t1-t0<.001||y1-y0<.001) return; const [x,z]=wallPoint(wl,(t0+t1)/2,-T/2); const alongX=wl.dir[0]!==0;
      const o=new THREE.Mesh(new THREE.BoxGeometry(alongX?t1-t0:T,y1-y0,alongX?T:t1-t0),m); o.position.set(x,(y0+y1)/2,z); o.receiveShadow=true; o.castShadow=false; roomG.add(o); };
    for(let i=0;i<br.length-1;i++){ const a=br[i],b=br[i+1],mid=(a+b)/2, op=ops.find(o=>mid>o.a&&mid<o.b);
      if(!op) seg(a,b,0,H); else { seg(a,b,0,op.lo); seg(a,b,op.hi,H);
        const [x,z]=wallPoint(wl,mid,-T/2), alongX=wl.dir[0]!==0, gl=new THREE.Mesh(new THREE.BoxGeometry(alongX?b-a:.02,op.hi-op.lo,alongX?.02:b-a),M.glass);
        gl.position.set(x,(op.lo+op.hi)/2,z); roomG.add(gl);
        const fr=new THREE.Mesh(new THREE.BoxGeometry(alongX?b-a+.08:T+.04,.06,alongX?T+.04:b-a+.08),M.frame); fr.position.set(x,op.hi+.03,z); roomG.add(fr);
        if(op.door){ const lbl=new THREE.Mesh(new THREE.PlaneGeometry(alongX?b-a:1,alongX?1:b-a),new THREE.MeshBasicMaterial({color:0x2f8a57,transparent:true,opacity:.14,depthWrite:false}));
          const [px,pz]=wallPoint(wl,mid,.5); lbl.rotation.x=-Math.PI/2; lbl.position.set(px,.006,pz); roomG.add(lbl);} } } }
  for(const [sx,sz,wn] of [[-1,-1,'back'],[1,-1,'back'],[1,1,'front'],[-1,1,'front']]){ const c=new THREE.Mesh(new THREE.BoxGeometry(T,H,T),wallMats[wn]); c.position.set(sx*(L/2+T/2),H/2,sz*(W/2+T/2)); roomG.add(c); }
  for(const wn in ws){ const img=wallPhotos[wn]; if(!img) continue; const wl=ws[wn];
    const tex=new THREE.Texture(img); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=4;
    const ia=img.naturalWidth/img.naturalHeight, wa=wl.len/H; if(ia>wa){ tex.repeat.set(wa/ia,1); tex.offset.set((1-wa/ia)/2,0); } else { tex.repeat.set(1,ia/wa); tex.offset.set(0,(1-ia/wa)/2); }
    tex.needsUpdate=true; const m=wallPhotoMats[wn]=new THREE.MeshStandardMaterial({map:tex,roughness:.9,envMapIntensity:.25,transparent:true,opacity:1});
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(wl.len,H),m); const [x,z]=wallPoint(wl,wl.len/2,.012); pl.position.set(x,H/2,z); pl.rotation.y=Math.atan2(wl.n[0],wl.n[1]); pl.receiveShadow=true; roomG.add(pl); }
  // LED cove along the top of each wall
  const ledMat=new THREE.MeshBasicMaterial({color:ST.led});
  for(const wn in ws){ const wl=ws[wn], alongX=wl.dir[0]!==0, [x,z]=wallPoint(wl,wl.len/2,.04);
    const led=new THREE.Mesh(new THREE.BoxGeometry(alongX?wl.len-.1:.03,.025,alongX?.03:wl.len-.1),ledMat); led.position.set(x,H-.12,z); roomG.add(led);
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(wl.len-.1,.5),new THREE.MeshBasicMaterial({color:ST.led,transparent:true,opacity:.16,depthWrite:false}));
    const [gx,gz]=wallPoint(wl,wl.len/2,.015); glow.position.set(gx,H-.36,gz); glow.rotation.y=Math.atan2(wl.n[0],wl.n[1]); roomG.add(glow); ledMeshes[wn]=[led,glow]; }
  for(let i=0;i<3;i++){ const pl=new THREE.PointLight(ST.led,.55,Math.max(L,W)*1.1,2); pl.position.set(-L/2+L*(i+.5)/3,H-.3,-W/2+.6); roomG.add(pl); }
  const pl2=new THREE.PointLight(0xfff3dd,.5,Math.max(L,W)*1.4,2); pl2.position.set(0,H-.2,W*.15); roomG.add(pl2);
  // neon sign on the back wall
  if(!wallPhotos.back){ const sc=document.createElement('canvas'); sc.width=512; sc.height=192; const g=sc.getContext('2d');
    g.fillStyle='#0d0d0f'; g.fillRect(0,0,512,192); g.strokeStyle='#f5b41f'; g.lineWidth=5; g.strokeRect(10,10,492,172);
    g.font='italic 700 96px Georgia, serif'; g.textAlign='center'; g.textBaseline='middle'; g.shadowColor='#ffb020'; g.shadowBlur=28; g.fillStyle='#ffd27a'; const sg=typeOf().fr; g.font=`italic 700 ${sg.length>8?72:96}px Georgia, serif`; g.fillText(sg,256,100); g.shadowBlur=10; g.fillText(sg,256,100);
    const st=new THREE.CanvasTexture(sc); st.encoding=THREE.sRGBEncoding; const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.56),new THREE.MeshBasicMaterial({map:st}));
    const wl=ws.back, t=Math.min(wl.len-.9,Math.max(3.2,wl.len*.72)); const [sx,sz]=wallPoint(wl,t,.02); sign.position.set(sx,Math.min(H-.6,2.1),sz); roomG.add(sign); ledMeshes.back.push(sign); }
  // plants in the front corners
  const potM=mat(0x1b1b1d,{roughness:.4}), leafM=mat(0x1f5e22,{roughness:.7,envMapIntensity:.15}), leafM2=mat(0x2c7a2c,{roughness:.7,envMapIntensity:.15});
  for(const sx of [-1,1]){ const g=new THREE.Group(); const pot=new THREE.Mesh(new THREE.CylinderGeometry(.2,.16,.45,20),potM); pot.position.y=.225; pot.castShadow=true; g.add(pot);
    for(let k=0;k<9;k++){ const a=k*2.4, r=.08+(k%3)*.05; const lf=new THREE.Mesh(new THREE.SphereGeometry(.16-(k%3)*.02,10,8),k%2?leafM:leafM2); lf.scale.set(1,1.5,.6); lf.position.set(Math.cos(a)*r,.6+k*.07,Math.sin(a)*r); lf.rotation.set(Math.cos(a)*.6,a,Math.sin(a)*.6); lf.castShadow=true; g.add(lf); }
    g.position.set(sx*(L/2-.32),0,W/2-.32); roomG.add(g); }
  const R=Math.max(L,W); sun.position.set(L*.4,H+R*.9,W*.7); sun.target.position.set(0,0,0);
  Object.assign(sun.shadow.camera,{left:-R,right:R,top:R,bottom:-R,near:.5,far:R*4}); sun.shadow.camera.updateProjectionMatrix();
}
function fadeWalls(){ const ws=walls(), c=camera.position;
  for(const wn in ws){ const wl=ws[wn], m=wallMats[wn]; if(!m) continue; const outside=(c.x-wl.o[0])*wl.n[0]+(c.z-wl.o[1])*wl.n[1]<0 && c.y<S.H*4;
    const target=outside?.1:1; m.opacity+= (target-m.opacity)*.25; m.depthWrite=m.opacity>.9; const pm=wallPhotoMats[wn]; if(pm){ pm.opacity=m.opacity; pm.depthWrite=m.depthWrite; } (ledMeshes[wn]||[]).forEach(o=>o.visible=m.opacity>.5); } }

let view='3d';
function resetCamera(){ const R=Math.max(S.L,S.W);
  if(view==='top'){ camera.position.set(0,R*1.75+2,.01); controls.target.set(0,0,0); controls.enableRotate=false; }
  else { camera.position.set(S.L*.55,R*.85+1.5,S.W/2+R*.95); controls.target.set(0,.5,0); controls.enableRotate=true; }
  controls.update(); }
function themeScene(){ const c=getComputedStyle(document.documentElement).getPropertyValue('--scene').trim()||'#d9e0e3'; scene.background=new THREE.Color(c); }
function resize(){ const r=vp.getBoundingClientRect(); if(!r.width||!r.height) return; renderer.setSize(r.width,r.height); camera.aspect=r.width/r.height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(vp);
(function loop(){ requestAnimationFrame(loop); controls.update(); fadeWalls(); renderer.render(scene,camera); })();

/* ---------- Selection ---------- */
function select(uid){ selected=uid; markCollisions(); const it=S.items.find(i=>i.uid===uid); $('#selbar').hidden=!it; $('#hint').hidden=!!it;
  if(!it) return; const d=DEF[it.id]; $('#selName').textContent=d.name; $('#selImg').src=thumb(it.id); $('#selImg').alt=d.name;
  $('#selInfo').innerHTML=`<span class="num">${(it.w||d.w).toFixed(1)}×${d.d.toFixed(1)} m</span> · `+(it.pack?`ضمن ${esc(PACKS[it.packId].name)}`:priceOf(it)==null?'السعر حسب الطلب':`<span class="num">${fmt(priceOf(it))}</span>`);
  $('#selDup').hidden=!!d.packOnly;
  $('#hoodSize').hidden=!d.perM; }
function mutate(fn){ const it=S.items.find(i=>i.uid===selected); if(!it) return; fn(it); }
function ridersOn(it){ const f=fpOf(it); return S.items.filter(r=>r!==it&&DEF[r.id].top&&r.x>f.x0&&r.x<f.x1&&r.z>f.z0&&r.z<f.z1); }
$('#selRot').onclick=()=>mutate(it=>{ const rs=DEF[it.id].surface?ridersOn(it):[];
  for(const r of rs){ const ox=r.x-it.x, oz=r.z-it.z; r.x=it.x+oz; r.z=it.z-ox; r.q=(r.q+1)%4; const rg=groupOf(r.uid); rg.position.x=r.x; rg.position.z=r.z; rg.rotation.y=r.q*Math.PI/2; }
  it.q=(it.q+1)%4; clampItem(it); groupOf(it.uid).rotation.y=it.q*Math.PI/2; groupOf(it.uid).position.set(it.x,0,it.z); markCollisions(); refresh(); });
$('#selDel').onclick=()=>mutate(it=>{ const gone=[it];
  S.items=S.items.filter(i=>!gone.includes(i)); gone.forEach(i=>itemsG.remove(groupOf(i.uid))); select(null); refresh(); });
$('#selDup').onclick=()=>mutate(it=>addItem(it.id,it));
const resizeHood=dw=>mutate(it=>{ it.w=Math.max(1,Math.min(6,(it.w||2)+dw)); clampItem(it); rebuildOne(it); select(it.uid); refresh(); });
$('#hoodPlus').onclick=()=>resizeHood(.5); $('#hoodMinus').onclick=()=>resizeHood(-.5);
addEventListener('keydown',e=>{ if(!selected||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)||!$('#modal').hidden) return;
  if(e.key==='r'||e.key==='R') $('#selRot').click(); if(e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); $('#selDel').click(); } if(e.key==='Escape') select(null); });

function addPack(pid){ const P=PACKS[pid]; if(P.custom){ const pk='k'+(uidSeq++);
    for(const id of P.list){ if(!DEF[id]) continue; addItem(id); const it=S.items[S.items.length-1]; it.pack=pk; it.packId=pid; }
    select(null); refresh(); toast(`تزاد: <b>${esc(P.name)}</b> · <span class="num">${fmt(P.price)}</span>`); return; }
  const obst=obstacles(); let b=placeOnWall(P.base,['back','right','left','front'],S.items,obst,null);
  if(!b){ toast(`ما كانش بلاصة لـ ${esc(P.name)}. كبّر المحل ولا نحّي شي قطع.`); return; }
  const pk='k'+(uidSeq++), base={uid:uidSeq++,id:P.base,x:b.x,z:b.z,q:b.q,pack:pk,packId:pid}; S.items.push(base); itemsG.add(buildModel(base));
  for(const r of ridersOf(P,base)){ const it={uid:uidSeq++,...r,pack:pk,packId:pid}; S.items.push(it); itemsG.add(buildModel(it)); }
  select(base.uid); refresh(); toast(`تزاد: <b>${esc(P.name)}</b> · <span class="num">${fmt(P.price)}</span>`); }
function findTopSpot(id){ const d=DEF[id];
  for(const sf of S.items){ const sd=DEF[sf.id]; if(!sd.surface) continue; const sw=sf.w||sd.w, a=sf.q*Math.PI/2, c=Math.cos(a), sn=Math.sin(a);
    for(let dx=-sw/2+d.w/2; dx<=sw/2-d.w/2+1e-6; dx+=.05){ const it={id,x:sf.x+c*dx,z:sf.z-sn*dx,q:sf.q}; if(fits(it,S.items,[])) return it; } }
  return null; }
function addItem(id,near){ const d=DEF[id]; const obst=obstacles(); let best=null;
  if(d.top) best=findTopSpot(id);
  if(d.mount){ best=placeOnWall(id,['back','right','left','front'],S.items,obst,null); }
  if(!best){ const cx=near?near.x:0, cz=near?near.z:0, cands=[];
    for(let x=-S.L/2;x<=S.L/2;x+=.1) for(let z=-S.W/2;z<=S.W/2;z+=.1) cands.push({x,z,dd:(x-cx)**2+(z-cz)**2});
    cands.sort((a,b)=>a.dd-b.dd);
    for(const c of cands){ for(const q of [0,1]){ const it={id,x:+c.x.toFixed(2),z:+c.z.toFixed(2),q,...(near&&near.w?{w:near.w}:{})}; if(fits(it,S.items,obst)){best=it;break;} } if(best) break; } }
  const it={uid:uidSeq++,id,x:best?best.x:0,z:best?best.z:0,q:best?best.q:0,...((best&&best.w)||(near&&near.w)?{w:(best&&best.w)||near.w}:{})};
  delete it._wall; delete it._t; clampItem(it); S.items.push(it); itemsG.add(buildModel(it)); select(it.uid); refresh();
  toast(best?`تزاد: <b>${esc(d.name)}</b>`:`ما كانش بلاصة فارغة لـ ${esc(d.name)}. حطيناها في الوسط، حرّكها.`); }

/* ---------- Budget & advisor ---------- */
function packComplete(k){ const its=S.items.filter(i=>i.pack===k); if(!its.length) return false; const P=PACKS[its[0].packId];
  const need=packList(P), have=its.map(i=>i.id); return need.every(id=>have.filter(x=>x===id).length>=need.filter(x=>x===id).length); }
function totals(){ const lines=[]; let ht=0, unknown=0; const packCnt={}, removed={};
  for(const k of new Set(S.items.filter(i=>i.pack).map(i=>i.pack))){ const its=S.items.filter(i=>i.pack===k), pid=its[0].packId, P=PACKS[pid];
    packCnt[pid]=(packCnt[pid]||0)+1; const have=its.map(i=>i.id);
    for(const id of packList(P)){ const j=have.indexOf(id); if(j>=0) have.splice(j,1); else removed[id]=(removed[id]||0)+1; } }
  for(const pid in packCnt){ const P=PACKS[pid], n=packCnt[pid]; lines.push({def:{name:P.name,pid},qty:n,total:P.price*n}); ht+=P.price*n; }
  for(const id in removed){ lines.push({def:{name:'− '+DEF[id].name},qty:removed[id],total:0,unknown:true}); unknown+=removed[id]; }
  const singles={};
  for(const it of S.items){ if(it.pack) continue; const d=DEF[it.id], p=priceOf(it);
    const l=singles[it.id]||(singles[it.id]={def:{...d,name:'+ '+d.name},qty:0,total:0,unknown:false}); l.qty+=d.perM?(it.w||d.w):1; if(p==null) l.unknown=true; else { l.total+=p; ht+=p; } }
  for(const l of Object.values(singles)){ lines.push(l); if(l.unknown) unknown+=l.qty; }
  const inst=opts.inst?ht*.06:0, tva=opts.tva?(ht+inst)*.19:0; return {lines,ht,inst,tva,ttc:ht+inst+tva,unknown}; }
const linePrice = l => l.unknown ? 'حسب الطلب' : fmt(l.total);
function advice(t){ const n=[];
  if(!S.items.length){ n.push(['info','المحل فارغ. اضغط «صمّم لي المحل» ولا زيد الـPack من خطوة المعدات.']); return n; }
  const bad=collisions(); if(bad.size) n.push(['bad',`${bad.size} قطع راكبين على بعضاهم ولا قدّام الباب. حرّكهم حتى يروح اللون الأحمر.`]);
  const floored=S.items.filter(i=>DEF[i.id].top&&surfaceY(i)===0); if(floored.length) n.push(['warn',`${floored.map(i=>DEF[i.id].name).join('، ')} راهي على الأرض. حطّها فوق الكونتوار.`]);
  if(t.unknown) n.push(['info',`بدّلت في الـPack. سعر ${t.unknown} منتج يأكدهولك البائع في الـDevis.`]);
  if(lastUnfit.length) n.push(['warn','الـPack ما دخلش في هذا القياس. الكونتوار طولو 2 م.']);
  if(!bad.size&&!floored.length&&!lastUnfit.length&&!t.unknown) n.push(['ok','كلش في بلاصتو.']);
  return n; }
function refresh(){ const t=totals(), type=typeOf();
  $('#hudType').textContent=type.fr; $('#hudDims').textContent=`${S.L.toFixed(1)} × ${S.W.toFixed(1)} × ${S.H.toFixed(1)} m · ${(S.L*S.W).toFixed(1)} m²`;
  $('#statArea').textContent=(S.L*S.W).toFixed(1)+' m²'; $('#pillTotal').textContent=fmt(t.ttc)+(t.unknown?' +':''); $('#pillCount').textContent=`${S.items.length} قطعة`;
  $('#budRows').innerHTML=t.lines.length?t.lines.map(l=>`<tr><td class="nm">${esc(l.def.name)}</td><td class="num">${l.def.perM?l.qty.toFixed(1)+' m':l.qty}</td><td class="n num">${linePrice(l)}</td></tr>`).join('')
    :`<tr><td colspan="3" class="empty">ما كانش معدات بعد.</td></tr>`;
  $('#tHT').textContent=fmt(t.ht); $('#tInst').textContent=fmt(t.inst); $('#tTva').textContent=fmt(t.tva); $('#tTTC').textContent=fmt(t.ttc); $('#tNote').hidden=!t.unknown; $('#tNote').textContent=`+ التعديلات (${t.unknown} منتج): سعرها يأكدو البائع.`;
  $('#notes').innerHTML=advice(t).map(([k,s])=>`<li><span class="chip ${k}">${{ok:'مليح',warn:'انتبه',bad:'مشكل',info:'معلومة'}[k]}</span><span>${esc(s)}</span></li>`).join('');
  if(selected) select(selected); renderLib(); }

/* ---------- Panel UI ---------- */
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function showTab(t){ if(t==='bud'){ const d=$('#budDetails'); d.open=true; d.scrollIntoView({block:'nearest',behavior:'smooth'}); } }
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showTab(b.dataset.go));
$('#totalPill').onclick=()=>showTab('bud');
function renderTypes(){ $('#types').innerHTML=TYPES.map(t=>`<button class="ptype" data-ptype="${t.id}" aria-pressed="${t.id===S.type}"><span class="em" aria-hidden="true">${t.em}</span><b>${t.fr}</b><small>${t.ar}</small></button>`).join(''); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-ptype]'); if(!b) return; S.type=b.dataset.ptype; renderTypes(); buildRoom();
  const ok=new Set(); Object.values(PACKS).filter(P=>!P.hidden&&(!P.types||P.types.includes(S.type))).forEach(P=>packList(P).forEach(id=>ok.add(id))); eqList().forEach(g=>g.models.forEach(m=>ok.add(m.id)));
  const gone=S.items.filter(i=>!ok.has(i.id)); gone.forEach(i=>itemsG.remove(groupOf(i.uid))); S.items=S.items.filter(i=>ok.has(i.id)); select(null);
  catTab=Object.values(PACKS).some(P=>!P.hidden&&(!P.types||P.types.includes(S.type)))?'packs':'equip';
  if(!S.items.length&&recipeOf().wall.length){ suggest(); } renderLib(); refresh();
  toast(`المشروع: <b>${esc(typeOf().fr)}</b>`); });
renderTypes();
const packKeys = pid => [...new Set(S.items.filter(i=>i.packId===pid).map(i=>i.pack))];
function qtyHTML(pid){ const n=packKeys(pid).length, nm=esc(PACKS[pid].name);
  return `<div class="qty"><button data-qdec="${pid}" aria-label="نقّص ${nm}" ${n?'':'disabled'}>−</button><span class="num" aria-live="polite">${n}</span><button data-qinc="${pid}" aria-label="زيد ${nm}">+</button></div>`; }
function prodQtyHTML(id){ const n=S.items.filter(i=>i.id===id).length, nm=esc(DEF[id].name);
  return `<div class="qty"><button data-pdec="${id}" aria-label="نقّص ${nm}" ${n?'':'disabled'}>−</button><span class="num">${n}</span><button data-pinc="${id}" aria-label="زيد ${nm}">+</button></div>`; }
function removeProduct(id){ const its=S.items.filter(i=>i.id===id); const it=its.filter(i=>!i.pack).pop()||its.pop(); if(!it) return;
  S.items=S.items.filter(i=>i!==it); itemsG.remove(groupOf(it.uid)); if(selected===it.uid) select(null); refresh(); toast(`تنقص: <b>${esc(DEF[id].name)}</b>`); }
const thumbCache={}; let thumbR=null, thumbEnv=null;
function thumb(id){ return PHOTOS[id]||render3d(id); }
function render3d(id){ if(thumbCache[id]) return thumbCache[id];
  try{ if(!thumbR){ thumbR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); thumbR.setSize(240,240); thumbR.outputEncoding=THREE.sRGBEncoding;
      thumbR.toneMapping=THREE.ACESFilmicToneMapping; thumbR.toneMappingExposure=.9; try{ thumbEnv=new THREE.PMREMGenerator(thumbR).fromScene(new THREE.RoomEnvironment(),.04).texture; }catch(e){} }
    const sc=new THREE.Scene(); sc.environment=thumbEnv; sc.add(new THREE.HemisphereLight(0xffffff,0x888888,thumbEnv?.25:.8)); const dl=new THREE.DirectionalLight(0xffffff,.9); dl.position.set(2,4,3); sc.add(dl);
    const g=buildModel({id,x:0,z:0,q:0,uid:-1}); g.position.y=0; g.children.forEach(o=>{ if(o.name==='outline'||o.name==='pad') g.remove(o); }); g.remove(g.getObjectByName('pad')); sc.add(g);
    const box=new THREE.Box3().setFromObject(g), c=box.getCenter(new THREE.Vector3()), sz=box.getSize(new THREE.Vector3()).length();
    const cam=new THREE.PerspectiveCamera(30,1,.01,50); cam.position.copy(c).add(new THREE.Vector3(.75,.55,1).normalize().multiplyScalar(sz*1.75)); cam.lookAt(c);
    thumbR.render(sc,cam); return thumbCache[id]=thumbR.domElement.toDataURL('image/png'); }catch(e){ return ''; } }
function showPhoto(id){ const real=!!PHOTOS[id];
  openModal(`<header><h2 style="direction:ltr;text-align:right">${esc(DEF[id].name)}</h2><button class="btn small" data-close>غلق</button></header>
  <div class="photos${real?' two':''}">${real?`<figure><img src="${PHOTOS[id]}" alt="${esc(DEF[id].name)}"><figcaption>الصورة الحقيقية</figcaption></figure>`:''}
  <figure><img src="${render3d(id)}" alt="${esc(DEF[id].name)} في الـ3D"><figcaption>${real?'كيفاش يبان في الـ3D':'صورة توضيحية من الـ3D. الصورة الحقيقية جاية قريب.'}</figcaption></figure></div>`); }
function removePack(pid){ const k=packKeys(pid).pop(); if(!k) return; const gone=S.items.filter(i=>i.pack===k);
  S.items=S.items.filter(i=>i.pack!==k); gone.forEach(i=>itemsG.remove(groupOf(i.uid))); select(null); refresh(); toast(`تنقص: <b>${esc(PACKS[pid].name)}</b>`); }
document.addEventListener('click',e=>{ const inc=e.target.closest('[data-qinc]'), dec=e.target.closest('[data-qdec]');
  if(inc) addPack(inc.dataset.qinc); if(dec) removePack(dec.dataset.qdec);
  const pi=e.target.closest('[data-pinc]'), pd=e.target.closest('[data-pdec]'), ph=e.target.closest('[data-photo]');
  if(pi) addItem(pi.dataset.pinc); if(pd) removeProduct(pd.dataset.pdec); if(ph) showPhoto(ph.dataset.photo); });
/* ---------- المعدات وحدها (بالموديلات) ---------- */
// المنتجات المحفوظة في الموقع. وضع البائع (#admin) يبدّلها ويصدّرها هنا.
const EMBED_EQUIP = Array.isArray(EMBED)?EMBED:[];
const EQ_KEY='hassen.equip.v1'; let EQUIP=EMBED_EQUIP; const selModel={}; const texCache={};
if(!DB){ try{ const ls=JSON.parse(localStorage.getItem(EQ_KEY)||'null'); if(Array.isArray(ls)) EQUIP=ls; }catch(e){} }
function photoTex(id){ if(texCache[id]!==undefined) return texCache[id]; const src=PHOTOS[id]; if(!src) return texCache[id]=null;
  const t=new THREE.TextureLoader().load(src,()=>{ const it=S.items.find(i=>i.id===id); if(it) S.items.filter(i=>i.id===id).forEach(rebuildOne); }); t.encoding=THREE.sRGBEncoding; return texCache[id]=t; }
function regModel(g,m){ const def={id:m.id,name:g.name+' · '+m.name,cat:'equip',w:+m.w||.6,d:+m.d||.6,h:+m.h||.9,p:(m.price===''||m.price==null)?null:+m.price,kind:'generic',top:m.top?1:0};
  const i=CATALOG.findIndex(c=>c.id===m.id); if(i>=0) CATALOG[i]=def; else CATALOG.push(def); DEF[m.id]=def; if(m.photo) PHOTOS[m.id]=m.photo; else delete PHOTOS[m.id]; delete thumbCache[m.id]; delete texCache[m.id]; }
EQUIP.forEach(g=>g.models.forEach(m=>regModel(g,m)));
const isAdmin=()=>false; // products are managed in /admin (store database)
addEventListener('hashchange',()=>renderLib());
function saveEquip(){ try{ localStorage.setItem(EQ_KEY,JSON.stringify(EQUIP)); setTimeout(()=>{ if(typeof rerenderAdmin==='function'&&$('#admBody')&&!$('#mform')) rerenderAdmin(); },0); return true; }catch(e){ toast('ما قدرناش نحفظو: الصور بزاف كبار ولا الذاكرة عامرة.'); return false; } }
function eqCard(g,admin){ const m=g.models.find(x=>x.id===selModel[g.id])||g.models[0]; if(!m) return ''; const d=DEF[m.id];
  return `<div class="pitem eq"><button class="thumb" data-photo="${m.id}" aria-label="شوف صورة ${esc(d.name)}"><img src="${thumb(m.id)}" alt="" loading="lazy"></button>
  <div class="nm"><b>${esc(g.name)}</b><span>${g.models.length>1?g.models.length+' موديلات':'موديل واحد'}</span></div>
  ${g.models.length>1?`<div class="models" role="group" aria-label="اختار الموديل">${g.models.map(x=>`<button class="mchip" data-model="${g.id}|${x.id}" aria-pressed="${x.id===m.id}">${esc(x.name)}</button>`).join('')}</div>`:`<div class="models one">${esc(m.name)}</div>`}
  <div class="eqmeta"><b class="${d.p==null?'':'num'}">${d.p==null?'السعر حسب الطلب':fmt(d.p)}</b><span class="num">${d.w}×${d.d}×${d.h} m</span></div>
  ${prodQtyHTML(m.id)}
  ${admin?`<div class="row adm"><button class="btn small" data-addmodel="${g.id}">+ موديل</button><button class="btn small" data-editmodel="${g.id}|${m.id}">بدّل</button><button class="btn small danger" data-delmodel="${g.id}|${m.id}">نحّي</button></div>`:''}</div>`; }
const EQ_CATS=[
 {id:'cuisson',fr:'Cuisson',ar:'الطهي',t:'*'},{id:'froid',fr:'Froid',ar:'التبريد',t:'*'},{id:'prep',fr:'Préparation',ar:'التحضير',t:'*'},
 {id:'pizza',fr:'Pizza',ar:'البيتزا',t:['pizzeria','restaurant']},
 {id:'boissons',fr:'Café & Boissons',ar:'القهوة والمشروبات',t:['cafeteria','fastfood','patisserie','creperie','restaurant']},
 {id:'patis',fr:'Pâtisserie & Crêpes',ar:'الحلويات والكريب',t:['patisserie','creperie','cafeteria']},
 {id:'service',fr:'Service & Mobilier',ar:'الخدمة والأثاث',t:'*'},{id:'lavage',fr:'Lavage & Rangement',ar:'الغسيل والتخزين',t:'*'},{id:'inox',fr:'Inox & Accessoires',ar:'الإينوكس والإكسسوارات',t:'*'}];
const catsFor=()=>EQ_CATS.filter(c=>c.t==='*'||c.t.includes(S.type));
let catTab='packs';
function equipHTML(){ const admin=isAdmin(), list=eqList(); if(!list.length&&!admin) return '';
  const fit=new Set(catsFor().map(c=>c.id)), cats=EQ_CATS.filter(c=>list.some(g=>g.cat===c.id)||(admin&&fit.has(c.id))), known=new Set(cats.map(c=>c.id)), other=list.filter(g=>!known.has(g.cat));
  let h=`<div class="cat equip">`;
  if(admin) h+=`<div class="adminbar"><b>وضع البائع</b><span>اضغط «+» في أي قسم باش تزيد معدّة. التبديلات تتحفظ في هذا الجهاز؛ باش يشوفوهم الزبائن، حلّ «لوحة التحكم ← النشر».</span>
    <div class="row"><button class="btn small primary" data-openadmin>لوحة التحكم</button><button class="btn small" data-export>نزّل نسخة (equipment.json)</button></div></div>`;
  for(const c of cats){ const gs=list.filter(g=>g.cat===c.id); if(!gs.length&&!admin) continue;
    h+=`<section class="eqcat"><h4>${c.ar} <small>${c.fr}</small>${gs.length?` <span class="num">${gs.length}</span>`:''}</h4><div class="pitems">${gs.map(g=>eqCard(g,admin)).join('')}${admin?`<button class="slot" data-addgroup="${c.id}"><b>+</b><span>زيد معدّة</span><small>${c.fr}</small></button>`:''}</div></section>`; }
  if(other.length) h+=`<section class="eqcat"><h4>أخرى <small>Autres</small></h4><div class="pitems">${other.map(g=>eqCard(g,admin)).join('')}</div></section>`;
  return h+'</div>'; }
const eqList = () => EQUIP.filter(g=>!g.types||!g.types.length||g.types.includes(S.type));
function resizePhoto(file){ return new Promise((ok,ko)=>{ const r=new FileReader(); r.onerror=ko; r.onload=()=>{ const im=new Image(); im.onerror=ko; im.onload=()=>{ const k=Math.min(1,700/Math.max(im.width,im.height));
  const c=document.createElement('canvas'); c.width=Math.round(im.width*k); c.height=Math.round(im.height*k); const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0,c.width,c.height); ok(c.toDataURL('image/jpeg',.82)); }; im.src=r.result; }; r.readAsDataURL(file); }); }
function modelForm(gid,mid,cat){ const g=EQUIP.find(x=>x.id===gid), m=g&&mid?g.models.find(x=>x.id===mid):null, newGroup=!g;
  openModal(`<header><h2>${newGroup?'زيد معدّة جديدة':m?'بدّل الموديل':'زيد موديل لـ '+esc(g.name)}</h2><button class="btn small" data-close>غلق</button></header>
  <form id="mform" class="mform">
    ${newGroup?`<div class="field"><label for="fGroup">اسم المعدّة (مثلاً: Friteuse)</label><input id="fGroup" required></div>
    <div class="field"><label for="fCat">القسم</label><select id="fCat">${EQ_CATS.map(c=>`<option value="${c.id}" ${c.id===(cat||'cuisson')?'selected':''}>${c.ar} · ${c.fr}</option>`).join('')}</select></div>`:''}
    <div class="field"><label for="fName">اسم الموديل (مثلاً: Comaf 2×8 L)</label><input id="fName" required value="${m?esc(m.name):''}"></div>
    <div class="field"><label for="fPrice">السعر (DA) · خلّيه فارغ = حسب الطلب</label><input id="fPrice" type="number" min="0" step="500" value="${m&&m.price!=null?m.price:''}"></div>
    <div class="grid3"><div class="field"><label for="fW">الطول (m)</label><input id="fW" type="number" step="0.01" min="0.1" value="${m?m.w:.6}"></div>
      <div class="field"><label for="fD">العمق (m)</label><input id="fD" type="number" step="0.01" min="0.1" value="${m?m.d:.6}"></div>
      <div class="field"><label for="fH">العلو (m)</label><input id="fH" type="number" step="0.01" min="0.05" value="${m?m.h:.9}"></div></div>
    ${newGroup?`<fieldset class="ftypes"><legend>يصلح لـ</legend>${TYPES.map(t=>`<label class="check"><input type="checkbox" name="ftype" value="${t.id}" ${t.id===S.type?'checked':''}> ${t.fr}</label>`).join('')}</fieldset>`:''}
    <label class="check"><input type="checkbox" id="fTop" ${m&&m.top?'checked':''}> يتحط فوق الكونتوار (ماكينة صغيرة)</label>
    <div class="field"><label for="fPhoto">الصورة ${m&&m.photo?'(خلّيها فارغة باش تبقى القديمة)':''}</label><input id="fPhoto" type="file" accept="image/*"></div>
    <button class="btn primary" type="submit">حفظ</button>
  </form>`);
  $('#mform').onsubmit=async e=>{ e.preventDefault(); const f=$('#fPhoto').files[0]; let photo=m?m.photo:''; if(f){ try{ photo=await resizePhoto(f); }catch(err){ toast('ما قدرناش نقراو الصورة.'); return; } }
    const nm={id:m?m.id:'m'+Date.now().toString(36),name:$('#fName').value.trim()||'Modèle',price:$('#fPrice').value===''?null:+$('#fPrice').value,w:+$('#fW').value||.6,d:+$('#fD').value||.6,h:+$('#fH').value||.9,top:$('#fTop').checked,photo};
    let grp=g; if(newGroup){ grp={id:'g'+Date.now().toString(36),name:$('#fGroup').value.trim()||'Équipement',cat:$('#fCat').value,types:[...document.querySelectorAll('[name=ftype]:checked')].map(x=>x.value),models:[]}; EQUIP.push(grp); }
    if(m) Object.assign(m,nm); else grp.models.push(nm); selModel[grp.id]=nm.id; regModel(grp,nm); saveEquip();
    const reopen=$('#dialog').classList.contains('wide'); S.items.filter(i=>i.id===nm.id).forEach(rebuildOne); closeModal(); refresh(); if(reopen) openAdmin(); toast(`تحفظ: <b>${esc(grp.name)} · ${esc(nm.name)}</b>`); }; }
function delModel(gid,mid){ const g=EQUIP.find(x=>x.id===gid); if(!g) return; g.models=g.models.filter(x=>x.id!==mid); if(!g.models.length) EQUIP=EQUIP.filter(x=>x!==g);
  S.items.filter(i=>i.id===mid).forEach(i=>itemsG.remove(groupOf(i.uid))); S.items=S.items.filter(i=>i.id!==mid); delete DEF[mid]; const ci=CATALOG.findIndex(c=>c.id===mid); if(ci>=0) CATALOG.splice(ci,1);
  saveEquip(); select(null); refresh(); }
async function exportSite(){ const json=JSON.stringify(EQUIP,null,1);
  try{ if(window.claude) throw 0; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([json],{type:'application/json'})); a.download='equipment.json'; document.body.appendChild(a); a.click(); a.remove();
    toast('تنزّل <b>equipment.json</b>. ابعثو لـClaude ولا حطّو في public/data باش يشوفوه الزبائن.'); }
  catch(e){ openModal(`<header><h2>تنزيل المعدات</h2><button class="btn small" data-close>غلق</button></header><p>التنزيل ما يخدمش هنا.</p><p class="empty">المنتجات راهم محفوظين في هذا الجهاز وما راحوش.</p>`); } }
/* ---------- لوحة التحكم (Admin) ---------- */
const GH={owner:'pako64038-ship-it',repo:'Hassen-Equipment'};
const PK_KEY='hassen.packs.v1', PO_KEY='hassen.packov.v1', SET_KEY='hassen.settings.v1', TOK_KEY='hassen.gh.token';
const lsGet=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)||'null'); return v==null?d:v; }catch(e){ return d; } };
const lsSet=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ toast('ما قدرناش نحفظو في هذا الجهاز.'); return false; } };
let CPACKS=DB?(SITE.packs||[]):lsGet(PK_KEY,Array.isArray(SITE.packs)?SITE.packs:[]);
let POV=DB?(SITE.packOverrides||{}):lsGet(PO_KEY,SITE.packOverrides&&typeof SITE.packOverrides==='object'?SITE.packOverrides:{});
let SETTINGS=Object.assign({whatsapp:'213556554548',phone:'0556 55 45 48'},SITE.settings||{},lsGet(SET_KEY,{}));
const BUILTIN_PACKS=Object.fromEntries(Object.entries(PACKS).map(([k,P])=>[k,{name:P.name,price:P.price,types:P.types}]));
function applyPacks(){ for(const k of Object.keys(PACKS)) if(PACKS[k].custom) delete PACKS[k];
  for(const [k,b] of Object.entries(BUILTIN_PACKS)) Object.assign(PACKS[k],b,{hidden:false},POV[k]||{});
  for(const cp of CPACKS){ const list=[]; (cp.items||[]).forEach(x=>{ for(let i=0;i<(+x.qty||1);i++) list.push(x.id); }); PACKS[cp.id]={custom:true,name:cp.name,price:+cp.price||0,types:cp.types&&cp.types.length?cp.types:null,hidden:!!cp.hidden,list}; } }
function applySettings(){ SELLER_WHATSAPP=String(SETTINGS.whatsapp||'').replace(/\D/g,''); }
applyPacks(); applySettings();
const allModels=()=>EQUIP.flatMap(g=>g.models.map(m=>({id:m.id,name:g.name+' · '+m.name})));
const builtinModels=()=>Object.keys(DEF).filter(id=>DEF[id].packOnly).map(id=>({id,name:DEF[id].name}));
let admTab='equip';
function openAdmin(tab){ if(tab) admTab=tab; $('#dialog').classList.add('wide'); openModal(`<header><h2>لوحة التحكم · Admin</h2><button class="btn small" data-close>غلق</button></header>
  <div class="ctabs atabs" role="tablist">${[['equip','المعدات'],['packs','الـPacks'],['settings','الإعدادات'],['publish','النشر']].map(([k,l])=>`<button role="tab" data-atab="${k}" aria-selected="${admTab===k}">${l}</button>`).join('')}</div>
  <div id="admBody">${admBody()}</div>`); }
const closeAdminClass=()=>$('#dialog').classList.remove('wide');
function admBody(){
  if(admTab==='equip') return `<p class="lead">كل معدّة بالموديلات تاعها. تقدر تزيدهم حتى من الـCatalogue في الخانات «+».</p>
    <div class="row" style="margin:6px 0"><button class="btn small primary" data-addgroup="cuisson">+ زيد معدّة</button></div>
    ${EQUIP.length?`<table class="budget adm-t"><thead><tr><th>المعدّة</th><th>القسم</th><th>الموديلات</th><th></th></tr></thead><tbody>${EQUIP.map(g=>`<tr><td class="nm">${esc(g.name)}<br><small class="empty">${(g.types&&g.types.length?g.types.map(t=>(TYPES.find(x=>x.id===t)||{}).fr).join('، '):'كل الأنواع')}</small></td>
      <td>${esc((EQ_CATS.find(c=>c.id===g.cat)||{ar:'أخرى'}).ar)}</td><td>${g.models.map(m=>`<div class="row" style="gap:4px;margin-bottom:3px"><span style="direction:ltr">${esc(m.name)}</span> <span class="num empty">${m.price==null?'حسب الطلب':fmt(m.price)}</span><button class="btn small" data-editmodel="${g.id}|${m.id}">بدّل</button><button class="btn small danger" data-delmodel="${g.id}|${m.id}">نحّي</button></div>`).join('')}</td>
      <td><button class="btn small" data-addmodel="${g.id}">+ موديل</button></td></tr>`).join('')}</tbody></table>`:'<p class="empty">ما كانش معدات ضرك.</p>'}`;
  if(admTab==='packs'){ const rows=Object.entries(PACKS).map(([k,P])=>`<tr><td class="nm">${esc(P.name)}${P.hidden?' <small class="empty">(مخبّي)</small>':''}<br><small class="empty">${P.types?P.types.map(t=>(TYPES.find(x=>x.id===t)||{}).fr).join('، '):'كل الأنواع'}</small></td>
      <td class="num">${fmt(P.price)}</td><td>${packList(P).length} قطع</td><td><button class="btn small" data-editpack="${k}">بدّل</button>${P.custom?` <button class="btn small danger" data-delpack="${k}">نحّي</button>`:''}</td></tr>`).join('');
    return `<p class="lead">بدّل السعر والاسم، ولا اعمل Pack جديد من المعدات اللي زدتهم.</p><div class="row" style="margin:6px 0"><button class="btn small primary" data-editpack="">+ Pack جديد</button></div>
    <table class="budget adm-t"><thead><tr><th>الـPack</th><th>السعر</th><th>المحتوى</th><th></th></tr></thead><tbody>${rows}</tbody></table>`; }
  if(admTab==='settings') return `<form id="setForm" class="mform"><div class="field"><label for="sWa">رقم الواتساب (بالـ213، بلا 0 والفراغات)</label><input id="sWa" inputmode="numeric" value="${esc(SETTINGS.whatsapp)}"></div>
    <div class="field"><label for="sPhone">الهاتف اللي يبان للزبائن</label><input id="sPhone" value="${esc(SETTINGS.phone)}"></div><button class="btn primary" type="submit">حفظ</button></form>`;
  const tok=lsGet(TOK_KEY,'');
  return `<div class="mform"><p class="lead">التبديلات تتحفظ في هذا الجهاز برك. باش يشوفوها الزبائن، اضغط «انشر في الموقع». الموقع يتبدّل في دقيقة ولا زوج.</p>
    <div class="field"><label for="ghTok">مفتاح GitHub ${tok?'(محفوظ ✓)':''}</label><input id="ghTok" type="password" autocomplete="off" placeholder="${tok?'••••••••':'github_pat_…'}"></div>
    <details class="more"><summary>كيفاش نجيب المفتاح؟ (مرة وحدة)</summary><ol style="margin:6px 0;padding-inline-start:18px;font-size:13px;line-height:1.8">
      <li>حلّ <span class="num" style="user-select:all">github.com/settings/personal-access-tokens/new</span></li>
      <li>Token name: <b>Hassen site</b> · Expiration: <b>1 year</b></li><li>Repository access: <b>Only select repositories</b> ← <b>Hassen-Equipment</b></li>
      <li>Permissions ← Repository permissions ← <b>Contents: Read and write</b></li><li>Generate token، انسخو، وحطّو هنا.</li></ol></details>
    <div class="row"><button class="btn primary" data-publish>انشر في الموقع</button>${tok?'<button class="btn small" data-forget>نحّي المفتاح</button>':''}</div>
    <p class="empty" id="pubMsg"></p><p class="empty" style="font-size:12px">ما تعطيش هذا المفتاح لحتى واحد. يتحفظ في هذا الجهاز برك.</p></div>`; }
function rerenderAdmin(){ const b=$('#admBody'); if(b){ b.innerHTML=admBody(); document.querySelectorAll('[data-atab]').forEach(x=>x.setAttribute('aria-selected',x.dataset.atab===admTab)); bindAdmin(); } }
function bindAdmin(){ const f=$('#setForm'); if(f) f.onsubmit=e=>{ e.preventDefault(); SETTINGS.whatsapp=$('#sWa').value.replace(/\D/g,''); SETTINGS.phone=$('#sPhone').value.trim(); lsSet(SET_KEY,SETTINGS); applySettings(); toast('تحفظو الإعدادات.'); }; }
function packForm(k){ const P=k?PACKS[k]:null, isNew=!k, custom=isNew||(P&&P.custom); const cp=custom&&!isNew?CPACKS.find(x=>x.id===k):null;
  const counts={}; (cp?cp.items:[]).forEach(x=>counts[x.id]=+x.qty||0); const models=[...builtinModels(),...allModels()];
  $('#admBody').innerHTML=`<form id="packForm" class="mform"><h3 style="margin:0">${isNew?'Pack جديد':'بدّل الـPack'}</h3>
    <div class="field"><label for="pName">الاسم</label><input id="pName" required value="${P?esc(P.name):''}"></div>
    <div class="field"><label for="pPrice">السعر (DA)</label><input id="pPrice" type="number" min="0" step="500" required value="${P?P.price:''}"></div>
    <fieldset class="ftypes"><legend>يصلح لـ (ما تعلّم والو = كل الأنواع)</legend>${TYPES.map(t=>`<label class="check"><input type="checkbox" name="ptype" value="${t.id}" ${P&&P.types&&P.types.includes(t.id)?'checked':''}> ${t.fr}</label>`).join('')}</fieldset>
    ${custom?`<fieldset class="ftypes" style="grid-template-columns:1fr"><legend>المحتوى (الكمية)</legend>${models.length?models.map(m=>`<label class="check" style="justify-content:space-between"><span style="direction:ltr">${esc(m.name)}</span><input type="number" min="0" max="20" step="1" data-pq="${m.id}" value="${counts[m.id]||0}" style="width:64px"></label>`).join(''):'<p class="empty">زيد المعدات أول في «المعدات».</p>'}</fieldset>`
      :`<label class="check"><input type="checkbox" id="pHidden" ${P.hidden?'checked':''}> خبّي هذا الـPack على الزبائن</label><p class="empty">محتوى هذا الـPack ثابت.</p>`}
    <div class="row"><button class="btn primary" type="submit">حفظ</button><button class="btn" type="button" data-atab="packs">رجوع</button></div></form>`;
  $('#packForm').onsubmit=e=>{ e.preventDefault(); const name=$('#pName').value.trim()||'Pack', price=+$('#pPrice').value||0, types=[...document.querySelectorAll('[name=ptype]:checked')].map(x=>x.value);
    if(custom){ const items=[...document.querySelectorAll('[data-pq]')].map(x=>({id:x.dataset.pq,qty:Math.round(+x.value||0)})).filter(x=>x.qty>0); if(!items.length){ toast('اختار على الأقل منتج واحد.'); return; }
      if(cp) Object.assign(cp,{name,price,types,items}); else CPACKS.push({id:'p'+Date.now().toString(36),name,price,types,items}); lsSet(PK_KEY,CPACKS); }
    else { POV[k]={name,price,types:types.length?types:null,hidden:$('#pHidden').checked}; lsSet(PO_KEY,POV); }
    applyPacks(); renderLib(); refresh(); admTab='packs'; rerenderAdmin(); toast(`تحفظ: <b>${esc(name)}</b>`); }; }
function siteJson(){ return JSON.stringify({version:1,updated:new Date().toISOString(),settings:SETTINGS,packOverrides:POV,packs:CPACKS,equip:EQUIP},null,1); }
async function ghPut(path,branch,content,token){ const api=`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}`, h={Authorization:'Bearer '+token,Accept:'application/vnd.github+json'};
  let sha; const g=await fetch(api+'?ref='+branch,{headers:h,cache:'no-store'}); if(g.ok) sha=(await g.json()).sha; else if(g.status!==404) throw new Error('get '+g.status);
  const bytes=new TextEncoder().encode(content); let bin=''; for(let i=0;i<bytes.length;i+=0x8000) bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
  const r=await fetch(api,{method:'PUT',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({message:'Update site data from admin',content:btoa(bin),branch,...(sha?{sha}:{})})});
  if(!r.ok) throw new Error('put '+r.status); }
async function publishSite(){ const inp=$('#ghTok'); if(inp&&inp.value.trim()) lsSet(TOK_KEY,inp.value.trim()); const token=lsGet(TOK_KEY,''); const msg=$('#pubMsg');
  if(!token){ msg.textContent='حط مفتاح GitHub أول.'; return; } if(window.claude){ msg.textContent='النشر يخدم من الموقع برك، ماشي من هنا.'; return; }
  msg.textContent='راهو ينشر…'; const json=siteJson();
  try{ await ghPut('data/site.json','gh-pages',json,token); await ghPut('public/data/site.json','main',json,token).catch(()=>{});
    msg.textContent='✓ تنشر. الموقع يتبدّل في دقيقة ولا زوج.'; toast('تنشر في الموقع ✓'); }
  catch(e){ const c=String(e.message||e); msg.textContent=/401|403/.test(c)?'المفتاح غالط ولا ما عندوش الصلاحية (Contents: Read and write).':/409|422/.test(c)?'صرا تعارض. عاود اضغط «انشر».':'ما قدرناش ننشرو ('+c+'). تأكد من الإنترنت وعاود.'; } }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-atab],[data-editpack],[data-delpack],[data-publish],[data-forget],[data-openadmin]'); if(!t) return; const d=t.dataset;
  if(d.openadmin!==undefined) openAdmin();
  else if(d.atab){ admTab=d.atab; rerenderAdmin(); }
  else if(d.editpack!==undefined) packForm(d.editpack||null);
  else if(d.delpack){ if(t.dataset.sure){ CPACKS=CPACKS.filter(x=>x.id!==d.delpack); lsSet(PK_KEY,CPACKS); const gone=S.items.filter(i=>i.packId===d.delpack); gone.forEach(i=>itemsG.remove(groupOf(i.uid))); S.items=S.items.filter(i=>i.packId!==d.delpack); applyPacks(); renderLib(); refresh(); rerenderAdmin(); } else { t.dataset.sure='1'; t.textContent='متأكد؟'; } }
  else if(d.publish!==undefined) publishSite();
  else if(d.forget!==undefined){ try{ localStorage.removeItem(TOK_KEY); }catch(err){} rerenderAdmin(); } });
function adminButton(){ let b=$('#adminBtn'); if(isAdmin()&&!b){ b=document.createElement('button'); b.id='adminBtn'; b.className='btn primary'; b.dataset.openadmin=''; b.textContent='لوحة التحكم · Admin'; $('.top').appendChild(b); } else if(!isAdmin()&&b) b.remove(); }
addEventListener('hashchange',adminButton); adminButton();
document.addEventListener('click',e=>{ const ct=e.target.closest('[data-ctab]'); if(ct){ catTab=ct.dataset.ctab; renderLib(); return; }
  const t=e.target.closest('[data-model],[data-addgroup],[data-addmodel],[data-editmodel],[data-delmodel],[data-export]'); if(!t) return; const d=t.dataset;
  if(d.model){ const [g,m]=d.model.split('|'); selModel[g]=m; renderLib(); }
  else if(d.addgroup!==undefined) modelForm(null,null,d.addgroup||'cuisson');
  else if(d.addmodel) modelForm(d.addmodel,null);
  else if(d.editmodel){ const [g,m]=d.editmodel.split('|'); modelForm(g,m); }
  else if(d.delmodel){ const [g,m]=d.delmodel.split('|'); if(t.dataset.sure){ delModel(g,m); } else { t.dataset.sure='1'; t.textContent='متأكد؟'; setTimeout(()=>{ t.dataset.sure=''; t.textContent='نحّي'; },3000); } }
  else if(d.export!==undefined) exportSite(); });

function renderLib(){ const q=''; let html='';
  const pk=Object.entries(PACKS).filter(([id,P])=>(!P.types||P.types.includes(S.type)))
    .filter(([id,P])=>!P.hidden&&packList(P).every(x=>DEF[x]));
  for(const [id,P] of pk){ const prods=[...new Set(packList(P))];
    html+=`<div class="packcard"><div class="packhead"><div class="nm"><b>${esc(P.name)}</b><span class="num">${fmt(P.price)}</span></div>${qtyHTML(id)}</div>
    <p class="lead" style="margin:0">فيه ${prods.length} منتجات. تقدر تزيد ولا تنقّص أي منتج وحدو.</p>
    <div class="pitems">`+prods.map(pid=>{ const d=DEF[pid]; return `<div class="pitem"><button class="thumb" data-photo="${pid}" aria-label="شوف صورة ${esc(d.name)}"><img src="${thumb(pid)}" alt="" loading="lazy"></button>
      <div class="nm"><b>${esc(d.name)}</b><span class="num">${d.w}×${d.d}×${d.h} m</span></div>${prodQtyHTML(pid)}</div>`; }).join('')+`</div></div>`; }
  for(const c in CATS){ const list=CATALOG.filter(p=>p.cat===c&&p.cat!=='equip'&&!p.packOnly&&(!q||p.name.toLowerCase().includes(q)||p.id.includes(q))); if(!list.length) continue;
    html+=`<div class="cat"><h3>${CATS[c]}</h3><div class="lib">`+list.map(p=>`<div class="prod"><div class="nm"><b>${esc(p.name)}</b><span class="num">${p.w}×${p.d}×${p.h} m</span></div><span class="pr num">${fmt(unitPrice(p))}${p.perM?'/m':''}</span><button class="add" data-id="${p.id}" aria-label="زيد ${esc(p.name)}">+</button></div>`).join('')+`</div></div>`; }
  const packHtml=html, eqHtml=equipHTML(), nP=pk.length, nE=eqList().length;
  const soon=w=>`<div class="soonbox"><b>${typeOf().em} ${esc(typeOf().fr)}</b><p>${w} تاع هذا النوع جايين قريب. اطلب Devis ولا اتصل بينا، ونجهّزولك المشروع.</p></div>`;
  html=`<div class="ctabs" role="tablist"><button role="tab" data-ctab="packs" aria-selected="${catTab==='packs'}">Packs <small class="num">${nP}</small></button><button role="tab" data-ctab="equip" aria-selected="${catTab==='equip'}">المعدات وحدها <small class="num">${nE}</small></button></div>`
    +(catTab==='packs'?(packHtml||soon('الـPacks')):(eqHtml||soon('المعدات')));
  $('#lib').innerHTML=html||'<p class="empty">ما لقينا حتى منتج بهذا الاسم.</p>';
  document.querySelectorAll('.add').forEach(b=>b.onclick=()=>addItem(b.dataset.id)); }

['doorWall','winWall'].forEach(id=>{ $('#'+id).innerHTML=(id==='winWall'?'<option value="none">بلا نافذة</option>':'')+Object.keys(WALL_AR).map(w=>`<option value="${w}">${WALL_AR[w]}</option>`).join(''); });

function syncInputs(){ $('#inL').value=S.L; $('#inW').value=S.W; $('#inH').value=S.H; $('#doorWall').value=S.door.wall; $('#doorT').value=S.door.t; $('#doorW').value=S.door.w;
  $('#winWall').value=S.win.wall; $('#winT').value=S.win.t; $('#winW').value=S.win.w; }
const num=(id,lo,hi,def)=>{ const v=parseFloat($('#'+id).value); return isFinite(v)?Math.min(hi,Math.max(lo,v)):def; };
function readInputs(){ S.L=num('inL',2,30,S.L); S.W=num('inW',2,30,S.W); S.H=num('inH',2.4,6,S.H);
  S.door={wall:$('#doorWall').value,w:num('doorW',.8,4,1.2),t:0}; S.door.t=num('doorT',0,99,S.door.t);
  S.win={wall:$('#winWall').value,w:num('winW',.5,8,2),t:num('winT',0,99,2)};
  const ws=walls(); for(const o of [S.door,S.win]){ const wl=ws[o.wall]; if(!wl) continue; o.w=Math.min(o.w,wl.len-.2); o.t=Math.min(Math.max(o.t,o.w/2+.05),wl.len-o.w/2-.05); o.t=+o.t.toFixed(2); } }
function onRoomChange(){ readInputs(); syncInputs(); buildRoom(); S.items.forEach(clampItem); rebuildItems(); resetCamera(); refresh(); }
['inL','inW','inH','doorWall','doorT','doorW','winWall','winT','winW'].forEach(id=>$('#'+id).addEventListener('change',onRoomChange));

$('#btnSuggest').onclick=()=>{ readInputs(); syncInputs(); buildRoom(); resetCamera(); suggest(); showTab('lib'); };

$('#v3d').onclick=()=>{view='3d';$('#v3d').setAttribute('aria-pressed',true);$('#vtop').setAttribute('aria-pressed',false);resetCamera();};
$('#vtop').onclick=()=>{view='top';$('#vtop').setAttribute('aria-pressed',true);$('#v3d').setAttribute('aria-pressed',false);resetCamera();};

let toastT; function toast(html){ const t=$('#toast'); t.innerHTML=html; t.hidden=false; t.style.opacity=1; clearTimeout(toastT); toastT=setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.hidden=true,300);},3200); }

/* ---------- Modal: image & devis ---------- */
function openModal(html){ $('#dialog').innerHTML=html; $('#modal').hidden=false; $('#dialog').querySelector('[data-close]').onclick=closeModal; }
function closeModal(){ $('#modal').hidden=true; $('#dialog').classList.remove('wide'); }
$('#modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });
addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('#modal').hidden) closeModal(); });
$('#btnShot').onclick=()=>{ const sel=selected; select(null); renderer.render(scene,camera); const url=renderer.domElement.toDataURL('image/png'); select(sel);
  openModal(`<header><h2>صورة 3D للمحل</h2><button class="btn small" data-close>غلق</button></header><img src="${url}" alt="صورة ثلاثية الأبعاد للمحل">
  <p class="empty">اضغط مطوّلاً على الصورة (هاتف) ولا كليك يمين (كمبيوتر) باش تحفظها. تقدر تدوّر الكاميرا قبل ما تاخذ صورة جديدة.</p>`); };

function devisText(t,no,c){ const type=typeOf();
  return [`HASSEN EQUIPMENT — DEVIS ${no} — ${new Date().toLocaleDateString('fr-DZ')}`,`Client: ${c.name||'—'} · ${c.phone||'—'} · ${c.city||'—'}`,
   `Local: ${type.fr} ${S.L}×${S.W}×${S.H} m (${(S.L*S.W).toFixed(1)} m²)`,'',
   ...t.lines.map(l=>`- ${l.def.name} × ${l.def.perM?l.qty.toFixed(1)+' m':l.qty} : ${l.unknown?'prix à confirmer':fmt(l.total)}`),'',
   ...(opts.inst?[`Installation & transport: ${fmt(t.inst)}`]:[]),...(opts.tva?[`TVA 19%: ${fmt(t.tva)}`]:[]),`TOTAL: ${fmt(t.ttc)}${t.unknown?' + articles à confirmer':''}`].join('\n'); }
$('#btnDevis').onclick=()=>{ const t=totals(), d=new Date(), no=`DV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(100+Math.random()*900)}`;
  openModal(`<header><h2>طلب Devis</h2><button class="btn small" data-close>غلق</button></header>
  <div class="grid2"><div class="field"><label for="cName">الاسم</label><input id="cName" type="text" autocomplete="name"></div>
  <div class="field"><label for="cPhone">الهاتف</label><input id="cPhone" type="tel" autocomplete="tel" dir="ltr"></div>
  <div class="field" style="grid-column:1/-1"><label for="cCity">الولاية</label><input id="cCity" type="text"></div></div>
  <div class="devis"><div class="meta"><span class="num">${no}</span><span class="num">${d.toLocaleDateString('fr-DZ')}</span></div>
  <table class="budget"><tbody>${t.lines.map(l=>`<tr><td class="nm">${esc(l.def.name)}</td><td class="num">${l.def.perM?l.qty.toFixed(1)+' m':l.qty}</td><td class="n num">${linePrice(l)}</td></tr>`).join('')}</tbody></table>${t.unknown?'<p class="empty" style="margin:6px 0 0">المنتجات «حسب الطلب» يأكد البائع سعرهم.</p>':''}
  <div class="totals">${opts.inst?`<div><span>التركيب والنقل</span><span class="num">${fmt(t.inst)}</span></div>`:''}${opts.tva?`<div><span>TVA 19%</span><span class="num">${fmt(t.tva)}</span></div>`:''}<div class="grand"><span>المجموع</span><span class="num">${fmt(t.ttc)}</span></div></div></div>
  <div class="row"><a class="btn primary" id="waLink" target="_blank" rel="noopener">بعث عبر WhatsApp</a><button class="btn" id="copyDevis">نسخ النص</button></div>
  <textarea id="devisTxt" readonly style="width:100%;min-height:90px;font-family:var(--f-num);font-size:12px;direction:ltr;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px" hidden></textarea>
  <p class="empty" id="devisMsg">الـDevis يتبعث لـHassen Equipment مع المقاسات وقائمة المعدات.</p><p class="empty" style="margin:0">الهاتف: <span class="num" style="user-select:all">${esc(SETTINGS.phone)}</span></p>`);
  const upd=()=>{ const txt=devisText(t,no,{name:$('#cName').value,phone:$('#cPhone').value,city:$('#cCity').value}); $('#devisTxt').value=txt;
    $('#waLink').href=`https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(txt)}`; return txt; };
  ['cName','cPhone','cCity'].forEach(id=>$('#'+id).oninput=upd); upd();
  $('#copyDevis').onclick=()=>{ const txt=upd(); navigator.clipboard.writeText(txt).then(()=>{$('#devisMsg').textContent='تنسخ النص. الصقه في رسالة للبائع.';})
    .catch(()=>{ const ta=$('#devisTxt'); ta.hidden=false; ta.select(); $('#devisMsg').textContent='انسخ النص من الخانة اللي فوق.'; }); }; };

/* ---------- Save / load (this device) ---------- */
const KEY='mahali3d.designs';
const loadAll=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } };
const saveAll=a=>{ try{ localStorage.setItem(KEY,JSON.stringify(a)); return true; }catch(e){ return false; } };
function renderSaved(){ const a=loadAll(); $('#saved').innerHTML=a.length?a.map((s,i)=>`<div><span>${esc(s.name)} <small class="num">${esc(s.date)}</small></span><span class="row"><button class="btn small" data-load="${i}">فتح</button><button class="btn small danger" data-del="${i}">حذف</button></span></div>`).join(''):'<p class="empty">ما كانش تصاميم محفوظة.</p>';
  document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{ const s=loadAll()[+b.dataset.load]; if(!s) return; Object.assign(S,JSON.parse(JSON.stringify(s.state))); if(!TYPES.some(t=>t.id===S.type)) S.type='fastfood'; renderTypes();
    S.items.forEach(i=>i.uid=uidSeq++); lastUnfit=[]; syncInputs(); renderTypes(); buildRoom(); rebuildItems(); resetCamera(); select(null); refresh(); toast(`تفتح: <b>${esc(s.name)}</b>`); });
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const a=loadAll(); a.splice(+b.dataset.del,1); saveAll(a); renderSaved(); }); }
$('#btnSave').onclick=()=>{ const a=loadAll(); const name=$('#saveName').value.trim()||`${typeOf().fr} ${S.L}×${S.W}`;
  a.unshift({name,date:new Date().toLocaleDateString('fr-DZ'),state:JSON.parse(JSON.stringify(S))});
  if(saveAll(a.slice(0,20))){ $('#saveName').value=''; renderSaved(); toast(`تحفظ: <b>${esc(name)}</b>`); } else toast('ما قدرناش نحفظو في هذا المتصفح.'); };

/* ---------- الستيل ---------- */
function renderStyles(){ $('#styles').innerHTML=Object.entries(STYLES).map(([k,v])=>`<button class="style" data-style="${k}" aria-pressed="${S.style===k}"><i style="background:${v.sw}"></i><span>${v.name}</span></button>`).join('');
  document.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{ S.style=b.dataset.style; renderStyles(); buildRoom(); }); }
renderStyles();

/* ---------- صور حيطان المحل ---------- */
const WALL_LABEL={back:['الحائط اللي قدّامك','اللور'],left:['الحائط اليسار',''],right:['الحائط اليمين',''],front:['حائط الباب','الواجهة']};
function renderWallPics(){ $('#wallPics').innerHTML=['back','left','right','front'].map(wn=>{ const img=wallPhotos[wn], [a,b]=WALL_LABEL[wn];
  return `<label class="wallpic${img?' has':''}" for="wp-${wn}">${img?`<img src="${img.src}" alt="">`:''}<span>${img?'✓ ':'+ '}${a}</span>${!img&&b?`<small>${b}</small>`:''}<input id="wp-${wn}" type="file" accept="image/*" data-wall="${wn}"></label>`; }).join(''); }
document.addEventListener('change',e=>{ const inp=e.target.closest('[data-wall]'); if(!inp||!inp.files[0]) return; const wn=inp.dataset.wall, r=new FileReader();
  r.onload=()=>{ const im=new Image(); im.onload=()=>{ wallPhotos[wn]=im; renderWallPics(); buildRoom(); toast(`تزادت صورة <b>${WALL_LABEL[wn][0]}</b>`); }; im.src=r.result; }; r.readAsDataURL(inp.files[0]); });
renderWallPics();

/* ---------- Boot ---------- */
themeScene(); matchMedia('(prefers-color-scheme: dark)').addEventListener('change',themeScene);
new MutationObserver(themeScene).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
syncInputs(); renderTypes(); renderSaved(); buildRoom(); resize(); resetCamera(); suggest();
})();
}
