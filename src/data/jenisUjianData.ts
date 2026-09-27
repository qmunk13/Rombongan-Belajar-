/**
 * Single Canonical Source of Truth for Jenis Ujian & Standar Asesmen
 * Sesuai Dynamic Evaluation Matrix Kemendikdasmen No. 9/2026 & Kurikulum Merdeka PKBM KTCT Tambora
 */

export interface JenisUjianItem {
  idAsesmen: string;
  kategori: 'AWAL' | 'FORMATIF' | 'SUMATIF';
  kategoriRomawi: 'I' | 'II' | 'III';
  kategoriLabel: string;
  jenisAsesmen: string;
  singkatan: string;
  tujuan: string;
  jenjang: string;
  kelas: string;
  semester: string;
  tahunAjaran: string;
  bobot: string;
  badge: string;
  status: 'AKTIF' | 'NONAKTIF';
}

export const MASTER_JENIS_UJIAN_ITEMS: JenisUjianItem[] = [
  // --- KATEGORI I: ASESMEN AWAL ---
  {
    idAsesmen: 'JU-01',
    kategori: 'AWAL',
    kategoriRomawi: 'I',
    kategoriLabel: 'I. Asesmen Awal',
    jenisAsesmen: 'Placement Test (Tes Penempatan)',
    singkatan: 'TEST-PL',
    tujuan: 'Mengukur kompetensi akademik awal Siswa baru agar ditempatkan pada tingkatan atau derajat yang sesuai.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Siswa baru: Paket A (Kls 1-6), Paket B (Kls 7-9), Paket C (Kls 10-12)',
    semester: '1 (Ganjil)',
    tahunAjaran: '2025/2026',
    bobot: '0% (Non-Rapor): Hasil berupa rekomendasi penempatan kelas/fase.',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-02',
    kategori: 'AWAL',
    kategoriRomawi: 'I',
    kategoriLabel: 'I. Asesmen Awal',
    jenisAsesmen: 'Asesmen Diagnostik Non-Kognitif',
    singkatan: 'DIAG-NON',
    tujuan: 'Memetakan profil psikologis, gaya belajar, kesiapan mental, dan latar belakang pekerjaan Siswa nonformal.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A, B, C (Kelas 1-12) - Rutin di awal tahun ajaran baru',
    semester: '1 (Ganjil)',
    tahunAjaran: '2025/2026',
    bobot: '0% (Non-Rapor): Acuan tutor dalam strategi andragogi (belajar dewasa).',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-03',
    kategori: 'AWAL',
    kategoriRomawi: 'I',
    kategoriLabel: 'I. Asesmen Awal',
    jenisAsesmen: 'Asesmen Diagnostik Kognitif',
    singkatan: 'DIAG-KOG',
    tujuan: 'Menguji materi prasyarat atau pengetahuan dasar Siswa sebelum masuk ke pembahasan modul baru.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A, B, C (Kelas 1-12) - Berkala di tiap awal modul baru',
    semester: 'Ganjil & Genap',
    tahunAjaran: '2025/2026',
    bobot: '0% (Non-Rapor): Memetakan kesiapan akademik dasar materi terkait.',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'AKTIF'
  },

  // --- KATEGORI II: ASESMEN FORMATIF ---
  {
    idAsesmen: 'JU-04',
    kategori: 'FORMATIF',
    kategoriRomawi: 'II',
    kategoriLabel: 'II. Asesmen Formatif',
    jenisAsesmen: 'Asesmen Formatif Internal Modul',
    singkatan: 'FORMATIF',
    tujuan: 'Memantau perkembangan belajar harian (kuis CBT, tugas mandiri, penilaian performa) untuk umpan balik tutor.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A, B, C (Kelas 1-12) - Berkelanjutan',
    semester: 'Ganjil & Genap',
    tahunAjaran: '2025/2026',
    bobot: '0% (Non-Rapor): Murni perbaikan proses belajar (bukan angka rapor).',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    status: 'AKTIF'
  },

  // --- KATEGORI III: ASESMEN SUMATIF ---
  {
    idAsesmen: 'JU-05',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'Sumatif Lingkup Materi (Nilai Akhir Modul)',
    singkatan: 'SLM',
    tujuan: 'Menilai capaian kompetensi Siswa tiap kali merampungkan satu Modul penuh secara terkomputerisasi.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A, B, C (Kelas 1-12) - Tiap penyelesaian satu modul',
    semester: 'Ganjil & Genap',
    tahunAjaran: '2025/2026',
    bobot: '50% s.d. 60% (Bobot Utama Rapor): Rata-rata nilai sumatif per modul.',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-06',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'Sumatif Tengah Semester (STS)',
    singkatan: 'STS',
    tujuan: 'Evaluasi capaian kompetensi tengah semester untuk memantau kemajuan akademik berkala.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A (Kls 4-6), Paket B (Kls 7-9), Paket C (Kls 10-12)',
    semester: '1 (Ganjil) & 2 (Genap)',
    tahunAjaran: '2025/2026',
    bobot: '20% s.d. 25% (Komponen Rapor): Refleksi kemajuan paruh semester.',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-07',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'ASAS (Asesmen Sumatif Akhir Semester)',
    singkatan: 'ASAS',
    tujuan: 'Mengukur penguasaan kompetensi atas gabungan seluruh modul selama satu semester berjalan (Semester Ganjil & Genap).',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A (Kls 1-6), Paket B (Kls 7-9), Paket C (Kls 10-12)',
    semester: '1 (Ganjil) & 2 (Genap)',
    tahunAjaran: '2025/2026',
    bobot: '40% s.d. 50% (Bobot Pendamping Rapor): Berkontribusi pada nilai rapor akhir.',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-08',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'Penilaian Akhir Tahun (PAT / SAT)',
    singkatan: 'PAT',
    tujuan: 'Evaluasi sumatif komprehensif kenaikan kelas dan penuntasan kurikulum pada akhir semester genap.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A (Kls 1-5), Paket B (Kls 7-8), Paket C (Kls 10-11)',
    semester: '2 (Genap)',
    tahunAjaran: '2025/2026',
    bobot: '40% s.d. 50% (Rapor Kenaikan Kelas): Penentu kenaikan jenjang.',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-09',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'ASAJ (Asesmen Sumatif Akhir Jenjang)',
    singkatan: 'ASAJ',
    tujuan: 'Evaluasi akhir tingkat satuan pendidikan PKBM untuk menentukan kriteria kelulusan sekolah.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A (Kls 6), Paket B (Kls 9), Paket C (Kls 12)',
    semester: '2 (Genap)',
    tahunAjaran: '2025/2026',
    bobot: '100% Nilai Kelulusan Internal: Komponen utama penentu ijazah sekolah.',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-10',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'Asesmen Nasional & TKA (Kemendikdasmen No. 9/2026)',
    singkatan: 'ANBK-TKA',
    tujuan: 'Pemetaan mutu nasional mengintegrasikan kemampuan literasi-numerasi dengan Tes Kemampuan Akademik (TKA) spesifik.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A (Kls 5), Paket B (Kls 8), Paket C (Kls 11/12)',
    semester: '1 (Ganjil)',
    tahunAjaran: '2025/2026',
    bobot: '0% Nilai Rapor: Digunakan murni untuk pemetaan mutu & rapor lembaga.',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-11',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'Uji Kesetaraan (UK)',
    singkatan: 'UK',
    tujuan: 'Asesmen nasional khusus nonformal untuk menerbitkan Sertifikat Hasil Uji Kesetaraan (SHUK) sebagai legalitas penyetaraan.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A (Kls 6), Paket B (Kls 9), Paket C (Kls 12)',
    semester: '2 (Genap)',
    tahunAjaran: '2025/2026',
    bobot: '0% Nilai Rapor: Nilai berdiri sendiri dalam bentuk SHUK nasional.',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    status: 'AKTIF'
  },
  {
    idAsesmen: 'JU-12',
    kategori: 'SUMATIF',
    kategoriRomawi: 'III',
    kategoriLabel: 'III. Asesmen Sumatif',
    jenisAsesmen: 'Ujian Praktek & Vokasi',
    singkatan: 'PRAKTEK',
    tujuan: 'Penilaian keterampilan vokasional, pemberdayaan wirausaha, dan unjuk kerja praktis peserta didik nonformal.',
    jenjang: 'Paket A, Paket B, Paket C',
    kelas: 'Paket A (Kls 6), Paket B (Kls 9), Paket C (Kls 11-12)',
    semester: 'Ganjil & Genap',
    tahunAjaran: '2025/2026',
    bobot: 'Penilaian Keterampilan Vokasi Rapor (Mandiri).',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    status: 'AKTIF'
  }
];

