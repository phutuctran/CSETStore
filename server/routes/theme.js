// server/routes/theme.js - Theme API Handler
import { sendJson, readJsonBody, withDb } from './utils.js';
import { pgGetTheme, pgSaveTheme } from '../postgres.js';
import { sqlGetTheme, sqlSaveTheme } from '../database.js';

export async function handleThemeRoute(req, res, reqPath) {
  if (reqPath === '/api/theme' || reqPath === '/api/theme/') {
    if (req.method === 'GET') {
      const theme = await withDb(pgGetTheme, sqlGetTheme);
      sendJson(res, 200, { success: true, data: theme });
      return true;
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const saved = await withDb(
        () => pgSaveTheme(body),
        () => sqlSaveTheme(body)
      );
      sendJson(res, 200, { success: true, data: saved });
      return true;
    }
  }
  return false;
}
