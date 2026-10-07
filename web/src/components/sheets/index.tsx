import "./sheets.css";
import { DOC_TYPE_LABEL } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { toWordsMn } from "@/lib/money";
import { docTotal, filledRows, rowAmount, type DocState, type Issuer, type Row } from "@/lib/documents";

/* Баримтын урьдчилан харах / хэвлэх хуудас. Хуучин апп-ын 4 загвар:
   үнийн санал, албан бичиг → брэнд загвар; нэхэмжлэх → ТМ-1; зарлагын баримт → БМ-3 */

const BM3_MIN_ROWS = 20;
const TM1_MIN_ROWS = 10;
const n = (v: number) => (v ? fmtMoney(v) : "");

export function DocumentSheet({ s, issuer }: { s: DocState; issuer: Issuer | undefined }) {
  const co = issuer ?? { id: "", name: "", address: "", rd: "", phone: "", email: "", bank: "", account: "", director: "" };
  if (s.docType === "invoice") return <Tm1 s={s} co={co} />;
  if (s.docType === "dispatch") return <Bm3 s={s} co={co} />;
  return <Brand s={s} co={co} />;
}

function StampArea() {
  return (
    <div className="sh-stamp-wrap">
      <div className="sh-sign-label">
        <strong>Тамга тэмдэг</strong>
        <br />
        <span style={{ color: "#94a3b8" }}>/Гарын үсэг/</span>
      </div>
    </div>
  );
}

function Brand({ s, co }: { s: DocState; co: Issuer }) {
  const isLetter = s.docType === "letter";
  const rows = filledRows(s.rows);
  const total = docTotal(s.rows);
  const info = [co.address, co.rd ? "РД: " + co.rd : ""].filter(Boolean).join("\n");
  return (
    <main className="sheet">
      <div className="sh-accent-bar" />
      <div className="sh-body">
        <div className="sh-header">
          <div>
            <div className="sh-co-name">{co.name}</div>
            <div className="sh-co-info">{info}</div>
          </div>
          <div className="sh-right">
            <div className="sh-doc-type">{DOC_TYPE_LABEL[s.docType].toUpperCase()}</div>
            {isLetter ? (
              <div style={{ fontSize: 11.5, color: "#475569", marginBottom: 4 }}>
                Дугаар: <strong>{s.number}</strong>
              </div>
            ) : (
              <>
                <div className="sh-inv-badge">{s.number || "—"}</div>
                <br />
              </>
            )}
            <div className="sh-date">
              Огноо: <strong>{s.docDate}</strong>
            </div>
          </div>
        </div>

        {isLetter ? (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <div style={{ textAlign: "right", fontSize: 12.5, lineHeight: 1.9 }}>
                <div style={{ fontWeight: 700 }}>{s.customerName}</div>
                <div>{s.letterOrg}</div>
              </div>
            </div>
            <div
              style={{
                textAlign: "center", margin: "22px 0 18px", fontSize: 14, fontWeight: 800,
                textDecoration: "underline", textUnderlineOffset: 4, letterSpacing: ".3px",
              }}
            >
              {s.subject}
            </div>
            <div style={{ fontSize: 13, lineHeight: 2, whiteSpace: "pre-wrap", textIndent: "2em" }}>{s.body}</div>
            <div style={{ marginTop: 28, fontSize: 13 }}>Хүндэтгэсэн,</div>
            <div className="sh-footer" style={{ marginTop: 28 }}>
              <div style={{ fontSize: 12.5, lineHeight: 2 }}>
                <div style={{ color: "#64748b", fontSize: 11 }}>{s.position || "Захирал"}</div>
                <div style={{ fontWeight: 700 }}>{s.signName}</div>
              </div>
              <StampArea />
            </div>
          </>
        ) : (
          <>
            <div className="sh-cust-box">
              <div className="sh-cust-lbl">Харилцагч / Customer</div>
              <div className="sh-cust-name">{s.customerName}</div>
            </div>
            <table className="sh-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>№</th>
                  <th className="left">БҮТЭЭГДЭХҮҮНИЙ НЭР / PRODUCT NAME</th>
                  <th style={{ width: 70 }}>НЭГЖ<br /><span style={{ fontWeight: 400, opacity: .7 }}>Unit</span></th>
                  <th style={{ width: 98 }}>НЭГЖИЙН ҮНЭ<br /><span style={{ fontWeight: 400, opacity: .7 }}>Unit Price</span></th>
                  <th style={{ width: 58 }}>ТОО<br /><span style={{ fontWeight: 400, opacity: .7 }}>Qty</span></th>
                  <th style={{ width: 108 }}>НИЙТ ДҮН<br /><span style={{ fontWeight: 400, opacity: .7 }}>Amount</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="doc-c">{i + 1}</td>
                    <td className="left">{r.name}</td>
                    <td className="doc-c">{r.unit}</td>
                    <td className="doc-r">{fmtMoney(r.price)}</td>
                    <td className="doc-c">{fmtMoney(r.qty)}</td>
                    <td className="doc-r">{fmtMoney(rowAmount(r))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="doc-r" style={{ fontSize: 13 }}>НИЙТ ДҮН (TOTAL)</td>
                  <td className="doc-r"><span className="sh-total-val">{fmtMoney(total)}</span> ₮</td>
                </tr>
              </tfoot>
            </table>
            {s.note && <div className="sh-note">{s.note}</div>}
            <div className="sh-footer">
              <div>
                <div className="sh-bank-name">{co.name}</div>
                <div className="sh-bank-row">
                  {(co.bank || co.account) && (
                    <div>
                      {co.bank || "Банк"}: <strong>{co.account}</strong>
                    </div>
                  )}
                  {co.email && <div>Email: {co.email}</div>}
                  {co.phone && <div>Утас: {co.phone}</div>}
                </div>
                {total > 0 && <div className="sh-words">{toWordsMn(total)}</div>}
              </div>
              <StampArea />
            </div>
          </>
        )}
        <div className="sh-bottom-bar" />
      </div>
    </main>
  );
}

function OfficialRows({ rows, min, cells }: { rows: Row[]; min: number; cells: (r: Row | undefined) => React.ReactNode }) {
  const count = Math.max(min, rows.length);
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <tr key={i}>
          <td className="doc-c">{i + 1}</td>
          {cells(rows[i])}
        </tr>
      ))}
    </>
  );
}

