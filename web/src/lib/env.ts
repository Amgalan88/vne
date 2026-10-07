// NEXT_PUBLIC_* утгуудыг build хийх үед кодонд шууд оруулдаг тул process.env.X гэж бүтнээр нь бичих ёстой
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} тохируулаагүй байна — web/.env.local файлыг шалгана уу`);
  return value;
}

export const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
