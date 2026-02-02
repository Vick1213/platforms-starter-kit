import Link from 'next/link';
import { rootDomain, getSellerPortalUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Factory, Globe, Shield, Truck, Users } from 'lucide-react';

export const metadata = {
  title: `How It Works | ${rootDomain}`,
  description: `Learn how ${rootDomain} connects importers and manufacturers`,
};

const steps = [
  { title: 'Browse suppliers', description: 'Search verified manufacturers and view store pages.' },
  { title: 'Start a conversation', description: 'Send messages, request quotes, and share specs securely.' },
  { title: 'Agree on price & terms', description: 'Finalize pricing, incoterms, and payment milestones.' },
  { title: 'Book logistics', description: 'Choose shipping options and track handoff to carriers.' },
  { title: 'Release payment', description: 'Funds are released after milestones are confirmed.' },
];

const highlights = [
  { icon: Shield, title: 'Escrow & moderation', body: 'Platform-level safeguards reduce disputes.' },
  { icon: Truck, title: 'Shipping support', body: 'Route planning, quotes, and status updates.' },
  { icon: Globe, title: 'Global ready', body: 'Built for cross-border trade and compliance.' },
  { icon: Users, title: 'Collaboration', body: 'Buyers, sellers, and ops teams stay in sync.' },
  { icon: Factory, title: 'Factory-first', body: 'Seller tools for catalogs, pricing, and media.' },
  { icon: CheckCircle2, title: 'Fast onboarding', body: 'Guided setup with verification checkpoints.' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Platform guide</p>
              <p className="text-lg font-semibold text-gray-900">How {rootDomain} works</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/register">
              <Button variant="outline" size="sm">Buyer signup</Button>
            </Link>
            <a href={getSellerPortalUrl()}>
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500">List your factory</Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <section className="bg-white rounded-2xl shadow-sm border p-8">
          <p className="text-sm font-semibold text-orange-600 mb-2">End-to-end flow</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">From inquiry to delivery</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={step.title} className="p-4 rounded-xl border bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold">{idx + 1}</span>
                  Step {idx + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6 rounded-xl border bg-white shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{body}</p>
            </div>
          ))}
        </section>

        <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-400">Next step</p>
            <h2 className="text-2xl font-bold mt-2">Ready to get started?</h2>
            <p className="text-gray-200 mt-2">Create a buyer account or list your factory and start receiving inquiries.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">Buyer signup</Button>
            </Link>
            <a href={getSellerPortalUrl()}>
              <Button size="lg" className="bg-white text-gray-900">Go to seller portal</Button>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
