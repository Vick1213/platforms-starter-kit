/**
 * Seed default product categories into the database.
 *
 * Usage:  npx tsx prisma/seed-categories.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  position: number;
  children?: { name: string; slug: string; description: string; position: number }[];
}

const categories: SeedCategory[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'OEM/ODM, PCB assemblies, chips, components, and finished consumer electronics.',
    position: 0,
    children: [
      { name: 'Consumer Electronics', slug: 'consumer-electronics', description: 'Phones, tablets, laptops, and accessories', position: 0 },
      { name: 'Electronic Components', slug: 'electronic-components', description: 'PCBs, ICs, resistors, capacitors', position: 1 },
      { name: 'LED & Lighting', slug: 'led-lighting', description: 'LED strips, bulbs, commercial lighting', position: 2 },
      { name: 'Cables & Connectors', slug: 'cables-connectors', description: 'USB, HDMI, power cables, adapters', position: 3 },
    ],
  },
  {
    name: 'Textiles',
    slug: 'textiles',
    description: 'Garments, fabrics, yarn, trims, and fashion accessories from Asian mills.',
    position: 1,
    children: [
      { name: 'Apparel', slug: 'apparel', description: 'T-shirts, dresses, outerwear, uniforms', position: 0 },
      { name: 'Fabrics', slug: 'fabrics', description: 'Cotton, polyester, silk, blended fabrics', position: 1 },
      { name: 'Home Textiles', slug: 'home-textiles', description: 'Bedding, towels, curtains', position: 2 },
      { name: 'Yarn & Thread', slug: 'yarn-thread', description: 'Spun yarn, sewing thread, embroidery', position: 3 },
    ],
  },
  {
    name: 'Machinery',
    slug: 'machinery',
    description: 'Industrial machinery, CNC equipment, packaging machines, and spare parts.',
    position: 2,
    children: [
      { name: 'CNC & Metalworking', slug: 'cnc-metalworking', description: 'CNC machines, lathes, milling machines', position: 0 },
      { name: 'Packaging Machinery', slug: 'packaging-machinery', description: 'Filling, sealing, labeling machines', position: 1 },
      { name: 'Agricultural Machinery', slug: 'agricultural-machinery', description: 'Tractors, seeders, harvesters', position: 2 },
      { name: 'Machine Parts', slug: 'machine-parts', description: 'Bearings, gears, motors, hydraulics', position: 3 },
    ],
  },
  {
    name: 'Raw Materials',
    slug: 'raw-materials',
    description: 'Metals, plastics, chemicals, and other industrial raw materials.',
    position: 3,
    children: [
      { name: 'Metals & Alloys', slug: 'metals-alloys', description: 'Steel, aluminium, copper, titanium', position: 0 },
      { name: 'Plastics & Polymers', slug: 'plastics-polymers', description: 'PE, PP, PVC, ABS, engineering plastics', position: 1 },
      { name: 'Chemicals', slug: 'chemicals', description: 'Industrial chemicals, solvents, adhesives', position: 2 },
      { name: 'Rubber', slug: 'rubber', description: 'Natural rubber, synthetic rubber, silicone', position: 3 },
    ],
  },
  {
    name: 'Consumer Goods',
    slug: 'consumer-goods',
    description: 'Household items, personal care, kitchenware, and everyday products.',
    position: 4,
    children: [
      { name: 'Kitchenware', slug: 'kitchenware', description: 'Cookware, utensils, storage containers', position: 0 },
      { name: 'Personal Care', slug: 'personal-care', description: 'Skincare, haircare, cosmetics packaging', position: 1 },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Furniture, décor, outdoor living', position: 2 },
      { name: 'Toys & Games', slug: 'toys-games', description: 'Plush toys, board games, outdoor play', position: 3 },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding categories...');

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        position: cat.position,
        level: 0,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        position: cat.position,
        level: 0,
        isActive: true,
      },
    });
    console.log(`  ✓ ${parent.name} (${parent.id})`);

    if (cat.children) {
      for (const child of cat.children) {
        const sub = await prisma.category.upsert({
          where: { slug: child.slug },
          update: {
            name: child.name,
            description: child.description,
            position: child.position,
            parentId: parent.id,
            level: 1,
            isActive: true,
          },
          create: {
            name: child.name,
            slug: child.slug,
            description: child.description,
            position: child.position,
            parentId: parent.id,
            level: 1,
            isActive: true,
          },
        });
        console.log(`    — ${sub.name}`);
      }
    }
  }

  console.log('\n✅ Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
