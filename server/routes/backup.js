// server/routes/backup.js - Database Backup & Restore API Handler
import { sendJson } from './utils.js';
import { exportSqlDump, restoreSqlDump } from '../database.js';

export async function handleBackupRoute(req, res, reqPath) {
  if (req.method === 'GET' && (reqPath === '/api/backup/download' || reqPath === '/api/backup/sql' || reqPath === '/api/backup')) {
    const sqlDump = exportSqlDump();
    const dateStr = new Date().toISOString().split('T')[0];
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cset_store_backup_${dateStr}.sql"`);
    res.end(sqlDump);
    return true;
  }

  if (req.method === 'POST' && (reqPath === '/api/backup/restore' || reqPath === '/api/backup')) {
    const rawBody = await new Promise(resolve => {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => resolve(b));
    });
    const result = restoreSqlDump(rawBody);
    sendJson(res, 200, result);
    return true;
  }

  return false;
}
