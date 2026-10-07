import { DocumentSheet } from "@/components/sheets";
import { DOC_TYPE_LABEL, type DocType } from "@/lib/types";
import { SAMPLE_ASSETS, SAMPLE_DOCS, SAMPLE_ISSUER } from "./sample-docs";

/** Жинхэнэ баримтын загварыг жижигрүүлж харуулна (хулганаар дарах боломжгүй зураг) */
export function SampleSheet({ type, zoom, className = "" }: { type: DocType; zoom: string; className?: string }) {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-label={`${DOC_TYPE_LABEL[type]} — жишээ`} role="img">
      <div className={zoom}>
        <DocumentSheet s={SAMPLE_DOCS[type]} issuer={SAMPLE_ISSUER} assets={SAMPLE_ASSETS} />
      </div>
    </div>
  );
}
