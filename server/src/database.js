import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.join(directory, '..', 'data', 'directory.db');
mkdirSync(path.dirname(databasePath), { recursive: true });

let DatabaseSync;
try {
  const mod = await import('node:sqlite');
  DatabaseSync = mod.DatabaseSync;
} catch (e) {
  console.warn('Native node:sqlite is not available. Ensure Node.js >= 22.5.0 is running.');
}

let db = null;

if (DatabaseSync) {
  db = new DatabaseSync(databasePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      avatar_url TEXT
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS trash (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      avatar_url TEXT,
      deleted_at INTEGER NOT NULL
    )
  `);
  db.exec('DELETE FROM trash WHERE (unixepoch() - deleted_at) > 2592000');

  const employees = [
    ['Pushpa Raj', 'AI Strategist', 'Tollywood', 'pushpa@lluvia.in', '+91 98765 10201', '/pushpa-raj.jpg'],
    ['Rocky Bhai', 'Growth Architect', 'Sandalwood', 'rocky@lluvia.in', '+91 98765 10202', '/rocky-bhai.jpg'],
    ['Kabir Singh', 'Experience Director', 'Bollywood', 'kabir@lluvia.in', '+91 98765 10203', '/kabir-singh.jpg'],
    ['Vikram Vedha', 'Security Intelligence Lead', 'Kollywood', 'vikram@lluvia.in', '+91 98765 10204', '/vikram-vedha.jpg'],
    ['Georgekutty', 'Risk & Insights Analyst', 'Mollywood', 'george@lluvia.in', '+91 98765 10205', '/georgekutty.jpg'],
    ['Arjun Reddy', 'Product Visionary', 'Tollywood', 'arjun@lluvia.in', '+91 98765 10206', '/arjun-reddy.jpg'],
    ['Bajirao Singham', 'Operations Commander', 'Bollywood', 'singham@lluvia.in', '+91 98765 10207', '/bajirao-singham.jpg'],
    ['Karthik Subramaniam', 'Data Storyteller', 'Kollywood', 'karthik@lluvia.in', '+91 98765 10208', '/karthik-subramaniam.jpg'],
    ['Bheeshma Iyer', 'Creative Technologist', 'Sandalwood', 'bheeshma@lluvia.in', '+91 98765 10209', '/bheeshma-iyer.jpg'],
    ['Aadhi Menon', 'Culture & Community Lead', 'Mollywood', 'aadhi@lluvia.in', '+91 98765 10210', '/aadhi-menon.jpg']
  ];

  const seed = db.prepare(`
    INSERT INTO employees (name, role, department, email, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const existing = db.prepare('SELECT name FROM employees ORDER BY id LIMIT 1').get();
  if (existing?.name === 'Maya Patel') {
    db.exec('DELETE FROM employees;');
  }

  if (db.prepare('SELECT COUNT(*) AS count FROM employees').get().count === 0) {
    db.exec('BEGIN');
    try {
      employees.forEach((employee) => seed.run(...employee));
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

export default db;
