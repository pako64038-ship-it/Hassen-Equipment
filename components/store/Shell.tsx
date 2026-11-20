'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Header';
import { useCart } from '@/lib/cart';
import { BASE } from '@/lib/supabase';
import { useSettings } from './useSettings';

// The 3D designer always opens with a full page load, so its engine starts fresh.
const NAV = [
  { href: '/', label: 'المعدات' },
  { href: '/designer/', label: 'صمّم محلّك 3D', reload: true },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const s = useSettings();
  const { count } = useCart();
  const path = usePathname() || '/';
  const wa = (s.whatsapp || '').replace(/\D/g, '');
  return (
    <div className="s-wrap" dir="rtl">
      <header className="s-head">
        <Link href="/" className="s-brand">
          {s.logo_url ? <img src={s.logo_url} alt="" className="s-logo-img" /> : <Logo />}
          <span><b>{s.store_name}</b><small>{s.tagline}</small></span>
        </Link>
        <nav className="s-nav" aria-label="القائمة">
          {NAV.map((n) => {
            const cur = path === n.href || (n.href !== '/' && path.startsWith(n.href)) ? 'page' : undefined;
            return n.reload
              ? <a key={n.href} href={BASE + n.href} aria-current={cur}>{n.label}</a>
              : <Link key={n.href} href={n.href} aria-current={cur}>{n.label}</Link>;
          })}
          <Link href="/panier/" className="s-cart" aria-current={path.startsWith('/panier') ? 'page' : undefined}>
            السلة {count > 0 && <span className="num">{count}</span>}
          </Link>
        </nav>
      </header>
      <main className="s-main">{children}</main>
      <footer className="s-foot">
        <div>
          <b>{s.store_name}</b>
          <p>{s.tagline}</p>
        </div>
        <div className="s-contact">
          {s.phone && <span>الهاتف: <span className="num">{s.phone}</span></span>}
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener">WhatsApp</a>}
          {s.facebook && <a href={s.facebook} target="_blank" rel="noopener">Facebook</a>}
          {s.instagram && <a href={s.instagram} target="_blank" rel="noopener">Instagram</a>}
          {s.tiktok && <a href={s.tiktok} target="_blank" rel="noopener">TikTok</a>}
          {s.address && <span>{s.address}</span>}
        </div>
      </footer>
    </div>
  );
}
