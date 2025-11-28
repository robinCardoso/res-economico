import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UploadDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/resultado-economico/uploads/${id}`);
}
