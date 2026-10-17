import { exportSqlDump, restoreSqlDump } from '../../server/database.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const sqlDump = exportSqlDump();
      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="cset_store_backup_${dateStr}.sql"`);
      return res.status(200).send(sqlDump);
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Không thể xuất file sao lưu. Vui lòng thử lại sau.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const sqlContent = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const result = restoreSqlDump(sqlContent);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Khôi phục dữ liệu thất bại. File sao lưu không hợp lệ.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
