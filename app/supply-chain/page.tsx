import Link from 'next/link';
import { rootDomain } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ClipboardList, Layers, Workflow } from 'lucide-react';

export const metadata = {
  title: `Supply Chain Tools | ${rootDomain}`,
  description: `Plan, track, and collaborate across your supply chain on ${rootDomain}`,
};

const tools = [
  { icon: Layers, title: 'Order milestones', description: 'Track POs from confirmation through production, QA, and shipment.' },
  { icon: Workflow, title: 'Approvals & docs', description: 'Keep specs, PI, CI, and packing lists in one shared space.' },
  { icon: ClipboardList, title: 'Risk checks', description: 'Flag lead-time slips and missing compliance docs early.' },
];

export default function SupplyChainPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-sm font-semibold text-orange-600 mb-1">Operations</p>
          <h1 className="text-3xl font-bold text-gray-900">Supply chain workspace</h1>
          <p className="text-gray-600 mt-2">A lightweight control tower for buyers and factories to stay aligned.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <div className="grid gap-6 md:grid-cols-3">
          {tools.map(({ icon: Icon, title, description }) => (
            <div key={title} className="p-6 rounded-2xl bg-white border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-orange-600">Try it</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Spin up a workspace</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">Create a store, add your team, and invite factory contacts to collaborate on live orders.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/register">
              <Button size="lg" variant="outline">Buyer signup</Button>
            </Link>
            <Link href="/auth/seller-register">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500">List your factory</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
