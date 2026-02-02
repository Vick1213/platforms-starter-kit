import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manufacturers',
  description: 'Browse manufacturers',
};

export default function ManufacturersPage() {
  redirect('/stores');
}
