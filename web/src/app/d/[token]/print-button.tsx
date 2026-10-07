"use client";

import { buttonClass } from "@/components/ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("light", "px-3")} aria-label="Хэвлэх">
      🖨 Хэвлэх
    </button>
  );
}
