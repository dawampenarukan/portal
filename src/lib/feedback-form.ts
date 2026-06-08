export const FEEDBACK_CATEGORIES = [
  "Saran",
  "Kritik",
  "Laporan Temuan",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

const categorySet = new Set<string>(FEEDBACK_CATEGORIES);

export function isFeedbackCategory(value: string): value is FeedbackCategory {
  return categorySet.has(value);
}

export function validateFeedbackEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!emailRegex.test(trimmed)) {
    return "Format email tidak valid (contoh: nama@email.com)";
  }
  return null;
}

export function validateFeedbackPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/[\s.-]/g, "");
  const phoneRegex = /^(\+62|62|0)8[1-9]\d{7,11}$/;
  if (!phoneRegex.test(normalized)) {
    return "Nomor telepon tidak valid (contoh: 08123456789)";
  }
  return null;
}

export function validateFeedbackCategory(category: string): string | null {
  if (!category.trim()) return "Pilih kategori masukan";
  if (!isFeedbackCategory(category)) return "Kategori tidak valid";
  return null;
}

export interface FeedbackFormInput {
  name: string;
  email: string;
  phone: string;
  category: string;
  title: string;
  description: string;
}

export function validateFeedbackForm(data: FeedbackFormInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) errors.name = "Nama wajib diisi";
  if (!data.title.trim()) errors.title = "Judul wajib diisi";
  if (!data.description.trim()) errors.description = "Deskripsi wajib diisi";

  const emailError = validateFeedbackEmail(data.email);
  if (emailError) errors.email = emailError;

  const phoneError = validateFeedbackPhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const categoryError = validateFeedbackCategory(data.category);
  if (categoryError) errors.category = categoryError;

  return errors;
}
