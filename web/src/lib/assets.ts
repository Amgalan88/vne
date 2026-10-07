import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { AssetUrls } from "./asset-types";

/** Баримт дээр гаргах зургууд. null = байхгүй / горим "off". locked = PIN горимтой зураг байгаа ч нээгдээгүй */
export type IssuerAssets = AssetUrls;

type Row = {
  id: string;
  logo_path: string | null;
  stamp_path: string | null;
  signature_path: string | null;
  stamp_mode: "on" | "pin" | "off";
  sig_mode: "on" | "pin" | "off";
};

const HOUR = 3600;

/** Байгууллага бүрийн лого, тамга, гарын үсгийн түр (1 цаг) холбоос. Хаалттай bucket тул signed URL. */
export async function loadIssuerAssets(supabase: SupabaseClient, tenantId: string): Promise<Record<string, IssuerAssets>> {
  const { data } = await supabase
    .from("issuers")
    .select("id, logo_path, stamp_path, signature_path, stamp_mode, sig_mode")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .returns<Row[]>();

  const sign = async (bucket: string, path: string | null) => {
    if (!path) return null;
    const { data: d } = await supabase.storage.from(bucket).createSignedUrl(path, HOUR);
    return d?.signedUrl ?? null;
  };

  const out: Record<string, IssuerAssets> = {};
  await Promise.all(
    (data ?? []).map(async r => {
      const wantsPin = (r.stamp_mode === "pin" && !!r.stamp_path) || (r.sig_mode === "pin" && !!r.signature_path);
      let locked = false;
      if (wantsPin) {
        const { data: st } = await supabase.rpc("stamp_status", { p_issuer: r.id });
        locked = !!st?.has_pin && !st?.unlocked_until;
      }
      const [logo, stamp, signature] = await Promise.all([
        sign("assets", r.logo_path),
        r.stamp_mode === "off" || (r.stamp_mode === "pin" && locked) ? null : sign("stamps", r.stamp_path),
        r.sig_mode === "off" || (r.sig_mode === "pin" && locked) ? null : sign("stamps", r.signature_path),
      ]);
      out[r.id] = { logo, stamp, signature, locked };
    }),
  );
  return out;
}
