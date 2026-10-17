// server/apiRouter.js - Unified API Router for Local Dev & Offline MPA Server
import { sendError } from './routes/utils.js';
import { handleProductsRoute } from './routes/products.js';
import { handleOrdersRoute } from './routes/orders.js';
import { handleReviewsRoute } from './routes/reviews.js';
import { handleCategoriesRoute } from './routes/categories.js';
import { handleCouponsRoute } from './routes/coupons.js';
import { handleUsersRoute } from './routes/users.js';
import { handleAuthRoute } from './routes/auth.js';
import { handleThemeRoute } from './routes/theme.js';
import { handleBackupRoute } from './routes/backup.js';

export async function handleApiRequest(req, res) {
  const [reqPath, queryString] = (req.url || '/').split('?');
  if (!reqPath.startsWith('/api/')) {
    return false;
  }

  // Handle CORS & Preflight
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  try {
    if (await handleProductsRoute(req, res, reqPath)) return true;
    if (await handleOrdersRoute(req, res, reqPath)) return true;
    if (await handleReviewsRoute(req, res, reqPath, queryString)) return true;
    if (await handleCategoriesRoute(req, res, reqPath)) return true;
    if (await handleCouponsRoute(req, res, reqPath)) return true;
    if (await handleUsersRoute(req, res, reqPath)) return true;
    if (await handleAuthRoute(req, res, reqPath)) return true;
    if (await handleThemeRoute(req, res, reqPath)) return true;
    if (await handleBackupRoute(req, res, reqPath)) return true;

    sendError(res, 404, 'Không tìm thấy API endpoint');
    return true;
  } catch (err) {
    console.error('[API Router Error]', err);
    sendError(res, 500, err?.message || 'Lỗi máy chủ nội bộ');
    return true;
  }
}
