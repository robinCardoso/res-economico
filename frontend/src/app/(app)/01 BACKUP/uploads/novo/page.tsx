import { redirect } from 'next/navigation';

export default function NovoUploadRedirect() {
  redirect('/admin/resultado-economico/uploads/novo');
}
