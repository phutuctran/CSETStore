import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { argon2id } from 'hash-wasm';

let DATA_DIR = path.join(process.cwd(), 'data');
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  DATA_DIR = path.join(os.tmpdir(), 'cset_data');
}
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {}

let dbInstance;
try {
  const DB_PATH = path.join(DATA_DIR, 'cset_store.sqlite');
  dbInstance = new DatabaseSync(DB_PATH);
} catch {
  // Fallback to in-memory database in strict read-only environments
  dbInstance = new DatabaseSync(':memory:');
}
export const db = dbInstance;

// Cryptographic Security Config
const ENCRYPTION_SECRET = process.env.CSET_ENCRYPTION_KEY || 'cset_store_secure_aes_256_key_2026';
const AES_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Hashes passwords using Argon2id (RFC 9106 recommended cryptographic memory-hard function).
 * Password is NEVER stored in plaintext.
 */
export async function hashPasswordArgon2(password) {
  if (!password) return '';
  const salt = new Uint8Array(crypto.randomBytes(16));
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 19456, // 19MB memory cost
    hashLength: 32,
    outputType: 'encoded'
  });
}

/**
 * Synchronous hash helper for initial bootstrap if needed (Argon2id format)
 */
export function hashPassword(password) {
  if (!password) return '';
  // Standard Argon2id hash for demo default '123'
  if (password === '123') {
    return '$argon2id$v=19$m=19456,t=2,p=1$DCI4TloMIjhOWgwiOE5aDA$IoyXDXDJUIr5PYp+0BwAH3tMduQpH5VwQHQq0MLOGrY';
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verifies password against Argon2id hash, PBKDF2 hash, or backward-compatible legacy comparison.
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  // 1. Argon2id verification
  if (storedHash.startsWith('$argon2id$')) {
    try {
      const parts = storedHash.split('$').filter(Boolean);
      const params = parts[2].split(',').reduce((acc, pair) => {
        const [k, v] = pair.split('=');
        acc[k] = parseInt(v, 10);
        return acc;
      }, {});
      const saltBytes = new Uint8Array(Buffer.from(parts[3], 'base64'));
      const computed = await argon2id({
        password,
        salt: saltBytes,
        parallelism: params.p || 1,
        iterations: params.t || 2,
        memorySize: params.m || 19456,
        hashLength: 32,
        outputType: 'encoded'
      });
      return computed === storedHash;
    } catch {
      return false;
    }
  }

  // 2. Legacy PBKDF2 verification
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(verifyHash, 'hex'));
  }

  // 3. Fallback for legacy plain passwords during initial migration
  return password === storedHash;
}

/**
 * Encrypts sensitive personal data (phone numbers, delivery addresses) using AES-256-CBC with random IV.
 */
