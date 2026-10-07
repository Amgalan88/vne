import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "../forms";

export const metadata: Metadata = { title: "Нууц үг сэргээх" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-extrabold tracking-tight">Нууц үг сэргээх</h1>
      <p className="mb-4 text-sm text-slate-500">Бүртгэлтэй имэйлээ оруулбал шинэ нууц үг тохируулах холбоос илгээнэ.</p>
      <ForgotForm />
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-slate-500 underline">
          ← Нэвтрэх рүү буцах
        </Link>
      </p>
    </>
  );
}
