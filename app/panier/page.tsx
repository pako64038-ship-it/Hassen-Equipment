'use client';
import Link from 'next/link';
import { useState } from 'react';
import Shell from '@/components/store/Shell';
import { Img } from '@/components/store/Cards';
import { useSettings } from '@/components/store/useSettings';
import { clearCart, setQty, useCart } from '@/lib/cart';
import { deliveryFee, PAYMENTS, WILAYAS, wilayaName } from '@/lib/delivery';
import { BASE, fmt, PROJECT_TYPES, supabase } from '@/lib/supabase';

type Done = { wa: string; payment: string; grand: number | null; number: number | null };

export default function Panier() {
  const s = useSettings();
  const { lines, total, unknown } = useCart();
  const pays = (s.payments?.length ? s.payments : Object.keys(PAYMENTS)).filter((p) => PAYMENTS[p]);
  const [form, setForm] = useState({ name: '', phone: '', wilaya: '', address: '', type: '', note: '', mode: 'delivery', payment: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const pickup = s.pickup && form.mode === 'pickup';
  const fee = pickup ? 0 : form.wilaya ? deliveryFee(s.delivery_prices, s.delivery_default, form.wilaya) : null;
  const payment = pays.includes(form.payment) ? form.payment : pays[0] || '';
  const grand = unknown || fee == null ? null : total + fee;

  async function send(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (form.name.trim().length < 2) { setErr('اكتب الاسم تاعك.'); return; }
    if (form.phone.replace(/\D/g, '').length < 9) { setErr('اكتب رقم هاتف صحيح.'); return; }
    if (!form.wilaya) { setErr('اختار الولاية تاعك.'); return; }
    setBusy(true);
    const items = lines.map((l) => ({ kind: l.kind, id: l.id, name: l.name, qty: l.qty, price: l.price }));
    const id = crypto.randomUUID();
    const { error } = await supabase.from('orders').insert({
      id, customer_name: form.name.trim(), phone: form.phone.trim(), city: wilayaName(form.wilaya),
      project_type: form.type, note: form.note.trim(), items, total,
      delivery_mode: pickup ? 'pickup' : 'delivery', address: pickup ? '' : form.address.trim().slice(0, 300), delivery_fee: fee, payment,
    });
    setBusy(false);
    if (error) { setErr('ما قدرناش نبعثو الطلب. عاود جرّب، ولا ابعثو بالواتساب.'); return; }
    const txt = [`${s.store_name} — طلب جديد`, `${form.name} · ${form.phone}`, `${wilayaName(form.wilaya)}${!pickup && form.address ? ' · ' + form.address : ''}`, '',
      ...lines.map((l) => `- ${l.name} × ${l.qty} : ${fmt(l.price == null ? null : l.price * l.qty)}`), '',
      `المنتجات: ${fmt(total)}${unknown ? ' + منتجات حسب الطلب' : ''}`,
      pickup ? 'الاستلام: من المحل' : `التوصيل: ${fee == null ? 'يتّفق مع البائع' : fmt(fee)}`,
      `الدفع: ${PAYMENTS[payment]?.label || '—'}`, form.note ? `ملاحظة: ${form.note}` : ''].filter(Boolean).join('\n');
    const wa = `https://wa.me/${(s.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`;
    setDone({ wa, payment, grand, number: null }); clearCart();
  }

  return (
    <Shell>
      <section className="s-sec">
        <h1 className="s-title">السلة</h1>
        {done ? (
          <div className="s-done">
            <h2>✓ وصلنا الطلب تاعك</h2>
            <p>نتّصلو بيك في أقرب وقت على الرقم اللي عطيتنا باش نأكدو معاك الطلب والتوصيل.</p>
            {(done.payment === 'ccp' || done.payment === 'baridimob') && (s.ccp || s.rip) && (
              <div className="s-paybox">
                <b>معلومات الدفع</b>
                {done.grand != null && <p>المبلغ: <span className="num">{fmt(done.grand)}</span></p>}
                {done.payment === 'ccp' && s.ccp && <p>CCP: <span className="num" dir="ltr" style={{ userSelect: 'all' }}>{s.ccp}</span></p>}
                {done.payment === 'baridimob' && s.rip && <p>RIP: <span className="num" dir="ltr" style={{ userSelect: 'all' }}>{s.rip}</span></p>}
                <p className="s-muted">حوّل غير من بعد ما نأكدو معاك الطلب بالتيليفون، وابعثلنا صورة الوصل بالواتساب.</p>
              </div>
            )}
            <p>تقدر تبعث الطلب بالواتساب باش يوصل أسرع.</p>
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
              <div className="s-sum">
                <div><span>المنتجات</span><b className="num">{unknown && !total ? 'حسب الطلب' : fmt(total) + (unknown ? ' +' : '')}</b></div>
                <div><span>{pickup ? 'الاستلام من المحل' : 'التوصيل'}</span><b className={fee == null ? 's-muted' : 'num'}>{pickup ? 'باطل' : !form.wilaya ? 'اختار الولاية' : fee == null ? 'يتّفق مع البائع' : fee === 0 ? 'باطل' : fmt(fee)}</b></div>
                <div className="s-total"><span>المجموع</span><b className="num">{grand != null ? fmt(grand) : unknown && !total ? 'حسب الطلب' : fmt(total) + ' +'}</b></div>
              </div>
              {unknown && <p className="s-muted">كاين منتجات «حسب الطلب»: البائع يأكدلك السعر.</p>}
              {s.delivery_note && <p className="s-muted">🚚 {s.delivery_note}</p>}
              <div className="s-try3d">
                <div><b>جرّب هاذو المعدات في محلّك بالـ3D</b><span>دخّل القياس تاع المحل وشوف كيفاش يجيو قبل ما تطلب.</span></div>
                <a className="btn primary" href={BASE + '/designer/?from=cart'}>شوف في محلّي 3D</a>
              </div>
            </div>
            <form className="s-form" onSubmit={send}>
              <h2>الطلب</h2>
              <label>الاسم<input value={form.name} onChange={set('name')} autoComplete="name" required /></label>
              <label>الهاتف<input value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" dir="ltr" required /></label>
              <label>الولاية<select value={form.wilaya} onChange={set('wilaya')} required>
                <option value="">— اختار —</option>
                {WILAYAS.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
              </select></label>
              {s.pickup && (
                <fieldset className="s-radios"><legend>كيفاش تستلم</legend>
                  <label><input type="radio" name="mode" value="delivery" checked={!pickup} onChange={set('mode')} /> توصيل</label>
                  <label><input type="radio" name="mode" value="pickup" checked={pickup} onChange={set('mode')} /> نجي نديها من المحل</label>
                </fieldset>
              )}
              {!pickup && <label>العنوان (البلدية، الحي)<input value={form.address} onChange={set('address')} autoComplete="street-address" maxLength={300} /></label>}
              {pays.length > 0 && (
                <fieldset className="s-radios"><legend>الدفع</legend>
                  {pays.map((p) => <label key={p} title={PAYMENTS[p].hint}><input type="radio" name="payment" value={p} checked={payment === p} onChange={set('payment')} /> {PAYMENTS[p].label}</label>)}
                </fieldset>
              )}
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
