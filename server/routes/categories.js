// server/routes/categories.js - Categories API Handler
import { sendJson, sendError, readJsonBody, withDb } from './utils.js';
import { pgGetCategories, pgCreateCategory, pgUpdateCategory, pgDeleteCategory } from '../postgres.js';
import { sqlGetCategories, sqlCreateCategory, sqlUpdateCategory, sqlDeleteCategory } from '../database.js';

export async function handleCategoriesRoute(req, res, reqPath) {
  const match = reqPath.match(/^\/api\/categories\/([^/]+)$/);
  if (match) {
    const catKey = decodeURIComponent(match[1]);
    if (req.method === 'PUT') {
      const patch = await readJsonBody(req);
      const success = await withDb(
        () => pgUpdateCategory(catKey, patch),
        () => sqlUpdateCategory(catKey, patch)
      );
      sendJson(res, 200, { success });
      return true;
    }
    if (req.method === 'DELETE') {
      const success = await withDb(
        () => pgDeleteCategory(catKey),
        () => sqlDeleteCategory(catKey)
      );
      sendJson(res, 200, { success });
      return true;
    }
  }

  if (reqPath === '/api/categories' || reqPath === '/api/categories/') {
    if (req.method === 'GET') {
      const data = await withDb(pgGetCategories, sqlGetCategories);
      sendJson(res, 200, { success: true, data });
      return true;
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body.key || !body.label) return sendError(res, 400, 'Thông tin ngành hàng không đầy đủ');
      const created = await withDb(
        () => pgCreateCategory(body),
        () => sqlCreateCategory(body)
      );
      sendJson(res, 201, { success: true, data: created });
      return true;
    }
  }

  return false;
}
