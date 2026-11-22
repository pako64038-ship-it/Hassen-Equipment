'use client';
import { useEffect, useState } from 'react';
import { fmt, loadCatalog, PROJECT_TYPES, supabase, type Category, type Model, type Product } from '@/lib/supabase';
import { Confirm, Flash, ImagesField, num, TypesPicker, useFlash } from './ui';

const emptyModel = (product_id: string, sort: number): Partial<Model> => ({
  product_id, name: '', price: null, old_price: null, stock: null, width_m: 0.6, depth_m: 0.6, height_m: 0.9, on_counter: false, images: [], sort, active: true,
});

function ModelRow({ m, n, onSaved, onDeleted }: { m: Partial<Model>; n: number; onSaved: (m: Model) => void; onDeleted: () => void }) {
  const [v, setV] = useState<Partial<Model>>(m);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  // Saved models start folded; a new one opens. The jump bar and «بيّن الكل / خبّي الكل» open or fold them.
  const [open, setOpen] = useState(!m.id);
  useEffect(() => {
    const onHash = () => { if (location.hash === `#model-${n}`) setOpen(true); };
    const all = (e: Event) => setOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener('hashchange', onHash); window.addEventListener('models-all', all);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('models-all', all); };
  }, [n]);
  const set = (k: keyof Model, x: unknown) => setV({ ...v, [k]: x });
  async function save() {
    if (!v.name?.trim()) { setErr('اكتب اسم الموديل.'); return; }
    setBusy(true); setErr('');
    const row = { product_id: v.product_id, name: v.name.trim(), price: v.price, old_price: v.old_price, stock: v.stock, width_m: v.width_m, depth_m: v.depth_m, height_m: v.height_m, on_counter: v.on_counter, images: v.images || [], sort: v.sort || 0, active: v.active };
    const q = v.id ? supabase.from('product_models').update(row).eq('id', v.id).select().single() : supabase.from('product_models').insert(row).select().single();
    const { data, error } = await q;
    if (error) { setBusy(false); setErr('ما تحفظش: ' + error.message); return; }
    const saved = data as Model;
    const w = v.wholesale == null ? await supabase.from('model_wholesale').delete().eq('model_id', saved.id)
      : await supabase.from('model_wholesale').upsert({ model_id: saved.id, price: v.wholesale, updated_at: new Date().toISOString() });
    setBusy(false);
    if (w.error) setErr('الموديل تحفظ، بصح سعر الجملة ما تحفظش: ' + w.error.message);
    const full = { ...saved, wholesale: v.wholesale ?? null }; setV(full); onSaved(full);
  }
  return (
    <div className="a-model" id={`model-${n}`}>
      <button type="button" className="a-model-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="a-model-n">موديل {n}</span>
        <b>{v.name?.trim() || 'موديل جديد'}</b>
        {v.active === false && <span className="a-pill">مخبّي</span>}
        {v.price != null && <small className="num">{Number(v.price).toLocaleString('en-US')} DA</small>}
        <span className="a-model-tog" aria-hidden="true">{open ? 'إخفاء ▲' : 'بيّن ▼'}</span>
      </button>
      {open && <>
      <div className="a-form-row">
        <label className="grow">اسم الموديل<input value={v.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="مثلاً: Comaf 2×8 L" /></label>
        <label>السعر (DA)<input type="number" min={0} step={500} value={v.price ?? ''} onChange={(e) => set('price', num(e.target.value))} placeholder="حسب الطلب" /></label>
        <label className="a-wholesale">سعر الجملة 🔒<input type="number" min={0} step={500} value={v.wholesale ?? ''} onChange={(e) => set('wholesale', num(e.target.value))} placeholder="—" title="يشوفو غير انت والخدّامين" /></label>
        <label>السعر القديم<input type="number" min={0} step={500} value={v.old_price ?? ''} onChange={(e) => set('old_price', num(e.target.value))} /></label>
        <label>المخزون<input type="number" min={0} value={v.stock ?? ''} onChange={(e) => set('stock', num(e.target.value))} /></label>
      </div>
      <div className="a-form-row">
        <label>الطول (m)<input type="number" step={0.01} min={0.05} value={v.width_m ?? ''} onChange={(e) => set('width_m', num(e.target.value))} /></label>
        <label>العمق (m)<input type="number" step={0.01} min={0.05} value={v.depth_m ?? ''} onChange={(e) => set('depth_m', num(e.target.value))} /></label>
        <label>العلو (m)<input type="number" step={0.01} min={0.05} value={v.height_m ?? ''} onChange={(e) => set('height_m', num(e.target.value))} /></label>
        <label className="check"><input type="checkbox" checked={!!v.on_counter} onChange={(e) => set('on_counter', e.target.checked)} /> فوق الكونتوار</label>
        <label className="check"><input type="checkbox" checked={v.active !== false} onChange={(e) => set('active', e.target.checked)} /> يبان للزبائن</label>
      </div>
      <ImagesField value={v.images || []} onChange={(x) => set('images', x)} folder="products" />
      {err && <p className="s-error">{err}</p>}
      <div className="row">
        <button type="button" className="btn small primary" onClick={save} disabled={busy}>{busy ? '…' : v.id ? 'حفظ الموديل' : 'زيد الموديل'}</button>
        {v.id && <Confirm label="حذف الموديل" onYes={async () => { const { error } = await supabase.from('product_models').delete().eq('id', v.id!); if (!error) onDeleted(); }} />}
        {!v.id && <button type="button" className="btn small" onClick={onDeleted}>إلغاء</button>}
      </div>
      </>}
    </div>
  );
}

