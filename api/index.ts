import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedApp) {
    // Dùng bản đã build sẵn (dist/server.cjs) thay vì import server.ts trực tiếp,
    // để tránh lỗi Vercel không dò được hết phụ thuộc của file server.ts phức tạp.
    const mod = require('../dist/server.cjs');
    const createApp = mod.createApp || mod.default?.createApp;
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
}