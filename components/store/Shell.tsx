'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Header';
import { useCart } from '@/lib/cart';
import { useSettings } from './useSettings';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/produits/', label: 'المعدات' },
  { href: '/designer/', label: 'صمّم محلّك 3D' },
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
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path === n.href || (n.href !== '/' && path.startsWith(n.href)) ? 'page' : undefined}>{n.label}</Link>
          ))}
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
          {s.address && <span>{s.address}</span>}
        </div>
        <Link href="/admin/" className="s-staff">دخول الخدّامين</Link>
      </footer>
    </div>
  );
}
