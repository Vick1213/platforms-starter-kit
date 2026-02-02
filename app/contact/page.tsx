import Link from 'next/link';
import { rootDomain } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export const metadata = {
  title: `Contact | ${rootDomain}`,
  description: `Contact the ${rootDomain} team`,
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <p className="text-sm font-semibold text-orange-600 mb-1">Support</p>
          <h1 className="text-3xl font-bold text-gray-900">Contact us</h1>
          <p className="text-gray-600 mt-2">Questions about sourcing, shipping, or your account? Reach our team.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Send a message</h2>
            <form className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-700" htmlFor="name">Name</label>
                <input id="name" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Your name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700" htmlFor="email">Email</label>
                <input id="email" type="email" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="you@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700" htmlFor="topic">Topic</label>
                <input id="topic" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Sourcing, shipping, billing..." />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700" htmlFor="message">Message</label>
                <textarea id="message" rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="How can we help?" />
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500">Send message</Button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <a
                    href={`mailto:support@${rootDomain}`}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    {`support@${rootDomain}`}
                  </a>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="font-semibold text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">+1 (800) 000-0000</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="font-semibold text-gray-900">HQ</p>
                  <p className="text-sm text-gray-600">123 Supply Street, Suite 100\nGlobal Trade City</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><MessageCircle className="w-5 h-5" /></div>
                <div>
                  <p className="font-semibold text-gray-900">Live chat</p>
                  <p className="text-sm text-gray-600">Available during business hours. Start from the help center.</p>
                  <Link href="/help" className="text-sm text-orange-600 font-medium">Open help center →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
