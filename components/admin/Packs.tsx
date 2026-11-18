'use client';
import { useEffect, useState } from 'react';
import { fmt, loadCatalog, PROJECT_TYPES, supabase, type Pack, type Product } from '@/lib/supabase';
import { Confirm, Flash, ImagesField, TypesPicker, useFlash } from './ui';

function Editor({ k, products, onClose }: { k: Pack | null; products: Product[]; onClose: () => void }) {
  const [v, setV] = useState({ name: k?.name || '', description: k?.description || '', price: k?.price ?? 0, project_types: k?.project_types || [], images: k?.images || [], featured: k ? k.featured : true, active: k ? k.active : true, sort: k?.sort || 0 });
  const [items, setItems] = useState<Record<string, number>>(Object.fromEntries((k?.pack_items || []).map((i) => [i.model_id, i.qty])));
  const { msg, flash } = useFlash();
  const [busy, setBusy] = useState(false);
  const models = products.flatMap((p) => p.product_models.map((m) => ({ id: m.id, name: `${p.name} · ${m.name}`, price: m.price })));
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
        <label>الوصف<textarea rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
        <TypesPicker value={v.project_types} onChange={(x) => setV({ ...v, project_types: x })} />
        <div className="row">
          <label className="check"><input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} /> يبان في الرئيسية</label>
          <label className="check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> يبان للزبائن</label>
        </div>
        <ImagesField value={v.images} onChange={(x) => setV({ ...v, images: x })} folder="packs" />
      </div>
      <div className="a-card">
        <h3>المحتوى</h3>
        {!models.length && <p className="s-muted">زيد المنتجات أول في «المنتجات».</p>}
        <div className="a-pack-items">{models.map((m) => (
          <label key={m.id} className="a-pack-item"><span>{m.name} <small className="s-muted num">{fmt(m.price)}</small></span>
            <input type="number" min={0} max={50} value={items[m.id] || 0} onChange={(e) => setItems({ ...items, [m.id]: Math.max(0, Math.round(Number(e.target.value) || 0)) })} /></label>
        ))}</div>
        {sum > 0 && <p className="s-muted">مجموع الأسعار وحدهم: <span className="num">{fmt(sum)}</span> · سعر الـPack: <span className="num">{fmt(Number(v.price))}</span></p>}
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
