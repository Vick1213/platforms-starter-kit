import { rootDomain } from '@/lib/utils';

export const metadata = {
  title: `Privacy Policy | ${rootDomain}`,
  description: `Privacy policy for ${rootDomain}`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose">
      <h1>Privacy Policy</h1>
      <p>Last updated: 2026-02-01</p>
      <p>This page outlines how we handle data for buyers, sellers, and visitors on {rootDomain}. It is a concise placeholder—tailor it to your legal requirements.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account info such as name, email, business details</li>
        <li>Usage data for improving reliability and security</li>
        <li>Payment and fulfillment details when processing orders</li>
      </ul>
      <h2>How we use data</h2>
      <ul>
        <li>Operate the marketplace, including messaging and payments</li>
        <li>Provide support, detect fraud, and meet compliance requirements</li>
        <li>Improve products through analytics in line with consent</li>
      </ul>
      <h2>Your choices</h2>
      <ul>
        <li>Access, update, or delete your account data</li>
        <li>Manage marketing preferences in your settings</li>
        <li>Request export of your data by contacting support</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions? Email support@{rootDomain}.</p>
    </div>
  );
}
