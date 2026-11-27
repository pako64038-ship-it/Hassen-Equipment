'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Shell from '@/components/store/Shell';
import { Img, PName, ProductCard, Toast } from '@/components/store/Cards';
import { addToCart } from '@/lib/cart';
import { useSettings } from '@/components/store/useSettings';
import { BASE, SITE_URL } from '@/lib/supabase';
import { byPhoto, fmt, loadCatalog, PROJECT_TYPES, supabase, type Product } from '@/lib/supabase';

export default function ProduitPage() {
  const [p, setP] = useState<Product | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const st = useSettings();
  const [mi, setMi] = useState(0);
  const [ii, setIi] = useState(0);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState('');
  const [related, setRelated] = useState<Product[]>([]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) { setState('missing'); return; }
    supabase.from('products').select('*, product_models(*)').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data) { setState('missing'); return; }
      const x = data as Product; x.product_models = (x.product_models || []).filter((m) => m.active).sort(byPhoto);
      setP(x); setState(x.product_models.length ? 'ok' : 'missing');
      document.title = `${x.name} · Hassen Equipment`;
      // Similar products: same category first, then products for the same kind of shop.
      loadCatalog().then((d) => {
        const others = d.products.filter((o) => o.id !== x.id);
        const same = others.filter((o) => o.category_id === x.category_id);
        const near = others.filter((o) => o.category_id !== x.category_id && o.project_types.some((t) => x.project_types.includes(t)));
        setRelated([...same, ...near].slice(0, 8));
      }).catch(() => {});
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
            <h1><PName name={p.name} /></h1>
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
            <div className="s-pmore">
              {st.whatsapp && <a className="btn" target="_blank" rel="noopener"
                href={`https://wa.me/${st.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`السلام، نحب نسقسي على: ${p.name} · ${m.name}\n${SITE_URL}/produit/?id=${p.id}`)}`}>اسقسي بالواتساب</a>}
              <a className="btn" href={BASE + '/designer/'}>جرّبو في محلّك 3D</a>
            </div>
            <ul className="s-pfacts">
              <li>توصيل لـ58 ولاية، ولا تجي تدّيه من المحل</li>
              <li>الدفع عند الاستلام، CCP ولا BaridiMob</li>
              <li>نأكدولك السعر والتوفّر بالتيليفون قبل التوصيل</li>
            </ul>
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="s-sec s-related" onClickCapture={(e) => { const a = (e.target as HTMLElement).closest('a[href*="produit"]') as HTMLAnchorElement | null; if (a) { e.preventDefault(); location.href = a.href; } }}>
          <h2 className="s-h2">منتجات قريبة <small>من نفس القسم</small></h2>
          <div className="s-grid">{related.map((r) => <ProductCard key={r.id} p={r} onAdded={(n) => { setToast(`تزاد للسلة: ${n}`); setTimeout(() => setToast(''), 2500); }} />)}</div>
        </section>
      )}
      <Toast text={toast} />
    </Shell>
  );
}
