# Gold Card Company website

A real, running site: static frontend plus a small Node backend with working
Enquiry and Feedback forms, storing submissions in Postgres. Deployable as-is
on Vercel (it captures `server.js` directly and routes traffic to it).

## Run it locally

You need a Postgres connection string in `DATABASE_URL`. The easiest source
is the same free Neon database you'll connect to Vercel (see below), copy
its connection string into a local `.env` file:

```
DATABASE_URL=postgres://...
```

Then:

```
node --env-file=.env server.js
```

Then open **http://localhost:3000**. (`npm run dev` does the same but
restarts automatically on file changes.)

## Where submissions go

Every Enquiry/Feedback form submit is saved to Postgres. View them at:

```
http://localhost:3000/admin?key=...
```

Set your own key (required; without it the admin page is disabled):

```
ADMIN_KEY=some-long-secret node --env-file=.env server.js
```

Keep that key private; anyone with the link can read submitted names,
emails and phone numbers.

To change the port locally: `PORT=4000 node --env-file=.env server.js`.

## Project layout

```
server.js        backend: routes, static file serving, admin view
db.js             Postgres setup (Neon's serverless driver, @neondatabase/serverless)
public/
  index.html      the landing page
  styles.css      all styling (palette, layout, forms, modals)
  script.js       opens the Enquiry/Feedback modals and submits them via fetch()
```

## Adding your real images

Drop files into `public/images/` using these exact names. The page already
looks for them, so no code changes needed. Refresh the browser after adding
a file and it swaps in automatically (the placeholder disappears the moment
the matching file is found).

| File to add | Where it appears | Suggested size / format |
|---|---|---|
| `public/images/logo.png` | Header + footer (replaces the "GC" shield) | Square-ish, transparent background, 200x200px+ |
| `public/images/photo-plumbing-gas.png` | Services section | Landscape ~4:3, 1200x900px+ |
| `public/images/photo-cctv-ev.png` | Services section | Landscape ~4:3, 1200x900px+ |
| `public/images/photo-electrician.png` | Specialisms section | Landscape ~4:3, 1200x900px+ |
| `public/images/photo-fire-alarm.png` | Specialisms section | Landscape ~4:3, 1200x900px+ |
| `public/images/cert-1.jpg` | "Gold Card Certified" mark, Specialisms section | Square-ish, 150x150px+ |

Notes:
- Filenames (including the extension) are case-sensitive and must match
  exactly what `public/index.html` references, or the image silently falls
  back to the placeholder. If you swap a file for a different format later,
  update the matching `<img src="...">` in `public/index.html` to the new
  extension.
- The four photo slots crop to fill their frame (`object-fit: cover`), so
  compose the subject roughly centred.

## Deploying to Vercel

1. Push this repo to GitHub (see commands below) if you haven't already.
2. On [vercel.com](https://vercel.com/new), import the GitHub repo. Vercel
   detects `server.js` and deploys it directly, no build step needed.
3. Before (or right after) the first deploy, add a database: in the
   project, open the **Storage** tab, add the free **Neon** (Postgres)
   integration. Vercel sets `DATABASE_URL` for you automatically.
4. Add one more environment variable yourself, under **Settings** >
   **Environment Variables**: `ADMIN_KEY` set to a long random string
   (the `/admin` page is disabled until this is set).
5. Redeploy if the database was added after the first deploy, so the new
   env vars take effect. Submissions view:
   `https://<your-project>.vercel.app/admin?key=<your ADMIN_KEY>`.

Neon's free tier doesn't expire or get deleted, so this setup keeps working
indefinitely at no cost.

```
git init
git add .
git commit -m "Gold Card Company site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Before this goes further

- Consider adding email notifications (e.g. via an SMTP provider or a
  service like Resend) so you don't have to keep checking `/admin`.
- The `/admin` view is protected only by the key in the URL, fine for
  internal use, but swap in real authentication if more than a couple of
  people need access.
