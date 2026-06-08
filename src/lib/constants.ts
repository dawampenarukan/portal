export const SITE_NAME = "SPPG Penarukan 2";
export const SITE_TAGLINE = "Rumah Cerita Gizi & Kegiatan Kita";
export const SITE_DESCRIPTION =
  "Portal ramah keluarga untuk berita, event, dan info gizi SPPG Penarukan 2 — untuk siswa, guru, dan ibu hamil.";

export const NAV_ITEMS = [
  { href: "/", label: "Beranda", emoji: "🏠" },
  { href: "/menu", label: "Menu", emoji: "🍽️" },
  { href: "/berita", label: "Berita", emoji: "📰" },
  { href: "/event", label: "Event", emoji: "🎉" },
  { href: "/kinerja", label: "Survey", emoji: "⭐" },
  { href: "/masukan", label: "Masukan", emoji: "💬" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/menu", label: "Kelola Menu", icon: "UtensilsCrossed" },
  { href: "/admin/berita", label: "Kelola Berita", icon: "Newspaper" },
  { href: "/admin/event", label: "Kelola Event", icon: "Calendar" },
  { href: "/admin/publikasi", label: "Publikasi Fixed", icon: "BarChart3" },
  { href: "/admin/komentar", label: "Moderasi Komentar", icon: "MessageSquare" },
  { href: "/admin/masukan", label: "Inbox Masukan", icon: "Inbox" },
  { href: "/admin/survey", label: "Kelola Survey", icon: "ClipboardList" },
] as const;