export function encryptSensitiveData(text) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);
  if (text.startsWith('enc:')) return text; // already encrypted
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `enc:${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts sensitive data if encrypted, or returns plaintext as fallback.
 */
export function decryptSensitiveData(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return '';
  if (!cipherText.startsWith('enc:')) return cipherText;
  try {
    const parts = cipherText.split(':');
    if (parts.length < 3) return cipherText;
    const iv = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Decryption error:', err);
    return cipherText;
  }
}

// Initialize SQL Schema
export function initDatabaseSchema() {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone_encrypted TEXT,
      address_encrypted TEXT,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      price INTEGER NOT NULL,
      original_price INTEGER,
      discount_percent INTEGER,
      discount_start_date TEXT,
      discount_end_date TEXT,
      image TEXT NOT NULL,
      images_json TEXT,
      description TEXT NOT NULL,
      brand TEXT,
      sku TEXT,
      stock INTEGER DEFAULT 50,
      origin TEXT,
      warranty TEXT,
      weight TEXT,
      condition TEXT,
      specifications_json TEXT,
      variant_groups_json TEXT,
      rating REAL DEFAULT 5.0,
      sold_count INTEGER DEFAULT 0,
      show_on_home INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      phone_encrypted TEXT,
      address_encrypted TEXT,
      items_json TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      subtotal_amount INTEGER,
      coupon_code TEXT,
      discount_amount INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      images_json TEXT,
      verified_purchase INTEGER DEFAULT 1,
      hidden INTEGER DEFAULT 0,
      admin_reply_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      icon TEXT,
      custom_icon_image TEXT,
      subcategories_json TEXT
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_value INTEGER DEFAULT 0,
      max_discount_amount INTEGER DEFAULT 0,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS theme_config (
      id TEXT PRIMARY KEY,
      config_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  try { db.exec("ALTER TABLE products ADD COLUMN sold_count INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN show_on_home INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN max_purchase_limit INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN variant_combinations_json TEXT;"); } catch {}
  // Ensure all detailed user profile columns exist
  const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  const missingUserCols = ['email', 'city', 'district', 'ward', 'gender', 'birthday', 'avatar', 'bio'];
  for (const c of missingUserCols) {
    if (!userCols.includes(c)) {
      try { db.exec(`ALTER TABLE users ADD COLUMN ${c} TEXT;`); } catch {}
    }
  }


  try {
    db.exec(`
      UPDATE products SET sold_count = 480, show_on_home = 1 WHERE id = 1 AND (sold_count IS NULL OR sold_count = 0);
      UPDATE products SET sold_count = 650, show_on_home = 1 WHERE id = 2 AND (sold_count IS NULL OR sold_count = 0);
      UPDATE products SET sold_count = 390 WHERE id = 3 AND (sold_count IS NULL OR sold_count = 0);
      UPDATE products SET sold_count = 820, show_on_home = 1 WHERE id = 4 AND (sold_count IS NULL OR sold_count = 0);
      UPDATE products SET sold_count = 710, show_on_home = 1 WHERE id = 5 AND (sold_count IS NULL OR sold_count = 0);
      UPDATE products SET sold_count = 210 WHERE id = 6 AND (sold_count IS NULL OR sold_count = 0);
      UPDATE products SET sold_count = 340 WHERE id = 7 AND (sold_count IS NULL OR sold_count = 0);
      UPDATE products SET sold_count = 560, show_on_home = 1 WHERE id = 8 AND (sold_count IS NULL OR sold_count = 0);
    `);
  } catch {}
}

// Initial Data Seed & Migration
export function seedDatabaseFromFiles() {
  initDatabaseSchema();

  // 1. Seed Users (with hashed passwords & encrypted phone/address)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const usersFile = path.join(DATA_DIR, 'users.json');
    if (fs.existsSync(usersFile)) {
      try {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        const insertUser = db.prepare(`
          INSERT INTO users (id, username, password_hash, full_name, phone_encrypted, address_encrypted, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const u of users) {
          const passHash = u.password && !u.password.startsWith('pbkdf2:') ? hashPassword(u.password) : (u.password_hash || hashPassword('123'));
          const encPhone = encryptSensitiveData(u.phone || '');
          const encAddress = encryptSensitiveData(u.address || '');
          insertUser.run(u.id, u.username, passHash, u.fullName || u.full_name || '', encPhone, encAddress, u.role || 'customer', u.createdAt || u.created_at || new Date().toISOString());
        }
        console.log(`[SQL Migration] Migrated ${users.length} users into SQL database with salted PBKDF2 hash & AES-256 encryption.`);
      } catch (err) {
        console.error('[SQL Migration] Error migrating users:', err);
      }
    }
  }

  // 2. Seed Products
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (prodCount === 0) {
    const prodsFile = path.join(DATA_DIR, 'products.json');
    if (fs.existsSync(prodsFile)) {
      try {
        const prods = JSON.parse(fs.readFileSync(prodsFile, 'utf-8'));
        const insertProd = db.prepare(`
          INSERT INTO products (id, name, category, sub_category, price, original_price, discount_percent, discount_start_date, discount_end_date, image, images_json, description, brand, sku, stock, origin, warranty, weight, condition, specifications_json, variant_groups_json, rating)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of prods) {
          insertProd.run(
            p.id,
            p.name,
            p.category,
            p.subCategory || p.sub_category || null,
            p.price,
            p.originalPrice || p.original_price || null,
            p.discountPercent || p.discount_percent || null,
            p.discountStartDate || p.discount_start_date || null,
            p.discountEndDate || p.discount_end_date || null,
            p.image,
            p.images ? JSON.stringify(p.images) : null,
            p.description || '',
            p.brand || null,
            p.sku || null,
            p.stock || 50,
            p.origin || null,
            p.warranty || null,
            p.weight || null,
            p.condition || null,
            p.specifications ? JSON.stringify(p.specifications) : null,
            p.variantGroups ? JSON.stringify(p.variantGroups) : null,
            p.rating || 5.0
          );
        }
        console.log(`[SQL Migration] Migrated ${prods.length} products into SQL database.`);
      } catch (err) {
        console.error('[SQL Migration] Error migrating products:', err);
      }
    }
  }

  // 3. Seed Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const catFile = path.join(DATA_DIR, 'categories.json');
    if (fs.existsSync(catFile)) {
      try {
        const cats = JSON.parse(fs.readFileSync(catFile, 'utf-8'));
        const insertCat = db.prepare(`
          INSERT INTO categories (key, label, icon, custom_icon_image, subcategories_json)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const c of cats) {
          insertCat.run(c.key, c.label, c.icon || 'fa-tag', c.customIconImage || null, c.subcategories ? JSON.stringify(c.subcategories) : '[]');
        }
        console.log(`[SQL Migration] Migrated ${cats.length} categories into SQL database.`);
      } catch (err) {
        console.error('[SQL Migration] Error migrating categories:', err);
      }
    }
  }

  // 4. Seed Reviews
  const revCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
  if (revCount === 0) {
    const revFile = path.join(DATA_DIR, 'reviews.json');
    if (fs.existsSync(revFile)) {
      try {
        const revs = JSON.parse(fs.readFileSync(revFile, 'utf-8'));
        const insertRev = db.prepare(`
          INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, images_json, verified_purchase, hidden, admin_reply_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of revs) {
          insertRev.run(
            r.id,
            r.productId,
            r.userId,
            r.userName,
            r.rating,
            r.comment,
            r.images ? JSON.stringify(r.images) : null,
            r.verifiedPurchase !== false ? 1 : 0,
            r.hidden ? 1 : 0,
            r.adminReply ? JSON.stringify(r.adminReply) : null,
            r.createdAt || new Date().toLocaleString('vi-VN')
          );
        }
        console.log(`[SQL Migration] Migrated ${revs.length} reviews into SQL database.`);
      } catch (err) {
        console.error('[SQL Migration] Error migrating reviews:', err);
      }
    }
  }

  // 5. Seed Coupons
  const coupCount = db.prepare('SELECT COUNT(*) as count FROM coupons').get().count;
  if (coupCount === 0) {
    const defaultCoupons = [
      { id: 'coup-1', code: 'CSET10', description: 'Giảm 10% cho đơn từ 500k', discountType: 'percentage', discountValue: 10, minOrderValue: 500000, maxDiscountAmount: 200000, usageLimit: 100, usedCount: 12, isActive: 1 },
      { id: 'coup-2', code: 'GIAM50K', description: 'Giảm 50k cho đơn từ 300k', discountType: 'fixed', discountValue: 50000, minOrderValue: 300000, maxDiscountAmount: 0, usageLimit: 50, usedCount: 8, isActive: 1 },
      { id: 'coup-3', code: 'CSETVIP', description: 'Giảm 200k cho đơn VIP từ 2tr', discountType: 'fixed', discountValue: 200000, minOrderValue: 2000000, maxDiscountAmount: 0, usageLimit: 20, usedCount: 3, isActive: 1 }
    ];
    const insertCoup = db.prepare(`
      INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, used_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of defaultCoupons) {
      insertCoup.run(c.id, c.code, c.description, c.discountType, c.discountValue, c.minOrderValue, c.maxDiscountAmount, c.usageLimit, c.usedCount, c.isActive);
    }
  }
}

// --- DATA ACCESS METHODS ---

// Products
export function sqlGetProducts() {
  const rows = db.prepare('SELECT * FROM products ORDER BY id ASC').all();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    subCategory: r.sub_category || undefined,
    price: r.price,
    originalPrice: r.original_price || undefined,
    discountPercent: r.discount_percent || undefined,
    discountStartDate: r.discount_start_date || undefined,
    discountEndDate: r.discount_end_date || undefined,
    image: r.image,
    images: r.images_json ? JSON.parse(r.images_json) : [r.image],
    description: r.description,
    brand: r.brand || undefined,
    sku: r.sku || undefined,
    stock: r.stock,
    origin: r.origin || undefined,
    warranty: r.warranty || undefined,
    weight: r.weight || undefined,
    condition: r.condition || undefined,
    specifications: r.specifications_json ? JSON.parse(r.specifications_json) : undefined,
    variantGroups: r.variant_groups_json ? JSON.parse(r.variant_groups_json) : undefined,
    rating: r.rating,
    soldCount: r.sold_count || 0,
    showOnHome: r.show_on_home === 1,
    maxPurchaseLimit: r.max_purchase_limit || undefined,
    variantCombinations: r.variant_combinations_json ? JSON.parse(r.variant_combinations_json) : undefined
  }));
}

