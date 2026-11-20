'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SITE_URL, supabase } from '@/lib/supabase';
import { Logo } from '@/components/Header';
import Orders from './Orders';
import Products from './Products';
import Categories from './Categories';
import Packs from './Packs';
import Team from './Team';
import SettingsTab from './SettingsTab';

type Me = { user_id: string; email: string; full_name: string; role: string };

function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) setMsg(error.message.includes('confirm') ? 'لازم تأكّد الإيميل أول: حلّ الإيميل اللي بعثنالك واضغط على الرابط.' : 'الإيميل ولا كلمة السر غالطين.');
      } else if (mode === 'signup') {
        if (pass.length < 8) { setMsg('كلمة السر لازم 8 حروف على الأقل.'); return; }
        const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: name }, emailRedirectTo: SITE_URL + '/admin/' } });
        if (error) setMsg(error.message);
        else if (!data.session) setMsg('تعمل الحساب. حلّ الإيميل تاعك واضغط على رابط التأكيد، ومن بعد ادخل.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL + '/admin/' });
        setMsg(error ? error.message : 'بعثنالك إيميل باش تبدّل كلمة السر.');
      }
    } finally { setBusy(false); }
  }
  return (
    <div className="a-auth">
      <div className="a-auth-card">
        <div className="a-auth-brand"><Logo /><b>لوحة التحكم</b></div>
        <div className="ctabs" role="tablist">
          <button role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>دخول</button>
          <button role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')}>حساب جديد</button>
        </div>
        <form onSubmit={submit} className="s-form">
          {mode === 'signup' && <label>الاسم الكامل<input value={name} onChange={(e) => setName(e.target.value)} required /></label>}
          <label>الإيميل<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" dir="ltr" /></label>
          {mode !== 'reset' && <label>كلمة السر<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} dir="ltr" /></label>}
          {msg && <p className="s-note">{msg}</p>}
          <button className="btn primary" disabled={busy}>{mode === 'login' ? 'دخول' : mode === 'signup' ? 'اعمل الحساب' : 'ابعثلي الرابط'}</button>
          {mode === 'login' && <button type="button" className="a-link" onClick={() => setMode('reset')}>نسيت كلمة السر؟</button>}
          {mode === 'signup' && <p className="s-muted">الحساب الأول يولّي Admin. الخدّامين الآخرين يستنّاو حتى يقبلهم الـAdmin.</p>}
        </form>
      </div>
    </div>
  );
}

function NewPassword({ onDone }: { onDone: () => void }) {
  const [pass, setPass] = useState(''); const [msg, setMsg] = useState('');
  return (
    <div className="a-auth"><form className="a-auth-card s-form" onSubmit={async (e) => {
      e.preventDefault(); if (pass.length < 8) { setMsg('8 حروف على الأقل.'); return; }
      const { error } = await supabase.auth.updateUser({ password: pass }); if (error) setMsg(error.message); else onDone();
    }}>
      <h2>كلمة سر جديدة</h2>
      <label>كلمة السر الجديدة<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} dir="ltr" autoComplete="new-password" /></label>
      {msg && <p className="s-note">{msg}</p>}
      <button className="btn primary">حفظ</button>
    </form></div>
  );
}

const TABS = [
  { id: 'orders', label: 'الطلبات', admin: false },
  { id: 'products', label: 'المنتجات', admin: false },
  { id: 'categories', label: 'الأقسام', admin: false },
  { id: 'packs', label: 'الـPacks', admin: false },
  { id: 'team', label: 'الخدّامين', admin: true },
  { id: 'settings', label: 'الإعدادات', admin: true },
];

function beep() {
  try {
    const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const c = new A();
    [0, 0.18, 0.36].forEach((t, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = [880, 1175, 1568][i];
      g.gain.setValueAtTime(0.0001, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.3, c.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + 0.16);
      o.connect(g).connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.18); });
  } catch {}
}

