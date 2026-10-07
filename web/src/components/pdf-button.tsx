"use client";

import { useState } from "react";
import { buttonClass, Spinner, type ButtonVariant } from "@/components/ui";
import { downloadSheetPdf } from "@/lib/pdf";

/** «⬇ PDF татах» — targetId бүхий элемент доторх баримтыг PDF болгоно */
export function PdfButton({
  targetId,
  filename,
  variant = "primary",
  className = "",
  onDone,
}: {
  targetId: string;
  filename: string;
  variant?: ButtonVariant;
  className?: string;
  /** PDF амжилттай татагдсаны дараа */
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          const el = document.getElementById(targetId);
          if (!el) return;
          setBusy(true);
          setErr("");
          try {
            await downloadSheetPdf(el, filename);
            onDone?.();
          } catch (e) {
            setErr(e instanceof Error ? e.message : "PDF үүсгэж чадсангүй");
          } finally {
            setBusy(false);
          }
        }}
        className={buttonClass(variant, className)}
      >
        {busy ? <><Spinner /> PDF бэлдэж байна…</> : "⬇ PDF татах"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </>
  );
}
