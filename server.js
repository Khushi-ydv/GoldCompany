'use strict';

// Gold Card Company backend
// Plain Node http server that serves the static frontend from /public and
// exposes two API routes for the Enquiry and Feedback forms, backed by a
// Postgres database (db.js). Deployable as-is on Vercel: it detects this
// server.js entrypoint and routes traffic to it directly.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const db = require('./db');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
// On Vercel, different instances could otherwise generate different random
// keys, so ADMIN_KEY must be set explicitly there. Locally, a random one
// generated at startup is a fine convenience.
const ADMIN_KEY = process.env.ADMIN_KEY || (process.env.VERCEL ? null : crypto.randomBytes(9).toString('hex'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readJsonBody(req, limitBytes = 1e6) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function serveStatic(req, res, pathname) {
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendHtml(res, 403, 'Forbidden');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return sendHtml(res, 404, '<h1>404 Not Found</h1><p><a href="/">Back home</a></p>');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function renderAdminPage() {
  const enquiries = await db.getEnquiries();
  const feedback = await db.getFeedback();

  const enquiryRows = enquiries.map((e) => `
    <tr>
      <td>${escapeHtml(new Date(e.created_at).toLocaleString('en-GB'))}</td>
      <td>${escapeHtml(e.name)}</td>
      <td><a href="mailto:${escapeHtml(e.email)}">${escapeHtml(e.email)}</a></td>
      <td>${escapeHtml(e.phone)}</td>
      <td>${escapeHtml(e.property_type)}</td>
      <td>${escapeHtml(e.service)}</td>
      <td>${escapeHtml(e.message)}</td>
    </tr>`).join('') || '<tr><td colspan="7" class="empty">No enquiries yet.</td></tr>';

  const feedbackRows = feedback.map((f) => `
    <tr>
      <td>${escapeHtml(new Date(f.created_at).toLocaleString('en-GB'))}</td>
      <td>${escapeHtml(f.name)}</td>
      <td>${escapeHtml(f.email)}</td>
      <td>${f.rating ? '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating) : 'n/a'}</td>
      <td>${escapeHtml(f.message)}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="empty">No feedback yet.</td></tr>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Gold Card Company Admin</title>
<style>
  body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#151412;color:#f4efe6;margin:0;padding:40px;}
  h1{font-size:22px;margin-bottom:4px;}
  h2{font-size:16px;color:#d9b25c;margin:36px 0 12px;text-transform:uppercase;letter-spacing:.08em;}
  table{width:100%;border-collapse:collapse;font-size:13.5px;background:#1d1b18;}
  th,td{padding:10px 12px;border-bottom:1px solid #322f2a;text-align:left;vertical-align:top;}
  th{color:#d9b25c;font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;}
  a{color:#d9b25c;}
  .empty{color:#8a8579;font-style:italic;}
  .count{color:#8a8579;font-size:13px;}
  .wrap-table{overflow-x:auto;}
</style>
</head>
<body>
  <h1>Gold Card Company Submissions</h1>
  <p class="count">${enquiries.length} enquir${enquiries.length === 1 ? 'y' : 'ies'} &middot; ${feedback.length} feedback ${feedback.length === 1 ? 'entry' : 'entries'}</p>

  <h2>Enquiries</h2>
  <div class="wrap-table">
    <table>
      <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Property</th><th>Service</th><th>Message</th></tr></thead>
      <tbody>${enquiryRows}</tbody>
    </table>
  </div>

  <h2>Feedback</h2>
  <div class="wrap-table">
    <table>
      <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Rating</th><th>Message</th></tr></thead>
      <tbody>${feedbackRows}</tbody>
    </table>
  </div>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === 'POST' && pathname === '/api/enquiry') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const phone = String(body.phone || '').trim();
      const propertyType = String(body.propertyType || '').trim();
      const service = String(body.service || '').trim();
      const message = String(body.message || '').trim();

      if (!name || !email || !message) {
        return sendJson(res, 400, { ok: false, error: 'Name, email and message are required.' });
      }
      if (!EMAIL_RE.test(email)) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid email address.' });
      }

      const result = await db.addEnquiry({ name, email, phone, propertyType, service, message });
      return sendJson(res, 201, { ok: true, id: result.id });
    }

    if (req.method === 'POST' && pathname === '/api/feedback') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const message = String(body.message || '').trim();
      let rating = Number.parseInt(body.rating, 10);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) rating = null;

      if (!name || !message) {
        return sendJson(res, 400, { ok: false, error: 'Name and message are required.' });
      }
      if (email && !EMAIL_RE.test(email)) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid email address.' });
      }

      const result = await db.addFeedback({ name, email, rating, message });
      return sendJson(res, 201, { ok: true, id: result.id });
    }

    if (req.method === 'GET' && pathname === '/admin') {
      if (!ADMIN_KEY) {
        return sendHtml(res, 500, '<h1>500 Not Configured</h1><p>Set an <code>ADMIN_KEY</code> environment variable to enable this page.</p>');
      }
      if (url.searchParams.get('key') !== ADMIN_KEY) {
        return sendHtml(res, 401, '<h1>401 Unauthorized</h1><p>Missing or incorrect <code>?key=</code>.</p>');
      }
      return sendHtml(res, 200, await renderAdminPage());
    }

    if (req.method === 'GET') {
      return serveStatic(req, res, pathname);
    }

    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (err) {
    return sendJson(res, 400, { ok: false, error: err.message || 'Bad request' });
  }
});

server.listen(PORT, () => {
  console.log(`\nGold Card Company site running at:  http://localhost:${PORT}`);
  if (ADMIN_KEY) {
    console.log(`Admin (submissions) view:            http://localhost:${PORT}/admin?key=${ADMIN_KEY}\n`);
    if (!process.env.ADMIN_KEY) {
      console.log('Tip: set ADMIN_KEY in your environment to keep this link stable across restarts.\n');
    }
  } else {
    console.log('Admin view disabled: set an ADMIN_KEY environment variable to enable it.\n');
  }
});
