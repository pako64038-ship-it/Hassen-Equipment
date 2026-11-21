function Opening({ label, prefix, wMin, wMax }: { label: string; prefix: 'door' | 'win'; wMin: number; wMax: number }) {
  return (
    <div className={`opening ${prefix}`}>
      <b>{label}</b>
      {prefix === 'door' && (
        <div className="field">
          <label htmlFor="doorKind">النوع</label>
          <select id="doorKind" defaultValue="porte">
            <option value="porte">باب زجاج</option>
            <option value="rideau">ريدو · Rideau (garage)</option>
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor={`${prefix}Wall`}>الحائط</label>
        <select id={`${prefix}Wall`} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}T`}>الموضع</label>
        <input id={`${prefix}T`} type="number" min={0} step={0.1} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}W`}>العرض</label>
        <input id={`${prefix}W`} type="number" min={wMin} max={wMax} step={0.1} />
      </div>
    </div>
  );
}

function DimRow({ id, label, min, max }: { id: string; label: string; min: number; max: number }) {
  return (
    <div className="dimrow">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" min={min} max={max} step={0.1} inputMode="decimal" />
    </div>
  );
}

export default function SidePanel() {
  return (
    <aside className="panel side">
      <section className="card">
        <h2><i>1</i>الأبعاد <small>Dimensions du local</small></h2>
        <DimRow id="inL" label="الطول (m)" min={2} max={30} />
        <DimRow id="inW" label="العرض (m)" min={2} max={30} />
        <DimRow id="inH" label="العلو (m)" min={2.4} max={6} />
        <button className="btn primary" id="btnSuggest">طبّق · Appliquer</button>
        <button className="btn" id="btnPlan">ارسم شكل المحل · Plan 2D</button>
        <p className="shape-note" id="shapeNote" hidden>
          <span /> <button type="button" className="a-link" id="shapeReset">رجّع مستطيل</button>
        </p>
        <details className="more" open>
          <summary>الباب / الريدو والنافذة</summary>
          <p className="lead">الموضع = المسافة من بداية الحائط. ما عندكش نافذة؟ اختار «بلا نافذة».</p>
          <div className="openings">
            <Opening label="المدخل" prefix="door" wMin={0.8} wMax={8} />
            <Opening label="النافذة" prefix="win" wMin={0.5} wMax={8} />
          </div>
        </details>
      </section>

      <section className="card">
        <h2><i>2</i>نوع المشروع <small>Type de projet</small></h2>
        <p className="lead">اختار نوع المشروع تاعك.</p>
        <div className="ptypes" id="types" />
      </section>

      <section className="card">
        <h2><i>3</i>الستيل <small>Choisir un style</small></h2>
        <div className="styles" id="styles" />
      </section>

      <section className="card">
        <h2><i>4</i>محلّك الحقيقي <small>Photos des murs</small></h2>
        <p className="lead">صوّر كل حائط من القدّام، ويتلصق في الـ3D.</p>
        <div className="walls" id="wallPics" />
      </section>

      <section className="card">
        <h2>ملاحظات</h2>
        <ul className="notes" id="notes" />
      </section>

      <section className="card">
        <div>
          <h2>التصاميم المحفوظة <small>في هذا الجهاز</small></h2>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="saveName">اسم التصميم</label>
              <input id="saveName" type="text" placeholder="مثلاً: Fast food باب الواد" />
            </div>
            <button className="btn" id="btnSave" style={{ alignSelf: 'end' }}>حفظ</button>
          </div>
          <div className="saved" id="saved" />
        </div>
      </section>
    </aside>
  );
}
