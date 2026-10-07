# hhk.mn — веб апп

Олон компани ашиглах хувилбар: Next.js 16 (App Router) + TypeScript + Tailwind + Supabase.
Компани бүр өөрийн дэд домэйнтэй (`umgm.hhk.mn`). Өгөгдлийн сангийн бүтэц: [`../supabase/schema.sql`](../supabase/schema.sql).

## Ажиллуулах

```bash
cd web
npm install
# .env.local дотор NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY-г бөглөнө (.env.example-г үз)
npm run dev
```

- Үндсэн домэйн: http://localhost:3000
- Компанийн хэсэг: http://umgm.localhost:3000 (Chrome, Edge, Firefox `*.localhost`-г автоматаар таньдаг)

Хөгжүүлэлтийн үед нэвтрэлтийн cookie дэд домэйн бүрт тусдаа байдаг (хөтчүүд `localhost`-д domain cookie зөвшөөрдөггүй).
Production-д `.hhk.mn` дээр тавигддаг тул нэг удаа нэвтрээд бүх дэд домэйнд ажиллана.

## Бүтэц

```
src/
├─ proxy.ts                  дэд домэйн → /t/[tenant] rewrite, session шинэчлэх
├─ app/
│  ├─ page.tsx               hhk.mn: танилцуулга / миний компаниуд
│  ├─ new/                   компани нээх (дэд домэйн сонгох)
│  ├─ (auth)/                login, signup, forgot-password, reset-password
│  ├─ auth/confirm/          имэйлийн холбоос хүлээж авах
│  ├─ auth/signout/          гарах (POST)
│  └─ t/[tenant]/            компанийн хэсэг: баримтууд, гишүүд, аудит лог
├─ components/               UI
└─ lib/
   ├─ supabase/server.ts     Supabase client (хүсэлт бүрд шинээр)
   ├─ tenant.ts              компани + эрх шалгах
   ├─ hosts.ts               домэйн, дэд домэйн, cookie domain
   └─ audit.ts               аудит логийг уншигдахуйц болгох
```

Эрхийн бүх шалгалт Postgres дотор (RLS + функцууд) хийгддэг. Апп талд байгаа шалгалтууд зөвхөн
товч харуулах/нуухад зориулагдсан — тэдгээрийг алгасаад ч өгөгдөлд хүрэх боломжгүй.

## Supabase тохиргоо

**Authentication → Sign In / Providers → Email:** Email идэвхтэй, **Confirm email идэвхтэй**, Minimum password length 8.

**Authentication → URL Configuration:**
- Site URL: `https://hhk.mn`
- Redirect URLs: `https://hhk.mn/**`, `https://*.hhk.mn/**`, `http://localhost:3000/**`, `http://*.localhost:3000/**`

**Authentication → Emails → SMTP:** өөрийн SMTP (жишээ нь Resend) — Supabase-ийн анхны илгээгч зөвхөн багийн гишүүд рүү илгээдэг.

**Authentication → Emails → Templates** — холбоосыг доорх хэлбэрээр солино. Ингэснээр имэйлийг өөр төхөөрөмж дээр нээсэн ч ажиллана.

*Confirm signup* — Subject: `hhk.mn — имэйлээ баталгаажуулна уу`
```html
<h2>Тавтай морил!</h2>
<p>hhk.mn-д бүртгүүлсэнд баярлалаа. Доорх товч дээр дарж имэйлээ баталгаажуулна уу.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Имэйл баталгаажуулах</a></p>
<p>Хэрэв та бүртгүүлээгүй бол энэ захидлыг үл тоомсорлоно уу.</p>
```

*Reset password* — Subject: `hhk.mn — нууц үг сэргээх`
```html
<h2>Нууц үг сэргээх</h2>
<p>Шинэ нууц үг тохируулахын тулд доорх товч дээр дарна уу. Холбоос 1 цагийн дотор хүчинтэй.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Шинэ нууц үг тохируулах</a></p>
<p>Хэрэв та хүсэлт илгээгээгүй бол энэ захидлыг үл тоомсорлоно уу — таны нууц үг өөрчлөгдөхгүй.</p>
```

## Production (Vercel)

1. GitHub repo-г Vercel-д холбож, **Root Directory = `web`** гэж тохируулна.
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_ROOT_DOMAIN=hhk.mn`.
3. Domains: `hhk.mn` болон `*.hhk.mn` нэмнэ. Wildcard домэйн ажиллахын тулд hhk.mn-ийн nameserver-ийг
   `ns1.vercel-dns.com`, `ns2.vercel-dns.com` болгоно (домэйн худалдаж авсан газрын панелаас).
4. Арилжааны хэрэглээнд Vercel Pro шаардлагатай (Hobby багц арилжааны бус).
