import Link from 'next/link';
import { rootDomain } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Ship, Route, Globe, Timer } from 'lucide-react';

export const metadata = {
  title: `Shipping & Logistics | ${rootDomain}`,
  description: `Shipping options and route planning on ${rootDomain}`,
};

export default function ShippingPage() {
  const services = [
    { title: 'Instant quotes', description: 'Compare sea, air, and rail options with current rates.' },
    { title: 'Route design', description: 'Pick ports, hubs, and consolidation paths that fit your SLA.' },
    { title: 'Milestone tracking', description: 'Stay aligned with sellers on pickup, customs, and delivery.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-sm font-semibold text-orange-600 mb-1">Logistics layer</p>
          <h1 className="text-3xl font-bold text-gray-900">Shipping & transport planning</h1>
          <p className="text-gray-600 mt-2">Coordinate freight with buyers and sellers, backed by live rates and routing support.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((s, i) => (
            <div key={s.title} className="p-6 rounded-2xl bg-white border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                {i === 0 && <Ship className="w-5 h-5" />}
                {i === 1 && <Route className="w-5 h-5" />}
                {i === 2 && <Timer className="w-5 h-5" />}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-400">Need a lane built?</p>
            <h2 className="text-2xl font-bold">Talk to our logistics desk</h2>
            <p className="text-gray-200 mt-2">We can suggest ports, forwarders, and timelines based on your origin and destination.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contact">
              <Button size="lg" variant="secondary">Contact us</Button>
            </Link>
            <Link href="/tariff-calculator">
              <Button size="lg" className="bg-white text-gray-900">Check tariffs</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
