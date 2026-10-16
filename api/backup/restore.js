import { restoreSqlDump } from '../../server/database.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const sqlContent = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = restoreSqlDump(sqlContent);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Khôi phục dữ liệu thất bại. File sao lưu không hợp lệ.' });
  }
}
