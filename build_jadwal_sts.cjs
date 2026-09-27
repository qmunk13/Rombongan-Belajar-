const fs = require('fs');

const rows = JSON.parse(fs.readFileSync('ujian_sheet_dump.json', 'utf8'));

const items = rows.map((r, i) => {
  const d = new Date(r.Tanggal);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hari = days[d.getDay()] || 'Senin';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const display = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const mapel = String(r.Mapel || r.NamaUjian || 'Mata Pelajaran').trim();

  return {
    id: String(r.UjianID || `SES-STS-26-${String(i + 1).padStart(3, '0')}`),
    mapel,
    semester: 'Ganjil',
    tahunAjaran: '2026/2027',
    kelas: String(r.Kelas || '4').trim(),
    token: String(r.Token || '').trim(),
    jenis: String(r.JenisUjian || 'STS (Tengah Semester)').trim(),
    tgl: r.Tanggal,
    tglDisplay: display,
    jamMulai: r.JamMulai,
    jamSelesai: r.JamSelesai,
    durasi: r.Durasi,
    pengawas: String(r.Proktor || 'Guru Kelas').trim(),
    proktor: String(r.Proktor || 'Guru Kelas').trim(),
    peserta: Number(r.Peserta || 30),
    status: (r.Status === 'Berlangsung' || r.Status === 'Selesai') ? r.Status : 'Terjadwal',
    soal: String(r.JumlahSoal || '30 Butir Soal (PG)'),
    acakSoal: String(r.AcakSoal || '').toUpperCase() === 'YA' || r.AcakSoal === true,
    acakOpsi: String(r.AcakOpsi || '').toUpperCase() === 'YA' || r.AcakOpsi === true,
    tampilkanNilai: String(r.TampilkanNilai || '').toUpperCase() === 'YA' || r.TampilkanNilai === true
  };
});

const tsCode = `/**
 * Master Data Jadwal Ujian STS (Sumatif Tengah Semester) Ganjil T.A 2026/2027
 * 117 Sesi Terjadwal LENGKAP dan RESMI langsung sesuai Spreadsheet Sheet UJIAN
 * Kelas 4, 5, 6, 7, 8, 9, 10, 11, 12 serta Ujian Praktek & Vokasi Paket A/B/C
 */

export interface JadwalStsItem {
  id: string; // Kode Sesi
  mapel: string;
  semester: string;
  tahunAjaran: string;
  kelas: string;
  token: string;
  jenis: string;
  tgl: string; // YYYY-MM-DD
  tglDisplay: string;
  jamMulai: string;
  jamSelesai: string;
  durasi: string;
  pengawas: string;
  proktor?: string;
  peserta: number;
  status: 'Terjadwal' | 'Berlangsung' | 'Selesai';
  soal: string;
  acakSoal: boolean;
  acakOpsi: boolean;
  tampilkanNilai: boolean;
}

export const JADWAL_STS_GANJIL_2026: JadwalStsItem[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync('src/data/jadwalStsGanjil2026.ts', tsCode, 'utf8');
console.log('Successfully generated src/data/jadwalStsGanjil2026.ts with ' + items.length + ' official sessions!');
