import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = express();
const directory = path.dirname(fileURLToPath(import.meta.url));
const client = path.join(directory, '..', '..', 'client');
const page = path.join(client, 'standalone.html');

app.use(express.static(path.join(client, 'public')));
app.get('/', (_req, res) => res.sendFile(page));
const port = process.env.FRONTEND_PORT || 5173;
app.listen(port, () => console.log(`Directory frontend running on http://localhost:${port}`));
