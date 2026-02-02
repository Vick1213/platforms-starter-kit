import Link from 'next/link';
import { rootDomain } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BookOpen, Headset, LifeBuoy, MessageCircle } from 'lucide-react';

export const metadata = {
  title: `Help Center | ${rootDomain}`,
  description: `FAQs and support for ${rootDomain}`,
};

const faqs = [
  { q: 'How do I list my factory?', a: 'Register via the seller portal, submit business details, and await verification.' },
  { q: 'How does escrow work?', a: 'Funds are held until agreed milestones are met, then released to the seller.' },
  { q: 'Can I invite my team?', a: 'Yes. Add team members under settings and assign roles per workspace.' },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-sm font-semibold text-orange-600 mb-1">Support</p>
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-2">Guides, FAQs, and ways to reach our team.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="p-6 bg-white border rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3"><BookOpen className="w-5 h-5" /></div>
            <h3 className="font-semibold text-gray-900 mb-2">Guides</h3>
            <p className="text-sm text-gray-600">Onboarding, listing products, and managing orders.</p>
            <Button variant="link" className="px-0 text-orange-600" asChild>
              <Link href="/how-it-works">View how it works</Link>
            </Button>
          </div>
          <div className="p-6 bg-white border rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3"><LifeBuoy className="w-5 h-5" /></div>
            <h3 className="font-semibold text-gray-900 mb-2">Account help</h3>
            <p className="text-sm text-gray-600">Password resets, billing, and verification.</p>
            <Button variant="link" className="px-0 text-orange-600" asChild>
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
          <div className="p-6 bg-white border rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3"><Headset className="w-5 h-5" /></div>
            <h3 className="font-semibold text-gray-900 mb-2">Live assistance</h3>
            <p className="text-sm text-gray-600">Chat with our ops team for shipment or order issues.</p>
            <Button variant="link" className="px-0 text-orange-600" asChild>
              <Link href="/contact">Start chat</Link>
            </Button>
          </div>
        </section>

        <section className="bg-white border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top questions</h2>
          <div className="space-y-5">
            {faqs.map((item) => (
              <div key={item.q} className="border-b pb-4 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-1">{item.q}</h3>
                <p className="text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-400">Need more help?</p>
            <h2 className="text-2xl font-bold">Talk to us</h2>
            <p className="text-gray-200 mt-2">We respond quickly during business hours.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contact">
              <Button size="lg" variant="secondary">Contact support</Button>
            </Link>
            <Button size="lg" className="bg-white text-gray-900" asChild>
              <Link href={`mailto:support@${rootDomain}`}>Email us</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
