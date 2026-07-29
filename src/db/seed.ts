import { db } from './index';
import { categories, products } from './schema';

async function seed() {
  console.log('Seeding Neon database...');

  try {
    // 1. Insert Categories
    const insertedCategories = await db.insert(categories).values([
      { name: 'Electronics & Audio', slug: 'electronics', description: 'Headphones, gadgets, & accessories' },
      { name: 'Apparel & Wearables', slug: 'apparel', description: 'Premium minimalist clothing' },
      { name: 'Home & Office', slug: 'home-office', description: 'Ergonomic workspace decor & tools' },
      { name: 'Accessories', slug: 'accessories', description: 'Everyday carrying essentials' },
    ]).onConflictDoNothing().returning();

    console.log(`Inserted ${insertedCategories.length} categories.`);

    const cats = await db.select().from(categories);
    const catMap = new Map(cats.map(c => [c.slug, c.id]));

    // 2. Insert Products
    await db.insert(products).values([
      {
        name: 'Acoustic Clarity Wireless Headphones',
        slug: 'acoustic-clarity-headphones',
        description: 'Active noise cancelling headphones with 40-hour battery life and spatial audio driver.',
        price: '249.99',
        stock: 25,
        categoryId: catMap.get('electronics'),
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        isFeatured: true,
      },
      {
        name: 'Ergonomic Minimalist Mechanical Keyboard',
        slug: 'ergonomic-mechanical-keyboard',
        description: 'Custom hot-swappable switches, anodized aluminum chassis, and RGB per-key backlighting.',
        price: '179.50',
        stock: 14,
        categoryId: catMap.get('electronics'),
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        isFeatured: true,
      },
      {
        name: 'Ultra-Light Leather Laptop Backpack',
        slug: 'leather-laptop-backpack',
        description: 'Handcrafted full-grain leather backpack with dedicated 16-inch padded laptop compartment.',
        price: '189.00',
        stock: 8,
        categoryId: catMap.get('accessories'),
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        isFeatured: false,
      },
      {
        name: 'Precision Smart Watch Chronograph',
        slug: 'precision-smart-watch',
        description: 'Titanium bezel, OLED display, continuous heart rate tracking, and 7-day battery life.',
        price: '299.00',
        stock: 19,
        categoryId: catMap.get('electronics'),
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        isFeatured: true,
      },
      {
        name: 'Matte Ceramic Coffee Mug & Warmer Set',
        slug: 'ceramic-coffee-warmer-set',
        description: 'Temperature-controlled smart mug with inductive warming coaster.',
        price: '64.99',
        stock: 42,
        categoryId: catMap.get('home-office'),
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        isFeatured: false,
      },
      {
        name: 'Organic Heavyweight Crewneck Sweatshirt',
        slug: 'heavyweight-crewneck-sweatshirt',
        description: '100% organic combed cotton, relaxed fit, brushed interior for extreme comfort.',
        price: '85.00',
        stock: 30,
        categoryId: catMap.get('apparel'),
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        isFeatured: false,
      }
    ]).onConflictDoNothing();

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    process.exit(0);
  }
}

seed();
