import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Tariffs',
  description: 'Import tariff information',
};

export default function TariffsPage() {
  redirect('/tariff-calculator');
}
