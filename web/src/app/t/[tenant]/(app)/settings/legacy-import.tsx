"use client";

import { useState, useTransition } from "react";
import { Card, Notice, Select, buttonClass } from "@/components/ui";
import { parseLegacyExport, type ImportDoc } from "@/lib/legacy";
import { importLegacy, type ImportResult } from "./import-actions";

/** Хуучин /umgm/ апп-ын «⬆ Шинэ апп руу» товчоор татсан файлыг оруулна */
export function LegacyImport({ tenantId, issuers }: { tenantId: string; issuers: { id: string; name: string }[] }) {
  const [parsed, setParsed] = useState<{ docs: ImportDoc[]; customers: string[] } | null>(null);
  const [issuerId, setIssuerId] = useState(issuers[0]?.id ?? "");
  const [result, setResult] = useState<ImportResult>({});
  const [pending, start] = useTransition();

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-bold">Хуучин аппаас импортлох</h2>
        <p className="mt-1 text-sm text-slate-500">
          Хуучин апп (hhk.mn/umgm) дээр «⬆ Шинэ апп руу» товч дарж файл татаад энд оруулна. Баримтын түүх, харилцагчид шилжинэ.
        </p>
      </div>
      {result.error && <Notice tone="error">{result.error}</Notice>}
      {result.message && <Notice tone="success">{result.message}</Notice>}
      <label className={buttonClass("light", "cursor-pointer")}>
        Файл сонгох (.json)
        <input
          id="legacy-file"
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={async e => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              setParsed(parseLegacyExport(JSON.parse(await f.text())));
              setResult({});
            } catch (err) {
              setParsed(null);
              setResult({ error: err instanceof Error ? err.message : "Файлыг уншиж чадсангүй." });
            }
          }}
        />
      </label>
      {parsed && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p>
            Олдсон: <b>{parsed.docs.length}</b> баримт, <b>{parsed.customers.length}</b> харилцагч.
          </p>
          {issuers.length > 1 && (
            <Select value={issuerId} onChange={e => setIssuerId(e.target.value)} aria-label="Аль байгууллагын нэрээр">
              {issuers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </Select>
          )}
          <button
            type="button"
            disabled={pending || !issuerId || (!parsed.docs.length && !parsed.customers.length)}
            onClick={() => start(async () => setResult(await importLegacy(tenantId, issuerId, parsed.docs, parsed.customers)))}
            className={buttonClass("primary")}
          >
            {pending ? "Импортлож байна…" : "Импортлох"}
          </button>
        </div>
      )}
    </Card>
  );
}