// Asks once for permission to show a notification on the computer or phone when an order arrives.
function NotifyBar() {
  const [perm, setPerm] = useState<string>('granted');
  useEffect(() => { setPerm('Notification' in window ? Notification.permission : 'unsupported'); }, []);
  if (perm !== 'default') return null;
  return (
    <div className="a-notify">
      <span>🔔 فعّل التنبيهات باش يجيك صوت وإشعار كي يبعث زبون طلب جديد (خلّي هاذي الصفحة محلولة).</span>
      <button className="btn small primary" onClick={() => Notification.requestPermission().then((p) => { setPerm(p); if (p === 'granted') beep(); })}>فعّل</button>
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [recovery, setRecovery] = useState(false);
  const [tab, setTab] = useState('orders');
  const [fresh, setFresh] = useState(0); // new orders since the panel was opened
  const [reloadKey, setReloadKey] = useState(0);
  const title = useRef('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((ev, s) => { setSession(s); if (ev === 'PASSWORD_RECOVERY') setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  const loadMe = useCallback(async () => {
    if (!session) { setMe(null); return; }
    const { data } = await supabase.from('staff').select('*').eq('user_id', session.user.id).maybeSingle();
    setMe((data as Me) || null);
  }, [session]);
  useEffect(() => { loadMe(); }, [loadMe]);

  // Live alert when a customer sends an order: sound, browser notification, badge in the tab title.
  const staff = !!me && ['admin', 'employee'].includes(me.role);
  useEffect(() => {
    if (!staff) return;
    if (!title.current) title.current = document.title;
    const ch = supabase.channel('orders-live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (p) => {
      const o = p.new as { number?: number; customer_name?: string; city?: string };
      setFresh((n) => n + 1); setReloadKey((k) => k + 1); beep();
      try { if ('Notification' in window && Notification.permission === 'granted') new Notification('طلب جديد #' + (o.number ?? ''), { body: `${o.customer_name || ''} · ${o.city || ''}`, tag: 'order-' + (o.number ?? '') }); } catch {}
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [staff]);
  useEffect(() => { if (title.current) document.title = fresh ? `(${fresh}) طلب جديد · ${title.current}` : title.current; }, [fresh]);

  if (session === undefined) return <div className="a-auth"><p className="s-muted">راهو يحمّل…</p></div>;
  if (recovery && session) return <NewPassword onDone={() => setRecovery(false)} />;
  if (!session) return <Auth />;
  if (me === undefined) return <div className="a-auth"><p className="s-muted">راهو يحمّل…</p></div>;
  const out = <button className="btn small" onClick={() => supabase.auth.signOut()}>خروج</button>;
  if (!me) return <div className="a-auth"><div className="a-auth-card"><p>ما لقيناش الحساب تاعك في الفريق. إذا ما زال ما خدمتش قاعدة البيانات، لازم تتنفّذ أول.</p>{out}</div></div>;
  if (me.role === 'pending') return <div className="a-auth"><div className="a-auth-card"><h2>الحساب في الانتظار</h2><p>الـAdmin لازم يقبل الحساب تاعك ({me.email}) من «الخدّامين». ارجع من بعد.</p>{out}</div></div>;
  if (me.role === 'disabled') return <div className="a-auth"><div className="a-auth-card"><h2>الحساب موقّف</h2><p>اتصل بالـAdmin.</p>{out}</div></div>;

  const isAdmin = me.role === 'admin';
  const tabs = TABS.filter((t) => isAdmin || !t.admin);
  return (
    <div className="a-wrap" dir="rtl">
      <header className="a-head">
        <div className="a-head-brand"><Logo /><b>لوحة التحكم</b></div>
        <nav className="a-tabs" role="tablist">
          {tabs.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); if (t.id === 'orders') setFresh(0); }}>{t.label}{t.id === 'orders' && fresh > 0 && <span className="a-badge">{fresh}</span>}</button>)}
        </nav>
        <div className="a-me"><span>{me.full_name || me.email}<small>{isAdmin ? 'Admin' : 'Employé'}</small></span><Link href="/" className="btn small">المتجر</Link>{out}</div>
      </header>
      <main className="a-main">
        <NotifyBar />
        {tab === 'orders' && <Orders isAdmin={isAdmin} reloadKey={reloadKey} />}
        {tab === 'products' && <Products />}
        {tab === 'categories' && <Categories />}
        {tab === 'packs' && <Packs />}
        {tab === 'team' && isAdmin && <Team meId={me.user_id} />}
        {tab === 'settings' && isAdmin && <SettingsTab />}
      </main>
    </div>
  );
}
