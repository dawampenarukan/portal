export const trendingTopics = [
  "Menu Favorit Minggu Ini 🍽️",
  "Request Menu Porsi Kecil 🧒",
  "Tips Gizi Buat Ibu Hamil 🤰",
  "Yuk Isi Survey! ⭐",
];

export const mockArticles = [
  {
    id: "1",
    slug: "program-mbg-berjalan-lancar",
    title: "Program MBG di Penarukan 2 Berjalan Lancar",
    excerpt:
      "Distribusi makanan bergizi untuk siswa berlangsung sesuai jadwal dengan standar gizi terpenuhi.",
    category: "Berita",
    author: "Admin SPPG",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    coverImage: null,
    isPopular: true,
    isHighlight: true,
  },
  {
    id: "2",
    slug: "pelatihan-nutrisi-untuk-relawan",
    title: "Pelatihan Nutrisi untuk Relawan Dapur",
    excerpt:
      "Kegiatan pelatihan menekankan pentingnya kebersihan, keselamatan pangan, dan standar porsi.",
    category: "Kegiatan",
    author: "Tim SPPG",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    coverImage: null,
    isPopular: true,
    isHighlight: false,
  },
  {
    id: "3",
    slug: "kunjungan-inspeksi-kualitas",
    title: "Kunjungan Inspeksi Kualitas Bahan Pangan",
    excerpt:
      "Tim inspeksi melakukan pengecekan kualitas bahan baku dan proses pengolahan di dapur.",
    category: "Pengumuman",
    author: "Admin SPPG",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    coverImage: null,
    isPopular: false,
    isHighlight: true,
  },
  {
    id: "4",
    slug: "edukasi-gizi-seimbang",
    title: "Edukasi Gizi Seimbang untuk Orang Tua Siswa",
    excerpt:
      "Sesi edukasi membahas pola makan sehat dan pentingnya asupan bergizi di rumah.",
    category: "Event",
    author: "Nutrisionis SPPG",
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    coverImage: null,
    isPopular: false,
    isHighlight: false,
  },
];

export const mockEvents = [
  {
    id: "1",
    title: "Edukasi Gizi Seimbang",
    location: "Aula SPPG Penarukan 2",
    date: "14 Juni 2026",
    time: "09.00 – 11.00 WIB",
  },
  {
    id: "2",
    title: "Pelatihan Kebersihan Dapur",
    location: "Dapur SPPG Penarukan 2",
    date: "21 Juni 2026",
    time: "13.00 – 15.00 WIB",
  },
  {
    id: "3",
    title: "Open House SPPG",
    location: "SPPG Penarukan 2",
    date: "28 Juni 2026",
    time: "08.00 – 12.00 WIB",
  },
];

export const mockSurveyData = {
  satisfactionScore: 4.3,
  npsScore: 82,
  respondents: 347,
  target: 75,
  aspects: [
    { name: "Rasa Makanan", score: 4.5 },
    { name: "Kebersihan", score: 4.4 },
    { name: "Pelayanan", score: 4.2 },
    { name: "Ketepatan Waktu", score: 4.1 },
    { name: "Keramahan Petugas", score: 4.6 },
  ],
  trend: [
    { month: "Jan", score: 3.8 },
    { month: "Feb", score: 4.0 },
    { month: "Mar", score: 4.1 },
    { month: "Apr", score: 4.2 },
    { month: "Mei", score: 4.3 },
    { month: "Jun", score: 4.3 },
  ],
};

export const mockPublications = [
  {
    id: "1",
    title: "Laporan Kinerja Q2 2026",
    period: "Triwulan II 2026",
    type: "performance",
    summary: "Capaian distribusi 98%, kepuasan pelanggan meningkat 12%.",
  },
  {
    id: "2",
    title: "Hasil Survey Kepuasan Juni 2026",
    period: "Juni 2026",
    type: "survey",
    summary: "Skor kepuasan 4.3/5 dengan 347 responden.",
  },
];

export const mockComments = [
  {
    id: "1",
    authorName: "Budi Santoso",
    content: "Informasinya sangat membantu, terima kasih tim SPPG!",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    replies: [
      {
        id: "1-r1",
        authorName: "Admin SPPG",
        content: "Terima kasih atas dukungannya!",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "2",
    authorName: "Siti Rahayu",
    content: "Semoga programnya terus berjalan dengan baik.",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    replies: [],
  },
];
