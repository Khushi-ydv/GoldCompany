'use strict';

// Storage layer, uses Neon's serverless Postgres driver over HTTP so it
// works from Vercel Functions (no persistent local disk there, unlike a
// normal server). Needs a DATABASE_URL env var pointing at a Postgres
// database — on Vercel, add the free Neon integration from the project's
// Storage tab and it sets this automatically.

const { neon } = require('@neondatabase/serverless');

// Connecting lazily (only on the first real query, not at require time)
// means the rest of the site still loads even before DATABASE_URL is set,
// instead of crashing the whole process on startup.
let sql = null;
function getClient() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it in your hosting provider (or a local .env file).');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

// Table creation is idempotent (IF NOT EXISTS) and only actually runs once
// per warm instance, the promise is memoized so later calls just await it.
let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getClient();
      await sql`
        CREATE TABLE IF NOT EXISTS enquiries (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          property_type TEXT,
          service TEXT,
          message TEXT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          name TEXT NOT NULL,
          email TEXT,
          rating INTEGER,
          message TEXT NOT NULL
        )
      `;
    })();
  }
  return schemaReady;
}

module.exports = {
  async addEnquiry({ name, email, phone, propertyType, service, message }) {
    await ensureSchema();
    const sql = getClient();
    const rows = await sql`
      INSERT INTO enquiries (name, email, phone, property_type, service, message)
      VALUES (${name}, ${email}, ${phone || null}, ${propertyType || null}, ${service || null}, ${message || null})
      RETURNING id, created_at
    `;
    return { id: rows[0].id, createdAt: rows[0].created_at };
  },
  async addFeedback({ name, email, rating, message }) {
    await ensureSchema();
    const sql = getClient();
    const rows = await sql`
      INSERT INTO feedback (name, email, rating, message)
      VALUES (${name}, ${email || null}, ${rating ?? null}, ${message})
      RETURNING id, created_at
    `;
    return { id: rows[0].id, createdAt: rows[0].created_at };
  },
  async getEnquiries() {
    await ensureSchema();
    const sql = getClient();
    return sql`SELECT * FROM enquiries ORDER BY id DESC`;
  },
  async getFeedback() {
    await ensureSchema();
    const sql = getClient();
    return sql`SELECT * FROM feedback ORDER BY id DESC`;
  },
};
