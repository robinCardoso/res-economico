import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ResumoDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/resultado-economico/resumos/${id}`);
}
