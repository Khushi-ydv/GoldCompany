# Gold Card Company website

A real, running site: static frontend plus a small Node backend with working
Enquiry and Feedback forms, storing submissions in a local SQLite database.
No external services, npm packages, or accounts required.

## Run it

```
node server.js
```

Then open **http://localhost:3000**.

(Optional: `npm run dev` restarts automatically on file changes.)

## Where submissions go

Every Enquiry/Feedback form submit is saved to `data/goldcard.db` (created
automatically on first run). View them at:

```
http://localhost:3000/admin?key=...
```

The exact link, including the key, is printed to the terminal when the
server starts. Keep that key private; anyone with the link can read
submitted names, emails and phone numbers. To use a link that doesn't
change every restart, set your own key:

```
ADMIN_KEY=some-long-secret node server.js
```

To change the port: `PORT=4000 node server.js`.

## Project layout

```
server.js        backend: routes, static file serving, admin view
db.js             SQLite setup (Node's built-in node:sqlite, nothing to install)
public/
  index.html      the landing page
  styles.css      all styling (palette, layout, forms, modals)
  script.js       opens the Enquiry/Feedback modals and submits them via fetch()
data/
  goldcard.db     created automatically, not committed to git
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

## Before this goes on the public internet

This is set up for local use or a private demo. Before deploying it live:

- Put it behind HTTPS (a plain host like Render, Railway, Fly.io, or a VPS
  with a reverse proxy all work fine with this as is).
- Consider adding email notifications (e.g. via an SMTP provider or a
  service like Resend) so you don't have to keep checking `/admin`.
- The `/admin` view is protected only by the key in the URL, fine for
  internal use, but swap in real authentication if more than a couple of
  people need access.

## Deploying to Render (free tier)

This repo includes a `render.yaml` blueprint, so Render can set the whole
service up automatically.

1. Push this folder to a GitHub repo (see commands below).
2. On [render.com](https://dashboard.render.com), click **New +** &gt;
   **Blueprint**, connect your GitHub account if you haven't already, and
   pick this repo. Render reads `render.yaml` and creates the web service
   for you, on the free plan, with an `ADMIN_KEY` generated automatically.
3. Once it's live, open your Render service, go to the **Environment** tab
   to copy the generated `ADMIN_KEY`, and use it at
   `https://<your-service>.onrender.com/admin?key=...`.

Free-tier trade-offs to know about:
- The service spins down after 15 minutes with no traffic, and takes about
  a minute to wake back up on the next visit.
- The filesystem is ephemeral: every restart, spin-down, or redeploy wipes
  `data/goldcard.db`, so form submissions do not persist long-term. Read
  the `/admin` page regularly (or export what you need) if this matters to
  you before it resets. Upgrading to a paid Render plan with a persistent
  disk (a couple of lines in `render.yaml`) removes both limitations
  whenever you're ready.

```
git init
git add .
git commit -m "Gold Card Company site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
