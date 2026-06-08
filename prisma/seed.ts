import {
  ArticleStatus,
  MenuCategoryType,
  PrismaClient,
  PublicationType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const menuSeed = {
  [MenuCategoryType.PORSI_KECIL]: {
    favorites: [
      { name: "Nasi Ayam Suwir Sayur", description: "Nasi putih, ayam suwir, dan tumis wortel buncis", votes: 128, emoji: "🍗" },
      { name: "Sup Ayam Jagung", description: "Sup hangat dengan jagung manis dan telur", votes: 112, emoji: "🌽" },
      { name: "Nasi Ikan Bakar Sambal", description: "Ikan bakar tanpa tulang dengan sambal tomat", votes: 98, emoji: "🐟" },
      { name: "Bubur Ayam Spesial", description: "Bubur ayam dengan suwiran ayam dan kuah kuning", votes: 87, emoji: "🥣" },
      { name: "Mie Kuah Sayur", description: "Mie rebus dengan sayuran dan telur rebus", votes: 76, emoji: "🍜" },
    ],
    weekly: [
      { day: "Senin", menu: "Nasi Ayam Suwir" },
      { day: "Selasa", menu: "Sup Ayam Jagung" },
      { day: "Rabu", menu: "Nasi Ikan Bakar" },
      { day: "Kamis", menu: "Bubur Ayam" },
      { day: "Jumat", menu: "Mie Kuah Sayur" },
    ],
  },
  [MenuCategoryType.PORSI_BESAR]: {
    favorites: [
      { name: "Nasi Rendang Telur", description: "Rendang sapi empuk dengan telur balado", votes: 156, emoji: "🥩" },
      { name: "Nasi Ayam Goreng Lengkap", description: "Ayam goreng, lalapan, dan sambal terasi", votes: 143, emoji: "🍗" },
      { name: "Nasi Goreng Spesial", description: "Nasi goreng dengan ayam, bakso, dan acar", votes: 131, emoji: "🍳" },
      { name: "Nasi Ikan Lele Goreng", description: "Lele goreng krispi dengan sambal dan lalapan", votes: 119, emoji: "🐟" },
      { name: "Nasi Campur Komplit", description: "Nasi, ayam, tempe, tahu, dan sayur bening", votes: 104, emoji: "🍱" },
    ],
    weekly: [
      { day: "Senin", menu: "Nasi Rendang Telur" },
      { day: "Selasa", menu: "Ayam Goreng Lengkap" },
      { day: "Rabu", menu: "Nasi Goreng Spesial" },
      { day: "Kamis", menu: "Ikan Lele Goreng" },
      { day: "Jumat", menu: "Nasi Campur" },
    ],
  },
  [MenuCategoryType.IBU_HAMIL]: {
    favorites: [
      { name: "Nasi Hati Ayam Bayam", description: "Hati ayam tumis dengan bayam dan tomat", votes: 67, emoji: "🥬" },
      { name: "Sup Kacang Merah Daging", description: "Sup bergizi dengan kacang merah dan daging sapi", votes: 58, emoji: "🫘" },
      { name: "Nasi Ikan Kembung Asam", description: "Ikan kembung bumbu asam dengan kangkung", votes: 52, emoji: "🐟" },
      { name: "Bubur Kacang Hijau Susu", description: "Bubur kacang hijau dengan susu rendah lemak", votes: 45, emoji: "🥣" },
      { name: "Nasi Telur Dadar Sayur", description: "Telur dadar, tumis brokoli, dan pepaya", votes: 41, emoji: "🍳" },
    ],
    weekly: [
      { day: "Senin", menu: "Hati Ayam Bayam" },
      { day: "Selasa", menu: "Sup Kacang Merah" },
      { day: "Rabu", menu: "Ikan Kembung" },
      { day: "Kamis", menu: "Bubur Kacang Hijau" },
      { day: "Jumat", menu: "Telur Dadar Sayur" },
    ],
  },
  [MenuCategoryType.BALITA]: {
    favorites: [
      { name: "Bubur Beras Tim Ayam", description: "Bubur halus dengan suwiran ayam dan wortel", votes: 43, emoji: "🥣" },
      { name: "Puree Ubi & Pisang", description: "Ubi jalar dan pisang kukus dihaluskan", votes: 38, emoji: "🍠" },
      { name: "Nasi Tim Telur Tofu", description: "Nasi lembek dengan telur dan tofu lembut", votes: 35, emoji: "🍚" },
      { name: "Sup Sayur Sapi Cincang", description: "Daging sapi cincang halus dengan labu siam", votes: 31, emoji: "🥕" },
      { name: "Bubur Jagung Keju", description: "Bubur jagung lembut dengan keju rendah garam", votes: 28, emoji: "🌽" },
    ],
    weekly: [
      { day: "Senin", menu: "Bubur Ayam Tim" },
      { day: "Selasa", menu: "Puree Ubi Pisang" },
      { day: "Rabu", menu: "Nasi Tim Tofu" },
      { day: "Kamis", menu: "Sup Sapi Cincang" },
      { day: "Jumat", menu: "Bubur Jagung" },
    ],
  },
} as const;

const surveySeedTitle = "Survey Kepuasan Pelanggan Juni 2026";

async function main() {
  await prisma.surveyAnswer.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.menuRequest.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.weeklyMenuEntry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@sppgpenarukan2.id",
      name: "Admin SPPG",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const categories = await Promise.all(
    ["Berita", "Kegiatan", "Pengumuman", "Event"].map((name) =>
      prisma.category.create({
        data: { name, slug: name.toLowerCase() },
      })
    )
  );

  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  const articles = [
    {
      slug: "program-mbg-berjalan-lancar",
      title: "Program MBG di Penarukan 2 Berjalan Lancar",
      excerpt:
        "Distribusi makanan bergizi untuk siswa berlangsung sesuai jadwal dengan standar gizi terpenuhi.",
      category: "Berita",
      isPopular: true,
      isHighlight: true,
      hoursAgo: 2,
    },
    {
      slug: "pelatihan-nutrisi-untuk-relawan",
      title: "Pelatihan Nutrisi untuk Relawan Dapur",
      excerpt:
        "Kegiatan pelatihan menekankan pentingnya kebersihan, keselamatan pangan, dan standar porsi.",
      category: "Kegiatan",
      isPopular: true,
      isHighlight: false,
      hoursAgo: 5,
    },
    {
      slug: "kunjungan-inspeksi-kualitas",
      title: "Kunjungan Inspeksi Kualitas Bahan Pangan",
      excerpt:
        "Tim inspeksi melakukan pengecekan kualitas bahan baku dan proses pengolahan di dapur.",
      category: "Pengumuman",
      isPopular: false,
      isHighlight: true,
      hoursAgo: 24,
    },
    {
      slug: "edukasi-gizi-seimbang",
      title: "Edukasi Gizi Seimbang untuk Orang Tua Siswa",
      excerpt:
        "Sesi edukasi membahas pola makan sehat dan pentingnya asupan bergizi di rumah.",
      category: "Event",
      isPopular: false,
      isHighlight: false,
      hoursAgo: 48,
    },
  ];

  const createdArticles = [];
  for (const article of articles) {
    const publishedAt = new Date(Date.now() - article.hoursAgo * 60 * 60 * 1000);
    const created = await prisma.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: `${article.excerpt}\n\nSPPG Penarukan 2 berkomitmen menyampaikan informasi yang akurat dan bermanfaat bagi masyarakat, orang tua siswa, dan seluruh pemangku kepentingan program makan bergizi.`,
        status: ArticleStatus.PUBLISHED,
        isPopular: article.isPopular,
        isHighlight: article.isHighlight,
        publishedAt,
        authorId: admin.id,
        categoryId: categoryByName[article.category].id,
      },
    });
    createdArticles.push(created);
  }

  await prisma.comment.create({
    data: {
      content: "Informasinya sangat membantu, terima kasih tim SPPG!",
      guestName: "Budi Santoso",
      isApproved: true,
      articleId: createdArticles[0].id,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      replies: {
        create: {
          content: "Terima kasih atas dukungannya!",
          guestName: "Admin SPPG",
          isApproved: true,
          articleId: createdArticles[0].id,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
    },
  });

  await prisma.comment.create({
    data: {
      content: "Semoga programnya terus berjalan dengan baik.",
      guestName: "Siti Rahayu",
      isApproved: true,
      articleId: createdArticles[0].id,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  await prisma.event.createMany({
    data: [
      {
        title: "Edukasi Gizi Seimbang",
        slug: "edukasi-gizi-seimbang-event",
        location: "Aula SPPG Penarukan 2",
        startAt: new Date("2026-06-14T09:00:00+07:00"),
        endAt: new Date("2026-06-14T11:00:00+07:00"),
        isPublished: true,
      },
      {
        title: "Pelatihan Kebersihan Dapur",
        slug: "pelatihan-kebersihan-dapur",
        location: "Dapur SPPG Penarukan 2",
        startAt: new Date("2026-06-21T13:00:00+07:00"),
        endAt: new Date("2026-06-21T15:00:00+07:00"),
        isPublished: true,
      },
      {
        title: "Open House SPPG",
        slug: "open-house-sppg",
        location: "SPPG Penarukan 2",
        startAt: new Date("2026-06-28T08:00:00+07:00"),
        endAt: new Date("2026-06-28T12:00:00+07:00"),
        isPublished: true,
      },
    ],
  });

  await prisma.publication.createMany({
    data: [
      {
        title: "Laporan Kinerja Q2 2026",
        slug: "laporan-kinerja-q2-2026",
        period: "Triwulan II 2026",
        type: PublicationType.PERFORMANCE_REPORT,
        summary: "Capaian distribusi 98%, kepuasan pelanggan meningkat 12%.",
        content: "Laporan kinerja triwulan II 2026 SPPG Penarukan 2.",
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        title: "Hasil Survey Kepuasan Juni 2026",
        slug: "hasil-survey-survey-kepuasan-pelanggan-juni-2026",
        period: "Juni 2026",
        type: PublicationType.SURVEY_RESULT,
        summary: "Belum ada responden. Skor akan diperbarui otomatis setelah survey diisi.",
        content: "Ringkasan hasil survey kepuasan Juni 2026.",
        isPublished: true,
        publishedAt: new Date(),
      },
    ],
  });

  for (const [category, data] of Object.entries(menuSeed)) {
    await prisma.menuItem.createMany({
      data: data.favorites.map((item) => ({
        ...item,
        category: category as MenuCategoryType,
      })),
    });

    await prisma.weeklyMenuEntry.createMany({
      data: data.weekly.map((entry, index) => ({
        category: category as MenuCategoryType,
        dayLabel: entry.day,
        menuText: entry.menu,
        sortOrder: index,
      })),
    });
  }

  await prisma.survey.create({
    data: {
      title: surveySeedTitle,
      description: "Bantu kami meningkatkan layanan dengan mengisi survey kepuasan ini.",
      respondentTarget: 100,
      isActive: true,
      questions: {
        create: [
          { question: "Rasa Makanan", type: "rating", order: 0 },
          { question: "Kebersihan", type: "rating", order: 1 },
          { question: "Pelayanan", type: "rating", order: 2 },
          { question: "Ketepatan Waktu", type: "rating", order: 3 },
          { question: "Keramahan Petugas", type: "rating", order: 4 },
          { question: "Seberapa mungkin Anda merekomendasikan SPPG?", type: "nps", order: 5 },
        ],
      },
    },
  });

  console.log("Seed selesai: admin (admin123), artikel, event, publikasi, menu, survey.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
