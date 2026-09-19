// Polyfill DOMMatrix cho thư viện pdf-parse chạy được trên Node.js serverless (Vercel)
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedApp) {
    // @ts-ignore - file này được tạo lúc build, không tồn tại lúc edit code
    const mod: any = await import('../dist/server.cjs');
    const createApp = mod.createApp || mod.default?.createApp || mod.default;
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
}