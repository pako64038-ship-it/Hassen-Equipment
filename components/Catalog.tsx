export default function Catalog() {
  return (
    <aside className="panel catalog">
      <div className="cathead">
        <b>Catalogue</b>
        <span>المعدات</span>
      </div>
      <div className="catbody">
        <div id="lib" />
        <details className="more" id="budDetails">
          <summary>تفاصيل الطلبية · Détail du devis</summary>
          <div style={{ overflowX: 'auto' }}>
            <table className="budget">
              <thead>
                <tr>
                  <th>المعدات</th>
                  <th>الكمية</th>
                  <th style={{ textAlign: 'left' }}>السعر</th>
                </tr>
              </thead>
              <tbody id="budRows" />
            </table>
          </div>
          <div className="totals">
            <div hidden>
              <span className="num" id="tHT" />
              <span className="num" id="tInst" />
              <span className="num" id="tTva" />
            </div>
            <div className="grand">
              <span>المجموع</span>
              <span className="num" id="tTTC" />
            </div>
            <p className="empty" id="tNote" hidden style={{ margin: 0 }} />
          </div>
        </details>
      </div>
    </aside>
  );
}
