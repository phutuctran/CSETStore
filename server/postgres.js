import { neon } from '@neondatabase/serverless';
import { hashPasswordArgon2, verifyPassword } from './database.js';

function getDbUrl() {
  return process.env.DATABASE_URL ||
         process.env.POSTGRES_URL ||
         process.env.DATABASE_URL_UNPOOLED ||
         process.env.POSTGRES_PRISMA_URL ||
         '';
}

export function isPostgresConfigured() {
  return !!getDbUrl();
}

function getSql() {
  const url = getDbUrl();
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(url);
}

// ----------------- PRODUCTS -----------------
export async function pgGetProducts() {
  const sql = getSql();
  const rows = await sql`SELECT * FROM products ORDER BY id ASC;`;
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    subCategory: r.sub_category,
    price: r.price,
    originalPrice: r.original_price,
    discountPercent: r.discount_percent,
    discountStartDate: r.discount_start_date,
    discountEndDate: r.discount_end_date,
    image: r.image,
    images: r.images_json ? JSON.parse(r.images_json) : [r.image],
    description: r.description,
    brand: r.brand,
    sku: r.sku,
    stock: r.stock,
    origin: r.origin,
    warranty: r.warranty,
    weight: r.weight,
    condition: r.condition,
    specifications: r.specifications_json ? JSON.parse(r.specifications_json) : [],
    variantGroups: r.variant_groups_json ? JSON.parse(r.variant_groups_json) : [],
    soldCount: r.sold_count || 0,
    showOnHome: Boolean(r.show_on_home),
    maxPurchaseLimit: r.max_purchase_limit || undefined,
    variantCombinations: r.variant_combinations_json ? JSON.parse(r.variant_combinations_json) : undefined
  }));
}

export async function pgGetProductById(id) {
  const sql = getSql();
  const rows = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1;`;
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    subCategory: r.sub_category,
    price: r.price,
    originalPrice: r.original_price,
    discountPercent: r.discount_percent,
    discountStartDate: r.discount_start_date,
    discountEndDate: r.discount_end_date,
    image: r.image,
    images: r.images_json ? JSON.parse(r.images_json) : [r.image],
    description: r.description,
    brand: r.brand,
    sku: r.sku,
    stock: r.stock,
    origin: r.origin,
    warranty: r.warranty,
    weight: r.weight,
    condition: r.condition,
    specifications: r.specifications_json ? JSON.parse(r.specifications_json) : [],
    variantGroups: r.variant_groups_json ? JSON.parse(r.variant_groups_json) : [],
    soldCount: r.sold_count || 0,
    showOnHome: Boolean(r.show_on_home),
    maxPurchaseLimit: r.max_purchase_limit || undefined,
    variantCombinations: r.variant_combinations_json ? JSON.parse(r.variant_combinations_json) : undefined
  };
}

export async function pgCreateProduct(p) {
  const sql = getSql();
  let newId = p.id;
  if (!newId) {
    const maxRow = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products;`;
    newId = maxRow[0].next_id;
  }
  await sql`
    INSERT INTO products (
      id, name, category, sub_category, price, original_price,
      discount_percent, discount_start_date, discount_end_date,
      image, images_json, description, brand, sku, stock, origin,
      warranty, weight, condition, specifications_json, variant_groups_json,
      sold_count, show_on_home, max_purchase_limit, variant_combinations_json
    ) VALUES (
      ${newId}, ${p.name}, ${p.category}, ${p.subCategory || null}, ${p.price}, ${p.originalPrice || null},
      ${p.discountPercent || null}, ${p.discountStartDate || null}, ${p.discountEndDate || null},
      ${p.image}, ${p.images ? JSON.stringify(p.images) : null}, ${p.description}, ${p.brand || null},
      ${p.sku || null}, ${p.stock || 50}, ${p.origin || null}, ${p.warranty || null}, ${p.weight || null},
      ${p.condition || null}, ${p.specifications ? JSON.stringify(p.specifications) : null},
      ${p.variantGroups ? JSON.stringify(p.variantGroups) : null}, ${p.soldCount || 0}, ${p.showOnHome ? 1 : 0},
      ${p.maxPurchaseLimit || 0}, ${p.variantCombinations ? JSON.stringify(p.variantCombinations) : null}
    );
  `;
  return pgGetProductById(newId);
}

