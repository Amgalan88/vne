"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Input, Select } from "@/components/ui";
import { fmtDate, fmtMoney } from "@/lib/format";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, type DocStatus, type DocType } from "@/lib/types";

export type DocListRow = {
  id: string;
  doc_type: DocType;
  number: string;
  doc_date: string;
  customer_name: string;
  total: number;
  status: DocStatus;
};

const STATUS_STYLE: Record<DocStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  issued: "bg-sky-100 text-sky-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

/** Дугаар, харилцагчаар хайх; төрөл, төлвөөр шүүх */
export function DocList({ docs }: { docs: DocListRow[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = docs.filter(
    d =>
      (!type || d.doc_type === type) &&
      (!status || d.status === status) &&
      (!needle || d.number.toLowerCase().includes(needle) || d.customer_name.toLowerCase().includes(needle)),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id="doc-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Дугаар эсвэл харилцагчаар хайх" className="flex-1" />
        <Select value={type} onChange={e => setType(e.target.value)} className="sm:w-44" aria-label="Төрөл">
          <option value="">Бүх төрөл</option>
          {(Object.keys(DOC_TYPE_LABEL) as DocType[]).map(t => <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>)}
        </Select>
        <Select value={status} onChange={e => setStatus(e.target.value)} className="sm:w-40" aria-label="Төлөв">
          <option value="">Бүх төлөв</option>
          {(Object.keys(DOC_STATUS_LABEL) as DocStatus[]).map(k => <option key={k} value={k}>{DOC_STATUS_LABEL[k]}</option>)}
        </Select>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">Хайлтад тохирох баримт олдсонгүй.</p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Огноо</th>
                <th className="px-4 py-3">Төрөл</th>
                <th className="px-4 py-3">Дугаар</th>
                <th className="px-4 py-3">Харилцагч</th>
                <th className="px-4 py-3 text-right">Дүн</th>
                <th className="px-4 py-3">Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(d => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3"><Link href={`/documents/${d.id}`} className="block">{fmtDate(d.doc_date)}</Link></td>
                  <td className="px-4 py-3"><Link href={`/documents/${d.id}`} className="block">{DOC_TYPE_LABEL[d.doc_type]}</Link></td>
                  <td className="px-4 py-3 font-mono"><Link href={`/documents/${d.id}`} className="block font-semibold text-indigo-600">{d.number}</Link></td>
                  <td className="px-4 py-3">{d.customer_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{d.doc_type === "letter" ? "—" : `${fmtMoney(d.total)} ₮`}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[d.status]}`}>{DOC_STATUS_LABEL[d.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
