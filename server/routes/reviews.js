// server/routes/reviews.js - Reviews API Handler
import { sendJson, sendError, readJsonBody, withDb } from './utils.js';
import { pgGetReviews, pgCreateReview, pgUpdateReview, pgDeleteReview } from '../postgres.js';
import { sqlGetReviews, sqlCreateReview, sqlUpdateReview, sqlDeleteReview } from '../database.js';

export async function handleReviewsRoute(req, res, reqPath, queryString) {
  const match = reqPath.match(/^\/api\/reviews\/([^/]+)$/);
  if (match) {
    const revId = match[1];
    if (req.method === 'PUT') {
      const patch = await readJsonBody(req);
      const success = await withDb(
        () => pgUpdateReview(revId, patch),
        () => sqlUpdateReview(revId, patch)
      );
      sendJson(res, 200, { success });
      return true;
    }
    if (req.method === 'DELETE') {
      const success = await withDb(
        () => pgDeleteReview(revId),
        () => sqlDeleteReview(revId)
      );
      sendJson(res, 200, { success });
      return true;
    }
  }

  if (reqPath === '/api/reviews' || reqPath === '/api/reviews/') {
    if (req.method === 'GET') {
      const sp = new URLSearchParams(queryString || '');
      const prodId = sp.get('productId');
      const includeHidden = sp.get('all') === '1';
      const data = await withDb(
        () => pgGetReviews(prodId, includeHidden),
        () => sqlGetReviews(prodId, includeHidden)
      );
      sendJson(res, 200, { success: true, data });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body.productId || !body.comment) {
        return sendError(res, 400, 'Thông tin đánh giá không hợp lệ');
      }
      if (body.rating < 1 || body.rating > 5) {
        return sendError(res, 400, 'Số sao đánh giá phải từ 1 đến 5');
      }
      const created = await withDb(
        () => pgCreateReview(body),
        () => sqlCreateReview(body)
      );
      sendJson(res, 201, { success: true, data: created });
      return true;
    }
  }

  return false;
}
