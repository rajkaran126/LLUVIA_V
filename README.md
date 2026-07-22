# Internal Team Directory

A responsive React directory backed by a small Express + SQLite REST API. The database is created and seeded with 10 employees automatically on the first server start.

## Requirements

- Node.js 22+ (uses the built-in SQLite driver, so no native database build is needed)

## Setup

```bash
# from the project root
npm install
npm run install:all
npm run dev
```

Open http://localhost:5173. The API runs at http://localhost:3001.

To start each service separately, run `npm run server` and `npm run client` in separate terminals.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /employees` | Lists all employees. |
| `GET /employees?search=engineering` | Filters by name or department. |
| `GET /employees/:id` | Gets a single employee. |

Unknown employees, empty directories, and unknown routes return a JSON 404 response such as `{ "error": "Employee not found." }`.

## Structure

```text
client/       React, Vite, Tailwind interface
server/       Express API and SQLite setup/seed code
```
