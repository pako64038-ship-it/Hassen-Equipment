export default function BottomBar() {
  return (
    <footer className="bottombar">
      <div className="stat">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div>
          <small>المساحة · Surface</small>
          <b className="num" id="statArea" />
        </div>
      </div>
      <div className="stat">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l9 5v10l-9 5-9-5V7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M3 7l9 5 9-5M12 12v10" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div>
          <small>المعدات · Équipements</small>
          <b id="pillCount" />
        </div>
      </div>
      <button className="stat total" id="totalPill">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <ellipse cx="12" cy="6" rx="8" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div>
          <small>المجموع · Total estimé</small>
          <b className="num" id="pillTotal" />
        </div>
      </button>
      <div className="actions">
        <button className="btn" id="btnShot">صورة 3D</button>
        <button className="btn" id="btnDevis">Devis واتساب</button>
        <button className="btn primary" id="btnCart">حط في السلة</button>
      </div>
    </footer>
  );
}
