"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, Spinner, type ButtonVariant } from "./ui";

export function SubmitButton({
  children,
  pendingText = "Түр хүлээнэ үү…",
  variant = "dark",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, className)}>
      {pending ? <><Spinner /> {pendingText}</> : children}
    </button>
  );
}
