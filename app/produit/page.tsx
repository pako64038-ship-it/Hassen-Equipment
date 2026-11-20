'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Shell from '@/components/store/Shell';
import { Img, Toast } from '@/components/store/Cards';
import { addToCart } from '@/lib/cart';
import { byPhoto, fmt, PROJECT_TYPES, supabase, type Product } from '@/lib/supabase';

export default function ProduitPage() {
  const [p, setP] = useState<Product | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [mi, setMi] = useState(0);
  const [ii, setIi] = useState(0);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState('');
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) { setState('missing'); return; }
    supabase.from('products').select('*, product_models(*)').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data) { setState('missing'); return; }
      const x = data as Product; x.product_models = (x.product_models || []).filter((m) => m.active).sort(byPhoto);
      setP(x); setState(x.product_models.length ? 'ok' : 'missing');
    });
  }, []);
  const m = p?.product_models[mi];
  const imgs = m?.images.length ? m.images : (p?.product_models.flatMap((x) => x.images) || []);
  return (
    <Shell>
      {state === 'loading' && <p className="s-muted">راهو يحمّل…</p>}
      {state === 'missing' && <p className="s-muted">هذا المنتج ما كانش. <Link href="/produits/">ارجع للمعدات</Link></p>}
      {state === 'ok' && p && m && (
        <section className="s-product">
          <div className="s-gallery">
            <div className="s-gallery-main"><Img src={imgs[ii]} alt={p.name} /></div>
            {imgs.length > 1 && <div className="s-thumbs">{imgs.map((u, i) => (
              <button key={u + i} aria-pressed={i === ii} onClick={() => setIi(i)}><img src={u} alt="" /></button>
            ))}</div>}
          </div>
          <div className="s-pinfo">
            <Link href="/produits/" className="s-muted">← المعدات</Link>
            <h1>{p.name}</h1>
            {p.project_types?.length > 0 && <p className="s-muted">يصلح لـ: {p.project_types.map((t) => PROJECT_TYPES.find((x) => x.id === t)?.fr).filter(Boolean).join('، ')}</p>}
            {p.product_models.length > 1 && <>
              <h2 className="s-label">الموديل</h2>
              <div className="s-models big" role="group" aria-label="الموديل">
                {p.product_models.map((x, i) => <button key={x.id} aria-pressed={i === mi} onClick={() => { setMi(i); setIi(0); }}>{x.name}</button>)}
              </div>
            </>}
            <div className="s-price big"><b className={m.price == null ? '' : 'num'}>{fmt(m.price)}</b>{m.old_price ? <s className="num">{fmt(m.old_price)}</s> : null}</div>
            <dl className="s-specs">
              <div><dt>القياس</dt><dd className="num">{m.width_m} × {m.depth_m} × {m.height_m} m</dd></div>
              {m.stock != null && <div><dt>المخزون</dt><dd>{m.stock > 0 ? `${m.stock} متوفر` : 'ما كانش ضرك'}</dd></div>}
            </dl>
            {p.description && <p className="s-desc">{p.description}</p>}
            <div className="row">
              <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="نقّص">−</button><span className="num">{qty}</span><button onClick={() => setQty(qty + 1)} aria-label="زيد">+</button></div>
              <button className="btn primary" onClick={() => { addToCart({ kind: 'model', id: m.id, name: `${p.name} · ${m.name}`, price: m.price, image: imgs[0] }, qty); setToast('تزاد للسلة'); setTimeout(() => setToast(''), 2500); }}>زيد للسلة</button>
            </div>
          </div>
        </section>
      )}
      <Toast text={toast} />
    </Shell>
  );
}
