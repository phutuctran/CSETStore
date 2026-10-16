import { resolve } from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { sqlGetProductById, sqlGetProducts } from './server/database.js'

function offlineApiPlugin(): Plugin {
  return {
    name: 'offline-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const [reqPath] = (req.url || '').split('?');
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
        if (reqPath === '/api/products' || reqPath === '/api/products/') {
          try {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: sqlGetProducts() }));
            return;
          } catch {}
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