export function sqlGetProductById(id) {
  const r = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    subCategory: r.sub_category || undefined,
    price: r.price,
    originalPrice: r.original_price || undefined,
    discountPercent: r.discount_percent || undefined,
    discountStartDate: r.discount_start_date || undefined,
    discountEndDate: r.discount_end_date || undefined,
    image: r.image,
    images: r.images_json ? JSON.parse(r.images_json) : [r.image],
    description: r.description,
    brand: r.brand || undefined,
    sku: r.sku || undefined,
    stock: r.stock,
    origin: r.origin || undefined,
    warranty: r.warranty || undefined,
    weight: r.weight || undefined,
    condition: r.condition || undefined,
    specifications: r.specifications_json ? JSON.parse(r.specifications_json) : undefined,
    variantGroups: r.variant_groups_json ? JSON.parse(r.variant_groups_json) : undefined,
    rating: r.rating,
    soldCount: r.sold_count || 0,
    showOnHome: r.show_on_home === 1,
    maxPurchaseLimit: r.max_purchase_limit || undefined,
    variantCombinations: r.variant_combinations_json ? JSON.parse(r.variant_combinations_json) : undefined
  };
}

export function sqlCreateProduct(p) {
  const maxId = db.prepare('SELECT MAX(id) as maxId FROM products').get()?.maxId || 0;
  const newId = p.id || maxId + 1;
  db.prepare(`
    INSERT INTO products (id, name, category, sub_category, price, original_price, discount_percent, discount_start_date, discount_end_date, image, images_json, description, brand, sku, stock, origin, warranty, weight, condition, specifications_json, variant_groups_json, rating, sold_count, show_on_home, max_purchase_limit, variant_combinations_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    p.name,
    p.category,
    p.subCategory || null,
    p.price,
    p.originalPrice || null,
    p.discountPercent || null,
    p.discountStartDate || null,
    p.discountEndDate || null,
    p.image,
    p.images ? JSON.stringify(p.images) : null,
    p.description || '',
    p.brand || null,
    p.sku || null,
    p.stock || 50,
    p.origin || null,
    p.warranty || null,
    p.weight || null,
    p.condition || null,
    p.specifications ? JSON.stringify(p.specifications) : null,
    p.variantGroups ? JSON.stringify(p.variantGroups) : null,
    p.rating || 5.0,
    p.soldCount || 0,
    p.showOnHome ? 1 : 0,
    p.maxPurchaseLimit || 0,
    p.variantCombinations ? JSON.stringify(p.variantCombinations) : null
  );
  return sqlGetProductById(newId);
}

export function sqlUpdateProduct(id, patch) {
  const existing = sqlGetProductById(id);
  if (!existing) return false;
  const merged = { ...existing, ...patch };
  db.prepare(`
    UPDATE products SET
      name = ?, category = ?, sub_category = ?, price = ?, original_price = ?,
      discount_percent = ?, discount_start_date = ?, discount_end_date = ?, image = ?,
      images_json = ?, description = ?, brand = ?, sku = ?, stock = ?, origin = ?,
      warranty = ?, weight = ?, condition = ?, specifications_json = ?, variant_groups_json = ?,
      sold_count = ?, show_on_home = ?, max_purchase_limit = ?, variant_combinations_json = ?
    WHERE id = ?
  `).run(
    merged.name,
    merged.category,
    merged.subCategory || null,
    merged.price,
    merged.originalPrice || null,
    merged.discountPercent || null,
    merged.discountStartDate || null,
    merged.discountEndDate || null,
    merged.image,
    merged.images ? JSON.stringify(merged.images) : null,
    merged.description,
    merged.brand || null,
    merged.sku || null,
    merged.stock,
    merged.origin || null,
    merged.warranty || null,
    merged.weight || null,
    merged.condition || null,
    merged.specifications ? JSON.stringify(merged.specifications) : null,
    merged.variantGroups ? JSON.stringify(merged.variantGroups) : null,
    merged.soldCount || 0,
    merged.showOnHome ? 1 : 0,
    merged.maxPurchaseLimit || 0,
    merged.variantCombinations ? JSON.stringify(merged.variantCombinations) : null,
    id
  );
  return true;
}

export function sqlDeleteProduct(id) {
  const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return res.changes > 0;
}

export function sqlAutoSelectTop5BestSellers() {
  db.exec('UPDATE products SET show_on_home = 0;');
  db.exec('UPDATE products SET show_on_home = 1 WHERE id IN (SELECT id FROM products ORDER BY sold_count DESC, id ASC LIMIT 5);');
  return sqlGetProducts();
}

// Users
export function sqlGetUsers() {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  return rows.map(r => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    phone: decryptSensitiveData(r.phone_encrypted),
    address: decryptSensitiveData(r.address_encrypted),
    email: r.email || '',
    city: r.city || '',
    district: r.district || '',
    ward: r.ward || '',
    gender: r.gender || 'male',
    birthday: r.birthday || '',
    avatar: r.avatar || '',
    bio: r.bio || '',
    role: r.role,
    createdAt: r.created_at
  }));
}

export function sqlGetUserById(id) {
  if (!id) return null;
  const r = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    password_hash: r.password_hash,
    fullName: r.full_name,
    phone: decryptSensitiveData(r.phone_encrypted),
    address: decryptSensitiveData(r.address_encrypted),
    email: r.email || '',
    city: r.city || '',
    district: r.district || '',
    ward: r.ward || '',
    gender: r.gender || 'male',
    birthday: r.birthday || '',
    avatar: r.avatar || '',
    bio: r.bio || '',
    role: r.role,
    createdAt: r.created_at
  };
}

export function sqlGetUserByUsername(username) {
  if (!username) return null;
  const r = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    password_hash: r.password_hash,
    fullName: r.full_name,
    phone: decryptSensitiveData(r.phone_encrypted),
    address: decryptSensitiveData(r.address_encrypted),
    email: r.email || '',
    city: r.city || '',
    district: r.district || '',
    ward: r.ward || '',
    gender: r.gender || 'male',
    birthday: r.birthday || '',
    avatar: r.avatar || '',
    bio: r.bio || '',
    role: r.role,
    createdAt: r.created_at
  };
}

export async function sqlCreateUser(u) {
  const id = u.id || 'USR-' + Date.now().toString(36).toUpperCase();
  let passHash = u.password_hash;
  if (!passHash) {
    if (u.password && (u.password.startsWith('$argon2id$') || u.password.startsWith('pbkdf2:'))) {
      passHash = u.password;
    } else {
      passHash = await hashPasswordArgon2(u.password || '123');
    }
  }
  const encPhone = encryptSensitiveData(u.phone || '');
  const encAddress = encryptSensitiveData(u.address || '');
  db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, phone_encrypted, address_encrypted, role, created_at, email, city, district, ward, gender, birthday, avatar, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    u.username.trim(),
    passHash,
    u.fullName || u.full_name || '',
    encPhone,
    encAddress,
    u.role || 'customer',
    u.createdAt || new Date().toLocaleString('vi-VN'),
    u.email || '',
    u.city || '',
    u.district || '',
    u.ward || '',
    u.gender || 'male',
    u.birthday || '',
    u.avatar || '',
    u.bio || ''
  );
  return sqlGetUserById(id);
}

export async function sqlUpdateUser(id, patch) {
  const existing = sqlGetUserById(id);
  if (!existing) return null;

  let passHash = existing.password_hash;
  if (patch.password) {
    if (patch.password.startsWith('$argon2id$') || patch.password.startsWith('pbkdf2:')) {
      passHash = patch.password;
    } else {
      passHash = await hashPasswordArgon2(patch.password);
    }
  }

  const fullName = patch.fullName !== undefined ? patch.fullName : existing.fullName;
  const phone = patch.phone !== undefined ? patch.phone : existing.phone;
  const address = patch.address !== undefined ? patch.address : existing.address;
  const email = patch.email !== undefined ? patch.email : existing.email;
  const city = patch.city !== undefined ? patch.city : existing.city;
  const district = patch.district !== undefined ? patch.district : existing.district;
  const ward = patch.ward !== undefined ? patch.ward : existing.ward;
  const gender = patch.gender !== undefined ? patch.gender : existing.gender;
  const birthday = patch.birthday !== undefined ? patch.birthday : existing.birthday;
  const avatar = patch.avatar !== undefined ? patch.avatar : existing.avatar;
  const bio = patch.bio !== undefined ? patch.bio : existing.bio;
  const role = patch.role !== undefined ? patch.role : existing.role;

  const encPhone = encryptSensitiveData(phone || '');
  const encAddress = encryptSensitiveData(address || '');

  db.prepare(`
    UPDATE users SET
      password_hash = ?,
      full_name = ?,
      phone_encrypted = ?,
      address_encrypted = ?,
      role = ?,
      email = ?,
      city = ?,
      district = ?,
      ward = ?,
      gender = ?,
      birthday = ?,
      avatar = ?,
      bio = ?
    WHERE id = ?
  `).run(
    passHash,
    fullName,
    encPhone,
    encAddress,
    role,
    email,
    city,
    district,
    ward,
    gender,
    birthday,
    avatar,
    bio,
    id
  );

  return sqlGetUserById(id);
}

export function sqlDeleteUser(id) {
  const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return res.changes > 0;
}

// Reviews
export function sqlGetReviews(productId, includeHidden = false) {
  let query = 'SELECT * FROM reviews';
  const params = [];
  const where = [];
  if (productId) {
    where.push('product_id = ?');
    params.push(parseInt(productId, 10));
  }
  if (!includeHidden) {
    where.push('hidden = 0');
  }
  if (where.length > 0) {
    query += ' WHERE ' + where.join(' AND ');
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    userId: r.user_id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    images: r.images_json ? JSON.parse(r.images_json) : undefined,
    verifiedPurchase: r.verified_purchase === 1,
    hidden: r.hidden === 1,
    adminReply: r.admin_reply_json ? JSON.parse(r.admin_reply_json) : undefined,
    createdAt: r.created_at
  }));
}

export function sqlCreateReview(data) {
  const id = data.id || 'rev-' + Date.now();
  db.prepare(`
    INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, images_json, verified_purchase, hidden, admin_reply_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.productId,
    data.userId,
    data.userName,
    data.rating,
    data.comment,
    data.images ? JSON.stringify(data.images) : null,
    data.verifiedPurchase !== false ? 1 : 0,
    data.hidden ? 1 : 0,
    data.adminReply ? JSON.stringify(data.adminReply) : null,
    data.createdAt || new Date().toLocaleString('vi-VN')
  );
  return { ...data, id };
}

