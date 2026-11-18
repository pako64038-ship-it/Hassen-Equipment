'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Confirm, Flash, useFlash } from './ui';

type Staff = { user_id: string; email: string; full_name: string; role: string; created_at: string };
const ROLES: Record<string, string> = { admin: 'Admin (كلش)', employee: 'Employé (المنتجات والطلبات)', pending: 'في الانتظار', disabled: 'موقّف' };

export default function Team({ meId }: { meId: string }) {
  const [list, setList] = useState<Staff[] | null>(null);
  const { msg, flash } = useFlash();
  const load = () => supabase.from('staff').select('*').order('created_at').then(({ data }) => setList((data as Staff[]) || []));
  useEffect(() => { load(); }, []);
  async function setRole(s: Staff, role: string) {
    const { error } = await supabase.from('staff').update({ role }).eq('user_id', s.user_id);
    if (error) flash(error.message.includes('admin') ? 'لازم يبقى Admin واحد على الأقل.' : 'ما تحفظش.'); else { flash('تحفظ ✓'); load(); }
  }
  if (!list) return <p className="s-muted">راهو يحمّل…</p>;
  const pending = list.filter((s) => s.role === 'pending').length;
  return (
    <section>
      <div className="a-bar"><h1>الخدّامين ({list.length})</h1></div>
      <div className="a-card">
        <b>كيفاش تزيد خدّام؟</b>
        <ol className="a-steps">
          <li>ابعثلو هذا الرابط: <span className="num" style={{ userSelect: 'all' }}>pako64038-ship-it.github.io/Hassen-Equipment/admin/</span></li>
          <li>يضغط «حساب جديد»، يكتب الاسم والإيميل وكلمة السر، ويأكّد الإيميل.</li>
          <li>يبان هنا «في الانتظار». بدّلو لـ<b>Employé</b> ولا <b>Admin</b>.</li>
        </ol>
      </div>
      {pending > 0 && <p className="s-note">{pending} حساب يستنّى الموافقة تاعك.</p>}
      <div className="a-table-wrap"><table className="budget a-table">
        <thead><tr><th>الاسم</th><th>الإيميل</th><th>الدور</th><th>من</th><th></th></tr></thead>
        <tbody>{list.map((s) => (
          <tr key={s.user_id}>
            <td className="nm"><b>{s.full_name || '—'}</b>{s.user_id === meId && <small className="s-muted"> (انت)</small>}</td>
            <td dir="ltr">{s.email}</td>
            <td><select value={s.role} onChange={(e) => setRole(s, e.target.value)}>{Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
            <td className="num">{new Date(s.created_at).toLocaleDateString('fr-DZ')}</td>
            <td>{s.user_id !== meId && <Confirm label="نحّي" onYes={async () => { const { error } = await supabase.from('staff').delete().eq('user_id', s.user_id); if (error) flash('ما تنحّاش.'); load(); }} />}</td>
          </tr>
        ))}</tbody>
      </table></div>
      <p className="s-muted">«نحّي» ينحّيه من الفريق. باش تمنعو يدخل نهائياً، خلّيه «موقّف».</p>
      <Flash msg={msg} />
    </section>
  );
}
