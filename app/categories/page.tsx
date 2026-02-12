import Link from 'next/link';
import { rootDomain } from '@/lib/utils';
import { getTopLevelCategories } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Factory, Package, ShoppingBag, Globe, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Browse Categories | ${rootDomain}`,
  description: `Explore industries and suppliers on ${rootDomain}`,
};

// Fallback categories shown when the database has none
const fallbackCategories = [
  { name: 'Electronics', slug: 'electronics', description: 'OEM/ODM, PCB, chips, and finished goods', productCount: 0 },
  { name: 'Textiles', slug: 'textiles', description: 'Garments, fabrics, trims, and accessories', productCount: 0 },
  { name: 'Machinery', slug: 'machinery', description: 'Industrial equipment and components', productCount: 0 },
  { name: 'Raw Materials', slug: 'raw-materials', description: 'Metals, plastics, chemicals', productCount: 0 },
  { name: 'Consumer Goods', slug: 'consumer-goods', description: 'Household, personal care, and more', productCount: 0 },
];

export default async function CategoriesPage() {
  const dbCategories = await getTopLevelCategories();

  // Use DB categories if any exist, otherwise fall back to hardcoded list
  const categories = dbCategories.length > 0
    ? dbCategories.map(c => ({
        name: c.name,
        slug: c.slug,
        description: c.description ?? '',
        productCount: c._count.products,
        children: c.children,
      }))
    : fallbackCategories.map(c => ({ ...c, children: [] as { id: string; name: string; slug: string; productCount: number }[] }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent hidden sm:block">
              Supply Me
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-orange-600">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">Categories</span>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <p className="text-sm font-semibold text-orange-100 mb-1">Explore</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Product Categories</h1>
          <p className="text-orange-100 mt-2">Jump into the industries you source most. Each category links to live supplier stores.</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="group block h-full">
              <div className="p-6 rounded-2xl border bg-white shadow-sm h-full transition-all group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-orange-200">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600">{cat.name}</h3>
                {cat.description && (
                  <p className="text-sm text-gray-600 mb-3">{cat.description}</p>
                )}
                {cat.productCount > 0 && (
                  <p className="text-xs text-gray-400 mb-2">{cat.productCount} products</p>
                )}
                {cat.children.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {cat.children.slice(0, 4).map(child => (
                      <span key={child.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {child.name}
                      </span>
                    ))}
                    {cat.children.length > 4 && (
                      <span className="text-xs text-gray-400">+{cat.children.length - 4} more</span>
                    )}
                  </div>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-orange-600 font-medium">
                  View suppliers <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white border rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-orange-600">Need something specific?</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Let us match you to a factory</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">Tell us your requirements and we will shortlist verified manufacturers from our network.</p>
          </div>
          <Link href="/contact">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500">Talk to sourcing</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
