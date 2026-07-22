import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import db from './database.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* ── Prepared statements ─────────────────────────────────────── */
const listEmployees = db.prepare(`
  SELECT id, name, role, department, email, phone, avatar_url
  FROM employees
  WHERE name LIKE ? COLLATE NOCASE OR department LIKE ? COLLATE NOCASE
  ORDER BY name
`);
const employeeById = db.prepare(`
  SELECT id, name, role, department, email, phone, avatar_url
  FROM employees WHERE id = ?
`);
const trashById = db.prepare(`SELECT * FROM trash WHERE id = ?`);
const listTrash = db.prepare(`
  SELECT *, (2592000 - (unixepoch() - deleted_at)) AS seconds_remaining
  FROM trash ORDER BY deleted_at DESC
`);

/* ── Employees ───────────────────────────────────────────────── */
app.get('/employees', (req, res) => {
  const search = String(req.query.search || '').trim();
  const term = `%${search}%`;
  const employees = listEmployees.all(term, term);
  if (employees.length === 0 && !search) {
    return res.status(404).json({ error: 'No employees found.' });
  }
  return res.json(employees);
});

app.get('/employees/:id', (req, res) => {
  const id = Number(req.params.id);
  const employee = Number.isInteger(id) && id > 0 ? employeeById.get(id) : undefined;
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });
  return res.json(employee);
});

app.post('/employees', (req, res) => {
  const { name, role, department, email, phone, avatar_url = null } = req.body || {};
  if (![name, role, department, email, phone].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'Name, role, department, email, and phone are required.' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO employees (name, role, department, email, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), role.trim(), department.trim(), email.trim(), phone.trim(), avatar_url?.trim() || null);
    return res.status(201).json(employeeById.get(Number(result.lastInsertRowid)));
  } catch {
    return res.status(409).json({ error: 'An employee with that email already exists.' });
  }
});

/* Soft-delete: move employee to trash */
app.delete('/employees/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Employee not found.' });

  const emp = employeeById.get(id);
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });

  db.prepare(`
    INSERT INTO trash (id, name, role, department, email, phone, avatar_url, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
  `).run(emp.id, emp.name, emp.role, emp.department, emp.email, emp.phone, emp.avatar_url);

  db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  return res.status(204).end();
});

/* ── Trash / Recycle Bin ─────────────────────────────────────── */
app.get('/trash', (req, res) => {
  const items = listTrash.all();
  const mapped = items.map(({ seconds_remaining, ...item }) => ({
    ...item,
    days_remaining: Math.max(0, Math.ceil(seconds_remaining / 86400))
  }));
  return res.json(mapped);
});

app.post('/trash/:id/restore', (req, res) => {
  const id = Number(req.params.id);
  const item = Number.isInteger(id) && id > 0 ? trashById.get(id) : undefined;
  if (!item) return res.status(404).json({ error: 'Trashed profile not found.' });

  try {
    db.prepare(`
      INSERT INTO employees (id, name, role, department, email, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(item.id, item.name, item.role, item.department, item.email, item.phone, item.avatar_url);
    db.prepare('DELETE FROM trash WHERE id = ?').run(id);
    return res.status(201).json(employeeById.get(id));
  } catch {
    return res.status(409).json({ error: 'An employee with that email already exists.' });
  }
});

app.delete('/trash/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Not found.' });
  const result = db.prepare('DELETE FROM trash WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found.' });
  return res.status(204).end();
});

/* ── Fallback ────────────────────────────────────────────────── */
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.listen(port, () => console.log(`Directory API running on http://localhost:${port}`));
