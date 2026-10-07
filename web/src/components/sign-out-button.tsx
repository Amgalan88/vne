import { buttonClass } from "./ui";

export function SignOutButton({ onDark = false }: { onDark?: boolean }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={
          onDark
            ? "rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            : buttonClass("light", "px-3 py-1.5")
        }
      >
        Гарах
      </button>
    </form>
  );
}
