'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/store/Shell';
import { PackCard, ProductCard, Toast } from '@/components/store/Cards';
import { useSettings } from '@/components/store/useSettings';
import { loadCatalog, PROJECT_TYPES, type Pack, type Product } from '@/lib/supabase';

export default function Home() {
  const s = useSettings();
  const [data, setData] = useState<{ products: Product[]; packs: Pack[] } | null>(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  useEffect(() => { loadCatalog().then((d) => { setData(d); if (d.error) setErr(d.error); }).catch((e) => setErr(String(e))); }, []);
  const modelName = useMemo(() => {
    const m: Record<string, string> = {};
    data?.products.forEach((p) => p.product_models.forEach((x) => (m[x.id] = `${p.name} · ${x.name}`)));
    return m;
  }, [data]);
  const added = (n: string) => { setToast(`تزاد للسلة: ${n}`); setTimeout(() => setToast(''), 2500); };
  const featured = (data?.products || []).filter((p) => p.featured).slice(0, 8);

  return (
    <Shell>
      <section className="s-hero">
        <div>
          <h1>{s.hero_title}</h1>
          <p>{s.hero_text}</p>
          <div className="row">
            <Link href="/produits/" className="btn primary">شوف المعدات</Link>
            <Link href="/designer/" className="btn">صمّم محلّك بالـ3D</Link>
          </div>
        </div>
      </section>

      <section className="s-sec">
        <h2>واش من مشروع عندك؟</h2>
        <div className="s-types">
          {PROJECT_TYPES.map((t) => (
            <Link key={t.id} href={`/produits/?type=${t.id}`} className="s-type">
              <span aria-hidden="true">{t.em}</span><b>{t.fr}</b><small>{t.ar}</small>
            </Link>
          ))}
        </div>
      </section>

      {err && <p className="s-error">ما قدرناش نحمّلو المعدات. عاود حلّ الصفحة بعد شوية.</p>}
      {!data && !err && <p className="s-muted">راهو يحمّل…</p>}

      {data && data.packs.length > 0 && (
        <section className="s-sec">
          <h2>الـPacks</h2>
          <div className="s-grid">
            {data.packs.map((k) => (
              <PackCard key={k.id} k={k} onAdded={added}
                names={k.pack_items.map((it) => (modelName[it.model_id] ? `${it.qty > 1 ? it.qty + ' × ' : ''}${modelName[it.model_id]}` : '')).filter(Boolean)} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="s-sec">
          <div className="s-sec-head"><h2>معدات مختارة</h2><Link href="/produits/">شوف الكل ←</Link></div>
          <div className="s-grid">{featured.map((p) => <ProductCard key={p.id} p={p} onAdded={added} />)}</div>
        </section>
      )}
      <Toast text={toast} />
    </Shell>
  );
}
