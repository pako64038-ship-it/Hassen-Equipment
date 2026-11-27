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

const Icon = {
  cart: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6.2" /><circle cx="9.5" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></svg>,
  phone: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3l1.6 4-2 1.3a11 11 0 0 0 7.1 7.1l1.3-2 4 1.6v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
};

export default function Shell({ children }: { children: React.ReactNode }) {
  const s = useSettings();
  const { count } = useCart();
  const path = usePathname() || '/';
  const wa = (s.whatsapp || '').replace(/\D/g, '');
  const tel = (s.phone || '').replace(/[^\d+]/g, '');
  const socials = [['Facebook', s.facebook], ['Instagram', s.instagram], ['TikTok', s.tiktok]].filter(([, u]) => u);
  return (
    <div className="s-wrap" dir="rtl">
      <header className="s-head">
        <div className="s-head-in">
          <Link href="/" className="s-brand">
            {s.logo_url ? <img src={s.logo_url} alt="" className="s-logo-img" /> : <Logo />}
            <span><b>{s.store_name}</b><small>{s.tagline}</small></span>
          </Link>
          <nav className="s-nav" aria-label="القائمة">
            {NAV.map((n) => {
              const cur = path === n.href || (n.href !== '/' && path.startsWith(n.href)) || (n.href === '/' && path.startsWith('/produit')) ? 'page' : undefined;
              return n.reload
                ? <a key={n.href} href={BASE + n.href} aria-current={cur}>{n.label}</a>
                : <Link key={n.href} href={n.href} aria-current={cur}>{n.label}</Link>;
            })}
          </nav>
          <div className="s-head-act">
            {tel && <a className="s-call" href={`tel:${tel}`}>{Icon.phone}<span className="num">{s.phone}</span></a>}
            <Link href="/panier/" className="s-cart" aria-label={`السلة (${count})`} aria-current={path.startsWith('/panier') ? 'page' : undefined}>
              {Icon.cart}<span>السلة</span>{count > 0 && <span className="s-cart-n num">{count}</span>}
            </Link>
          </div>
        </div>
      </header>
      <main className="s-main">{children}</main>
      {wa && (
        <a className="s-wa" href={`https://wa.me/${wa}?text=${encodeURIComponent('السلام، نحب نسقسي على المعدات')}`} target="_blank" rel="noopener" aria-label="WhatsApp">
          <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5l-.6-.4z"/></svg>
          <span>WhatsApp</span>
        </a>
      )}
      <footer className="s-foot">
        <div className="s-foot-in">
          <div className="s-foot-brand">
            <div className="s-brand">{s.logo_url ? <img src={s.logo_url} alt="" className="s-logo-img" /> : <Logo />}<span><b>{s.store_name}</b><small>{s.tagline}</small></span></div>
            <p>معدات المطاعم، الفاست فود، البيتزيريا، الكافيتيريا والحلويات. نجهّزو المشروع تاعك من الماكينة الأولى حتى الأخيرة، ونوصّلو لـ58 ولاية.</p>
          </div>
          <div>
            <h4>المتجر</h4>
            <Link href="/">كامل المعدات</Link>
            <a href={BASE + '/designer/'}>صمّم محلّك 3D</a>
            <Link href="/panier/">السلة والطلب</Link>
          </div>
          <div>
            <h4>اتصل بينا</h4>
            {s.phone && <a href={`tel:${tel}`} className="num">{s.phone}</a>}
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener">WhatsApp</a>}
            {s.email && <a href={`mailto:${s.email}`} dir="ltr">{s.email}</a>}
            {s.address && <span>{s.address}</span>}
          </div>
          {socials.length > 0 && (
            <div>
              <h4>تابعونا</h4>
              {socials.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener">{n}</a>)}
            </div>
          )}
        </div>
        <div className="s-foot-bottom"><span>© {new Date().getFullYear()} {s.store_name}</span><span>الأسعار بالدينار الجزائري (DA)</span></div>
      </footer>
    </div>
  );
}
