"use client";

/** Үндсэн layout өөрөө алдаа өгвөл (маш ховор) */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="mn">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24 }}>Алдаа гарлаа</h1>
          <p style={{ color: "#64748b" }}>Хуудсыг дахин ачаалж үзнэ үү.</p>
          <button onClick={reset} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: 0, background: "#1a5bcc", color: "#fff" }}>
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
