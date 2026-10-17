import { isPostgresConfigured, pgAutoSelectTop5BestSellers } from '../../server/postgres.js';
import { sqlAutoSelectTop5BestSellers } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      const updated = isPostgresConfigured() ? await pgAutoSelectTop5BestSellers() : sqlAutoSelectTop5BestSellers();
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error('[API auto-top5] Error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
