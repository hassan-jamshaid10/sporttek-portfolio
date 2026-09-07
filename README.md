# SportTek

Public launching-soon site for [sporttek.pk](https://sporttek.pk) — find, book and play.

Next.js 15. Brand marks come from the SportTek venue panel (navy, lime, tennis yellow). The query form uses Hostinger SMTP, the same mailbox as the OctaBit Logics portfolio (`info@octabitlogics.com` as the authenticated sender). Inquiries are addressed to `info@sporttek.pk`.

## Local

```bash
cp .env.example .env
# set SMTP_PASS
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Key | Purpose |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | Hostinger login |
| `SMTP_PASS` | Hostinger password — never commit |
| `MAIL_TO` | Inbox that receives queries (`info@sporttek.pk`) |

Instagram is `@sporttek.pk` in `src/lib/site.ts`. Change that file if the handle is different.

## Scripts

- `npm run dev` — local
- `npm run build` — production bundle
- `npm run start` — serve the build
