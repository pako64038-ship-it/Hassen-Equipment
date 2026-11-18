'use client';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, supabase, type Settings } from '@/lib/supabase';
import { resetSettingsCache } from '@/components/store/useSettings';
import { Flash, ImagesField, useFlash } from './ui';

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
    const { error } = await supabase.from('settings').update({ ...v, whatsapp: v.whatsapp.replace(/\D/g, ''), updated_at: new Date().toISOString() }).eq('id', 1);
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
      <button className="btn primary">حفظ</button>
      <Flash msg={msg} />
    </form>
  );
}
