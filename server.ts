import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './backend/server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SwiftCart full-stack server running on http://0.0.0.0:${PORT}`);
});