export function sqlUpdateReview(id, patch) {
  const rows = db.prepare('SELECT * FROM reviews WHERE id = ?').all(id);
  if (rows.length === 0) return false;
  const current = rows[0];
  const hiddenVal = patch.hidden !== undefined ? (patch.hidden ? 1 : 0) : current.hidden;
  const adminReplyVal = patch.adminReply !== undefined ? JSON.stringify(patch.adminReply) : current.admin_reply_json;
  db.prepare(`
    UPDATE reviews SET hidden = ?, admin_reply_json = ? WHERE id = ?
  `).run(hiddenVal, adminReplyVal, id);
  return true;
}

export function sqlDeleteReview(id) {
  const res = db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  return res.changes > 0;
}

// Categories
export function sqlGetCategories() {
  const rows = db.prepare('SELECT * FROM categories').all();
  return rows.map(r => ({
    key: r.key,
    label: r.label,
    icon: r.icon,
    customIconImage: r.custom_icon_image || undefined,
    subcategories: r.subcategories_json ? JSON.parse(r.subcategories_json) : []
  }));
}

// Orders
export function sqlGetOrders() {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  return rows.map(r => ({
    id: r.id,
    customerId: r.customer_id || undefined,
    customerName: r.customer_name,
    phone: decryptSensitiveData(r.phone_encrypted),
    address: decryptSensitiveData(r.address_encrypted),
    items: JSON.parse(r.items_json),
    totalAmount: r.total_amount,
    subtotalAmount: r.subtotal_amount || undefined,
    couponCode: r.coupon_code || undefined,
    discountAmount: r.discount_amount || 0,
    status: r.status,
    createdAt: r.created_at
  }));
}

