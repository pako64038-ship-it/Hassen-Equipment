'use client';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, supabase, type Settings } from '@/lib/supabase';
import { resetSettingsCache } from '@/components/store/useSettings';
import { Flash, ImagesField, useFlash } from './ui';
import { PAYMENTS, WILAYAS } from '@/lib/delivery';

const FIELDS: [keyof Settings, string, string?][] = [
  ['store_name', 'اسم المتجر'], ['tagline', 'الشعار (تحت الاسم)'], ['hero_title', 'العنوان الكبير في الرئيسية'], ['hero_text', 'النص في الرئيسية', 'area'],
  ['phone', 'الهاتف اللي يبان'], ['whatsapp', 'رقم الواتساب (بالـ213 بلا 0، مثلاً 213556554548)'], ['email', 'الإيميل'], ['address', 'العنوان'],
  ['facebook', 'رابط Facebook'], ['instagram', 'رابط Instagram'],
];

export default function SettingsTab() {
  const [v, setV] = useState<Settings | null>(null);
  const { msg, flash } = useFlash();
  useEffect(() => { loadSettings().then(setV).catch(() => setV(DEFAULT_SETTINGS)); }, []);
  if (!v) return <p className="s-muted">راهو يحمّل…</p>;
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!v) return;
    const prices = Object.fromEntries(Object.entries(v.delivery_prices || {}).filter(([, x]) => x != null && !isNaN(Number(x))).map(([k, x]) => [k, Number(x)]));
    const { error } = await supabase.from('settings').update({ ...v, delivery_prices: prices, whatsapp: v.whatsapp.replace(/\D/g, ''), updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) flash('ما تحفظش: ' + error.message); else { resetSettingsCache(); flash('تحفظو الإعدادات ✓'); }
  }
  return (
    <form onSubmit={save}>
      <div className="a-bar"><h1>إعدادات المتجر</h1><button className="btn primary">حفظ</button></div>
      <div className="a-card">
        {FIELDS.map(([k, label, kind]) => (
          <label key={k}>{label}{kind === 'area'
            ? <textarea rows={3} value={String(v[k] || '')} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
            : <input value={String(v[k] || '')} onChange={(e) => setV({ ...v, [k]: e.target.value })} dir={['whatsapp', 'email', 'facebook', 'instagram'].includes(k) ? 'ltr' : undefined} />}</label>
        ))}
        <div><b>اللوغو</b> <small className="s-muted">(إذا خلّيتو فارغ، يبان اللوغو HE)</small>
          <ImagesField value={v.logo_url ? [v.logo_url] : []} onChange={(x) => setV({ ...v, logo_url: x[x.length - 1] || '' })} folder="brand" /></div>
      </div>
      <div className="a-card">
        <h2>التوصيل</h2>
        <label>سعر التوصيل العادي (DA) <small className="s-muted">فارغ = «يتّفق مع البائع»، 0 = باطل</small>
          <input type="number" min={0} dir="ltr" value={v.delivery_default ?? ''} onChange={(e) => setV({ ...v, delivery_default: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        <label>ملاحظة على التوصيل <small className="s-muted">(تبان في السلة، مثلاً: التوصيل في 48 ساعة مع Yalidine)</small>
          <input value={v.delivery_note || ''} onChange={(e) => setV({ ...v, delivery_note: e.target.value })} /></label>
        <label className="a-check"><input type="checkbox" checked={!!v.pickup} onChange={(e) => setV({ ...v, pickup: e.target.checked })} /> الزبون يقدر يجي يدي السلعة من المحل</label>
        <details>
          <summary>سعر خاص لكل ولاية <small className="s-muted">(فارغ = السعر العادي)</small></summary>
          <div className="a-wilayas">
            {WILAYAS.map(([c, n]) => (
              <label key={c}><span>{c} · {n}</span>
                <input type="number" min={0} dir="ltr" value={v.delivery_prices?.[c] ?? ''} placeholder={v.delivery_default == null ? '—' : String(v.delivery_default)}
                  onChange={(e) => setV({ ...v, delivery_prices: { ...(v.delivery_prices || {}), [c]: e.target.value === '' ? null : Number(e.target.value) } })} /></label>
            ))}
          </div>
        </details>
      </div>
      <div className="a-card">
        <h2>الدفع</h2>
        {Object.entries(PAYMENTS).map(([k, p]) => (
          <label key={k} className="a-check"><input type="checkbox" checked={(v.payments || []).includes(k)}
            onChange={(e) => setV({ ...v, payments: e.target.checked ? [...(v.payments || []), k] : (v.payments || []).filter((x) => x !== k) })} /> {p.label}</label>
        ))}
        <label>رقم الحساب CCP <small className="s-muted">(يبان للزبون غير من بعد ما يبعث الطلب)</small><input dir="ltr" value={v.ccp || ''} onChange={(e) => setV({ ...v, ccp: e.target.value })} placeholder="0000000000 clé 00" /></label>
        <label>RIP تاع BaridiMob<input dir="ltr" value={v.rip || ''} onChange={(e) => setV({ ...v, rip: e.target.value })} placeholder="00799999..." /></label>
      </div>
      <button className="btn primary">حفظ</button>
      <Flash msg={msg} />
    </form>
  );
}
