import { pgTable, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Categories Table (Collections)
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  bannerImage: text('banner_image'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Parent Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  priceBdt: integer('price_bdt').notNull(),
  compareAtPriceBdt: integer('compare_at_price_bdt'),
  collectionTag: text('collection_tag').default('Minimal'),
  specifications: text('specifications'),
  categoryId: uuid('category_id').references(() => categories.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Color Variants Table (Dual-Axis with Size Stock)
export const colorVariants = pgTable('color_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  hexColor: text('hex_color'),
  thumbnailUrl: text('thumbnail_url').notNull(),
  isLowStock: boolean('is_low_stock').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Variant Images (Gallery per color variant)
export const variantImages = pgTable('variant_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').references(() => colorVariants.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
});

// 5. Stock Inventory per Size ('S', 'M', 'L', 'XL', 'XXL')
export const stockInventory = pgTable('stock_inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').references(() => colorVariants.id, { onDelete: 'cascade' }).notNull(),
  sku: text('sku'),
  size: text('size').notNull(),
  quantity: integer('quantity').default(10).notNull(),
  isStockOut: boolean('is_stock_out').default(false).notNull(),
});

// 6. Promo Codes & Gift Cards
export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),
  minCartValue: integer('min_cart_value').default(0).notNull(),
  usageLimit: integer('usage_limit'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Marquee Text & Top Banner Announcements
export const marqueeAnnouncements = pgTable('marquee_announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  message: text('message').notNull(),
  linkUrl: text('link_url'),
  bgColor: text('bg_color').default('#050505').notNull(),
  textColor: text('text_color').default('#ffffff').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Customers Table (Platform CRM & Guest Orders Database)
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull().unique(),
  email: text('email'),
  address: text('address'),
  apt: text('apt'),
  city: text('city'),
  district: text('district'),
  postalCode: text('postal_code'),
  totalOrdersCount: integer('total_orders_count').default(1).notNull(),
  totalSpentBdt: integer('total_spent_bdt').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Orders Table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  shippingAddress: text('shipping_address').notNull(),
  city: text('city'),
  district: text('district'),
  postalCode: text('postal_code'),
  subtotalBdt: integer('subtotal_bdt').default(0),
  vatBdt: integer('vat_bdt').default(0),
  deliveryChargeBdt: integer('delivery_charge_bdt').default(150),
  discountBdt: integer('discount_bdt').default(0),
  totalAmount: text('total_amount').notNull(),
  paymentMethod: text('payment_method').default('Cash on Delivery').notNull(),
  deliveryInstructions: text('delivery_instructions'),
  status: text('status').default('Pending').notNull(), // 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
  paymentStatus: text('payment_status').default('Unpaid (COD)').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Order Items Table
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').default('Apparel Item'),
  variantName: text('variant_name'),
  size: text('size'),
  thumbnailUrl: text('thumbnail_url'),
  quantity: integer('quantity').notNull(),
  priceBdt: integer('price_bdt').notNull(),
  price: text('price').notNull(),
});

// 11. Newsletter Subscribers CRM
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
});

// 12. Geographic Shipping Regions & Cities
export const shippingRegions = pgTable('shipping_regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  regionName: text('region_name').notNull().unique(),
  cities: text('cities').notNull(),
  deliveryChargeBdt: integer('delivery_charge_bdt').default(100).notNull(),
});

// Drizzle Relational Mappings
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  colorVariants: many(colorVariants),
}));

export const colorVariantsRelations = relations(colorVariants, ({ one, many }) => ({
  product: one(products, { fields: [colorVariants.productId], references: [products.id] }),
  variantImages: many(variantImages),
  stockInventory: many(stockInventory),
}));

export const variantImagesRelations = relations(variantImages, ({ one }) => ({
  variant: one(colorVariants, { fields: [variantImages.variantId], references: [colorVariants.id] }),
}));

export const stockInventoryRelations = relations(stockInventory, ({ one }) => ({
  variant: one(colorVariants, { fields: [stockInventory.variantId], references: [colorVariants.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

// 13. Better Auth Schema Tables (User, Session, Account, Verification)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role').default('user').notNull(), // 'superadmin' | 'admin' | 'user'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