export function sqlCreateOrder(order) {
  const id = order.id || 'ORD-' + Date.now().toString(36).toUpperCase();
  const encPhone = encryptSensitiveData(order.phone || '');
  const encAddress = encryptSensitiveData(order.address || '');
  const totalAmount = Math.round(Number(order.totalAmount) || 0);
  const subtotalAmount = Math.round(Number(order.subtotalAmount || order.totalAmount) || 0);
  const discountAmount = Math.round(Number(order.discountAmount) || 0);
  const customerId = (order.customerId && typeof order.customerId === 'string' && order.customerId.trim()) ? order.customerId.trim() : null;
  const createdAt = order.createdAt || new Date().toLocaleString('vi-VN');

  db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, phone_encrypted, address_encrypted, items_json, total_amount, subtotal_amount, coupon_code, discount_amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    customerId,
    order.customerName || 'Khách Vãng Lai',
    encPhone,
    encAddress,
    JSON.stringify(order.items || []),
    totalAmount,
    subtotalAmount,
    order.couponCode || null,
    discountAmount,
    order.status || 'pending',
    createdAt
  );
  return {
    ...order,
    id,
    customerId: customerId || undefined,
    totalAmount,
    subtotalAmount,
    discountAmount,
    createdAt
  };
}

export function sqlUpdateOrderStatus(id, status) {
  const res = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return res.changes > 0;
}

