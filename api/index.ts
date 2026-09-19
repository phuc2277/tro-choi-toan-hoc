import { createApp } from '../server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
}