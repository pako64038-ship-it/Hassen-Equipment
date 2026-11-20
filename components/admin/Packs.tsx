'use client';
import { useEffect, useState } from 'react';
import { fmt, loadCatalog, PROJECT_TYPES, supabase, type Pack, type Product } from '@/lib/supabase';
import { Confirm, Flash, ImagesField, TypesPicker, useFlash } from './ui';

function Editor({ k, products, onClose }: { k: Pack | null; products: Product[]; onClose: () => void }) {
  const [v, setV] = useState({ name: k?.name || '', description: k?.description || '', price: k?.price ?? 0, project_types: k?.project_types || [], images: k?.images || [], featured: k ? k.featured : true, active: k ? k.active : true, sort: k?.sort || 0 });
  const [items, setItems] = useState<Record<string, number>>(Object.fromEntries((k?.pack_items || []).map((i) => [i.model_id, i.qty])));
  const { msg, flash } = useFlash();
  const [busy, setBusy] = useState(false);
  const models = products.flatMap((p) => p.product_models.map((m) => ({ id: m.id, name: `${p.name} · ${m.name}`, price: m.price, image: m.images[0] || p.product_models.find((x) => x.images[0])?.images[0] || '' })));
  const [q, setQ] = useState('');
  const chosen = models.filter((m) => (items[m.id] || 0) > 0);
  const found = q.trim() ? models.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40) : [];
  const setQty = (id: string, n: number) => setItems({ ...items, [id]: Math.max(0, Math.min(50, n)) });
  const sum = models.reduce((s, m) => s + (items[m.id] || 0) * (m.price || 0), 0);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!v.name.trim()) return; setBusy(true);
    const row = { ...v, name: v.name.trim(), price: Number(v.price) || 0 };
    const { data, error } = k ? await supabase.from('packs').update(row).eq('id', k.id).select().single() : await supabase.from('packs').insert(row).select().single();
    if (error) { setBusy(false); flash('ما تحفظش: ' + error.message); return; }
    const id = (data as Pack).id;
    await supabase.from('pack_items').delete().eq('pack_id', id);
    const rows = Object.entries(items).filter(([, q]) => q > 0).map(([model_id, qty]) => ({ pack_id: id, model_id, qty }));
    if (rows.length) { const r = await supabase.from('pack_items').insert(rows); if (r.error) { setBusy(false); flash('المحتوى ما تحفظش: ' + r.error.message); return; } }
    setBusy(false); flash('تحفظ ✓'); onClose();
  }
  return (
    <form onSubmit={save} className="a-editor">
      <div className="a-bar"><h2>{k ? 'بدّل الـPack' : 'Pack جديد'}</h2><button type="button" className="btn small" onClick={onClose}>← رجوع</button></div>
      <div className="a-card">
        <div className="a-form-row">
          <label className="grow">الاسم<input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required /></label>
          <label>السعر (DA)<input type="number" min={0} step={500} value={v.price} onChange={(e) => setV({ ...v, price: Number(e.target.value) })} required /></label>
          <label>الترتيب<input type="number" value={v.sort} onChange={(e) => setV({ ...v, sort: Number(e.target.value) || 0 })} /></label>
        </div>
        <label>الوصف <small className="s-muted">(اختياري: المحتوى يبان وحدو بالتصاور والأسعار)</small><textarea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
        <TypesPicker value={v.project_types} onChange={(x) => setV({ ...v, project_types: x })} />
        <div className="row">
          <label className="check"><input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} /> يبان في الرئيسية</label>
          <label className="check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> يبان للزبائن</label>
        </div>
        <ImagesField value={v.images} onChange={(x) => setV({ ...v, images: x })} folder="packs" />
      </div>
      <div className="a-card">
        <h3>المحتوى <small className="s-muted">({chosen.reduce((n, m) => n + (items[m.id] || 0), 0)} قطع)</small></h3>
        {!models.length && <p className="s-muted">زيد المنتجات أول في «المنتجات».</p>}
        {chosen.length === 0 && models.length > 0 && <p className="s-muted">الـPack فارغ. قلّب على منتج تحت وزيدو.</p>}
        <div className="a-pk-list">{chosen.map((m) => (
          <div key={m.id} className="a-pk">
            {m.image ? <img src={m.image} alt="" /> : <span className="a-pk-noimg" />}
            <div className="a-pk-nm"><b>{m.name}</b><span className="num">{fmt(m.price)}{(items[m.id] || 0) > 1 && m.price != null ? ` × ${items[m.id]} = ${fmt(m.price * items[m.id])}` : ''}</span></div>
            <div className="qty"><button type="button" onClick={() => setQty(m.id, (items[m.id] || 0) - 1)} aria-label="نقّص">−</button><span className="num">{items[m.id]}</span><button type="button" onClick={() => setQty(m.id, (items[m.id] || 0) + 1)} aria-label="زيد">+</button></div>
          </div>
        ))}</div>
        <label>زيد منتج للـPack<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب اسم المنتج، مثلاً: Friteuse" /></label>
        {found.length > 0 && <div className="a-pk-list">{found.map((m) => (
          <button type="button" key={m.id} className="a-pk a-pk-add" onClick={() => setQty(m.id, (items[m.id] || 0) + 1)}>
            {m.image ? <img src={m.image} alt="" /> : <span className="a-pk-noimg" />}
            <div className="a-pk-nm"><b>{m.name}</b><span className="num">{fmt(m.price)}</span></div>
            <span className="a-pk-plus">{items[m.id] ? `✓ ${items[m.id]}` : '+ زيد'}</span>
          </button>
        ))}</div>}
        {q.trim() && !found.length && <p className="s-muted">ما لقينا حتى منتج بهذا الاسم.</p>}
        {sum > 0 && <p className="a-pk-sum">مجموع الأسعار وحدهم: <b className="num">{fmt(sum)}</b> · سعر الـPack: <b className="num">{fmt(Number(v.price))}</b>{sum > Number(v.price) ? <> · الزبون يوفّر <b className="num">{fmt(sum - Number(v.price))}</b></> : null}</p>}
      </div>
      <button className="btn primary" disabled={busy}>{busy ? '…' : 'حفظ الـPack'}</button>
      <Flash msg={msg} />
    </form>
  );
}

