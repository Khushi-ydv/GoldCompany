'use strict';

// Gold Card Company backend (prototype mode)
// Plain Node http server that serves the static frontend from /public and
// exposes two API routes for the Enquiry and Feedback forms. This is a
// prototype: submissions are validated and acknowledged, but nothing is
// stored anywhere. No external services, no database, no env vars needed.
// Deployable as-is on Vercel: it detects this server.js entrypoint and
// routes traffic to it directly.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === 'POST' && pathname === '/api/enquiry') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const message = String(body.message || '').trim();

      if (!name || !email || !message) {
        return sendJson(res, 400, { ok: false, error: 'Name, email and message are required.' });
      }
      if (!EMAIL_RE.test(email)) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid email address.' });
      }

      // Prototype: acknowledge only, nothing is stored.
      return sendJson(res, 201, { ok: true });
    }

    if (req.method === 'POST' && pathname === '/api/feedback') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const message = String(body.message || '').trim();

      if (!name || !message) {
        return sendJson(res, 400, { ok: false, error: 'Name and message are required.' });
      }
      if (email && !EMAIL_RE.test(email)) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid email address.' });
      }

      // Prototype: acknowledge only, nothing is stored.
      return sendJson(res, 201, { ok: true });
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
  console.log('Prototype mode: form submissions are validated and confirmed but not stored anywhere.\n');
});
