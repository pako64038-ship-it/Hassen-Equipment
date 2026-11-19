'use client';
import Link from 'next/link';
import { useState } from 'react';
import { addToCart } from '@/lib/cart';
import { fmt, type Pack, type Product } from '@/lib/supabase';

/** Product photo, or a clean branded card with the product name when no photo exists yet. */
export function Img({ src, alt }: { src?: string; alt: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" />;
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

export function ProductCard({ p, onAdded }: { p: Product; onAdded?: (n: string) => void }) {
  const [mi, setMi] = useState(() => Math.max(0, p.product_models.findIndex((x) => x.price != null)));
  const m = p.product_models[mi] || p.product_models[0];
  if (!m) return null;
  const img = m.images[0] || p.product_models.find((x) => x.images[0])?.images[0];
  return (
    <article className="s-card">
      <Link href={`/produit/?id=${p.id}`} className="s-card-img"><Img src={img} alt={p.name} /></Link>
      <div className="s-card-body">
        <h3><Link href={`/produit/?id=${p.id}`}>{p.name}</Link></h3>
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

export function PackCard({ k, names, onAdded }: { k: Pack; names: string[]; onAdded?: (n: string) => void }) {
  return (
    <article className="s-card s-pack">
      <div className="s-card-img"><Img src={k.images[0]} alt={k.name} /></div>
      <div className="s-card-body">
        <span className="s-eyebrow">PACK</span>
        <h3>{k.name}</h3>
        {names.length > 0 && <ul className="s-list">{names.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        <div className="s-price"><b className="num">{fmt(k.price)}</b></div>
        <button className="btn primary" onClick={() => { addToCart({ kind: 'pack', id: k.id, name: k.name, price: k.price, image: k.images[0] }); onAdded?.(k.name); }}>
          زيد للسلة
        </button>
      </div>
    </article>
  );
}

export function Toast({ text }: { text: string }) {
  return text ? <div className="s-toast" role="status">{text}</div> : null;
}