/**
 * Standard Array of Canonical Names for Dropdowns and Filters
 */
export const STANDARD_JENIS_UJIAN_LIST: string[] = MASTER_JENIS_UJIAN_ITEMS.map(i => i.jenisAsesmen);

/**
 * Normalizes any raw string or abbreviation to the exact canonical name
 * Ensures "penamaan nya harus sama semua" across the entire application.
 */
export function normalizeJenisUjian(raw: string | undefined | null): string {
  if (!raw) return 'Sumatif Tengah Semester (STS)';
  const s = String(raw).trim();
  const lower = s.toLowerCase();

  // Exact matches first
  const exact = MASTER_JENIS_UJIAN_ITEMS.find(
    item => item.jenisAsesmen.toLowerCase() === lower || item.singkatan.toLowerCase() === lower
  );
  if (exact) return exact.jenisAsesmen;

  // Placement Test
  if (lower.includes('placement') || lower.includes('penempatan') || lower === 'test-pl' || lower === 'pl') {
    return 'Placement Test (Tes Penempatan)';
  }

  // Diagnostik Non-Kognitif
  if (lower.includes('non-kognitif') || lower.includes('non kognitif') || lower === 'diag-non') {
    return 'Asesmen Diagnostik Non-Kognitif';
  }

  // Diagnostik Kognitif
  if (lower.includes('diagnostik') || lower === 'diag-kog' || lower.includes('kognitif')) {
    return 'Asesmen Diagnostik Kognitif';
  }

  // Formatif
  if (lower.includes('formatif') || lower.includes('harian') || lower.includes('kuis') || lower === 'uh') {
    return 'Asesmen Formatif Internal Modul';
  }

  // Sumatif Lingkup Materi
  if (lower.includes('lingkup materi') || lower.includes('akhir modul') || lower === 'slm') {
    return 'Sumatif Lingkup Materi (Nilai Akhir Modul)';
  }

  // STS
  if (lower.includes('tengah semester') || lower === 'sts' || lower.includes('uts')) {
    return 'Sumatif Tengah Semester (STS)';
  }

  // ASAS / SAS
  if (lower.includes('asas') || lower.includes('akhir semester') || lower === 'sas' || lower.includes('uas')) {
    return 'ASAS (Asesmen Sumatif Akhir Semester)';
  }

  // PAT / SAT
  if (lower.includes('akhir tahun') || lower === 'pat' || lower === 'sat' || lower.includes('kenaikan kelas')) {
    return 'Penilaian Akhir Tahun (PAT / SAT)';
  }

  // ASAJ / US
  if (lower.includes('akhir jenjang') || lower === 'asaj' || lower === 'us' || lower.includes('ujian sekolah') || lower.includes('kelulusan')) {
    return 'ASAJ (Asesmen Sumatif Akhir Jenjang)';
  }

  // ANBK / TKA
  if (lower.includes('anbk') || lower.includes('asesmen nasional') || lower.includes('tka') || lower.includes('kemendikdasmen')) {
    return 'Asesmen Nasional & TKA (Kemendikdasmen No. 9/2026)';
  }

  // Uji Kesetaraan (UK)
  if (lower.includes('kesetaraan') || lower === 'uk' || lower.includes('shuk')) {
    return 'Uji Kesetaraan (UK)';
  }

  // Praktek & Vokasi
  if (lower.includes('praktek') || lower.includes('praktik') || lower.includes('vokasi') || lower.includes('kewirausahaan')) {
    return 'Ujian Praktek & Vokasi';
  }

  // Fallback: return as-is or default
  return s;
}

/**
 * Returns color classes for badges according to canonical Jenis Ujian
 */
export function getJenisUjianBadgeClass(jenisName: string): string {
  const norm = normalizeJenisUjian(jenisName);
  const found = MASTER_JENIS_UJIAN_ITEMS.find(i => i.jenisAsesmen === norm);
  return found ? found.badge : 'bg-slate-100 text-slate-700 border-slate-200';
}