export default function Packs() {
  const [data, setData] = useState<{ packs: Pack[]; products: Product[] } | null>(null);
  const [edit, setEdit] = useState<Pack | null | 'new'>(null);
  const load = () => loadCatalog(true).then(setData);
  useEffect(() => { load(); }, []);
  if (!data) return <p className="s-muted">راهو يحمّل…</p>;
  if (edit) return <Editor k={edit === 'new' ? null : edit} products={data.products} onClose={() => { setEdit(null); load(); }} />;
  return (
    <section>
      <div className="a-bar"><h1>الـPacks ({data.packs.length})</h1><button className="btn primary" onClick={() => setEdit('new')}>+ Pack جديد</button></div>
      <div className="a-table-wrap"><table className="budget a-table">
        <thead><tr><th></th><th>الـPack</th><th>السعر</th><th>المحتوى</th><th>الحالة</th><th></th></tr></thead>
        <tbody>{data.packs.map((k) => (
          <tr key={k.id}>
            <td>{k.images[0] ? <img src={k.images[0]} alt="" className="a-row-img" /> : <span className="a-row-img" />}</td>
            <td className="nm"><b>{k.name}</b><br /><small className="s-muted">{k.project_types.length ? k.project_types.map((t) => PROJECT_TYPES.find((x) => x.id === t)?.fr).join('، ') : 'كل الأنواع'}</small></td>
            <td className="num">{fmt(k.price)}</td>
            <td>{k.pack_items.reduce((s, i) => s + i.qty, 0)} قطع</td>
            <td>{k.active ? <span className="a-pill ok">يبان</span> : <span className="a-pill">مخبّي</span>}</td>
            <td className="row"><button className="btn small" onClick={() => setEdit(k)}>بدّل</button>
              <Confirm label="حذف" onYes={async () => { await supabase.from('packs').delete().eq('id', k.id); load(); }} /></td>
          </tr>
        ))}</tbody>
      </table></div>
    </section>
  );
}
