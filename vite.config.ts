import type { IncomingMessage } from 'http'
import type { Order } from './src/models/types.ts'
import { resolve } from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { sqlGetProductById, sqlGetProducts, sqlGetOrders, sqlCreateOrder, sqlUpdateOrderStatus } from './server/database.js'
import { isPostgresConfigured, pgGetOrders, pgCreateOrder, pgUpdateOrderStatus } from './server/postgres.js'

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const { promise, resolve, reject } = Promise.withResolvers<Record<string, unknown>>();
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    if (!data) return resolve({});
    try {
      resolve(JSON.parse(data));
    } catch (err) {
      reject(err);
    }
  });
  req.on('error', reject);
  return promise;
}
interface RateEntry {
  timestamps: number[];
}
const devOrderRateLimits = new Map<string, RateEntry>();

function checkDevOrderRateLimit(key: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const entry = devOrderRateLimits.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => now - t < 60000);

  const lastTime = entry.timestamps[entry.timestamps.length - 1] || 0;
  if (now - lastTime < 2500) {
    return { allowed: false, message: 'Thao tác đặt hàng quá nhanh. Vui lòng chờ 3 giây trước khi thử lại.' };
  }
  if (entry.timestamps.length >= 4) {
    return { allowed: false, message: 'Tần suất gửi đơn hàng quá cao. Vui lòng thử lại sau 1 phút.' };
  }

  entry.timestamps.push(now);
  devOrderRateLimits.set(key, entry);
  return { allowed: true };
}

function offlineApiPlugin(): Plugin {
  return {
    name: 'offline-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const [reqPath] = (req.url || '').split('?');
        
        // GET /api/products/:id
        if (reqPath?.startsWith('/api/products/')) {
          const match = reqPath.match(/^\/api\/products\/(\d+)$/);
          if (match) {
            const id = parseInt(match[1], 10);
            try {
              const target = sqlGetProductById(id);
              if (target) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, data: target }));
                return;
              }
            } catch {}
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Không tìm thấy sản phẩm' }));
            return;
          }
        }
        
        // GET /api/products
        if (reqPath === '/api/products' || reqPath === '/api/products/') {
          try {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: sqlGetProducts() }));
            return;
          } catch {}
        }

        // GET /api/orders
        if (req.method === 'GET' && (reqPath === '/api/orders' || reqPath === '/api/orders/')) {
          try {
            const orders = isPostgresConfigured() ? await pgGetOrders() : sqlGetOrders();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: orders }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Lỗi máy chủ' }));
            return;
          }
        }

        // POST /api/orders
        if (req.method === 'POST' && (reqPath === '/api/orders' || reqPath === '/api/orders/')) {
          try {
            const body = await readBody(req);
            if (!body.customerName || !body.phone || !body.address || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Thông tin đơn hàng không đầy đủ' }));
              return;
            }

            const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
            const cleanPhone = String(body.phone || '').replace(/[\s+-]+/g, '');
            const rateKey = `${clientIp}:${cleanPhone || 'anonymous'}`;
            const rateCheck = checkDevOrderRateLimit(rateKey);
            if (!rateCheck.allowed) {
              res.statusCode = 429;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: rateCheck.message }));
              return;
            }

            const orderPayload = body as unknown as Omit<Order, 'id' | 'createdAt'>;
            const created = isPostgresConfigured() ? await pgCreateOrder(orderPayload) : sqlCreateOrder(orderPayload);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: created }));
            return;
          } catch (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
            return;
          }
        }

        // PUT /api/orders/:id/status
        const orderStatusMatch = reqPath?.match(/^\/api\/orders\/([^/]+)\/status$/);
        if (req.method === 'PUT' && orderStatusMatch) {
          const orderId = orderStatusMatch[1];
          try {
            const body = await readBody(req);
            if (!body.status) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Thiếu trạng thái đơn hàng' }));
              return;
            }
            const success = isPostgresConfigured() ? await pgUpdateOrderStatus(orderId, body.status) : sqlUpdateOrderStatus(orderId, body.status);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success }));
            return;
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Dữ liệu không hợp lệ' }));
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [offlineApiPlugin(), tailwindcss(), svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
})
