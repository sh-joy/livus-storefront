import dotenv from 'dotenv';
import path from 'path';

// Load .env file FIRST
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading env from:', envPath);
const result = dotenv.config({ path: envPath });
console.log('Env loaded:', result.error ? `Error: ${result.error}` : 'Success');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

import { db } from '../src/db/index';
import { products, colorVariants, variantImages, stockInventory } from '../src/db/schema';

const productsToCreate = [
  {
    name: 'Light Gray Crewneck T-Shirt Half',
    slug: 'light-gray-crewneck-t-shirt-half',
    description: 'Premium crewneck t-shirt in light gray. Perfect for everyday wear.',
    priceBdt: 843,
    compareAtPriceBdt: 991,
    categoryId: '14d5283d-d8e9-4272-a54b-a8ff4babdea1',
    collectionTag: 'Minimal',
    color: 'Light Gray',
    hexColor: '#d3d3d3',
    imageUrl: 'https://cdn.gentlepark.com/products/2026/06/27/L6WeJHRCounnDB4cO8II1yWN5DNKhEsCKLoo3nky.jpg',
  },
  {
    name: 'Navy Blue Crewneck T-Shirt Half',
    slug: 'navy-blue-crewneck-t-shirt-half',
    description: 'Classic navy blue crewneck t-shirt. Timeless style for any occasion.',
    priceBdt: 1183,
    compareAtPriceBdt: 1391,
    categoryId: '14d5283d-d8e9-4272-a54b-a8ff4babdea1',
    collectionTag: 'Minimal',
    color: 'Navy Blue',
    hexColor: '#000080',
    imageUrl: 'https://cdn.gentlepark.com/products/2026/06/27/2X6we9HNy761qFK9jVawNmVWGzsRpeET166zblFD.jpg',
  },
  {
    name: 'Mint Green Crewneck T-Shirt Half',
    slug: 'mint-green-crewneck-t-shirt-half',
    description: 'Fresh mint green crewneck t-shirt. Perfect for summer vibes.',
    priceBdt: 843,
    compareAtPriceBdt: 991,
    categoryId: '14d5283d-d8e9-4272-a54b-a8ff4babdea1',
    collectionTag: 'Minimal',
    color: 'Mint Green',
    hexColor: '#98FF98',
    imageUrl: 'https://cdn.gentlepark.com/products/2026/06/27/KUElUaHlROJgt0HOdJhWyPO0i8HFomwO6QgPKPV7.jpg',
  },
  {
    name: 'Navy Blue Textured Knit T-Shirt with Pocket',
    slug: 'navy-blue-textured-knit-t-shirt-with-pocket',
    description: 'Textured knit t-shirt with front pocket detail. Premium comfort fabric.',
    priceBdt: 1012,
    compareAtPriceBdt: 1191,
    categoryId: '14d5283d-d8e9-4272-a54b-a8ff4babdea1',
    collectionTag: 'Minimal',
    color: 'Navy Blue',
    hexColor: '#000080',
    imageUrl: 'https://cdn.gentlepark.com/products/2026/05/05/zSKAl05qYIqJ1CdiTvZsSjJAuWrTbvZaPD1sKSQY.jpg',
  },
  {
    name: 'Pitch Black Smooth Minimalist T-Shirt',
    slug: 'pitch-black-smooth-minimalist-t-shirt',
    description: 'Smooth minimalist t-shirt in pure pitch black. Essential wardrobe piece.',
    priceBdt: 1182,
    compareAtPriceBdt: 1391,
    categoryId: '14d5283d-d8e9-4272-a54b-a8ff4babdea1',
    collectionTag: 'Minimal',
    color: 'Pitch Black',
    hexColor: '#000000',
    imageUrl: 'https://cdn.gentlepark.com/products/2026/03/03/6Sjcx4unMpXW746LfO7NJYXd4dyTSVo3GziHmvcu.jpg',
  },
];

async function createProducts() {
  if (!db) {
    console.log('Database not connected. Skipping product creation.');
    return;
  }

  try {
    for (const productData of productsToCreate) {
      console.log(`Creating ${productData.name}...`);

      // Create product
      const [newProduct] = await db
        .insert(products)
        .values({
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          priceBdt: productData.priceBdt,
          compareAtPriceBdt: productData.compareAtPriceBdt,
          categoryId: productData.categoryId,
          collectionTag: productData.collectionTag,
          isActive: true,
          specifications: productData.description,
        })
        .returning();

      // Create color variant
      const [newVariant] = await db
        .insert(colorVariants)
        .values({
          productId: newProduct.id,
          name: productData.color,
          hexColor: productData.hexColor,
          thumbnailUrl: productData.imageUrl,
          isLowStock: false,
        })
        .returning();

      // Add variant image
      await db.insert(variantImages).values({
        variantId: newVariant.id,
        imageUrl: productData.imageUrl,
        displayOrder: 0,
      });

      // Add inventory for all sizes
      const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      const quantities = [10, 15, 12, 8, 5];

      for (let i = 0; i < sizes.length; i++) {
        const cleanColor = productData.color.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const sku = `${productData.slug}-${sizes[i]}-${Date.now().toString(36)}-${i}`;

        await db.insert(stockInventory).values({
          variantId: newVariant.id,
          size: sizes[i] as 'S' | 'M' | 'L' | 'XL' | 'XXL',
          sku,
          quantity: quantities[i],
          isStockOut: false,
        });
      }

      console.log(`✓ Created ${productData.name}`);
    }

    console.log('✓ All products created successfully!');
  } catch (error) {
    console.error('Error creating products:', error);
  }
}

createProducts().then(() => process.exit(0));
