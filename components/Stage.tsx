export default function Stage() {
  return (
    <main className="stage" id="stage">
      <div id="viewport" />
      <div className="hud">
        <div className="dims glass">
          <b id="hudType" />
          <span className="num" id="hudDims" />
        </div>
        <div className="views glass" role="group" aria-label="زاوية الكاميرا">
          <button id="v3d" aria-pressed="true">3D</button>
          <button id="vtop" aria-pressed="false">المخطط</button>
          <button data-arrange className="arrange" title="رتّب المعدات حذا الحيطان">رتّب وحدو</button>
          <button data-clearall className="clearall" title="نحّي كامل المعدات من المحل">حذف الكل</button>
        </div>
      </div>
      <div className="toast glass" id="toast" hidden />
      <div className="hint glass" id="hint">اضغط «رتّب وحدو» ولا اسحب أي قطعة · كي تقرّبها للحيط تلصق وحدها</div>
      <div className="selbar glass" id="selbar" hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="selImg" className="selimg" alt="" />
        <div className="nm">
          <b id="selName" />
          <span id="selInfo" />
        </div>
        <div className="row">
          <button className="btn small" id="selRot">تدوير 90°</button>
          <button className="btn small" id="selDup">نسخ</button>
          <span id="hoodSize" className="row" hidden>
            <button className="btn small" id="hoodMinus" aria-label="تقصير">−</button>
            <button className="btn small" id="hoodPlus" aria-label="تطويل">+</button>
          </span>
          <button className="btn small danger" id="selDel">حذف</button>
          <button className="btn small danger" data-clearall>حذف الكل</button>
        </div>
      </div>
    </main>
  );
}
