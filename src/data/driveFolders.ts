// DAFTAR RESMI STRUKTUR FOLDER GOOGLE DRIVE SISTA TAMBORA
// Sumber: Konfigurasi resmi Rombel Tambora

export interface DriveFolderConfig {
  code: string;
  name: string;
  id: string;
  url: string;
  category: 'siswa' | 'guru' | 'akademik' | 'keuangan' | 'administrasi' | 'media';
  description: string;
}

export const DRIVE_FOLDERS_MASTER: DriveFolderConfig[] = [
  {
    code: '01',
    name: '01_BERKAS_SISWA_AKTIF',
    id: '1DfCtp8BbsRzFafEa8fk30Suq-aVQoS7V',
    url: 'https://drive.google.com/drive/folders/1DfCtp8BbsRzFafEa8fk30Suq-aVQoS7V',
    category: 'siswa',
    description: 'Dokumen dan arsip data siswa aktif'
  },
  {
    code: '02',
    name: '02_PAS_FOTO_SISWA',
    id: '1nc06GS54V8zdywZmLHnvK8JoRkIuuSsh',
    url: 'https://drive.google.com/drive/folders/1nc06GS54V8zdywZmLHnvK8JoRkIuuSsh',
    category: 'siswa',
    description: 'Pas foto resmi kartu pelajar dan ijazah siswa'
  },
  {
    code: '03',
    name: '03_PRESTASI_DAN_SERTIFIKAT_SISWA',
    id: '1EKq1VA9fE8YbiRvu5JnlMPB4lh4G6vUs',
    url: 'https://drive.google.com/drive/folders/1EKq1VA9fE8YbiRvu5JnlMPB4lh4G6vUs',
    category: 'siswa',
    description: 'Piagam, sertifikat lomba, dan portofolio prestasi'
  },
  {
    code: '04',
    name: '04_BERKAS_GURU_DAN_GTK',
    id: '1P1g-ktltQ97B4SZJiCygsvSsjTZ7t4i3',
    url: 'https://drive.google.com/drive/folders/1P1g-ktltQ97B4SZJiCygsvSsjTZ7t4i3',
    category: 'guru',
    description: 'Biodata, ijazah, dan dokumen pendidik/tenaga kependidikan'
  },
  {
    code: '05',
    name: '05_SK_DAN_DOKUMEN_KEPEGAWAIAN',
    id: '1uLiEBg3BIG2jNQ6WLuQZpvi0zkMXxGzo',
    url: 'https://drive.google.com/drive/folders/1uLiEBg3BIG2jNQ6WLuQZpvi0zkMXxGzo',
    category: 'guru',
    description: 'SK pembagian tugas, SK pengangkatan, dan arsip kepegawaian'
  },
  {
    code: '06',
    name: '06_SPMB_PENDAFTARAN_DAN_VERIFIKASI',
    id: '1ZgHDYaOx5UPINYi_BYhYWlw04tPtJItQ',
    url: 'https://drive.google.com/drive/folders/1ZgHDYaOx5UPINYi_BYhYWlw04tPtJItQ',
    category: 'siswa',
    description: 'Formulir pendaftaran, berkas verifikasi siswa baru'
  },
  {
    code: '07',
    name: '07_AKADEMIK_DAN_PERANGKAT_AJAR',
    id: '1dlxIK5YAsl-gdyZjF3FWcxPR9z9fkC4V',
    url: 'https://drive.google.com/drive/folders/1dlxIK5YAsl-gdyZjF3FWcxPR9z9fkC4V',
    category: 'akademik',
    description: 'RPP, Modul Ajar, Prota, Promes, dan Kalender Akademik'
  },
  {
    code: '08',
    name: '08_PRESENSI_SURAT_IZIN_DAN_CUTI',
    id: '1Vuwz-U9cjqGYB96Nmez8Y4b4O2cvOrTE',
    url: 'https://drive.google.com/drive/folders/1Vuwz-U9cjqGYB96Nmez8Y4b4O2cvOrTE',
    category: 'akademik',
    description: 'Surat sakit, izin siswa, dan surat cuti guru'
  },
  {
    code: '09',
    name: '09_CBT_BANK_SOAL_DAN_ASESMEN',
    id: '16oUIgoAYOB7mhVATnEkZ0S-8BWWt7C8z',
    url: 'https://drive.google.com/drive/folders/16oUIgoAYOB7mhVATnEkZ0S-8BWWt7C8z',
    category: 'akademik',
    description: 'Naskah soal ujian, kisi-kisi, kunci jawaban, dan asesmen'
  },
  {
    code: '10',
    name: '10_TUGAS_DAN_LEMBAR_KERJA_SISWA',
    id: '1pJ28fhYa4FQsJABMeN3CVEbemnQ1gU1t',
    url: 'https://drive.google.com/drive/folders/1pJ28fhYa4FQsJABMeN3CVEbemnQ1gU1t',
    category: 'akademik',
    description: 'Pengumpulan lembar kerja, proyek, dan tugas mandiri siswa'
  },
  {
    code: '11',
    name: '11_MATERI_DAN_MODUL_DIGITAL',
    id: '1xaf825icvAaXO7T1YtxjbWQQw-sud_t0',
    url: 'https://drive.google.com/drive/folders/1xaf825icvAaXO7T1YtxjbWQQw-sud_t0',
    category: 'akademik',
    description: 'Modul PDF K13, silabus, dan materi ajar per kelas/mapel'
  },
  {
    code: '12',
    name: '12_RAPOR_DAN_LEGER_NILAI',
    id: '1J3Lfj6unmwWuaAf0xptN0BH5nQkXyWi5',
    url: 'https://drive.google.com/drive/folders/1J3Lfj6unmwWuaAf0xptN0BH5nQkXyWi5',
    category: 'akademik',
    description: 'Cetak rapor semester, leger nilai, dan transkrip nilai'
  },
  {
    code: '13',
    name: '13_KEUANGAN_KWITANSI_DAN_BUKTI_BAYAR',
    id: '1Sa6x2LzuUnFWQgU0bzsQvoS7aNyzNsuy',
    url: 'https://drive.google.com/drive/folders/1Sa6x2LzuUnFWQgU0bzsQvoS7aNyzNsuy',
    category: 'keuangan',
    description: 'Bukti transfer SPP, kwitansi pembayaran, dan iuran siswa'
  },
  {
    code: '14',
    name: '14_KAS_PENGELUARAN_DAN_BOS',
    id: '1islZISEAXbvhoAbISU3gYPVR2uMzHx1-',
    url: 'https://drive.google.com/drive/folders/1islZISEAXbvhoAbISU3gYPVR2uMzHx1-',
    category: 'keuangan',
    description: 'Laporan SPJ BOS, nota belanja, dan kas operasional'
  },
  {
    code: '15',
    name: '15_TABUNGAN_SISWA_DAN_MUTASI',
    id: '1kBcg9wGdYp7_6cyo83F65QLuYqWPLZLj',
    url: 'https://drive.google.com/drive/folders/1kBcg9wGdYp7_6cyo83F65QLuYqWPLZLj',
    category: 'keuangan',
    description: 'Buku tabungan siswa, slip setor dan tarik tunai'
  },
  {
    code: '16',
    name: '16_BK_DAN_KEDISIPLINAN_SISWA',
    id: '1JSCX7kCLR5FUOcT7RW5h0jvHIWE1BeQv',
    url: 'https://drive.google.com/drive/folders/1JSCX7kCLR5FUOcT7RW5h0jvHIWE1BeQv',
    category: 'administrasi',
    description: 'Catatan bimbingan konseling, rekap pelanggaran & prestasi perilaku'
  },
  {
    code: '17',
    name: '17_SARANA_PRASARANA_DAN_ASET',
    id: '1aw82dWR_CqGVPrqtZXGDIzwweSleN2RD',
    url: 'https://drive.google.com/drive/folders/1aw82dWR_CqGVPrqtZXGDIzwweSleN2RD',
    category: 'administrasi',
    description: 'Inventaris barang, ruang kelas, laboratorium, dan perawatan aset'
  },
  {
    code: '18',
    name: '18_PERSURATAN_DAN_ARSIP_TU',
    id: '15_wj8Pz3T68PT2ZZtYG3bMnitbaq0Jre',
    url: 'https://drive.google.com/drive/folders/15_wj8Pz3T68PT2ZZtYG3bMnitbaq0Jre',
    category: 'administrasi',
    description: 'Surat masuk, surat keluar dinas, disposisi, dan arsip TU'
  },
  {
    code: '19',
    name: '19_PERPUSTAKAAN_DIGITAL_DAN_EBOOK',
    id: '1PVsFayWebO0wZtVkHXnKnmIwWSlztjiS',
    url: 'https://drive.google.com/drive/folders/1PVsFayWebO0wZtVkHXnKnmIwWSlztjiS',
    category: 'media',
    description: 'Koleksi e-book bacaan umum, literasi, dan referensi belajar'
  },
  {
    code: '20',
    name: '20_EKSKUL_DAN_DOKUMENTASI_KEGIATAN',
    id: '1EVbndVsYTEq25WHFNhWjSEvc6f8kihMX',
    url: 'https://drive.google.com/drive/folders/1EVbndVsYTEq25WHFNhWjSEvc6f8kihMX',
    category: 'media',
    description: 'Dokumentasi foto/video kegiatan ekskul, upacara, dan perayaan'
  },
  {
    code: '21',
    name: '21_MADING_BERITA_DAN_BANNER_WEB',
    id: '113Et4NheWjEtTlDtqevzACEKfrw4OE52',
    url: 'https://drive.google.com/drive/folders/113Et4NheWjEtTlDtqevzACEKfrw4OE52',
    category: 'media',
    description: 'Banner informasi, poster pengumuman, dan karya mading sekolah'
  },
  {
    code: '22',
    name: '22_AKREDITASI_DAN_DOKUMEN_LEMBAGA',
    id: '1m9JkbcxG2nZsdNYOsPnShvtHe0cLCMn2',
    url: 'https://drive.google.com/drive/folders/1m9JkbcxG2nZsdNYOsPnShvtHe0cLCMn2',
    category: 'administrasi',
    description: 'Standar mutu akreditasi, izin operasional, dan profil lembaga'
  },
  {
    code: '23',
    name: '23_BACKUP_DATABASE_DAN_LOG_SISTEM',
    id: '11ZhIWlGuIev_iHcYq56TezMteMC78lJz',
    url: 'https://drive.google.com/drive/folders/11ZhIWlGuIev_iHcYq56TezMteMC78lJz',
    category: 'administrasi',
    description: 'Arsip backup otomatis database JSON, CSV, dan log sistem'
  }
];

