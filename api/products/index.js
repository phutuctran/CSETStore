import { isPostgresConfigured, pgGetProducts, pgCreateProduct, pgAutoSelectTop5BestSellers } from '../../server/postgres.js';
import { sqlGetProducts, sqlCreateProduct, sqlAutoSelectTop5BestSellers } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const list = isPostgresConfigured() ? await pgGetProducts() : sqlGetProducts();
      return res.status(200).json({ success: true, data: list });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'POST') {
    const { action } = req.query;
    if (action === 'auto-top5') {
      try {
        const updated = isPostgresConfigured() ? await pgAutoSelectTop5BestSellers() : sqlAutoSelectTop5BestSellers();
        return res.status(200).json({ success: true, data: updated });
      } catch (err) {
        console.error('[API auto-top5] Error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
      }
    }
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const created = isPostgresConfigured() ? await pgCreateProduct(body) : sqlCreateProduct(body);
      return res.status(201).json({ success: true, data: created });
    } catch {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
