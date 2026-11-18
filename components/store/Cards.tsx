'use client';
import Link from 'next/link';
import { useState } from 'react';
import { addToCart } from '@/lib/cart';
import { fmt, type Pack, type Product } from '@/lib/supabase';

export function Img({ src, alt }: { src?: string; alt: string }) {
  return src ? <img src={src} alt={alt} loading="lazy" /> : <span className="s-noimg">الصورة جاية قريب</span>;
}

export function ProductCard({ p, onAdded }: { p: Product; onAdded?: (n: string) => void }) {
  const [mi, setMi] = useState(0);
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