export async function pgUpdateProduct(id, patch) {
  const existing = await pgGetProductById(id);
  if (!existing) return false;
  const merged = { ...existing, ...patch };
  const sql = getSql();
  await sql`
    UPDATE products SET
      name = ${merged.name},
      category = ${merged.category},
      sub_category = ${merged.subCategory || null},
      price = ${merged.price},
      original_price = ${merged.originalPrice || null},
      discount_percent = ${merged.discountPercent || null},
      discount_start_date = ${merged.discountStartDate || null},
      discount_end_date = ${merged.discountEndDate || null},
      image = ${merged.image},
      images_json = ${merged.images ? JSON.stringify(merged.images) : null},
      description = ${merged.description},
      brand = ${merged.brand || null},
      sku = ${merged.sku || null},
      stock = ${merged.stock},
      origin = ${merged.origin || null},
      warranty = ${merged.warranty || null},
      weight = ${merged.weight || null},
      condition = ${merged.condition || null},
      specifications_json = ${merged.specifications ? JSON.stringify(merged.specifications) : null},
      variant_groups_json = ${merged.variantGroups ? JSON.stringify(merged.variantGroups) : null},
      sold_count = ${merged.soldCount || 0},
      show_on_home = ${merged.showOnHome ? 1 : 0},
      max_purchase_limit = ${merged.maxPurchaseLimit || 0},
      variant_combinations_json = ${merged.variantCombinations ? JSON.stringify(merged.variantCombinations) : null}
    WHERE id = ${id};
  `;
  return true;
}

export async function pgDeleteProduct(id) {
  const sql = getSql();
  await sql`DELETE FROM products WHERE id = ${id};`;
  return true;
}

export async function pgAutoSelectTop5BestSellers() {
  const sql = getSql();
  await sql`UPDATE products SET show_on_home = 0;`;
  await sql`UPDATE products SET show_on_home = 1 WHERE id IN (SELECT id FROM products ORDER BY sold_count DESC, id ASC LIMIT 5);`;
  return pgGetProducts();
}

