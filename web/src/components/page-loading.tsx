import { Spinner } from "./ui";

/** Хуудас шилжих үед (сервер өгөгдөл ачаалах хооронд) харагдана */
export function PageLoading() {
  return (
    <div role="status" className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-7 w-7 text-brand" />
      <p className="text-sm font-medium">Ачаалж байна…</p>
    </div>
  );
}
