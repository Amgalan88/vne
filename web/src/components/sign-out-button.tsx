import { buttonClass } from "./ui";

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={buttonClass("light", "px-3 py-1.5")}>
        Гарах
      </button>
    </form>
  );
}