// ----------------- USERS -----------------
export async function pgGetUsers() {
  const sql = getSql();
  const rows = await sql`SELECT * FROM users ORDER BY created_at DESC;`;
  return rows.map(r => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    phone: r.phone_encrypted || '',
    address: r.address_encrypted || '',
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

export async function pgGetUserById(id) {
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1;`;
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    password_hash: r.password_hash,
    fullName: r.full_name,
    phone: r.phone_encrypted || '',
    address: r.address_encrypted || '',
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

export async function pgGetUserByUsername(username) {
  if (!username) return null;
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE LOWER(username) = LOWER(${username.trim()}) LIMIT 1;`;
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    password_hash: r.password_hash,
    fullName: r.full_name,
    phone: r.phone_encrypted || '',
    address: r.address_encrypted || '',
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

export async function pgCreateUser(u) {
  const sql = getSql();
  const id = u.id || 'USR-' + Date.now().toString(36).toUpperCase();
  let passHash = u.password_hash;
  if (!passHash) {
    if (u.password && (u.password.startsWith('$argon2id$') || u.password.startsWith('pbkdf2:'))) {
      passHash = u.password;
    } else {
      passHash = await hashPasswordArgon2(u.password || '123');
    }
  }
  await sql`
    INSERT INTO users (
      id, username, password_hash, full_name, phone_encrypted, address_encrypted,
      role, created_at, email, city, district, ward, gender, birthday, avatar, bio
    ) VALUES (
      ${id}, ${u.username.trim()}, ${passHash}, ${u.fullName || u.full_name || ''},
      ${u.phone || ''}, ${u.address || ''}, ${u.role || 'customer'},
      ${u.createdAt || new Date().toLocaleString('vi-VN')},
      ${u.email || ''}, ${u.city || ''}, ${u.district || ''}, ${u.ward || ''},
      ${u.gender || 'male'}, ${u.birthday || ''}, ${u.avatar || ''}, ${u.bio || ''}
    );
  `;
  return pgGetUserById(id);
}

export async function pgUpdateUser(id, patch) {
  const existing = await pgGetUserById(id);
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

  const sql = getSql();
  await sql`
    UPDATE users SET
      password_hash = ${passHash},
      full_name = ${fullName},
      phone_encrypted = ${phone},
      address_encrypted = ${address},
      role = ${role},
      email = ${email},
      city = ${city},
      district = ${district},
      ward = ${ward},
      gender = ${gender},
      birthday = ${birthday},
      avatar = ${avatar},
      bio = ${bio}
    WHERE id = ${id};
  `;

  return pgGetUserById(id);
}

export async function pgDeleteUser(id) {
  const sql = getSql();
  await sql`DELETE FROM users WHERE id = ${id};`;
  return true;
}

// ----------------- ORDERS -----------------
export async function pgGetOrders() {
  const sql = getSql();
  const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC;`;
  return rows.map(r => ({
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    phone: r.phone_encrypted,
    address: r.address_encrypted,
    items: JSON.parse(r.items_json || '[]'),
    subtotalAmount: r.subtotal_amount,
    couponCode: r.coupon_code,
    discountAmount: r.discount_amount,
    totalAmount: r.total_amount,
    status: r.status,
    createdAt: r.created_at
  }));
}

export async function pgCreateOrder(order) {
  const sql = getSql();
  const id = order.id || 'ORD-' + Date.now().toString(36).toUpperCase();
  const createdAt = order.createdAt || new Date().toLocaleString('vi-VN');
  const totalAmount = Math.round(Number(order.totalAmount) || 0);
  const subtotalAmount = Math.round(Number(order.subtotalAmount || order.totalAmount) || 0);
  const discountAmount = Math.round(Number(order.discountAmount) || 0);
  const customerId = (order.customerId && typeof order.customerId === 'string' && order.customerId.trim()) ? order.customerId.trim() : null;

  await sql`
    INSERT INTO orders (
      id, customer_id, customer_name, phone_encrypted, address_encrypted,
      items_json, subtotal_amount, coupon_code, discount_amount, total_amount, status, created_at
    ) VALUES (
      ${id}, ${customerId}, ${order.customerName || 'Khách Vãng Lai'},
      ${order.phone || ''}, ${order.address || ''},
      ${JSON.stringify(order.items || [])},
      ${subtotalAmount},
      ${order.couponCode || null},
      ${discountAmount},
      ${totalAmount},
      ${order.status || 'pending'},
      ${createdAt}
    );
  `;
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

export async function pgUpdateOrderStatus(id, status) {
  const sql = getSql();
  await sql`UPDATE orders SET status = ${status} WHERE id = ${id};`;
  return true;
}

// ----------------- REVIEWS -----------------
export async function pgGetReviews(productId, includeHidden = false) {
  const sql = getSql();
  let rows;
  if (productId) {
    if (includeHidden) {
      rows = await sql`SELECT * FROM reviews WHERE product_id = ${parseInt(productId, 10)} ORDER BY created_at DESC;`;
    } else {
      rows = await sql`SELECT * FROM reviews WHERE product_id = ${parseInt(productId, 10)} AND (hidden = 0 OR hidden IS NULL) ORDER BY created_at DESC;`;
    }
  } else {
    if (includeHidden) {
      rows = await sql`SELECT * FROM reviews ORDER BY created_at DESC;`;
    } else {
      rows = await sql`SELECT * FROM reviews WHERE (hidden = 0 OR hidden IS NULL) ORDER BY created_at DESC;`;
    }
  }
  return rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    userId: r.user_id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    images: r.images_json ? JSON.parse(r.images_json) : [],
    verifiedPurchase: Boolean(r.verified_purchase),
    hidden: Boolean(r.hidden),
    adminReply: r.admin_reply_json ? JSON.parse(r.admin_reply_json) : undefined,
    createdAt: r.created_at
  }));
}

export async function pgCreateReview(rev) {
  const sql = getSql();
  const id = rev.id || 'rev-' + Date.now();
  const createdAt = rev.createdAt || new Date().toLocaleString('vi-VN');
  await sql`
    INSERT INTO reviews (
      id, product_id, user_id, user_name, rating, comment, images_json,
      verified_purchase, hidden, admin_reply_json, created_at
    ) VALUES (
      ${id}, ${rev.productId}, ${rev.userId || ''}, ${rev.userName},
      ${rev.rating}, ${rev.comment}, ${rev.images ? JSON.stringify(rev.images) : null},
      ${rev.verifiedPurchase ? 1 : 0}, ${rev.hidden ? 1 : 0},
      ${rev.adminReply ? JSON.stringify(rev.adminReply) : null}, ${createdAt}
    );
  `;
  return { ...rev, id, createdAt };
}

export async function pgUpdateReview(id, patch) {
  const sql = getSql();
  const rows = await sql`SELECT * FROM reviews WHERE id = ${id} LIMIT 1;`;
  if (!rows || rows.length === 0) return false;
  const current = rows[0];

  const rating = patch.rating !== undefined ? patch.rating : current.rating;
  const comment = patch.comment !== undefined ? patch.comment : current.comment;
  const hidden = patch.hidden !== undefined ? (patch.hidden ? 1 : 0) : current.hidden;
  const imagesJson = patch.images !== undefined ? JSON.stringify(patch.images) : current.images_json;
  const adminReplyJson = patch.adminReply !== undefined ? JSON.stringify(patch.adminReply) : current.admin_reply_json;

  await sql`
    UPDATE reviews SET
      rating = ${rating},
      comment = ${comment},
      hidden = ${hidden},
      images_json = ${imagesJson},
      admin_reply_json = ${adminReplyJson}
    WHERE id = ${id};
  `;
  return true;
}

export async function pgDeleteReview(id) {
  const sql = getSql();
  await sql`DELETE FROM reviews WHERE id = ${id};`;
  return true;
}

// ----------------- THEME CONFIG -----------------
export async function pgGetTheme() {
  const sql = getSql();
  const rows = await sql`SELECT config_json FROM theme_config WHERE id = 1 LIMIT 1;`;
  if (!rows || rows.length === 0) return null;
  return JSON.parse(rows[0].config_json);
}

export async function pgSaveTheme(theme) {
  const sql = getSql();
  const jsonStr = JSON.stringify(theme);
  const now = new Date().toISOString();
  await sql`
    INSERT INTO theme_config (id, config_json, updated_at)
    VALUES (1, ${jsonStr}, ${now})
    ON CONFLICT (id) DO UPDATE SET config_json = ${jsonStr}, updated_at = ${now};
  `;
  return theme;
}

// ----------------- CATEGORIES -----------------
export async function pgGetCategories() {
  const sql = getSql();
  const rows = await sql`SELECT * FROM categories;`;
  return rows.map(r => ({
    key: r.key,
    label: r.label,
    icon: r.icon,
    customIconImage: r.custom_icon_image,
    subcategories: r.subcategories_json ? JSON.parse(r.subcategories_json) : []
  }));
}

// ----------------- COUPONS -----------------
export async function pgGetCoupons() {
  const sql = getSql();
  const rows = await sql`SELECT * FROM coupons ORDER BY id ASC;`;
  return rows.map(r => ({
    id: r.id,
    code: r.code,
    description: r.description,
    discountType: r.discount_type,
    discountValue: r.discount_value,
    minOrderValue: r.min_order_value || undefined,
    maxDiscountAmount: r.max_discount_amount || r.max_discount || undefined,
    usageLimit: r.usage_limit || undefined,
    usedCount: r.used_count || 0,
    startDate: r.start_date || undefined,
    endDate: r.end_date || undefined,
    isActive: Boolean(r.is_active)
  }));
}

export async function pgCreateCoupon(c) {
  const sql = getSql();
  const id = c.id || 'coup-' + Date.now().toString(36);
  const code = c.code.trim().toUpperCase();
  const discountValue = Math.round(Number(c.discountValue) || 0);
  const minOrderValue = Math.round(Number(c.minOrderValue) || 0);
  const maxDiscountAmount = Math.round(Number(c.maxDiscountAmount) || 0);
  const usageLimit = c.usageLimit ? Math.round(Number(c.usageLimit)) : null;
  const usedCount = Math.round(Number(c.usedCount) || 0);
  const isActive = c.isActive !== false ? 1 : 0;
  await sql`
    INSERT INTO coupons (
      id, code, description, discount_type, discount_value, min_order_value,
      max_discount_amount, usage_limit, used_count, is_active
    ) VALUES (
      ${id}, ${code}, ${c.description || ''}, ${c.discountType || 'percentage'},
      ${discountValue}, ${minOrderValue}, ${maxDiscountAmount}, ${usageLimit},
      ${usedCount}, ${isActive}
    );
  `;
  return { ...c, id, code, usedCount, isActive: Boolean(isActive) };
}

export async function pgUpdateCoupon(id, patch) {
  const sql = getSql();
  const rows = await sql`SELECT * FROM coupons WHERE id = ${id} LIMIT 1;`;
  if (!rows || rows.length === 0) return false;
  const current = rows[0];

  const code = patch.code ? patch.code.trim().toUpperCase() : current.code;
  const description = patch.description !== undefined ? patch.description : current.description;
  const discountType = patch.discountType !== undefined ? patch.discountType : current.discount_type;
  const discountValue = patch.discountValue !== undefined ? Math.round(Number(patch.discountValue)) : current.discount_value;
  const minOrderValue = patch.minOrderValue !== undefined ? Math.round(Number(patch.minOrderValue)) : current.min_order_value;
  const maxDiscountAmount = patch.maxDiscountAmount !== undefined ? Math.round(Number(patch.maxDiscountAmount)) : (current.max_discount_amount || 0);
  const usageLimit = patch.usageLimit !== undefined ? (patch.usageLimit ? Math.round(Number(patch.usageLimit)) : null) : current.usage_limit;
  const usedCount = patch.usedCount !== undefined ? Math.round(Number(patch.usedCount)) : current.used_count;
  const isActive = patch.isActive !== undefined ? (patch.isActive ? 1 : 0) : current.is_active;

  await sql`
    UPDATE coupons SET
      code = ${code},
      description = ${description},
      discount_type = ${discountType},
      discount_value = ${discountValue},
      min_order_value = ${minOrderValue},
      max_discount_amount = ${maxDiscountAmount},
      usage_limit = ${usageLimit},
      used_count = ${usedCount},
      is_active = ${isActive}
    WHERE id = ${id};
  `;
  return true;
}

export async function pgDeleteCoupon(id) {
  const sql = getSql();
  await sql`DELETE FROM coupons WHERE id = ${id};`;
  return true;
}
