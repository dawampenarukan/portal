import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Route lama — arahkan ke form edit di halaman daftar. */
export default async function EditPublicationRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/publikasi?edit=${encodeURIComponent(id)}`);
}
