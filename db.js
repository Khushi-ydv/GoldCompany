'use strict';

// Storage layer, uses Node's built-in SQLite (node:sqlite), so there is
// nothing to install: the database file is created automatically on first
// run at data/goldcard.db.

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'goldcard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    property_type TEXT,
    service TEXT,
    message TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    rating INTEGER,
    message TEXT NOT NULL
  )
`);

const insertEnquiry = db.prepare(`
  INSERT INTO enquiries (created_at, name, email, phone, property_type, service, message)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertFeedback = db.prepare(`
  INSERT INTO feedback (created_at, name, email, rating, message)
  VALUES (?, ?, ?, ?, ?)
`);

const listEnquiries = db.prepare(`SELECT * FROM enquiries ORDER BY id DESC`);
const listFeedback = db.prepare(`SELECT * FROM feedback ORDER BY id DESC`);

module.exports = {
  addEnquiry({ name, email, phone, propertyType, service, message }) {
    const createdAt = new Date().toISOString();
    const info = insertEnquiry.run(
      createdAt, name, email, phone || null, propertyType || null, service || null, message || null
    );
    return { id: Number(info.lastInsertRowid), createdAt };
  },
  addFeedback({ name, email, rating, message }) {
    const createdAt = new Date().toISOString();
    const info = insertFeedback.run(createdAt, name, email || null, rating ?? null, message);
    return { id: Number(info.lastInsertRowid), createdAt };
  },
  getEnquiries() {
    return listEnquiries.all();
  },
  getFeedback() {
    return listFeedback.all();
  },
};
