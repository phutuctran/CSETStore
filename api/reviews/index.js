import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { productId } = req.query;

  try {
    const filePath = path.join(process.cwd(), 'data', 'reviews.json');
    if (fs.existsSync(filePath)) {
      let list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (productId) {
        list = list.filter(r => r.productId === parseInt(productId, 10));
      }
      return res.status(200).json({ success: true, data: list });
    }
    return res.status(200).json({ success: true, data: [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}
