import express from 'express';
import path from 'path';
import { app } from './backend/server.ts';

const rootDir = process.cwd();
const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const PORT = isRender || (process.env.PORT && process.env.PORT !== '8080')
  ? parseInt(process.env.PORT || '10000', 10)
  : 3000;

app.use(express.static(path.join(rootDir, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(rootDir, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SwiftCart full-stack server running on http://0.0.0.0:${PORT}`);
});

