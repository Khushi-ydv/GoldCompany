# Gold Card Company website [ On Hold ] 

A prototype: static frontend plus a small Node backend with working
Enquiry and Feedback forms. Submissions are validated and confirmed in the
UI, but nothing is stored (no database, no external services, nothing to
configure). Deployable as-is on Vercel (it captures `server.js` directly
and routes traffic to it) or run locally with zero setup.

## Run it locally

```
node server.js
```

Then open **http://localhost:3000**. (`npm run dev` does the same but
restarts automatically on file changes.)

To change the port: `PORT=4000 node server.js`.

## Project layout

```
server.js        backend: static file serving + the two form routes
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

1. Push this repo to GitHub if you haven't already.
2. On [vercel.com/new](https://vercel.com/new), import the GitHub repo.
   Vercel detects `server.js` and deploys it directly, no config, no
   environment variables, no database to connect.

That's it, it's live at `https://<your-project>.vercel.app`.

## Turning this into a real backend later

Right now `/api/enquiry` and `/api/feedback` in `server.js` just validate
the input and return success, nothing is saved. When you're ready to
actually collect submissions, the two options are:

- **Store them**: add a database (e.g. Postgres) and insert a row in each
  route instead of just returning `{ ok: true }`.
- **Email them**: call an email API (e.g. Resend, SendGrid) from each route
  so submissions land in an inbox instead.

Either way it's a small, contained change, just those two route handlers.
