import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';
import { createHttpApp } from '../src/http.js';

let app: Express | undefined;

export default function handler(req: VercelRequest, res: VercelResponse) {
  app ??= createHttpApp();
  return app(req as any, res as any);
}