function Editor({ p, cats, onClose, onChange }: { p: Product | null; cats: Category[]; onClose: () => void; onChange: () => void }) {
  const [v, setV] = useState({ name: p?.name || '', category_id: p?.category_id || cats[0]?.id || '', description: p?.description || '', project_types: p?.project_types || [], featured: !!p?.featured, active: p ? p.active : true, sort: p?.sort || 0 });
  const [id, setId] = useState(p?.id || '');
  const [models, setModels] = useState<Partial<Model>[]>(p?.product_models || []);
  const { msg, flash } = useFlash();
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!v.name.trim()) return;
    const row = { ...v, name: v.name.trim(), category_id: v.category_id || null };
    const { data, error } = id ? await supabase.from('products').update(row).eq('id', id).select().single() : await supabase.from('products').insert(row).select().single();
    if (error) { flash('ما تحفظش: ' + error.message); return; }
    if (!id) { setId((data as Product).id); setModels([emptyModel((data as Product).id, 0)]); }
    flash('تحفظ ✓'); onChange();
  }
  return (
    <div className="a-editor">
      <div className="a-bar"><h2>{id ? 'بدّل المنتج' : 'منتج جديد'}</h2><button className="btn small" onClick={onClose}>← رجوع للقائمة</button></div>
      <form onSubmit={save} className="a-card">
        <div className="a-form-row">
          <label className="grow">اسم المنتج<input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required placeholder="مثلاً: Friteuse" /></label>
          <label>القسم<select value={v.category_id} onChange={(e) => setV({ ...v, category_id: e.target.value })}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></label>
          <label>الترتيب<input type="number" value={v.sort} onChange={(e) => setV({ ...v, sort: Number(e.target.value) || 0 })} /></label>
        </div>
        <label>الوصف<textarea rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
        <TypesPicker value={v.project_types} onChange={(x) => setV({ ...v, project_types: x })} />
        <div className="row">
          <label className="check"><input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} /> يبان في الصفحة الرئيسية</label>
          <label className="check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> يبان للزبائن</label>
        </div>
        <button className="btn primary">{id ? 'حفظ المنتج' : 'اعمل المنتج'}</button>
      </form>
      {id && (
        <div className="a-card">
          <div className="a-bar"><h3>الموديلات ({models.length})</h3><button className="btn small primary" onClick={() => setModels([...models, emptyModel(id, models.length)])}>+ موديل</button></div>
          {!models.length && <p className="s-muted">زيد على الأقل موديل واحد باش يبان المنتج للزبائن.</p>}
          {models.length > 1 && (
            <div className="row">
              <button type="button" className="btn small" onClick={() => window.dispatchEvent(new CustomEvent('models-all', { detail: true }))}>بيّن الكل</button>
              <button type="button" className="btn small" onClick={() => window.dispatchEvent(new CustomEvent('models-all', { detail: false }))}>خبّي الكل</button>
            </div>
          )}
          {models.length > 1 && (
            <nav className="a-model-jump" aria-label="روح لموديل">
              {models.map((m, i) => <a key={m.id || 'j' + i} href={`#model-${i + 1}`}><b>{i + 1}</b> {m.name?.trim() || 'جديد'}</a>)}
            </nav>
          )}
          {models.map((m, i) => (
            <ModelRow key={m.id || 'new' + i} n={i + 1} m={m}
              onSaved={(x) => { setModels(models.map((y, j) => (j === i ? x : y))); flash('تحفظ الموديل ✓'); onChange(); }}
              onDeleted={() => { setModels(models.filter((_, j) => j !== i)); onChange(); }} />
          ))}
        </div>
      )}
      <Flash msg={msg} />
    </div>
  );
}

