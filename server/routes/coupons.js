// server/routes/coupons.js - Coupons API Handler
import { sendJson, sendError, readJsonBody, withDb } from './utils.js';
import { pgGetCoupons, pgCreateCoupon, pgUpdateCoupon, pgDeleteCoupon } from '../postgres.js';
import { sqlGetCoupons, sqlCreateCoupon, sqlUpdateCoupon, sqlDeleteCoupon } from '../database.js';

export async function handleCouponsRoute(req, res, reqPath) {
  const match = reqPath.match(/^\/api\/coupons\/([^/]+)$/);
  if (match) {
    const coupId = match[1];
    if (req.method === 'PUT') {
      const patch = await readJsonBody(req);
      const success = await withDb(
        () => pgUpdateCoupon(coupId, patch),
        () => sqlUpdateCoupon(coupId, patch)
      );
      sendJson(res, 200, { success });
      return true;
    }
    if (req.method === 'DELETE') {
      const success = await withDb(
        () => pgDeleteCoupon(coupId),
        () => sqlDeleteCoupon(coupId)
      );
      sendJson(res, 200, { success });
      return true;
    }
  }

  if (reqPath === '/api/coupons' || reqPath === '/api/coupons/') {
    if (req.method === 'GET') {
      const data = await withDb(pgGetCoupons, sqlGetCoupons);
      sendJson(res, 200, { success: true, data });
      return true;
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body.code || !body.discountValue) return sendError(res, 400, 'Thông tin mã giảm giá không đầy đủ');
      const created = await withDb(
        () => pgCreateCoupon(body),
        () => sqlCreateCoupon(body)
      );
      sendJson(res, 201, { success: true, data: created });
      return true;
    }
  }

  return false;
}
