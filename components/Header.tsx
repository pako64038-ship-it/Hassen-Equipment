export function Logo() {
  return (
    <svg className="logo he" viewBox="0 0 100 100" aria-label="Hassen Equipment">
      <circle cx="50" cy="50" r="49" fill="#fff" />
      <path d="M12 36 L50 14 L88 36" fill="none" stroke="#1F2147" strokeWidth="8" strokeLinejoin="miter" />
      <path d="M18 70 L50 88 L82 70" fill="none" stroke="#1F2147" strokeWidth="8" />
      <g fill="#EE8A2E">
        <path d="M21 34h11v38l-11-6z" />
        <path d="M21 49h30v10H21z" />
        <path d="M43 34h11v50l-11-6z" />
        <path d="M43 34h37v10H43z" />
        <path d="M54 49h22v10H54z" />
        <path d="M54 63h27v9l-27 6z" />
      </g>
    </svg>
  );
}

import Link from 'next/link';

export default function Header() {
  return (
    <header className="top">
      <div className="brand">
        <Logo />
        <div>
          <h1>
            Hassen <b>Equipment</b>
          </h1>
          <p>Pack 3D Designer · Concevez · Équipez · Réalisez</p>
        </div>
      </div>
      <Link href="/" className="btn small">← المتجر</Link>
    </header>
  );
}
