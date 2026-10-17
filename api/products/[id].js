import { isPostgresConfigured, pgGetProductById, pgUpdateProduct, pgDeleteProduct } from '../../server/postgres.js';
import { sqlGetProductById, sqlUpdateProduct, sqlDeleteProduct } from '../../server/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;
  const prodId = parseInt(id, 10);
  if (isNaN(prodId)) {
    return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
  }

  if (req.method === 'GET') {
    try {
      const product = isPostgresConfigured() ? await pgGetProductById(prodId) : sqlGetProductById(prodId);
      if (product) {
        return res.status(200).json({ success: true, data: product });
      }
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const patch = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const success = isPostgresConfigured() ? await pgUpdateProduct(prodId, patch) : sqlUpdateProduct(prodId, patch);
      if (success) {
        const updated = isPostgresConfigured() ? await pgGetProductById(prodId) : sqlGetProductById(prodId);
        return res.status(200).json({ success: true, data: updated });
      }
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    } catch {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const success = isPostgresConfigured() ? await pgDeleteProduct(prodId) : sqlDeleteProduct(prodId);
      return res.status(200).json({ success });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
