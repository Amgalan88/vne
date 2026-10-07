import Link from "next/link";
import { PRO_PRICE } from "@/lib/billing";
import { fmtMoney } from "@/lib/format";

/** Үнэгүй багцад байхгүй боломжийн оронд харуулна */
export function UpgradeNotice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
      <p className="font-semibold text-indigo-950">🔒 {title}</p>
      {children && <p className="mt-1 text-sm text-indigo-900/70">{children}</p>}
      <Link
        href="/billing"
        className="mt-3 inline-flex rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Төлбөртэй багц — {fmtMoney(PRO_PRICE)}₮/сар
      </Link>
    </div>
  );
}