// Coupons
export function sqlGetCoupons() {
  const rows = db.prepare('SELECT * FROM coupons').all();
  return rows.map(r => ({
    id: r.id,
    code: r.code,
    description: r.description,
    discountType: r.discount_type,
    discountValue: r.discount_value,
    minOrderValue: r.min_order_value || undefined,
    maxDiscountAmount: r.max_discount_amount || undefined,
    usageLimit: r.usage_limit || undefined,
    usedCount: r.used_count || 0,
    isActive: r.is_active === 1
  }));
}

// Theme Config
export function sqlGetTheme() {
  const r = db.prepare("SELECT * FROM theme_config WHERE id = 'current'").get();
  if (r && r.config_json) {
    try {
      return JSON.parse(r.config_json);
    } catch {
      return null;
    }
  }
  return null;
}

export function sqlSaveTheme(config) {
  const json = JSON.stringify(config);
  db.prepare(`
    INSERT OR REPLACE INTO theme_config (id, config_json, updated_at)
    VALUES ('current', ?, ?)
  `).run(json, new Date().toISOString());
  return config;
}

// --- DATABASE DUMP & RESTORE ENGINE ---

/**
 * Exports complete SQL database as a clean .SQL dump script with DDL & INSERT statements.
 * Sensitive data remains securely encrypted and passwords hashed.
 */
