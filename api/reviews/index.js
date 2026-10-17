import { withDb } from '../../server/routes/utils.js';
import { pgGetReviews, pgCreateReview, pgUpdateReview, pgDeleteReview } from '../../server/postgres.js';
import { sqlGetReviews, sqlCreateReview, sqlUpdateReview, sqlDeleteReview } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { productId, all, id } = req.query;

  if (req.method === 'GET') {
    try {
      const list = await withDb(() => pgGetReviews(productId, all === '1'), () => sqlGetReviews(productId, all === '1'));
      return res.status(200).json({ success: true, data: list });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.productId || !body.comment) {
        return res.status(400).json({ success: false, message: 'Thông tin đánh giá không hợp lệ' });
      }
      if (Array.isArray(body.images)) {
        for (const img of body.images) {
          if (typeof img === 'string' && img.startsWith('data:image/')) {
            const approxBytes = img.length * 0.75;
            if (approxBytes > 3 * 1024 * 1024) {
              return res.status(400).json({ success: false, message: 'Dung lượng ảnh vượt quá giới hạn 3MB' });
            }
          }
        }
      }
      const created = await withDb(() => pgCreateReview(body), () => sqlCreateReview(body));
      return res.status(201).json({ success: true, data: created });
    } catch {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const reviewId = id || req.query.id || body?.id;
      if (!reviewId) {
        return res.status(400).json({ success: false, message: 'Thiếu ID đánh giá' });
      }
      const success = await withDb(() => pgUpdateReview(reviewId, body), () => sqlUpdateReview(reviewId, body));
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/reviews] PUT error:', err);
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const reviewId = id || req.query.id;
      if (!reviewId) {
        return res.status(400).json({ success: false, message: 'Thiếu ID đánh giá' });
      }
      const success = await withDb(() => pgDeleteReview(reviewId), () => sqlDeleteReview(reviewId));
      return res.status(200).json({ success });
    } catch (err) {
      console.error('[API /api/reviews] DELETE error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
