# Byteflow Admin and CMS

This Next.js 16 application contains the protected Byteflow content-management panel at `/admin` and uses the existing Turso/libSQL database. It manages pages and SEO, menus, reusable page sections, services, FAQs, testimonials, CTAs, team members, projects, blog posts, global settings, forms, enquiries, and media.

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the values.
3. Generate `ADMIN_PASSWORD_SHA256` from the intended administrator password (for example, `node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" "your password"`).
4. Run `npm run db:migrate` and then `npm run db:seed`.
5. Run `npm run dev` and open `http://localhost:3000/admin`.

Never commit `.env.local`. Change the admin password hash and session secret independently. Admin sessions are signed, HTTP-only, same-site cookies with a 12-hour lifetime; all API mutations revalidate the session.

## Database and seeding

`scripts/cms-schema.sql` defines the relational CMS schema. `scripts/migrate-cms.mjs` creates tables and safely upgrades the existing posts, services, and projects tables. `scripts/seed-cms.mjs` copies the current Byteflow page names, navigation, services, homepage hero, contact details, FAQs, and contact-form messages into empty CMS tables without replacing existing records.

Run migrations before deploying either application:

```text
npm run db:migrate
npm run db:seed
```

## Media

Uploads accept JPG, PNG, WebP, and GIF files up to 5 MB, require alt text, and are saved to `public/uploads`. Deploy on persistent shared storage when the public and admin apps run as separate processes. For serverless or separately hosted deployments, replace this adapter with the project’s persistent object-storage provider while keeping the stored `media.url` values publicly accessible.

## Contact email

Submissions are always validated and stored in `contact_submissions`. Configure `RESEND_API_KEY` and a verified `CONTACT_FROM_EMAIL` in the public website deployment to also send email to the recipient selected in Contact Forms. Secrets remain environment-only; recipients, subjects, reply-to behavior, and user-facing messages are CMS-managed.

## Production

Run `npm run typecheck`, `npm run lint`, and `npm run build`. Deploy with the same Turso credentials used by the public website, set a unique production session secret, use HTTPS, and ensure the upload directory is persistent. Apply migrations before routing production traffic.
