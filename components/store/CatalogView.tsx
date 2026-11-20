'use client';
import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/store/Shell';
import { PackCard, ProductCard, Toast } from '@/components/store/Cards';
import { loadCatalog, PROJECT_TYPES, type Category, type Pack, type Product } from '@/lib/supabase';

export default function CatalogView() {
  const [data, setData] = useState<{ categories: Category[]; products: Product[]; packs: Pack[] } | null>(null);
  const [err, setErr] = useState('');
  const [type, setType] = useState('');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('type'); if (t) setType(t);
    loadCatalog().then((d) => { setData(d); if (d.error) setErr(d.error); }).catch((e) => setErr(String(e)));
  }, []);
  const fitsType = (types: string[]) => !type || !types?.length || types.includes(type);
  const cats = (data?.categories || []).filter((c) => c.active && fitsType(c.project_types));
  const list = useMemo(() => (data?.products || []).filter((p) =>
    fitsType(p.project_types) && (!cat || p.category_id === cat) &&
    (!q || (p.name + ' ' + p.product_models.map((m) => m.name).join(' ')).toLowerCase().includes(q.toLowerCase()))
  ), [data, type, cat, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const packs = (data?.packs || []).filter((k) => fitsType(k.project_types) && !cat && !q);
  const modelInfo: Record<string, { name: string; image?: string; price: number | null }> = {};
  data?.products.forEach((p) => p.product_models.forEach((x) => (modelInfo[x.id] = { name: `${p.name} · ${x.name}`, image: x.images[0], price: x.price == null ? null : Number(x.price) })));
  const added = (n: string) => { setToast(`تزاد للسلة: ${n}`); setTimeout(() => setToast(''), 2500); };

  return (
    <Shell>
      <section className="s-sec">
        <h1 className="s-title">المعدات</h1>
        <div className="s-filters">
          <div className="s-chips" role="group" aria-label="نوع المشروع">
            <button aria-pressed={!type} onClick={() => setType('')}>الكل</button>
            {PROJECT_TYPES.map((t) => <button key={t.id} aria-pressed={type === t.id} onClick={() => { setType(t.id); setCat(''); }}>{t.em} {t.fr}</button>)}
          </div>
          <div className="s-chips" role="group" aria-label="القسم">
            <button aria-pressed={!cat} onClick={() => setCat('')}>كل الأقسام</button>
            {cats.map((c) => <button key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.name_ar}</button>)}
          </div>
          <input className="s-search" type="search" placeholder="ابحث: friteuse، frigo…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
        </div>
      </section>
      {err && <p className="s-error">ما قدرناش نحمّلو المعدات. عاود حلّ الصفحة بعد شوية.</p>}
      {!data && !err && <p className="s-muted">راهو يحمّل…</p>}
      {data && (
        <section className="s-sec">
          {list.length ? <div className="s-grid">{list.map((p) => <ProductCard key={p.id} p={p} onAdded={added} />)}</div>
            : <p className="s-muted">ما كانش معدات هنا ضرك. اتصل بينا ونجهّزولك المشروع.</p>}
        </section>
      )}
      {packs.length > 0 && (
        <section className="s-sec"><h2>الـPacks</h2><div className="s-grid">
          {packs.map((k) => <PackCard key={k.id} k={k} onAdded={added} items={k.pack_items.filter((it) => modelInfo[it.model_id]).map((it) => ({ ...modelInfo[it.model_id], qty: it.qty }))} />)}
        </div></section>
      )}
      <Toast text={toast} />
    </Shell>
  );
}
