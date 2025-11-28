import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirecionar para o dashboard do resultado econômico
  redirect('/admin/resultado-economico/dashboard');
}