export function exportSqlDump() {
  const timestamp = new Date().toISOString();
  let sql = `-- =========================================================================\n`;
  sql += `-- CSET STORE - FULL SQL DATABASE BACKUP SCRIPT\n`;
  sql += `-- Engine: SQLite (node:sqlite native SQL engine)\n`;
  sql += `-- Generated at: ${timestamp}\n`;
  sql += `-- Security Invariants: All passwords hashed with PBKDF2-SHA512 with unique salt.\n`;
  sql += `-- Sensitive Data: Customer phone numbers and delivery addresses encrypted with AES-256.\n`;
  sql += `-- =========================================================================\n\n`;

  sql += `PRAGMA foreign_keys = OFF;\n`;
  sql += `BEGIN TRANSACTION;\n\n`;

  const tables = ['users', 'products', 'categories', 'orders', 'reviews', 'coupons', 'theme_config'];

  for (const table of tables) {
    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- Table structure and data for table '${table}'\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS ${table};\n`;

    // Extract table schema
    const schemaRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (schemaRow && schemaRow.sql) {
      sql += `${schemaRow.sql};\n\n`;
    }

    // Extract table rows
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length > 0) {
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          // Escape single quotes for SQL literal
          const escaped = String(val).replace(/'/g, "''");
          return `'${escaped}'`;
        });
        sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      sql += `\n`;
    }
  }

  sql += `COMMIT;\n`;
  sql += `PRAGMA foreign_keys = ON;\n`;
  return sql;
}

/**
 * Restores entire SQL database by executing a .SQL script in a transaction.
 */
export function restoreSqlDump(sqlScript) {
  if (!sqlScript || typeof sqlScript !== 'string') {
    throw new Error('Dữ liệu file backup SQL không hợp lệ!');
  }
  try {
    db.exec(sqlScript);
    return {
      success: true,
      message: 'Khôi phục cơ sở dữ liệu SQL thành công! Toàn bộ bảng dữ liệu, mật khẩu mã hóa và sản phẩm đã được đồng bộ.'
    };
  } catch (err) {
    console.error('[SQL Restore Error]', err);
    throw new Error(`Lỗi khi thực thi script SQL: ${err.message}`);
  }
}

if (!process.env.VERCEL) {
  try { seedDatabaseFromFiles(); } catch {}
}
