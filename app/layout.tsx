import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE = 'https://pako64038-ship-it.github.io/Hassen-Equipment';
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
const DESC = 'معدات المطاعم، الفاست فود، البيتزيريا، الكافيتيريا والحلويات في الجزائر. صمّم محلّك بالـ3D، اختار المعدات واطلب Devis. توصيل لـ58 ولاية · 0556 55 45 48';

export const metadata: Metadata = {
  metadataBase: new URL(SITE + '/'),
  title: { default: 'Hassen Equipment · معدات المطاعم والفاست فود', template: '%s · Hassen Equipment' },
  description: DESC,
  keywords: ['équipement fast food Algérie', 'matériel restaurant Algérie', 'معدات المطاعم', 'معدات الفاست فود', 'friteuse', 'plaque chauffante', 'inox sur mesure', 'Hassen Equipment'],
  manifest: BASE + '/manifest.webmanifest',
  icons: { icon: BASE + '/favicon.png', apple: BASE + '/apple-touch-icon.png' },
  openGraph: { type: 'website', locale: 'ar_DZ', siteName: 'Hassen Equipment', title: 'Hassen Equipment · معدات المطاعم والفاست فود', description: DESC, url: SITE + '/', images: [{ url: SITE + '/og.jpg', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'Hassen Equipment', description: DESC, images: [SITE + '/og.jpg'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#E2771A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Readex+Pro:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
