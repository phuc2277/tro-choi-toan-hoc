import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedApp) {
    // Dùng import() động thay vì require(), vì project chạy ở chế độ ES Module
    // @ts-ignore - file này được tạo lúc build, không tồn tại lúc edit code
    const mod: any = await import('../dist/server.cjs');    const createApp = mod.createApp || mod.default?.createApp || mod.default;
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
}