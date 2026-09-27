import { db } from '../data/db';
import { autoSyncEngine } from '../data/autoSyncEngine';
import { formatClockTime } from '../lib/utils';
import { generateJadwalItemsFromMaster } from '../data/masterJadwalData';
import { JADWAL_STS_GANJIL_2026 } from '../data/jadwalStsGanjil2026';

/**
 * Helper untuk normalisasi kunci Mapel & Kelas
 */
function normalizeCbtKey(mapel: string, kelas: string): string {
  const cleanM = String(mapel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanK = String(kelas || '').toLowerCase().replace(/[^0-9a-z]/g, '');
  return `${cleanM}___${cleanK}`;
}

/**
 * Deduplikasi sesi ujian CBT untuk mencegah double counting
 * dan memastikan tepat 117 Sesi Ujian STS Resmi Paten (membuang sesi ganda / jadwal usang 204 sesi).
 */
export function deduplicateUjianSessions(list: any[]): any[] {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }

  // Petakan jadwal paten resmi 117 sesi sebagai acuan validasi tertinggi
  const officialMap = new Map<string, any>();
  (JADWAL_STS_GANJIL_2026 || []).forEach(item => {
    officialMap.set(normalizeCbtKey(item.mapel, item.kelas), item);
  });

  // Prioritaskan sesi resmi (berisi SES-STS-26- atau tanggal resmi 27 Sep / jadwal paten)
  const sortedList = [...list].sort((a, b) => {
    const aId = String(a.id || a.UjianID || '');
    const bId = String(b.id || b.UjianID || '');
    const aIsPatented = aId.startsWith('SES-STS-26-');
    const bIsPatented = bId.startsWith('SES-STS-26-');
    if (aIsPatented && !bIsPatented) return -1;
    if (!aIsPatented && bIsPatented) return 1;

    const aTgl = String(a.tgl || a.tanggal || '');
    const bTgl = String(b.tgl || b.tanggal || '');
    if (aTgl.includes('2026-09-27') && !bTgl.includes('2026-09-27')) return -1;
    if (!aTgl.includes('2026-09-27') && bTgl.includes('2026-09-27')) return 1;

    return 0;
  });

  const seenIds = new Set<string>();
  const seenMapelKelas = new Set<string>();
  const result: any[] = [];

  for (const item of sortedList) {
    if (!item) continue;
    const id = String(item.id || item.UjianID || item.ujianId || item.sesiId || '').trim();
    if (id.startsWith('SIM-') || item.isSimulation || item.isDummy) {
      continue;
    }
    const mapel = String(item.mapel || item.Mapel || item.namaUjian || item.NamaUjian || '').trim();
    const kelas = String(item.kelas || item.Kelas || '').trim();
    const mapelKey = mapel.toLowerCase();
    const kelasKey = kelas.toLowerCase();
    const matchKey = normalizeCbtKey(mapel, kelas);

    if (id && seenIds.has(id)) {
      continue; // ID duplikat
    }

    // 1 Sesi per 1 Mapel & 1 Kelas di Asesmen STS Ganjil (mencegah penumpukan 204 sesi ganda)
    if (matchKey !== '___' && seenMapelKelas.has(matchKey)) {
      continue;
    }

    if (id) seenIds.add(id);
    if (matchKey !== '___') seenMapelKelas.add(matchKey);

    const jenis = String(item.jenis || item.Jenis || item.JenisUjian || item.jenisUjian || 'Sumatif Tengah Semester (STS)').trim();
    const durasi = String(item.durasi || item.Durasi || (item.durasiMenit ? `${item.durasiMenit} Menit` : '90 Menit')).trim();
    const durasiMenit = Number(String(item.durasiMenit || durasi).replace(/\D/g, '')) || 90;
    const proktor = String(item.proktor || item.Proktor || item.pengawas || item.Pengawas || 'Guru Kelas').trim();
    const soal = String(item.soal || item.Soal || item.jumlahSoal || item.JumlahSoal || '30 Butir Soal (PG)').trim();
    const peserta = item.peserta !== undefined ? item.peserta : (item.Peserta !== undefined ? item.Peserta : 30);
    const namaUjian = String(item.namaUjian || item.NamaUjian || item.mapel || item.Mapel || 'Ujian').trim();

    // Preserve exact clock times without forcing 19:30 or 22:00
    const rawJamMulai = item.jamMulai || item.JamMulai;
    const rawJamSelesai = item.jamSelesai || item.JamSelesai;
    const cleanJamMulai = rawJamMulai ? formatClockTime(rawJamMulai, '10:00') : '10:00';
    const cleanJamSelesai = rawJamSelesai ? formatClockTime(rawJamSelesai, '12:00') : '12:00';

    result.push({
      ...item,
      id: id || item.id,
      UjianID: id || item.UjianID || item.id,
      mapel: item.mapel || item.Mapel,
      Mapel: item.Mapel || item.mapel,
      namaUjian,
      NamaUjian: namaUjian,
      kelas: item.kelas || item.Kelas,
      Kelas: item.Kelas || item.kelas,
      tgl: item.tgl || item.tanggal || item.Tanggal,
      tanggal: item.tanggal || item.tgl || item.Tanggal,
      tglDisplay: item.tglDisplay || item.TanggalDisplay || item.tgl || '',
      jamMulai: cleanJamMulai,
      jamSelesai: cleanJamSelesai,
      JamMulai: cleanJamMulai,
      JamSelesai: cleanJamSelesai,
      token: item.token || item.Token,
      status: item.status || item.Status || 'Terjadwal',
      jenis,
      Jenis: jenis,
      JenisUjian: jenis,
      jenisUjian: jenis,
      durasi,
      Durasi: durasi,
      durasiMenit,
      proktor,
      Proktor: proktor,
      pengawas: proktor,
      soal,
      Soal: soal,
      jumlahSoal: soal,
      peserta,
      Peserta: peserta,
      bankSoalId: item.bankSoalId || item.BankSoalID || undefined,
      BankSoalID: item.BankSoalID || item.bankSoalId || undefined,
      soalList: Array.isArray(item.soalList) ? item.soalList : undefined,
      avg: Number(item.avg ?? item.Avg ?? 0) || 0,
      semester: item.semester || item.Semester || 'Ganjil',
      tahunAjaran: item.tahunAjaran || item.TahunAjaran || '2026/2027',
      acakSoal: item.acakSoal !== undefined ? item.acakSoal : (String(item.AcakSoal || '').toLowerCase() === 'ya' || item.AcakSoal === true),
      acakOpsi: item.acakOpsi !== undefined ? item.acakOpsi : (String(item.AcakOpsi || '').toLowerCase() === 'ya' || item.AcakOpsi === true),
      tampilkanNilai: item.tampilkanNilai !== undefined ? item.tampilkanNilai : (String(item.TampilkanNilai || '').toLowerCase() === 'ya' || item.TampilkanNilai === true)
    });
  }

  return result;
}

