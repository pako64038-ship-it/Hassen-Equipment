'use client';
import Link from 'next/link';
import { useState } from 'react';
import { addToCart } from '@/lib/cart';
import { fmt, type Pack, type Product } from '@/lib/supabase';

/** Product photo, or a clean branded card with the product name when no photo exists yet. */
export function Img({ src, alt }: { src?: string; alt: string }) {
  if (src) return src.includes('/products/3d/')
    ? <><img src={src} alt={alt} loading="lazy" /><span className="s-3dtag">صورة 3D</span></>
    : <img src={src} alt={alt} loading="lazy" />;
  const [main, ...rest] = alt.split(' · ');
  return (
    <span className="s-noimg" role="img" aria-label={alt}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect x="10" y="22" width="44" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M10 32h44M22 22v-6h20v6M20 42h8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="42" r="3" fill="currentColor" />
      </svg>
      <b>{main}</b>
      {rest.length > 0 && <small>{rest.join(' · ')}</small>}
      <em>Hassen Equipment</em>
    </span>
  );
}

/** «اسم عربي · Nom français» shows as two lines, each in its own direction. */
export function PName({ name }: { name: string }) {
  const i = name.indexOf(' · ');
  if (i < 0) return <>{name}</>;
  return <><span className="pn-ar">{name.slice(0, i)}</span><span className="pn-fr">{name.slice(i + 3)}</span></>;
}

export function ProductCard({ p, onAdded }: { p: Product; onAdded?: (n: string) => void }) {
  const [mi, setMi] = useState(() => { const i = p.product_models.findIndex((x) => x.price != null && x.images.length); return i >= 0 ? i : 0; });
  const m = p.product_models[mi] || p.product_models[0];
  if (!m) return null;
  const img = m.images[0] || p.product_models.find((x) => x.images[0])?.images[0];
  return (
    <article className="s-card">
      <Link href={`/produit/?id=${p.id}`} className="s-card-img"><Img src={img} alt={p.name} /></Link>
      <div className="s-card-body">
        <h3><Link href={`/produit/?id=${p.id}`}><PName name={p.name} /></Link></h3>
        {p.product_models.length > 1 ? (
          <div className="s-models" role="group" aria-label="الموديل">
            {p.product_models.map((x, i) => (
              <button key={x.id} aria-pressed={i === mi} onClick={() => setMi(i)}>{x.name}</button>
            ))}
          </div>
        ) : <span className="s-muted">{m.name}</span>}
        <div className="s-price">
          <b className={m.price == null ? '' : 'num'}>{fmt(m.price)}</b>
          {m.old_price ? <s className="num">{fmt(m.old_price)}</s> : null}
        </div>
        <button className="btn primary" onClick={() => { addToCart({ kind: 'model', id: m.id, name: `${p.name} · ${m.name}`, price: m.price, image: img }); onAdded?.(p.name); }}>
          زيد للسلة
        </button>
      </div>
    </article>
  );
}

export type PackLine = { name: string; image?: string; price: number | null; qty: number };

export function PackCard({ k, items, onAdded }: { k: Pack; items: PackLine[]; onAdded?: (n: string) => void }) {
  const known = items.every((x) => x.price != null);
  const sum = items.reduce((s, x) => s + (x.price || 0) * x.qty, 0);
  const save = known && sum > k.price ? sum - k.price : 0;
  return (
    <article className="s-card s-pack">
      <div className="s-card-img"><Img src={k.images[0] || items.find((x) => x.image)?.image} alt={k.name} /></div>
      <div className="s-card-body">
        <span className="s-eyebrow">PACK · {items.reduce((s, x) => s + x.qty, 0)} قطع</span>
        <h3>{k.name}</h3>
        {items.length > 0 && (
          <ul className="s-pack-items">
            {items.map((x, i) => (
              <li key={i}>
                <span className="s-pack-img"><Img src={x.image} alt={x.name} /></span>
                <span className="s-pack-nm">{x.name}{x.qty > 1 && <b className="num"> × {x.qty}</b>}</span>
                <span className={x.price == null ? 's-muted' : 'num'}>{fmt(x.price == null ? null : x.price * x.qty)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="s-price">
          <b className="num">{fmt(k.price)}</b>
          {save > 0 && <s className="num">{fmt(sum)}</s>}
        </div>
        {save > 0 && <p className="s-save">توفّر <span className="num">{fmt(save)}</span> كي تشري الـPack</p>}
        <button className="btn primary" onClick={() => { addToCart({ kind: 'pack', id: k.id, name: k.name, price: k.price, image: k.images[0] || items.find((x) => x.image)?.image }); onAdded?.(k.name); }}>
          زيد للسلة
        </button>
      </div>
    </article>
  );
}

export function Toast({ text }: { text: string }) {
  return text ? <div className="s-toast" role="status">{text}</div> : null;
}
