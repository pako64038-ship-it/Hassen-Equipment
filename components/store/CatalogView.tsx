'use client';
import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/store/Shell';
import { PackCard, ProductCard, Toast } from '@/components/store/Cards';
import { BASE, loadCatalog, photoRank, PROJECT_TYPES, type Category, type Pack, type Product } from '@/lib/supabase';

export default function CatalogView({ home = false }: { home?: boolean }) {
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

  // Hero collage: four real product photos (no 3D pictures).
  const heroImgs = (data?.products || []).flatMap((p) => p.product_models.filter((m) => photoRank(m) === 0).slice(0, 1).map((m) => ({ src: m.images[0], name: p.name }))).slice(0, 4);
  const total = list.length;

  return (
    <Shell>
      {home && (
        <section className="s-hero">
          <div className="s-hero-txt">
            <span className="s-kicker">Équipement CHR · الجزائر</span>
            <h1>نجهّزو المحل تاعك، من الماكينة الأولى حتى الأخيرة</h1>
            <p>معدات Fast Food، Pizzeria، Cafétéria، Pâtisserie وRestaurant. اختار المعدات، شوف كيفاش يجيو في محلّك بالـ3D، واطلب الـDevis.</p>
            <div className="s-hero-cta">
              <a className="btn primary" href="#catalogue">شوف المعدات</a>
              <a className="btn" href={BASE + '/designer/'}>صمّم محلّك 3D</a>
            </div>
          </div>
          <div className="s-hero-pics" aria-hidden={heroImgs.length === 0}>
            {heroImgs.map((h, k) => <figure key={k}><img src={h.src} alt={h.name} /></figure>)}
          </div>
        </section>
      )}
      {home && (
        <ul className="s-trust">
          <li><b>توصيل لـ58 ولاية</b><span>ولا تجي تدّيها من المحل</span></li>
          <li><b>صمّم محلّك 3D</b><span>شوف المعدات في القياس تاعك قبل ما تشري</span></li>
          <li><b>Devis في نفس النهار</b><span>بالتيليفون ولا الواتساب</span></li>
          <li><b>مرافقة كاملة</b><span>من الاختيار حتى التركيب</span></li>
        </ul>
      )}
      <section className="s-sec" id="catalogue">
        <div className="s-cat-head">
          <h1 className="s-title">المعدات <small className="num">{data ? total : ''}</small></h1>
          <div className="s-tools">
            <input className="s-search" type="search" placeholder="ابحث: friteuse، frigo…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
            <select className="s-select" value={type} onChange={(e) => { setType(e.target.value); setCat(''); }} aria-label="نوع المشروع">
              <option value="">كل المشاريع</option>
              {PROJECT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.fr} · {t.ar}</option>)}
            </select>
          </div>
        </div>
        <div className="s-tabs-row" role="group" aria-label="القسم">
          <button aria-pressed={!cat} onClick={() => setCat('')}>الكل</button>
          {cats.map((c) => <button key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.name_ar}</button>)}
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
        <section className="s-sec"><h2 className="s-h2">Packs جاهزين <small>كل واش يلزم باش تبدا، بسعر واحد</small></h2><div className="s-grid">
          {packs.map((k) => <PackCard key={k.id} k={k} onAdded={added} items={k.pack_items.filter((it) => modelInfo[it.model_id]).map((it) => ({ ...modelInfo[it.model_id], qty: it.qty }))} />)}
        </div></section>
      )}
      <Toast text={toast} />
    </Shell>
  );
}
