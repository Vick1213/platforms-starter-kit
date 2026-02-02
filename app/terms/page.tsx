import { rootDomain } from '@/lib/utils';

export const metadata = {
  title: `Terms of Service | ${rootDomain}`,
  description: `Terms of service for ${rootDomain}`,
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose">
      <h1>Terms of Service</h1>
      <p>Last updated: 2026-02-01</p>
      <p>These terms govern use of the {rootDomain} platform by buyers and sellers. Replace this placeholder with your finalized terms.</p>
      <h2>Accounts</h2>
      <p>Provide accurate information and keep credentials secure. Business accounts must represent a valid entity.</p>
      <h2>Marketplace rules</h2>
      <ul>
        <li>No prohibited goods or fraudulent activity.</li>
        <li>Honor negotiated terms, incoterms, and payment milestones.</li>
        <li>Respect IP, compliance, and export controls.</li>
      </ul>
      <h2>Payments & escrow</h2>
      <p>Payments may be held in escrow until milestones are confirmed. Fees and payout timing are set per agreement.</p>
      <h2>Liability</h2>
      <p>Service is provided as-is. Limitations of liability and dispute resolution should be added here.</p>
      <h2>Contact</h2>
      <p>For questions about these terms, contact legal@{rootDomain}.</p>
    </div>
  );
}
