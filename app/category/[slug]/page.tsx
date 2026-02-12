import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProductsByCategory, getCompaniesByCategory } from '@/lib/db';
import { rootDomain, buildSubdomainUrl } from '@/lib/utils';
import {
  Globe, ArrowLeft, ChevronRight, Store, Shield,
  Package, Factory, Search, SlidersHorizontal,
  Star, MapPin, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };
  return {
    title: `${category.name} Suppliers & Products | Supply Me`,
    description: category.description ?? `Browse ${category.name} products and verified manufacturers on Supply Me.`,
  };
}

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = parseInt(sp.page ?? '1', 10);
  const sortBy = (sp.sort ?? 'newest') as 'newest' | 'price-low' | 'price-high' | 'popular';

  const [{ products, total }, companies] = await Promise.all([
    getProductsByCategory(slug, { page, limit: 20, sortBy }),
    getCompaniesByCategory(slug),
  ]);

  const totalPages = Math.ceil(total / 20);

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

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
          <nav className="flex items-center gap-1 text-sm text-gray-500 flex-1 min-w-0">
            <Link href="/" className="hover:text-orange-600">Home</Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <Link href="/categories" className="hover:text-orange-600">Categories</Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            {category.parent && (
              <>
                <Link href={`/category/${category.parent.slug}`} className="hover:text-orange-600 truncate">
                  {category.parent.name}
                </Link>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              </>
            )}
            <span className="text-gray-900 font-medium truncate">{category.name}</span>
          </nav>
        </div>
      </header>

      {/* Category Banner */}
      <section className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <Link href="/categories" className="inline-flex items-center gap-1 text-orange-100 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Categories
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-orange-100 max-w-2xl">{category.description}</p>
          )}
          <div className="flex items-center gap-6 mt-4 text-orange-100 text-sm">
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {total} {total === 1 ? 'product' : 'products'}
            </span>
            <span className="flex items-center gap-1">
              <Factory className="w-4 h-4" />
              {companies.length} {companies.length === 1 ? 'supplier' : 'suppliers'}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            {/* Sub-categories */}
            {category.children.length > 0 && (
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Sub-categories
                </h3>
                <ul className="space-y-2">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/category/${child.slug}`}
                        className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 py-1"
                      >
                        <span>{child.name}</span>
                        <span className="text-xs text-gray-400">{child._count.products}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Suppliers in category */}
            {companies.length > 0 && (
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Top Suppliers
                </h3>
                <ul className="space-y-3">
                  {companies.slice(0, 8).map((company) => (
                    <li key={company.id}>
                      <Link
                        href={company.seller?.subdomain ? buildSubdomainUrl(company.seller.subdomain) : '#'}
                        className="flex items-center gap-3 group"
                      >
                        {company.logo ? (
                          <img src={company.logo} alt={company.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Factory className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600">
                            {company.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {company.country && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {company.country}
                              </span>
                            )}
                            {company.verificationStatus === 'VERIFIED' || company.verificationStatus === 'GOLD_SUPPLIER' ? (
                              <span className="text-green-600 flex items-center gap-0.5">
                                <Shield className="w-3 h-3" />
                                Verified
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort & Count Bar */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-600">
                Showing <strong>{products.length}</strong> of <strong>{total}</strong> products
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
                <div className="flex gap-1">
                  {sortOptions.map((opt) => (
                    <Link
                      key={opt.value}
                      href={`/category/${slug}?sort=${opt.value}${page > 1 ? `&page=${page}` : ''}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        sortBy === opt.value
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border p-16 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  There are no active products listed in {category.name} yet. Check back later or explore other categories.
                </p>
                <Link href="/categories">
                  <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    Browse All Categories
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => {
                  const image = product.images?.[0]?.url ?? product.thumbnail;
                  const companySubdomain = product.company?.seller?.subdomain;
                  const productUrl = companySubdomain
                    ? `${buildSubdomainUrl(companySubdomain)}/products/${product.slug}`
                    : '#';

                  return (
                    <Link key={product.id} href={productUrl} className="group">
                      <div className="bg-white rounded-xl border overflow-hidden transition-all group-hover:shadow-lg group-hover:border-orange-200">
                        {/* Image */}
                        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                          {product.featured && (
                            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                              Featured
                            </span>
                          )}
                          {product.newArrival && (
                            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 text-sm mb-1">
                            {product.name}
                          </h3>

                          {/* Price */}
                          {(product.minPrice != null || product.maxPrice != null) && (
                            <p className="text-orange-600 font-bold text-base mb-2">
                              {product.minPrice != null && product.maxPrice != null && product.minPrice !== product.maxPrice
                                ? `$${product.minPrice.toFixed(2)} – $${product.maxPrice.toFixed(2)}`
                                : `$${(product.minPrice ?? product.maxPrice)?.toFixed(2)}`}
                              {product.priceUnit && (
                                <span className="text-xs font-normal text-gray-500 ml-1">/ {product.priceUnit}</span>
                              )}
                            </p>
                          )}

                          {/* MOQ */}
                          {product.moq && (
                            <p className="text-xs text-gray-500 mb-2">
                              MOQ: {product.moq} {product.moqUnit ?? 'pieces'}
                            </p>
                          )}

                          {/* Company info */}
                          {product.company && (
                            <div className="flex items-center gap-2 pt-2 border-t text-xs text-gray-500">
                              <Factory className="w-3 h-3" />
                              <span className="truncate">{product.company.name}</span>
                              {product.company.country && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {product.company.country}
                                  </span>
                                </>
                              )}
                              {(product.company.verificationStatus === 'VERIFIED' || product.company.verificationStatus === 'GOLD_SUPPLIER') && (
                                <Shield className="w-3 h-3 text-green-600 ml-auto flex-shrink-0" />
                              )}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            {product.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {product.rating.toFixed(1)}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-3 h-3" />
                              {product.viewCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={`/category/${slug}?page=${page - 1}&sort=${sortBy}`}
                    className="px-4 py-2 rounded-lg border bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={`/category/${slug}?page=${pageNum}&sort=${sortBy}`}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                        pageNum === page
                          ? 'bg-orange-500 text-white'
                          : 'border bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link
                    href={`/category/${slug}?page=${page + 1}&sort=${sortBy}`}
                    className="px-4 py-2 rounded-lg border bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
          © 2026 Supply Me. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