function LegalHead({ code }: { code: string }) {
  return (
    <>
      <div className="of-code">НХМаягт {code}</div>
      <div className="of-legal">
        Сангийн сайдын 2017 оны 12 дугаар сарын
        <br />
        5-ны өдрийн 347 тоот тушаалын хавсралт
      </div>
    </>
  );
}

function Bm3({ s, co }: { s: DocState; co: Issuer }) {
  const rows = filledRows(s.rows);
  const total = docTotal(s.rows);
  const [yy, mm, dd] = (s.docDate || "").split("-");
  return (
    <section className="of-sheet">
      <LegalHead code="БМ-3" />
      <div className="of-title">
        ЗАРЛАГЫН БАРИМТ № <span className="of-fill">{s.number}</span>
      </div>
      <div className="of-row of-two">
        <div>
          <div className="of-fill block">{co.name}</div>
          <div className="of-cap">(байгууллагын нэр)</div>
          <div style={{ marginTop: 7 }}>Регистрийн № <span className="of-fill">{co.rd}</span></div>
        </div>
        <div>
          <div className="of-fill block">{s.customerName}</div>
          <div className="of-cap">(худалдан авагчийн нэр)</div>
          <div style={{ marginTop: 7 }}>Регистрийн № <span className="of-fill">{s.custRD}</span></div>
        </div>
      </div>
      <div className="of-row">
        20<span className="of-fill">{yy ? yy.slice(2) : ""}</span> оны <span className="of-fill">{mm}</span> сарын{" "}
        <span className="of-fill">{dd}</span> өдөр
      </div>
      <div className="of-row" style={{ textAlign: "center" }}>
        <span className="of-fill grow">{s.carrier}</span>
        <div className="of-cap">(тээвэрлэгчийн хаяг, албан тушаал, нэр)</div>
      </div>
      <table className="of-table">
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: 26 }}>№</th>
            <th rowSpan={2}>Материалын үнэт зүйлийн нэр, зэрэг, дугаар</th>
            <th rowSpan={2} style={{ width: 44 }}>Код</th>
            <th rowSpan={2} style={{ width: 50 }}>Хэмжих нэгж</th>
            <th rowSpan={2} style={{ width: 42 }}>Тоо</th>
            <th colSpan={2}>Худалдах</th>
          </tr>
          <tr>
            <th style={{ width: 82 }}>Нэгжийн үнэ</th>
            <th style={{ width: 92 }}>Нийт дүн</th>
          </tr>
        </thead>
        <tbody>
          <OfficialRows
            rows={rows}
            min={BM3_MIN_ROWS}
            cells={r =>
              r ? (
                <>
                  <td>{r.name}</td>
                  <td />
                  <td className="doc-c">{r.unit}</td>
                  <td className="doc-c">{fmtMoney(r.qty)}</td>
                  <td className="doc-r">{fmtMoney(r.price)}</td>
                  <td className="doc-r">{fmtMoney(rowAmount(r))}</td>
                </>
              ) : (
                <><td /><td /><td /><td /><td /><td /></>
              )
            }
          />
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} className="doc-r sum">Дүн</td>
            <td className="doc-r sum">{n(total)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="of-signs">
        <div className="of-sign-row">Хүлээлгэн өгсөн эд хариуцагч <span className="of-sign">{s.issuerName}</span></div>
        <div className="of-sign-row">Хүлээн авагч <span className="of-sign">{s.receiverName}</span></div>
        <div className="of-sign-row">Шалгасан нягтлан бодогч <span className="of-sign">{s.accountantName}</span></div>
        <div className="of-stamp-box" />
      </div>
    </section>
  );
}

