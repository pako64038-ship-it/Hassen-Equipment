'use client';
import { useEffect, useState } from 'react';
import { fmt, ORDER_STATUS, PROJECT_TYPES, supabase } from '@/lib/supabase';
import { Confirm, Flash, useFlash } from './ui';

type Order = {
  id: string; number: number; created_at: string; customer_name: string; phone: string; city: string; project_type: string;
  note: string; items: { name: string; qty: number; price: number | null }[]; total: number; status: string; staff_note: string;
};

export default function Orders({ isAdmin }: { isAdmin: boolean }) {
  const [list, setList] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState('active');
  const [open, setOpen] = useState<string | null>(null);
  const { msg, flash } = useFlash();
  async function load() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) flash('ما قدرناش نحمّلو الطلبات.'); setList((data as Order[]) || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function patch(o: Order, v: Partial<Order>) {
    const { error } = await supabase.from('orders').update(v).eq('id', o.id);
    if (error) flash('ما تحفظش.'); else { flash('تحفظ ✓'); setList((l) => (l || []).map((x) => (x.id === o.id ? { ...x, ...v } : x))); }
  }
  const shown = (list || []).filter((o) => filter === 'all' || (filter === 'active' ? !['delivered', 'cancelled'].includes(o.status) : o.status === filter));
  const counts = (list || []).reduce<Record<string, number>>((a, o) => { a[o.status] = (a[o.status] || 0) + 1; return a; }, {});
  return (
    <section>
      <div className="a-bar">
        <h1>الطلبات</h1>
        <div className="s-chips">
          {[['active', 'المفتوحين'], ['all', 'الكل'], ...Object.entries(ORDER_STATUS)].map(([k, l]) => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}{counts[k] ? ` (${counts[k]})` : ''}</button>
          ))}
        </div>
        <button className="btn small" onClick={load}>تحديث</button>
      </div>
      {!list && <p className="s-muted">راهو يحمّل…</p>}
      {list && !shown.length && <p className="s-muted">ما كانش طلبات هنا.</p>}
      <div className="a-orders">
        {shown.map((o) => {
          const wa = 'https://wa.me/' + o.phone.replace(/\D/g, '').replace(/^0/, '213');
          return (
            <article key={o.id} className={`a-order st-${o.status}`}>
              <button className="a-order-head" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                <span className="num">#{o.number}</span>
                <b>{o.customer_name}</b>
                <span className="num">{o.phone}</span>
                <span>{o.city}</span>
                <span className="num">{fmt(o.total)}</span>
                <span className="a-pill">{ORDER_STATUS[o.status]}</span>
                <small className="num">{new Date(o.created_at).toLocaleString('fr-DZ')}</small>
              </button>
              {open === o.id && (
                <div className="a-order-body">
                  <table className="budget"><tbody>
                    {o.items.map((it, i) => <tr key={i}><td className="nm">{it.name}</td><td className="num">× {it.qty}</td><td className="n num">{fmt(it.price == null ? null : it.price * it.qty)}</td></tr>)}
                  </tbody></table>
                  {o.project_type && <p>المشروع: {PROJECT_TYPES.find((t) => t.id === o.project_type)?.fr}</p>}
                  {o.note && <p>ملاحظة الزبون: {o.note}</p>}
                  <div className="a-form-row">
                    <label>الحالة<select value={o.status} onChange={(e) => patch(o, { status: e.target.value })}>{Object.entries(ORDER_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                    <label className="grow">ملاحظة داخلية<input defaultValue={o.staff_note} onBlur={(e) => e.target.value !== o.staff_note && patch(o, { staff_note: e.target.value })} /></label>
                  </div>
                  <div className="row">
                    <a className="btn small primary" href={wa} target="_blank" rel="noopener">WhatsApp الزبون</a>
                    <span className="s-muted">الهاتف: <span className="num" style={{ userSelect: 'all' }}>{o.phone}</span></span>
                    {isAdmin && <Confirm label="حذف الطلب" onYes={async () => { const { error } = await supabase.from('orders').delete().eq('id', o.id); if (!error) setList((l) => (l || []).filter((x) => x.id !== o.id)); }} />}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <Flash msg={msg} />
    </section>
  );
}