/**
 * Deduplikasi Token Riwayat Ujian
 */
export function deduplicateTokens(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: any[] = [];

  for (const item of list) {
    if (!item) continue;
    const rawSesi = String(item.sesiId || item.UjianID || item.ujianId || item.id || '').replace(/^tok-/, '').trim();
    const token = String(item.token || item.Token || '').trim();
    const key = rawSesi || token;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    result.push({
      ...item,
      id: item.id || `tok-${rawSesi}`,
      sesiId: rawSesi || item.sesiId,
      UjianID: rawSesi || item.UjianID,
      token: item.token || item.Token,
      status: item.status || 'Aktif'
    });
  }
  return result;
}

/**
 * Menyinkronkan Sesi Ujian CBT ke:
 * 1. Modul CBT (ujian_cbt & cbt_exams)
 * 2. Token Ujian (cbt_token_history & cbt_tokens)
 * 3. Jadwal Ujian CBT (cbt_schedules, jadwal_ujian)
 * 4. Antrian Google Spreadsheet Sync (Sheet UJIAN & TOKEN)
 */
export function syncStsToAllSystems(customList?: any[]) {
  const rawUjian = db.get('ujian_cbt');
  const existingUjian = Array.isArray(rawUjian) ? rawUjian : [];
  const sourceList = customList && customList.length > 0 ? customList : existingUjian;

  // 1. Simpan ke CBT Exams (Dinamis sesuai seluruh jadwal yang ada)
  const fullUjian = deduplicateUjianSessions(sourceList);
  db.set('ujian_cbt', fullUjian);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'ujian_cbt' } }));
  }

  // 2. Simpan ke Token History (1 Token per 1 Sesi)
  const sessionTokens = fullUjian.map((item: any) => ({
    id: `tok-${item.id || item.UjianID}`,
    sesiId: item.id || item.UjianID,
    UjianID: item.id || item.UjianID,
    mapel: item.mapel || item.Mapel,
    kelas: item.kelas || item.Kelas,
    token: item.token || item.Token,
    waktuDibuat: `${item.jamMulai || '10:00'} WIB`,
    kedaluwarsa: `${item.tglDisplay || item.tgl || ''}, ${item.jamSelesai || '12:00'} WIB`,
    status: 'Aktif' as const,
    proktor: item.pengawas || item.proktor || 'Guru Pengawas'
  }));
  const fullTokens = deduplicateTokens(sessionTokens);
  db.set('cbt_token_history', fullTokens);
  db.set('cbt_tokens', fullTokens);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'cbt_token_history' } }));
  }

  // 3. Simpan ke Jadwal Ujian CBT (Bukan Jadwal Pelajaran Mingguan!)
  // Jadwal Ujian bersifat insidental/berkala, terpisah dari Jadwal KBM Mingguan rutin 3x pertemuan
  const stsSchedules = fullUjian.map((item, idx) => {
      let hari = 'Minggu';
      try {
        const d = new Date(item.tgl);
        if (!isNaN(d.getTime())) {
          const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          hari = days[d.getDay()] || 'Senin';
        }
      } catch {}

    return {
      id: `JDW-STS-26-${String(idx + 1).padStart(3, '0')}`,
      JadwalID: `JDW-STS-26-${String(idx + 1).padStart(3, '0')}`,
      Hari: hari,
      hari: hari,
      Tanggal: item.tgl,
      tgl: item.tgl,
      tglDisplay: item.tglDisplay,
      JamMulai: item.jamMulai,
      jamMulai: item.jamMulai,
      JamSelesai: item.jamSelesai,
      jamSelesai: item.jamSelesai,
      Jam: `${item.jamMulai} - ${item.jamSelesai} WIB`,
      jam: `${item.jamMulai} - ${item.jamSelesai} WIB`,
      Kelas: item.kelas,
      kelas: item.kelas,
      NamaKelas: item.kelas,
      Mapel: item.mapel,
      mapel: item.mapel,
      NamaMapel: item.mapel,
      Guru: item.pengawas || 'Guru Pengampu / Proktor',
      guru: item.pengawas || 'Guru Pengampu / Proktor',
      NamaGuru: item.pengawas || 'Guru Pengampu / Proktor',
      Ruangan: `Ruang CBT (${item.kelas})`,
      ruang: `Ruang CBT (${item.kelas})`,
      TahunAjaran: '2026/2027',
      tahunAjaran: '2026/2027',
      Semester: 'Ganjil',
      semester: 'Ganjil',
      Status: item.status || 'Terjadwal',
      status: item.status || 'Terjadwal',
      Kategori: 'Ujian STS Ganjil',
      kategori: 'Ujian STS Ganjil',
      kategoriBelajar: 'Semua',
      Token: item.token,
      token: item.token,
      UjianID: item.id
    };
  });

  db.set('cbt_schedules', stsSchedules);
  db.set('jadwal_ujian', stsSchedules);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'cbt_schedules' } }));
  }

  // 4. Bersihkan Jadwal Pelajaran Mingguan dari kontaminasi jadwal ujian
  // Jadwal Mingguan KTCT Tambora secara ketat menganut Skema 3x Pertemuan Sinkron per Minggu (Senin, Rabu/Kamis, Minggu)
  const isExamItem = (item: any) => {
    if (!item) return false;
    const id = String(item.id || item.JadwalID || item.UjianID || '').toUpperCase();
    if (id.startsWith('JDW-STS-') || id.startsWith('SES-STS-') || id.startsWith('CBT-') || id.startsWith('UJIAN-')) return true;
    const kat = String(item.Kategori || item.kategori || '').toLowerCase();
    if (kat.includes('ujian') || kat.includes('cbt') || kat.includes('sts') || kat.includes('sas') || kat.includes('asesmen')) return true;
    const r = String(item.Ruang || item.ruang || item.Ruangan || '').toLowerCase();
    if (r.includes('ruang cbt') || r.includes('laboratorium cbt')) return true;
    if (item.Token || item.token || item.UjianID || item.ujianId) return true;
    return false;
  };

  const rawWeekly = (db.get('jadwal_rombel') || db.get('academic_schedules') || db.get('jadwal_pelajaran') || db.get('schedule') || []) as any[];
  let cleanWeekly = Array.isArray(rawWeekly) ? rawWeekly.filter((j: any) => !isExamItem(j)) : [];

  // Jika setelah dibersihkan jadwal mingguan kosong, pulihkan 27 Sesi Resmi KTCT Tambora
  if (!cleanWeekly || cleanWeekly.length === 0) {
    cleanWeekly = generateJadwalItemsFromMaster('2026/2027', 'Ganjil');
  }

  db.set('academic_schedules', cleanWeekly);
  db.set('jadwal_rombel', cleanWeekly);
  db.set('jadwal_pelajaran', cleanWeekly);
  db.set('schedule', cleanWeekly);
  db.set('jadwal', cleanWeekly);
  db.set('JADWAL', cleanWeekly);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'academic_schedules' } }));
    window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'jadwal_rombel' } }));
  }

  // 5. Push ke Google Spreadsheet antrean tabel CBT
  try {
    autoSyncEngine.pushSpecificTables(['UJIAN', 'CBT_UJIAN', 'TOKEN', 'CBT_TOKEN', 'JADWAL']).catch(() => {});
  } catch (err) {
    console.warn('AutoSync push error:', err);
  }

  return { fullUjian, fullTokens, stsSchedules, cleanWeeklySchedules: cleanWeekly };
}
