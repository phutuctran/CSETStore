import { exportSqlDump } from '../../server/database.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const sqlDump = exportSqlDump();
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cset_store_backup_${dateStr}.sql"`);
    return res.status(200).send(sqlDump);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