export default function Products() {
  const [data, setData] = useState<{ categories: Category[]; products: Product[] } | null>(null);
  const [edit, setEdit] = useState<Product | null | 'new'>(null);
  const [q, setQ] = useState('');
  const [show, setShow] = useState<'all' | 'visible' | 'hidden'>('all');
  const load = () => loadCatalog(true).then(setData);
  useEffect(() => { load(); }, []);
  if (!data) return <p className="s-muted">راهو يحمّل…</p>;
  if (edit) return <Editor p={edit === 'new' ? null : edit} cats={data.categories} onClose={() => { setEdit(null); load(); }} onChange={load} />;
  const catName = (id: string | null) => data.categories.find((c) => c.id === id)?.name_ar || '—';
  const hidden = data.products.filter((p) => !p.active).length;
  const list = data.products.filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (show === 'all' || (show === 'hidden' ? !p.active : p.active)));
  async function publish(p: Product, active: boolean) {
    setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, active } : x)) });
    const { error } = await supabase.from('products').update({ active }).eq('id', p.id);
    if (error) load();
  }
  return (
    <section>
      <div className="a-bar"><h1>المنتجات ({data.products.length})</h1>
        <input className="s-search" type="search" placeholder="ابحث…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
        <div className="s-chips">
          <button aria-pressed={show === 'all'} onClick={() => setShow('all')}>الكل ({data.products.length})</button>
          <button aria-pressed={show === 'visible'} onClick={() => setShow('visible')}>يبانو ({data.products.length - hidden})</button>
          <button aria-pressed={show === 'hidden'} onClick={() => setShow('hidden')}>مخبّيين ({hidden})</button>
        </div>
        <button className="btn primary" onClick={() => setEdit('new')}>+ منتج جديد</button></div>
      <div className="a-table-wrap"><table className="budget a-table">
        <thead><tr><th></th><th>المنتج</th><th>القسم</th><th>الموديلات</th><th>السعر</th><th title="يشوفو غير انت والخدّامين">الجملة 🔒</th><th>الحالة</th><th></th></tr></thead>
        <tbody>{list.map((p) => {
          const img = p.product_models.find((m) => m.images[0])?.images[0];
          const prices = p.product_models.map((m) => m.price).filter((x): x is number => x != null);
          const gros = p.product_models.map((m) => m.wholesale).filter((x): x is number => x != null);
          return (
            <tr key={p.id}>
              <td>{img ? <img src={img} alt="" className="a-row-img" /> : <span className="a-row-img" />}</td>
              <td className="nm"><b>{p.name}</b><br /><small className="s-muted">{p.project_types.length ? p.project_types.map((t) => PROJECT_TYPES.find((x) => x.id === t)?.fr).join('، ') : 'كل الأنواع'}</small></td>
              <td>{catName(p.category_id)}</td>
              <td>{p.product_models.length}</td>
              <td className="num">{prices.length ? fmt(Math.min(...prices)) : 'حسب الطلب'}</td>
              <td className="num a-gros">{gros.length ? fmt(Math.min(...gros)) : '—'}</td>
              <td>{p.active ? <span className="a-pill ok">يبان</span> : <span className="a-pill">مخبّي</span>}{p.featured && <span className="a-pill">مختار</span>}</td>
              <td className="row">{p.active
                  ? <button className="btn small" onClick={() => publish(p, false)} title="الزبائن ما يشوفوهش">إخفاء</button>
                  : <button className="btn small primary" onClick={() => publish(p, true)} title="الزبائن يشوفوه في الموقع">✓ نشر</button>}
                <button className="btn small" onClick={() => setEdit(p)}>بدّل</button>
                <Confirm label="حذف" onYes={async () => { await supabase.from('products').delete().eq('id', p.id); load(); }} /></td>
            </tr>
          );
        })}</tbody>
      </table></div>
    </section>
  );
}
