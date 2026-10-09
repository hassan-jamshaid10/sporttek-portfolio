# SportTek

Public site for [sporttek.pk](https://sporttek.pk) — marketing landing **plus** player web booking at `/play` (mobile-app parity: OTP login, venues, slots, checkout, bookings, favourites, alerts, profile).

Next.js 15. Brand colours match the Flutter app (`#17354F` navy, `#65AA2B` lime, `#D4E22A` tennis). The query form uses Hostinger SMTP (`info@octabitlogics.com` as sender). Inquiries go to `info@sporttek.pk`.

## Local

```bash
cp .env.example .env
# set SMTP_PASS, SPORTTEK_API_BASE_URL, SESSION_SECRET
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (marketing) and [http://localhost:3000/play](http://localhost:3000/play) (booking).

| Key | Purpose |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | Hostinger login |
| `SMTP_PASS` | Hostinger password — never commit |
| `MAIL_TO` | Inbox that receives queries (`info@sporttek.pk`) |
| `SPORTTEK_API_BASE_URL` | Spring Boot origin (e.g. `https://api.sporttek.pk`) |
| `SESSION_SECRET` | Encrypts the player session cookie (min 16 chars) |
| `SESSION_DAYS` | Session cookie lifetime (default 30) |

Instagram is `@sporttek.pk` in `src/lib/site.ts`.

## Scripts

- `npm run dev` — local
- `npm run build` — production bundle
- `npm run start` — serve the build
