import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirecionar para o novo dashboard principal
  redirect('/admin/dashboard');
}

