import "server-only";

/**
 * Имэйл мэдэгдэл (Resend). RESEND_API_KEY тохируулаагүй бол юу ч илгээхгүй — апп хэвийн ажиллана.
 * Илгээгч домэйн Resend дээр баталгаажсан байх ёстой (MAIL_FROM).
 */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "hhk.mn <noreply@hhk.mn>", to, subject, html }),
    });
  } catch {
    // Мэдэгдэл илгээж чадаагүй нь үндсэн үйлдлийг зогсоохгүй
  }
}
