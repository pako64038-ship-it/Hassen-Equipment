'use client';
import { useState } from 'react';
import { PROJECT_TYPES, uploadImage } from '@/lib/supabase';

export function TypesPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="a-types"><legend>يصلح لـ (ما تعلّم والو = كل الأنواع)</legend>
      {PROJECT_TYPES.map((t) => (
        <label key={t.id} className="check">
          <input type="checkbox" checked={value.includes(t.id)} onChange={(e) => onChange(e.target.checked ? [...value, t.id] : value.filter((x) => x !== t.id))} /> {t.fr}
        </label>
      ))}
    </fieldset>
  );
}

export function ImagesField({ value, onChange, folder }: { value: string[]; onChange: (v: string[]) => void; folder: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  return (
    <div className="a-images">
      <div className="a-thumbs">
        {value.map((u, i) => (
          <div key={u + i} className="a-thumb"><img src={u} alt="" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="نحّي الصورة">×</button>
            {i > 0 && <button type="button" className="a-first" onClick={() => onChange([u, ...value.filter((_, j) => j !== i)])}>الأولى</button>}
          </div>
        ))}
        <label className="a-add-img">{busy ? '…' : '+ صورة'}
          <input type="file" accept="image/*" multiple hidden onChange={async (e) => {
            const files = Array.from(e.target.files || []); if (!files.length) return; setBusy(true); setErr('');
            try { const urls: string[] = []; for (const f of files) urls.push(await uploadImage(f, folder)); onChange([...value, ...urls]); }
            catch { setErr('ما قدرناش نرفعو الصورة. عاود جرّب.'); } finally { setBusy(false); e.target.value = ''; }
          }} />
        </label>
      </div>
      {err && <p className="s-error">{err}</p>}
    </div>
  );
}

export function useFlash() {
  const [msg, setMsg] = useState('');
  return { msg, flash: (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); } };
}
export function Flash({ msg }: { msg: string }) { return msg ? <div className="s-toast" role="status">{msg}</div> : null; }

export function Confirm({ label, onYes, className = 'btn small danger' }: { label: string; onYes: () => void; className?: string }) {
  const [ask, setAsk] = useState(false);
  return ask
    ? <span className="row"><button type="button" className={className} onClick={() => { setAsk(false); onYes(); }}>متأكد؟</button><button type="button" className="btn small" onClick={() => setAsk(false)}>لا</button></span>
    : <button type="button" className={className} onClick={() => setAsk(true)}>{label}</button>;
}

export const num = (v: string) => (v === '' ? null : Number(v));
