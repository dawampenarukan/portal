import { redirect } from "next/navigation";

/** Route lama — arahkan ke form di halaman daftar (hindari 404 nested route). */
export default function NewPublicationRedirectPage() {
  redirect("/admin/publikasi?buat=1");
}