// Pohon Struktur Sub-Folder Lengkap untuk 11_MATERI_DAN_MODUL_DIGITAL
// Sesuai dengan seluruh mata pelajaran & tingkat kelas di MASTER_SILABUS
export const SILABUS_FOLDER_TREE = {
  "PAKET A (SD)": {
    "A4 (Kelas 4)": [
      "PAI - Pendidikan Agama Islam",
      "BIN - Bahasa Indonesia",
      "MTK - Matematika",
      "IPA - Ilmu Pengetahuan Alam",
      "IPS - Ilmu Pengetahuan Sosial",
      "PPKn - PPKn",
      "BAR - Bahasa Arab"
    ],
    "A5 (Kelas 5)": [
      "PAI - Pendidikan Agama Islam",
      "BIN - Bahasa Indonesia",
      "MTK - Matematika",
      "IPA - Ilmu Pengetahuan Alam",
      "IPS - Ilmu Pengetahuan Sosial",
      "PPKn - PPKn",
      "BAR - Bahasa Arab"
    ],
    "A6 (Kelas 6)": [
      "PAI - Pendidikan Agama Islam",
      "BIN - Bahasa Indonesia",
      "MTK - Matematika",
      "IPA - Ilmu Pengetahuan Alam",
      "IPS - Ilmu Pengetahuan Sosial",
      "PPKn - PPKn"
    ]
  },
  "PAKET B (SMP)": {
    "B7 (Kelas 7)": [
      "PAI - Pendidikan Agama Islam",
      "BIN - Bahasa Indonesia",
      "BIG - Bahasa Inggris",
      "MTK - Matematika",
      "IPA - Ilmu Pengetahuan Alam",
      "IPS - Ilmu Pengetahuan Sosial",
      "PPKn - PPKn"
    ],
    "B8 (Kelas 8)": [
      "PAI - Pendidikan Agama Islam",
      "BIN - Bahasa Indonesia",
      "BIG - Bahasa Inggris",
      "MTK - Matematika",
      "IPA - Ilmu Pengetahuan Alam",
      "IPS - Ilmu Pengetahuan Sosial",
      "PPKn - PPKn"
    ],
    "B9 (Kelas 9)": [
      "PAI - Pendidikan Agama Islam",
      "BIN - Bahasa Indonesia",
      "BIG - Bahasa Inggris",
      "MTK - Matematika",
      "IPA - Ilmu Pengetahuan Alam",
      "IPS - Ilmu Pengetahuan Sosial",
      "PPKn - PPKn"
    ]
  },
  "PAKET C (SMA)": {
    "C10 (Kelas 10)": [
      "BIN - Bahasa Indonesia",
      "BIG - Bahasa Inggris",
      "MTK - Matematika",
      "EKO - Ekonomi",
      "GEO - Geografi",
      "SOS - Sosiologi",
      "SJI - Sejarah Indonesia",
      "SJP - Sejarah Peminatan",
      "PPKn - PPKn",
      "PAI - Pendidikan Agama Islam"
    ],
    "C11 (Kelas 11)": [
      "BIN - Bahasa Indonesia",
      "BIG - Bahasa Inggris",
      "MTK - Matematika",
      "EKO - Ekonomi",
      "GEO - Geografi",
      "SOS - Sosiologi",
      "SJI - Sejarah Indonesia",
      "SJP - Sejarah Peminatan",
      "PPKn - PPKn",
      "PAI - Pendidikan Agama Islam"
    ],
    "C12 (Kelas 12)": [
      "BIN - Bahasa Indonesia",
      "BIG - Bahasa Inggris",
      "MTK - Matematika",
      "MTKP - Matematika Peminatan",
      "EKO - Ekonomi",
      "GEO - Geografi",
      "SOS - Sosiologi",
      "SJI - Sejarah Indonesia",
      "SJP - Sejarah Peminatan",
      "PPKn - PPKn"
    ]
  }
};

// Helper cari ID folder berdasarkan nomor/nama
export const getDriveFolderByCode = (code: string): DriveFolderConfig | undefined => {
  return DRIVE_FOLDERS_MASTER.find(f => f.code === code);
};

export const getDriveFolderByName = (name: string): DriveFolderConfig | undefined => {
  return DRIVE_FOLDERS_MASTER.find(f => f.name.toLowerCase().includes(name.toLowerCase()));
};
