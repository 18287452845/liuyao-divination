import { NextFunction, Request, Response } from 'express';
import { normalizeLegacyData } from '../utils/textNormalize';

export function normalizeResponse(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => originalJson(normalizeLegacyData(body))) as typeof res.json;

  next();
}
