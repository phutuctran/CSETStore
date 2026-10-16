import { resolve } from 'path'
import fs from 'fs'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function offlineApiPlugin(): Plugin {
  return {
    name: 'offline-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [reqPath] = (req.url || '').split('?');
        if (reqPath?.startsWith('/api/products/')) {
          const match = reqPath.match(/^\/api\/products\/(\d+)$/);
          if (match) {
            const id = parseInt(match[1], 10);
            const dataFile = resolve(import.meta.dirname, 'data/products.json');
            if (fs.existsSync(dataFile)) {
              const list = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
              const target = list.find((p: { id: number }) => p.id === id);
              if (target) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, data: target }));
                return;
              }
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Không tìm thấy sản phẩm' }));
            return;
          }
        }
        if (reqPath === '/api/products' || reqPath === '/api/products/') {
          const dataFile = resolve(import.meta.dirname, 'data/products.json');
          if (fs.existsSync(dataFile)) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: JSON.parse(fs.readFileSync(dataFile, 'utf-8')) }));
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
