'use client';
import Link from 'next/link';
import { useState } from 'react';
import Shell from '@/components/store/Shell';
import { Img } from '@/components/store/Cards';
import { useSettings } from '@/components/store/useSettings';
import { clearCart, setQty, useCart } from '@/lib/cart';
import { fmt, PROJECT_TYPES, supabase } from '@/lib/supabase';

export default function Panier() {
  const s = useSettings();
  const { lines, total, unknown } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', city: '', type: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ wa: string } | null>(null);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function send(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (form.name.trim().length < 2) { setErr('اكتب الاسم تاعك.'); return; }
    if (form.phone.replace(/\D/g, '').length < 9) { setErr('اكتب رقم هاتف صحيح.'); return; }
    setBusy(true);
    const items = lines.map((l) => ({ kind: l.kind, id: l.id, name: l.name, qty: l.qty, price: l.price }));
    const id = crypto.randomUUID();
    const { error } = await supabase.from('orders').insert({
      id, customer_name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(),
      project_type: form.type, note: form.note.trim(), items, total,
    });
    setBusy(false);
    if (error) { setErr('ما قدرناش نبعثو الطلب. عاود جرّب، ولا ابعثو بالواتساب.'); return; }
    const txt = [`${s.store_name} — طلب Devis`, `${form.name} · ${form.phone} · ${form.city}`, '',
      ...lines.map((l) => `- ${l.name} × ${l.qty} : ${fmt(l.price == null ? null : l.price * l.qty)}`), '',
      `المجموع: ${fmt(total)}${unknown ? ' + منتجات حسب الطلب' : ''}`, form.note ? `ملاحظة: ${form.note}` : ''].filter(Boolean).join('\n');
    const wa = `https://wa.me/${(s.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`;
    setDone({ wa }); clearCart();
  }

  return (
    <Shell>
      <section className="s-sec">
        <h1 className="s-title">السلة</h1>
        {done ? (
          <div className="s-done">
            <h2>✓ وصلنا الطلب تاعك</h2>
            <p>نتّصلو بيك في أقرب وقت على الرقم اللي عطيتنا. تقدر تبعث الطلب بالواتساب باش يوصل أسرع.</p>
            <div className="row"><a className="btn primary" href={done.wa} target="_blank" rel="noopener">بعث بالواتساب</a><Link className="btn" href="/produits/">كمّل التسوّق</Link></div>
          </div>
        ) : lines.length === 0 ? (
          <p className="s-muted">السلة فارغة. <Link href="/produits/">شوف المعدات</Link></p>
        ) : (
          <div className="s-cart-grid">
            <div className="s-lines">
              {lines.map((l) => (
                <div key={l.key} className="s-line">
                  <div className="s-line-img"><Img src={l.image} alt={l.name} /></div>
                  <div className="s-line-nm"><b>{l.name}</b><span className={l.price == null ? 's-muted' : 'num'}>{fmt(l.price)}</span></div>
                  <div className="qty"><button onClick={() => setQty(l.key, l.qty - 1)} aria-label="نقّص">−</button><span className="num">{l.qty}</span><button onClick={() => setQty(l.key, l.qty + 1)} aria-label="زيد">+</button></div>
                </div>
              ))}
              <div className="s-total"><span>المجموع</span><b className="num">{fmt(total)}{unknown ? ' +' : ''}</b></div>
              {unknown && <p className="s-muted">كاين منتجات «حسب الطلب»: البائع يأكدلك السعر.</p>}
            </div>
            <form className="s-form" onSubmit={send}>
              <h2>طلب Devis</h2>
              <label>الاسم<input value={form.name} onChange={set('name')} autoComplete="name" required /></label>
              <label>الهاتف<input value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" dir="ltr" required /></label>
              <label>الولاية<input value={form.city} onChange={set('city')} /></label>
              <label>نوع المشروع<select value={form.type} onChange={set('type')}><option value="">—</option>{PROJECT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.fr}</option>)}</select></label>
              <label>ملاحظة<textarea value={form.note} onChange={set('note')} rows={3} /></label>
              {err && <p className="s-error">{err}</p>}
              <button className="btn primary" disabled={busy}>{busy ? 'راهو يبعث…' : 'ابعث الطلب'}</button>
            </form>
          </div>
        )}
      </section>
    </Shell>
  );
}
