import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  redirect('/admin/resultado-economico/dashboard');
}
