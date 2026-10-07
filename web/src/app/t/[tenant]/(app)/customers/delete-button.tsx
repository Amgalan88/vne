"use client";

import { deleteCustomer } from "./actions";

export function DeleteCustomerButton({ tenantId, id, name }: { tenantId: string; id: string; name: string }) {
  return (
    <button
      type="button"
      onClick={() => confirm(`${name}-г жагсаалтаас хасах уу? Өмнөх баримтууд хэвээр үлдэнэ.`) && deleteCustomer(tenantId, id)}
      className="text-xs text-red-600 hover:underline"
    >
      Хасах
    </button>
  );
}
