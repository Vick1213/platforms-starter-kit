import Link from 'next/link';
import { rootDomain } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Factory, Package, ShoppingBag } from 'lucide-react';

export const metadata = {
  title: `Browse Categories | ${rootDomain}`,
  description: `Explore industries and suppliers on ${rootDomain}`,
};

const categories = [
  { name: 'Electronics', icon: Factory, description: 'OEM/ODM, PCB, chips, and finished goods' },
  { name: 'Textiles', icon: Package, description: 'Garments, fabrics, trims, and accessories' },
  { name: 'Machinery', icon: Factory, description: 'Industrial equipment and components' },
  { name: 'Raw Materials', icon: Package, description: 'Metals, plastics, chemicals' },
  { name: 'Consumer Goods', icon: ShoppingBag, description: 'Household, personal care, and more' },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-sm font-semibold text-orange-600 mb-1">Explore</p>
          <h1 className="text-3xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-gray-600 mt-2">Jump into the industries you source most. Each category links to live supplier stores.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/category/${cat.name.toLowerCase().replace(/ & /g, '-')}`} className="group block h-full">
              <div className="p-6 rounded-2xl border bg-white shadow-sm h-full transition-transform group-hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                  <cat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cat.name}</h3>
                <p className="text-sm text-gray-600">{cat.description}</p>
                <span className="inline-flex items-center gap-1 text-sm text-orange-600 mt-4 font-medium">View suppliers →</span>
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
