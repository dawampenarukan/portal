/**
 * Data PIC entri organoleptik (sekolah/posyandu).
 * Email: {slug}@sppg.com — Password: {slug}123
 */
export type OrganolepticPicSeed = {
  name: string;
  phone: string;
  schoolLocation: string;
};

export function emailSlugFromName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function picEmail(name: string): string {
  return `${emailSlugFromName(name)}@sppg.com`;
}

export function picPassword(name: string): string {
  return `${emailSlugFromName(name)}123`;
}

/** Infer tipe tempat dari nama lokasi. */
export function inferOrganolepticPlaceType(
  schoolLocation: string | null | undefined
): "SEKOLAH" | "POSYANDU" {
  const s = (schoolLocation ?? "").trim();
  if (!s) return "SEKOLAH";
  if (/posyandu/i.test(s)) return "POSYANDU";
  if (/^(nusaindah|anggrek|mawar|melati|kenanga)\b/i.test(s)) return "POSYANDU";
  return "SEKOLAH";
}

export const ORGANOLEPTIC_PIC_SEEDS: OrganolepticPicSeed[] = [
  { name: "Nur Udiyah", phone: "+62 823-5141-8250", schoolLocation: "KB Khodijah Tegalsari" },
  { name: "Andaru", phone: "+62 812-3052-9188", schoolLocation: "KB IT Salsabila" },
  { name: "Tatik", phone: "+62 858-0713-7194", schoolLocation: "TK DWP 8 Tegalsari" },
  { name: "Efi", phone: "+62 896-5553-9767", schoolLocation: "TK Wahidiyah Penarukan" },
  { name: "Wahyu", phone: "+62 856-4632-8746", schoolLocation: "SDN 1 Tegalsari" },
  { name: "Doni", phone: "+62 813-3513-6706", schoolLocation: "SDN 2 Tegalsari" },
  { name: "Dian", phone: "+62 812-3559-1163", schoolLocation: "SDN Penarukan" },
  { name: "Wiwin", phone: "+62 856-4546-6218", schoolLocation: "SDN 2 Kepanjen" },
  { name: "Leni", phone: "+62 813-5708-8613", schoolLocation: "SD Wahidiyah" },
  { name: "Rizqy", phone: "+62 812-1766-1361", schoolLocation: "SMP Wahidiyah" },
  { name: "Zulfi", phone: "+62 812-1478-6578", schoolLocation: "SMP Darul Hijrah Tegalsari" },
  { name: "Indasa", phone: "+62 812-3026-3800", schoolLocation: "SMP PGRI 1 Kepanjen" },
  { name: "Ali", phone: "+62 878-5718-1728", schoolLocation: "SMP Muhammadiyah" },
  { name: "Anas", phone: "+62 812-5221-9963", schoolLocation: "SMA Wahidiyah" },
  { name: "Farida", phone: "+62 896-9728-5279", schoolLocation: "Nusaindah 1" },
  { name: "Rose", phone: "+62 858-5915-7587", schoolLocation: "Nusaindah 2" },
  { name: "Ana", phone: "+62 858-5234-1900", schoolLocation: "Nusaindah 3" },
  { name: "Sri Handayani", phone: "+62 812-3487-9740", schoolLocation: "Anggrek 1" },
  { name: "Agustin", phone: "+62 812-3274-3770", schoolLocation: "Anggrek 2" },
  { name: "Dewi", phone: "+62 878-7705-8448", schoolLocation: "Anggrek 3" },
  { name: "Sapta", phone: "+62 823-1152-1572", schoolLocation: "Anggrek 4" },
  { name: "Dewo", phone: "+62 813-3378-6767", schoolLocation: "Mawar 1" },
  { name: "Umi", phone: "+62 812-3873-7079", schoolLocation: "Mawar 2" },
  { name: "Febry", phone: "+62 821-4276-3170", schoolLocation: "Melati 1" },
  { name: "Koes", phone: "+62 812-3509-9321", schoolLocation: "Melati 2" },
  { name: "Ary", phone: "+62 895-3448-25456", schoolLocation: "Melati 3" },
  { name: "Lilik", phone: "+62 812-2659-4098", schoolLocation: "Melati 4" },
  { name: "Ninik", phone: "+62 821-3751-8183", schoolLocation: "Kenanga 1" },
  { name: "Lutfiyah", phone: "+62 838-5197-0206", schoolLocation: "Kenanga 2" },
  { name: "Zuhriyah", phone: "+62 896-0138-3748", schoolLocation: "Kenanga 3" },
];
