# hhk.mn — ажиллуулах энгийн заавар

Систем гурван хэсгээс бүрдэнэ. Кодыг та өөрөө ажиллуулах шаардлагагүй — GitHub-д хадгалагдаж, Vercel өөрөө сайт болгоно.

| Хэсэг | Юу хийдэг | Хаана |
|---|---|---|
| **GitHub** (`Amgalan88/vne`) | Кодыг хадгална | github.com |
| **Vercel** | Кодыг сайт болгож `hhk.mn` дээр ажиллуулна | vercel.com |
| **Supabase** | Өгөгдөл, нэвтрэлт, зураг хадгална | supabase.com |

`main` branch руу код орох бүрт Vercel автоматаар шинэчилнэ. Та юу ч дарах шаардлагагүй.

## Нэг удаа хийх тохиргоо

### 1. Supabase: хүснэгтүүд үүсгэх
Supabase → **SQL Editor** → New query. Дараах файлуудыг GitHub-аас нээж (Raw), бүгдийг хуулаад paste хийж **Run** дарна. **Дарааллаар**:
1. `supabase/schema.sql`
2. `supabase/002_billing.sql`
3. `supabase/003_sites.sql`
4. `supabase/004_payments.sql`
5. `supabase/005_admin_overview.sql`

(Нэг файлыг хоёр удаа Run хийвэл "already exists" алдаа гарна. Тэр тохиолдолд дараагийнх руу шилж.)

### 2. Supabase: нэвтрэлтийн тохиргоо
**Authentication** хэсэгт:
- **Sign In / Providers → Email**: Email идэвхтэй, Confirm email идэвхтэй.
- **URL Configuration**: Site URL = `https://hhk.mn`. Redirect URLs-д `https://hhk.mn/**` болон `https://*.hhk.mn/**` нэмнэ.
- **Emails → SMTP**: өөрийн имэйл илгээгч (жишээ нь Resend). Үгүй бол имэйл бусдад очихгүй.
- **Emails → Templates → Magic link**: доорхыг оруулна (админы нэвтрэх код ирнэ):
  ```html
  <h2>Нэвтрэх код</h2>
  <p>Нэг удаагийн код: <b>{{ .Token }}</b></p>
  ```

### 3. Vercel: хувьсагчид
Vercel → төсөл → **Settings → Environment Variables**:

| Нэр | Утга | Заавал уу |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Тийм |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API Keys → Publishable key | Тийм |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `hhk.mn` | Тийм |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → **Secret key** | Ажилтанд түр нууц үг өгөхөд |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Push мэдэгдлийн түлхүүр (доорх хэсгийг үз) | Push мэдэгдэлд (заавал биш) |
| `RESEND_API_KEY`, `MAIL_FROM` | resend.com түлхүүр | Имэйл мэдэгдэлд (заавал биш) |

Хувьсагч нэмсэн бүрдээ **Deployments → Redeploy** хийнэ. Secret key-г хэнд ч бүү өг.

### 3.1. Push мэдэгдэл (заавал биш)
Утас, компьютерт мэдэгдэл ирэх: төлбөрийн хүсэлт ирэхэд админд, баталгаажихад хэрэглэгчид.
1. Supabase SQL Editor дээр `supabase/006_push.sql`-ийг Run.
2. Vercel-д `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` нэмнэ (түлхүүрийг Claude-ээс авсан эсвэл `npx web-push generate-vapid-keys`-ээр үүсгэсэн). `SUPABASE_SERVICE_ROLE_KEY` мөн хэрэгтэй. Redeploy.
3. Хэрэглэгч бүр өөрийн төхөөрөмж дээр **🔔 Мэдэгдэл асаах** дарж зөвшөөрнө. Android/Chrome дээр **📲 Апп болгон суулгах**, iPhone дээр Хуваалцах → «Нүүр дэлгэцэнд нэмэх» хийж суулгана (iPhone дээр суулгасан апп-аас л мэдэгдэл ирнэ).
4. Админ `hhk.mn/admin/dashboard` дээр өөрөө мэдэгдлээ асаана.

### 4. Vercel: домэйн
**Settings → Domains** дээр `hhk.mn` болон `*.hhk.mn` нэмнэ. `*.hhk.mn` ажиллахын тулд домэйны nameserver-ийг Vercel-ийнх (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) болгоно.

## Зөв ажиллаж байгааг шалгах

**`https://hhk.mn/setup`** хуудсыг нээнэ. Тохиргоо бүрийн хажууд ✓ эсвэл ✗ гарна, ✗ бол яг юу хийхийг бичсэн байна. Бүгд ✓ болтол засна.

## Өдөр тутмын ажил

- **Төлбөр баталгаажуулах:** `hhk.mn/admin/dashboard` → имэйл бичиж ирсэн кодоор нэвтэрнэ → хүсэлтийг банкны хуулгатай тулгаад **Баталгаажуулах**.
- **Шинэ хэрэглэгч:** `hhk.mn/signup` дээр компанийн хаяг сонгож бүртгүүлнэ → имэйлээ баталгаажуулна → `хаяг.hhk.mn` бэлэн.
- **Ажилтан урих:** компанийн **Гишүүд** хуудас → имэйл, эрх, түр нууц үг → Урих.

## Алдаа гарвал
1. `hhk.mn/setup` дээр ✗ байгаа эсэхийг харна.
2. Vercel → **Deployments** дээр сүүлийн deploy **Ready** эсэхийг харна. **Error** бол дээр дарж log-ийг хуулна.
3. Supabase → **Logs** хэсгээс алдааг хайна.
