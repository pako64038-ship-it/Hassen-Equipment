'use client';
import { useEffect, useState } from 'react';
import { supabase, type Category } from '@/lib/supabase';
import { Confirm, Flash, TypesPicker, useFlash } from './ui';

function Row({ c, onSaved, onDeleted }: { c: Partial<Category>; onSaved: () => void; onDeleted: () => void }) {
  const [v, setV] = useState<Partial<Category>>(c);
  const [err, setErr] = useState('');
  async function save() {
    if (!v.name_ar?.trim()) { setErr('اكتب اسم القسم.'); return; }
    const row = { name_ar: v.name_ar.trim(), name_fr: v.name_fr || '', project_types: v.project_types || [], sort: v.sort || 0, active: v.active !== false };
    const { error } = v.id ? await supabase.from('categories').update(row).eq('id', v.id) : await supabase.from('categories').insert(row);
    if (error) setErr('ما تحفظش: ' + error.message); else { setErr(''); onSaved(); }
  }
  return (
    <div className="a-card">
      <div className="a-form-row">
        <label className="grow">الاسم بالعربية<input value={v.name_ar || ''} onChange={(e) => setV({ ...v, name_ar: e.target.value })} /></label>
        <label className="grow">بالفرنسية<input value={v.name_fr || ''} onChange={(e) => setV({ ...v, name_fr: e.target.value })} /></label>
        <label>الترتيب<input type="number" value={v.sort ?? 0} onChange={(e) => setV({ ...v, sort: Number(e.target.value) || 0 })} /></label>
        <label className="check"><input type="checkbox" checked={v.active !== false} onChange={(e) => setV({ ...v, active: e.target.checked })} /> يبان</label>
      </div>
      <TypesPicker value={v.project_types || []} onChange={(x) => setV({ ...v, project_types: x })} />
      {err && <p className="s-error">{err}</p>}
      <div className="row"><button className="btn small primary" onClick={save}>{v.id ? 'حفظ' : 'زيد القسم'}</button>
        {v.id ? <Confirm label="حذف" onYes={async () => { await supabase.from('categories').delete().eq('id', v.id!); onDeleted(); }} /> : <button className="btn small" onClick={onDeleted}>إلغاء</button>}</div>
    </div>
  );
}

export default function Categories() {
  const [list, setList] = useState<Partial<Category>[] | null>(null);
  const { msg, flash } = useFlash();
  const load = () => supabase.from('categories').select('*').order('sort').then(({ data }) => setList((data as Category[]) || []));
  useEffect(() => { load(); }, []);
  if (!list) return <p className="s-muted">راهو يحمّل…</p>;
  return (
    <section>
      <div className="a-bar"><h1>الأقسام ({list.filter((c) => c.id).length})</h1>
        <button className="btn primary" onClick={() => setList([{ name_ar: '', name_fr: '', project_types: [], sort: list.length + 1, active: true }, ...list])}>+ قسم جديد</button></div>
      <p className="s-muted">كي تحذف قسم، المنتجات تاعو ما يتحذفوش: يبقاو بلا قسم.</p>
      {list.map((c, i) => <Row key={c.id || 'new' + i} c={c} onSaved={() => { flash('تحفظ ✓'); load(); }} onDeleted={load} />)}
      <Flash msg={msg} />
    </section>
  );
}