function Tm1({ s, co }: { s: DocState; co: Issuer }) {
  const rows = filledRows(s.rows);
  const total = docTotal(s.rows);
  // НӨАТ: "none" = маягт дээрх шиг задлахгүй, "incl" = үнэд багтсан 10%-г задална
  const split = s.vatMode === "incl";
  const net = split ? total / 1.1 : total;
  return (
    <section className="of-sheet">
      <LegalHead code="ТМ-1" />
      <div className="of-title">
        НЭХЭМЖЛЭХ № <span className="of-fill">{s.number}</span>
      </div>
      <div className="of-parties">
        <div>
          <div className="of-party-h">Нэхэмжлэгч:</div>
          <div className="of-kv">Байгууллагын нэр:<span className="of-fill">{co.name}</span></div>
          <div className="of-kv">Хаяг:<span className="of-fill">{co.address.replace(/\s*\n\s*/g, ", ")}</span></div>
          <div className="of-kv">Утас, факс:<span className="of-fill">{co.phone}</span></div>
          <div className="of-kv">Э-шуудан:<span className="of-fill">{co.email}</span></div>
          <div className="of-kv">Банкны нэр:<span className="of-fill">{co.bank}</span></div>
          <div className="of-kv">Банкны дансны дугаар:<span className="of-fill">{co.account}</span></div>
          <div className="of-kv">Регистрийн №:<span className="of-fill">{co.rd}</span></div>
        </div>
        <div>
          <div className="of-party-h">Төлөгч:</div>
          <div className="of-kv">Байгууллагын нэр:<span className="of-fill">{s.customerName}</span></div>
          <div className="of-kv">Хаяг:<span className="of-fill">{s.custAddress}</span></div>
          <div className="of-kv">Утас, факс:<span className="of-fill">{s.custPhone}</span></div>
          <div className="of-kv">Э-шуудан:<span className="of-fill">{s.custEmail}</span></div>
          <div className="of-kv">Регистрийн №:<span className="of-fill">{s.custRD}</span></div>
          {s.contractNo && <div className="of-kv">Гэрээний №:<span className="of-fill">{s.contractNo}</span></div>}
          <div className="of-kv">Нэхэмжилсэн огноо:<span className="of-fill">{s.docDate}</span></div>
          <div className="of-kv">Төлбөр хийх хугацаа:<span className="of-fill">{s.payDue}</span></div>
        </div>
      </div>
      <table className="of-table">
        <thead>
          <tr>
            <th style={{ width: 26 }}>№</th>
            <th>Гүйлгээний утга</th>
            <th style={{ width: 66 }}>Тоо хэмжээ</th>
            <th style={{ width: 92 }}>Нэгжийн үнэ</th>
            <th style={{ width: 100 }}>Нийт үнэ</th>
          </tr>
        </thead>
        <tbody>
          <OfficialRows
            rows={rows}
            min={TM1_MIN_ROWS}
            cells={r =>
              r ? (
                <>
                  <td>{r.name}</td>
                  <td className="doc-c">{fmtMoney(r.qty)}</td>
                  <td className="doc-r">{fmtMoney(r.price)}</td>
                  <td className="doc-r">{fmtMoney(rowAmount(r))}</td>
                </>
              ) : (
                <><td /><td /><td /><td /></>
              )
            }
          />
        </tbody>
        <tfoot>
          <tr><td colSpan={4} className="doc-r sum">Дүн</td><td className="doc-r sum">{n(net)}</td></tr>
          <tr><td colSpan={4} className="doc-r sum">НӨАТ</td><td className="doc-r sum">{split ? n(total - net) : ""}</td></tr>
          <tr><td colSpan={4} className="doc-r sum">Нийт дүн</td><td className="doc-r sum">{n(total)}</td></tr>
        </tfoot>
      </table>
      <div className="of-row" style={{ marginTop: 12 }}>
        Мөнгөн дүн <span className="of-sign" style={{ minWidth: "64%" }}>{total ? toWordsMn(total) : ""}</span> болно.
        <div className="of-cap" style={{ textAlign: "left", paddingLeft: 78 }}>(үгээр)</div>
      </div>
      <div className="of-signs">
        <div className="of-sign-row">Дарга <span className="of-sign">{s.director}</span></div>
        <div className="of-sign-row">Хүлээн авсан <span className="of-sign">{s.receiver}</span></div>
        <div className="of-sign-row">Нягтлан бодогч <span className="of-sign">{s.accountant}</span></div>
        <div className="of-stamp-box" />
      </div>
    </section>
  );
}
