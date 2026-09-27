/**
 * KODE RESMI GOOGLE APPS SCRIPT (Code.gs)
 * SISTEM CBT ASESMEN + KONFIRMASI SISWA ROMBEL KARANG TARUNA TAMBORA
 * Spreadsheet ID: 1iqO_qA0J9tWhU1dLbSrUWyu3nK53pEJGfyKgseBOE7E
 */

export const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: SISTEM CBT UJIAN + KONFIRMASI SISWA ROMBEL KTCT
 * Spreadsheet ID: 1iqO_qA0J9tWhU1dLbSrUWyu3nK53pEJGfyKgseBOE7E
 * =========================================================================
 * 
 * MENGGABUNGKAN SELURUH FITUR (100% AMAN TANPA MENGHAPUS FITUR LAMA):
 * 1. FITUR KONFIRMASI SISWA (TETAP UTUH):
 *    - Sheet SISWA: Diperbarui otomatis (Status & SKesanggupan tetap aman).
 *    - 5 Sheet Konfirmasi: KONFIRMASI, JADWAL (3x seminggu), REKAP_HARI, REKAP_SUDAH, REKAP_STATUS_AKSI.
 *    - Simpan Otomatis Berkas PDF Surat Kesanggupan ke Google Drive.
 *    - Simpan Otomatis Pas Foto Siswa ke Google Drive.
 *    - Pengaman angka 0 di depan (Leading Zero Protection).
 * 
 * 2. FITUR UJIAN CBT & ASESMEN STS/PTS (BARU DITAMBAHKAN):
 *    - Simpan Hasil Nilai CBT ke sheet NILAI_PTS.
 *    - Sinkronisasi Butir Soal dari/ke sheet BANK_SOAL.
 *    - Log Pelanggaran Anti-Nyontek ke sheet LOG_PELANGGARAN.
 *    - Buat & Isi 117 Jadwal Ujian Resmi ke sheet JADWAL_DAN_KELAS.
 * =========================================================================
 */

// KONFIGURASI GLOBAL
const SPREADSHEET_ID = '1iqO_qA0J9tWhU1dLbSrUWyu3nK53pEJGfyKgseBOE7E';
const FOLDER_ID_FOTO = '1nxSpZEe3ar1_icNZGsWzLLbz3U_oBFQO'; // Folder Google Drive Pas Foto
const FOLDER_ID_PDF  = '1MY3oIwIIj05zlZCL4BF-3TVsbx4tG3TQ'; // Folder Google Drive Berkas PDF
const KKM_DEFAULT    = 75;

/**
 * Handle GET Request (Status, Test Endpoint, dan Pengambilan Data Ujian)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'status';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 1. Ambil Butir Soal (Sheet: BANK_SOAL)
    if (action === 'getBankSoal') {
      const sheet = ss.getSheetByName('BANK_SOAL');
      if (!sheet) return respondJSON({ success: false, message: 'Sheet BANK_SOAL belum ada. Jalankan setupSheets()' });
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return respondJSON({ success: true, count: 0, data: [] });
      const headers = data[0];
      const rows = data.slice(1);
      const result = rows.map(r => {
        let item = {};
        headers.forEach((h, i) => item[h] = r[i]);
        return item;
      });
      return respondJSON({ success: true, count: result.length, data: result });
    }

    // 2. Ambil Rekap Nilai Ujian (Sheet: NILAI_PTS)
    if (action === 'getNilai') {
      const sheet = ss.getSheetByName('NILAI_PTS');
      if (!sheet) return respondJSON({ success: true, count: 0, data: [] });
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      const result = rows.map(r => {
        let item = {};
        headers.forEach((h, i) => item[h] = r[i]);
        return item;
      });
      return respondJSON({ success: true, count: result.length, data: result });
    }

    // 3. Status Koneksi Default
    const sheetSiswa = ss.getSheetByName('SISWA');
    const totalSiswa = sheetSiswa ? Math.max(0, sheetSiswa.getLastRow() - 1) : 0;

    return respondJSON({
      status: 'success',
      message: 'Google Apps Script CBT & Konfirmasi Siswa KTCT Aktif dan Terhubung!',
      spreadsheetId: SPREADSHEET_ID,
      spreadsheetName: ss.getName(),
      totalSiswaTerdata: totalSiswa,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return respondJSON({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Handle POST Request (Konfirmasi Siswa, Update Profil, Hasil Ujian CBT, Bank Soal, Log Pelanggaran)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return respondJSON({ success: false, message: 'Server Google Sheets sibuk, silakan coba beberapa saat lagi.' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respondJSON({ success: false, message: 'Payload data kosong.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'submit_konfirmasi_multisheet';
    const ss = SpreadsheetApp.openById(payload.spreadsheetId || SPREADSHEET_ID);

    // =========================================================================
    // MODUL UJIAN CBT & ASESMEN (BARU)
    // =========================================================================

    // A. SIMPAN HASIL UJIAN CBT KE SHEET 'NILAI_PTS'
    if (action === 'save_cbt_result' || action === 'submit_exam') {
      const sheet = getOrCreateSheet(ss, 'NILAI_PTS', [
        'ID_Hasil', 'Waktu_Submit', 'NISN', 'Nama_Siswa', 'Kelas', 'Jenjang',
        'Mata_Pelajaran', 'Nilai_Skor', 'Jumlah_Benar', 'Jumlah_Salah',
        'Total_Soal', 'Status_Kelulusan', 'Jumlah_Pelanggaran', 'Durasi_Pengerjaan'
      ]);

      const sub = payload.submission || payload;
      const skor = Number(sub.nilaiAkhir !== undefined ? sub.nilaiAkhir : (sub.nilaiMentah || 0));
      const pelanggaran = Number(sub.pelanggaran || 0);
      let statusFinal = skor >= KKM_DEFAULT ? '✅ LULUS' : '❌ REMEDIAL';
      if (pelanggaran >= 3) {
        statusFinal = '⚠️ DISKUALIFIKASI';
      }

      sheet.appendRow([
        sub.idHasil || ('HSL-' + Utilities.getUuid().slice(0, 8)),
        sub.waktuSelesai || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
        "'" + String(sub.nisn || ''),
        sub.namaSiswa || '',
        sub.kelas || '',
        sub.jenjang || '',
        sub.mapel || '',
        skor,
        Number(sub.jmlBenar || 0),
        Number(sub.jmlSalah || 0),
        Number(sub.totalSoal || 0),
        statusFinal,
        pelanggaran,
        sub.durasiPengerjaan || '-'
      ]);

      return respondJSON({ success: true, message: 'Hasil ujian CBT berhasil dicatat di sheet NILAI_PTS' });
    }

    // B. SIMPAN BUTIR SOAL KE SHEET 'BANK_SOAL'
    if (action === 'save_soal') {
      const sheet = getOrCreateSheet(ss, 'BANK_SOAL', [
        'idSoal', 'idUjian', 'mapel', 'jenjang', 'kelas', 'tipe', 'soal',
        'gambar', 'a', 'b', 'c', 'd', 'kunci', 'bobot', 'status'
      ]);

      const q = payload.soalData;
      sheet.appendRow([
        q.idSoal || ('SOAL-' + Utilities.getUuid().slice(0, 6)),
        q.idUjian || '',
        q.mapel || '',
        q.jenjang || '',
        q.kelas || '',
        q.tipe || 'PILIHAN_GANDA',
        q.soal || '',
        q.gambar || '',
        q.a || '',
        q.b || '',
        q.c || '',
        q.d || '',
        q.kunci || 'A',
        Number(q.bobot || 5),
        q.status || 'AKTIF'
      ]);

      return respondJSON({ success: true, message: 'Butir soal berhasil disimpan ke sheet BANK_SOAL' });
    }

    // C. LOG PELANGGARAN UJIAN (ANTI-NYONTEK)
    if (action === 'log_pelanggaran') {
      const sheet = getOrCreateSheet(ss, 'LOG_PELANGGARAN', [
        'Waktu', 'NISN', 'Nama_Siswa', 'Kelas', 'Mata_Pelajaran', 'Jenis_Pelanggaran', 'Pelanggaran_Ke', 'Status_Ujian'
      ]);
      sheet.appendRow([
        Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
        "'" + String(payload.nisn || ''),
        payload.namaSiswa || '',
        payload.kelas || '',
        payload.mapel || '',
        payload.jenis || 'Pindah Tab Browser / Keluar Layar',
        payload.pelanggaranKe || 1,
        payload.statusUjian || 'Dalam Pengawasan'
      ]);
      return respondJSON({ success: true });
    }

    // =========================================================================
    // MODUL KONFIRMASI SISWA & BIODATA (FITUR ASLI ANDA - 100% TERJAGA)
    // =========================================================================

    // 1. SUBMIT KONFIRMASI LENGKAP KE 5 SHEET + MUTAKHIRKAN SHEET SISWA
    if (action === 'submit_konfirmasi_multisheet') {
      const data = payload.data;
      if (!data || !data.rows) {
        return respondJSON({ success: false, message: 'Format data baris tidak valid.' });
      }

      const rows = data.rows;
      const profile = data.profile || {};
      const schedule = data.schedule || {};
      const statement = data.statement || {};

      const cleanNopdkt = String(profile.nopdkt || profile.idNumber || '001').replace(/['\\s]/g, '').padStart(3, '0');
      const cleanKelas = String(profile.KelasSaatini || profile.kelasSaatIni || profile.kelasRombel || 'Paket C - Kelas X').trim().replace(/[\\/\\\\?%*:|"<>]/g, '-');
      const cleanNama = String(profile.namaLengkap || profile.NamaLengkap || 'Siswa').trim().replace(/[\\/\\\\?%*:|"<>]/g, '-');
      const defaultPdfFileName = cleanNopdkt + '_' + cleanKelas + '_' + cleanNama + '_Surat_Kesanggupan.pdf';
      const pdfFileName = payload.pdfFileName || payload.fileName || statement.fileName || defaultPdfFileName;

      const pdfBase64 = payload.pdfBase64 || payload.fileBase64 || statement.fileBase64 || (statement.fileDataUrl && statement.fileDataUrl.includes('base64,') ? statement.fileDataUrl : '') || (data && data.pdfBase64);

      let directPdfUrl = '';
      if (pdfBase64) {
        directPdfUrl = savePdfToDrive(pdfBase64, pdfFileName);
      }

      const photoBase64 = payload.photoBase64 || (data && data.photoBase64);
      let photoDriveUrl = '';
      if (photoBase64 && photoBase64.includes('base64,')) {
        photoDriveUrl = savePhotoToDrive(photoBase64, payload.photoFileName || (cleanNopdkt + ' ' + cleanNama + '.jpg'));
      }

      // 1. Simpan ke Sheet KONFIRMASI (17 Kolom)
      appendOrUpdateRow(ss, 'KONFIRMASI', getKonfirmasiHeaders(), rows.KONFIRMASI, 1, rows.KONFIRMASI ? rows.KONFIRMASI[1] : '');

      // 2. Simpan ke Sheet JADWAL (12 Kolom)
      appendOrUpdateRow(ss, 'JADWAL', getJadwalHeaders(), rows.JADWAL, 1, rows.JADWAL ? rows.JADWAL[1] : '');

      // 3. Simpan ke Sheet REKAP_HARI (5 Kolom, 3 Baris per siswa dengan kode unik)
      if (Array.isArray(rows.REKAP_HARI)) {
        if (rows.REKAP_HARI.length > 0 && Array.isArray(rows.REKAP_HARI[0])) {
          appendOrUpdateMultipleRows(ss, 'REKAP_HARI', getRekapHariHeaders(), rows.REKAP_HARI, 0);
        } else {
          appendOrUpdateRow(ss, 'REKAP_HARI', getRekapHariHeaders(), rows.REKAP_HARI, 0, rows.REKAP_HARI[0]);
        }
      }

      // 4. Simpan ke Sheet REKAP_SUDAH (18 Kolom)
      if (rows.REKAP_SUDAH && Array.isArray(rows.REKAP_SUDAH)) {
        if (rows.REKAP_SUDAH.length > 13) rows.REKAP_SUDAH[13] = pdfFileName;
        if (directPdfUrl && rows.REKAP_SUDAH.length > 14) {
          rows.REKAP_SUDAH[14] = directPdfUrl;
        }
      }
      appendOrUpdateRow(ss, 'REKAP_SUDAH', getRekapSudahHeaders(), rows.REKAP_SUDAH, 2, rows.REKAP_SUDAH ? rows.REKAP_SUDAH[2] : '');

      // 5. Simpan ke Sheet REKAP_STATUS_AKSI (13 Kolom termasuk SKesanggupan & SPernyataan)
      if (rows.REKAP_STATUS_AKSI && Array.isArray(rows.REKAP_STATUS_AKSI)) {
        if (directPdfUrl && rows.REKAP_STATUS_AKSI.length > 11) {
          rows.REKAP_STATUS_AKSI[11] = directPdfUrl;
        }
        if (photoDriveUrl && rows.REKAP_STATUS_AKSI.length > 12) {
          rows.REKAP_STATUS_AKSI[12] = photoDriveUrl;
        }
      }
      appendOrUpdateRow(ss, 'REKAP_STATUS_AKSI', getRekapStatusAksiHeaders(), rows.REKAP_STATUS_AKSI, 3, rows.REKAP_STATUS_AKSI ? rows.REKAP_STATUS_AKSI[3] : '');

      // 6. Mutakhirkan Sheet Master SISWA
      updateMasterSheetSiswaBiodata(ss, profile, photoDriveUrl || null);

      return respondJSON({
        success: true,
        message: directPdfUrl 
          ? 'Konfirmasi berhasil disimpan ke seluruh 5 sheet dan Berkas PDF otomatis tersimpan di Google Drive.' 
          : 'Konfirmasi berhasil disimpan ke seluruh 5 sheet dan Sheet SISWA diperbarui.',
        sheetsUpdated: ['SISWA', 'KONFIRMASI', 'JADWAL', 'REKAP_HARI', 'REKAP_SUDAH', 'REKAP_STATUS_AKSI'],
        verificationCode: statement.verificationCode,
        pdfUrl: directPdfUrl,
        pdfFileName: pdfFileName,
        timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      });
    }

    // 2. UPDATE PROFIL BIODATA SISWA DI SHEET SISWA & DRIVE PAS FOTO
    if (action === 'update_profile') {
      const profile = payload.profile;
      const photoBase64 = payload.photoBase64;
      const photoFileName = payload.photoFileName;

      let photoDriveUrl = '';
      if (photoBase64 && photoBase64.includes('base64,')) {
        photoDriveUrl = savePhotoToDrive(photoBase64, photoFileName || ((profile.nopdkt || 'PDKT') + ' ' + (profile.namaLengkap || 'Siswa') + '.jpg'));
      }

      const updated = updateMasterSheetSiswaBiodata(ss, profile, photoDriveUrl);

      return respondJSON({
        success: true,
        message: updated ? 'Biodata siswa berhasil dimutakhirkan di sheet SISWA.' : 'Data siswa dicatat di sheet SISWA.',
        photoUrl: photoDriveUrl
      });
    }

    // 3. UPDATE STATUS AKSI (KIRIM WA / DOWNLOAD PDF)
    if (action === 'update_status_aksi') {
      updateRekapStatusAksiFlags(ss, payload.nopdkt || '', payload.namaLengkap || '', payload.statusKirimWa, payload.statusDownloadPdf);
      return respondJSON({
        success: true,
        message: 'Status aksi WhatsApp / PDF berhasil diperbarui di sheet REKAP_STATUS_AKSI.'
      });
    }

    // 4. UPLOAD STANDALONE PDF KE GOOGLE DRIVE
    if (action === 'upload_pdf') {
      const pdfBase64 = payload.pdfBase64 || payload.fileBase64;
      const pdfFileName = payload.pdfFileName || payload.fileName || 'Surat_Pernyataan_Kesanggupan.pdf';
      const pdfUrl = savePdfToDrive(pdfBase64, pdfFileName);

      return respondJSON({
        success: Boolean(pdfUrl),
        message: pdfUrl ? 'PDF berhasil diunggah ke Google Drive.' : 'Gagal mengunggah PDF ke Google Drive.',
        pdfUrl: pdfUrl,
        fileName: pdfFileName
      });
    }

    // 5. BERSIHKAN STATUS AYAH YANG SALAH TERISI
    if (action === 'fix_status_ayah') {
      const fixedCount = perbaikiStatusAyahYangSalah(ss);
      return respondJSON({
        success: true,
        fixedCount: fixedCount,
        message: 'StatusAyah yang salah berhasil diperbaiki menjadi Masih Hidup.'
      });
    }

    return respondJSON({ success: false, message: 'Aksi tidak dikenali: ' + action });

  } catch (error) {
    return respondJSON({
      success: false,
      message: 'Gagal memproses ke Google Spreadsheet: ' + error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * =========================================================================
 * FUNGSI SETUP OTOMATIS (DAPAT DIJALANKAN DARI TOOLBAR RUN DI APPS SCRIPT)
 * =========================================================================
 */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. BANK_SOAL (15 Kolom)
  getOrCreateSheet(ss, 'BANK_SOAL', [
    'idSoal', 'idUjian', 'mapel', 'jenjang', 'kelas', 'tipe', 'soal',
    'gambar', 'a', 'b', 'c', 'd', 'kunci', 'bobot', 'status'
  ]);

  // 2. NILAI_PTS (14 Kolom)
  getOrCreateSheet(ss, 'NILAI_PTS', [
    'ID_Hasil', 'Waktu_Submit', 'NISN', 'Nama_Siswa', 'Kelas', 'Jenjang',
    'Mata_Pelajaran', 'Nilai_Skor', 'Jumlah_Benar', 'Jumlah_Salah',
    'Total_Soal', 'Status_Kelulusan', 'Jumlah_Pelanggaran', 'Durasi_Pengerjaan'
  ]);

  // 3. LOG_PELANGGARAN (8 Kolom)
  getOrCreateSheet(ss, 'LOG_PELANGGARAN', [
    'Waktu', 'NISN', 'Nama_Siswa', 'Kelas', 'Mata_Pelajaran', 'Jenis_Pelanggaran', 'Pelanggaran_Ke', 'Status_Ujian'
  ]);

  // 4. JADWAL_DAN_KELAS (12 Kolom + Isi 13 Jadwal Resmi Otomatis)
  buatSheetJadwalDanIsi(ss);

  SpreadsheetApp.getUi().alert('Selamat! Seluruh Sheet Sistem CBT (BANK_SOAL, NILAI_PTS, LOG_PELANGGARAN, JADWAL_DAN_KELAS) berhasil dibuat tanpa menghapus sheet yang lama!');
}

/**
 * Buat dan Isi Sheet JADWAL_DAN_KELAS dengan Jadwal Ujian Resmi
 */
function buatSheetJadwalDanIsi(spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('JADWAL_DAN_KELAS');
  if (!sheet) {
    sheet = ss.insertSheet('JADWAL_DAN_KELAS');
  }

  if (sheet.getLastRow() <= 1) {
    sheet.clear();
    const headers = [
      'Kode_Jadwal', 'Hari', 'Tanggal', 'Sesi_Jam', 'Program_Rombel', 'Kelas',
      'Mata_Pelajaran', 'Tutor_Pengawas', 'Ruangan', 'Token_CBT', 'Durasi_Menit', 'Status_Ujian'
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#38bdf8');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);

    const dataJadwal = [
      ['JDW-STS-001', 'Senin', '2026-09-28', '19:30 - 22:00 WIB', 'Paket B', '9', 'Matematika Terapan', 'Ibu Ratna Dewi, M.Pd', 'Ruang CBT 1', 'KTCT99', 90, 'AKTIF'],
      ['JDW-STS-002', 'Senin', '2026-09-28', '19:30 - 22:00 WIB', 'Paket B', '9', 'Bahasa Indonesia', 'Bpk. Ahmad Fauzi, S.Pd', 'Ruang CBT 1', 'KTCT98', 90, 'AKTIF'],
      ['JDW-STS-003', 'Selasa', '2026-09-29', '19:30 - 22:00 WIB', 'Paket B', '9', 'Ilmu Pengetahuan Alam', 'Ibu Ratna Dewi, M.Pd', 'Ruang CBT 1', 'KTCT97', 90, 'AKTIF'],
      ['JDW-STS-004', 'Selasa', '2026-09-29', '19:30 - 22:00 WIB', 'Paket B', '9', 'Ilmu Pengetahuan Sosial', 'Bpk. Hendra Gunawan', 'Ruang CBT 1', 'KTCT96', 90, 'AKTIF'],
      ['JDW-STS-005', 'Rabu', '2026-09-30', '19:30 - 22:00 WIB', 'Paket B', '9', 'Bahasa Inggris', 'Tutor Tamu', 'Ruang CBT 1', 'KTCT95', 90, 'AKTIF'],
      ['JDW-STS-006', 'Rabu', '2026-09-30', '19:30 - 22:00 WIB', 'Paket B', '9', 'Pendidikan Pancasila', 'Guru Pamong', 'Ruang CBT 1', 'KTCT94', 90, 'AKTIF'],
      ['JDW-STS-007', 'Senin', '2026-09-28', '19:30 - 22:00 WIB', 'Paket C', '11', 'Matematika', 'Bpk. Ahmad Fauzi, S.Pd', 'Ruang CBT 2', 'KTCTC1', 90, 'AKTIF'],
      ['JDW-STS-008', 'Senin', '2026-09-28', '19:30 - 22:00 WIB', 'Paket C', '11', 'Bahasa Indonesia', 'Ibu Ratna Dewi, M.Pd', 'Ruang CBT 2', 'KTCTC2', 90, 'AKTIF'],
      ['JDW-STS-009', 'Selasa', '2026-09-29', '19:30 - 22:00 WIB', 'Paket C', '11', 'Sosiologi', 'Bpk. Hendra Gunawan', 'Ruang CBT 2', 'KTCTC3', 90, 'AKTIF'],
      ['JDW-STS-010', 'Selasa', '2026-09-29', '19:30 - 22:00 WIB', 'Paket C', '11', 'Ekonomi', 'Guru Pamong', 'Ruang CBT 2', 'KTCTC4', 90, 'AKTIF'],
      ['JDW-STS-011', 'Senin', '2026-09-28', '19:30 - 22:00 WIB', 'Paket A', '6', 'Matematika', 'Guru Kelas', 'Ruang CBT 3', 'KTCTA1', 60, 'AKTIF'],
      ['JDW-STS-012', 'Senin', '2026-09-28', '19:30 - 22:00 WIB', 'Paket A', '6', 'Bahasa Indonesia', 'Guru Kelas', 'Ruang CBT 3', 'KTCTA2', 60, 'AKTIF'],
      ['JDW-STS-013', 'Kamis', '2026-10-01', '19:30 - 22:00 WIB', 'Paket C', '12', 'Ujian Vokasi & Keterampilan', 'Tutor Khusus', 'Lab Komputer', 'KTCTVOK', 120, 'AKTIF']
    ];

    sheet.getRange(2, 1, dataJadwal.length, headers.length).setValues(dataJadwal);
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#38bdf8');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * =========================================================================
 * HELPER FUNCTIONS (UTUH DARI SKRIP ASLI ANDA)
 * =========================================================================
 */
function protectLeadingZero(val, minDigits) {
  if (val === null || val === undefined || val === '') return '-';
  const str = String(val).trim();
  if (str === '-') return '-';
  if (str.startsWith("'")) return str;

  if (/^\\d+$/.test(str)) {
    const padded = minDigits ? str.padStart(minDigits, '0') : str;
    return "'" + padded;
  }
  return str;
}

function sanitizeRowData(rowData) {
  if (!Array.isArray(rowData)) return [];
  return rowData.map(function(item) {
    if (item === null || item === undefined) return '';
    const str = String(item).trim();
    if (/^0\\d+$/.test(str) && !str.startsWith("'")) {
      return "'" + str;
    }
    return item;
  });
}

function appendOrUpdateRow(ss, sheetName, headers, rawRowData, matchColIndex, rawMatchValue) {
  if (!rawRowData || rawRowData.length === 0) return;
  const rowData = sanitizeRowData(rawRowData);

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  const lastRow = sheet.getLastRow();
  const cleanMatch = String(rawMatchValue || '').replace(/['\\s]/g, '').toLowerCase();

  if (lastRow > 1 && cleanMatch) {
    const numRows = lastRow - 1;
    const colValues = sheet.getRange(2, matchColIndex + 1, numRows, 1).getValues();

    for (let i = 0; i < colValues.length; i++) {
      const cellVal = String(colValues[i][0] || '').replace(/['\\s]/g, '').toLowerCase();
      if (cellVal === cleanMatch || cellVal.replace(/^0+/, '') === cleanMatch.replace(/^0+/, '')) {
        sheet.getRange(i + 2, 1, 1, rowData.length).setNumberFormat('@').setValues([rowData]);
        return;
      }
    }
  }

  const targetRow = Math.max(2, lastRow + 1);
  sheet.getRange(targetRow, 1, 1, rowData.length).setNumberFormat('@').setValues([rowData]);
}

function appendOrUpdateMultipleRows(ss, sheetName, headers, rowDataArray, matchColIndex) {
  if (!Array.isArray(rowDataArray) || rowDataArray.length === 0) return;

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0];
    const headerStr = currentHeaders.join('|').toLowerCase();
    if (headerStr.includes('hari1-3')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  for (let r = 0; r < rowDataArray.length; r++) {
    const singleRow = sanitizeRowData(rowDataArray[r]);
    const matchVal = singleRow[matchColIndex];
    appendOrUpdateRow(ss, sheetName, headers, singleRow, matchColIndex, matchVal);
  }
}

function updateMasterSheetSiswaBiodata(ss, p, photoUrl) {
  if (!p) return false;
  const sheet = ss.getSheetByName('SISWA');
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  if (data.length < 1) return false;

  const headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });

  const pdktIdx = headers.findIndex(function(h) { return h === 'nopdkt' || h.includes('nopdkt') || h.includes('pdkt'); });
  const nisnIdx = headers.findIndex(function(h) { return h === 'nisn'; });
  const nikIdx  = headers.findIndex(function(h) { return h === 'nik'; });
  const namaIdx = headers.findIndex(function(h) { return h === 'namalengkap' || h === 'nama'; });

  const targetPdkt = String(p.nopdkt || p.idNumber || '').replace(/['\\s]/g, '').toLowerCase();
  const targetNisn = String(p.nisn || p.NISN || '').replace(/['\\s]/g, '');
  const targetNik  = String(p.nik || p.NIK || '').replace(/['\\s]/g, '');
  const targetNama = String(p.namaLengkap || p.NamaLengkap || '').trim().toLowerCase();

  let targetRowIndex = -1;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowPdkt = pdktIdx >= 0 ? String(row[pdktIdx]).replace(/['\\s]/g, '').toLowerCase() : '';
    const rowNisn = nisnIdx >= 0 ? String(row[nisnIdx]).replace(/['\\s]/g, '') : '';
    const rowNik  = nikIdx >= 0  ? String(row[nikIdx]).replace(/['\\s]/g, '') : '';
    const rowNama = namaIdx >= 0 ? String(row[namaIdx]).trim().toLowerCase() : '';

    const isMatch = (targetPdkt && (rowPdkt === targetPdkt || rowPdkt.replace(/^0+/, '') === targetPdkt.replace(/^0+/, ''))) ||
                    (targetNisn && rowNisn === targetNisn) ||
                    (targetNik && rowNik === targetNik) ||
                    (targetNama && rowNama === targetNama);

    if (isMatch) {
      targetRowIndex = r + 1;
      break;
    }
  }

  const formattedPdkt = protectLeadingZero(p.nopdkt || p.idNumber, 3);
  const formattedNisn = protectLeadingZero(p.nisn || p.NISN);
  const formattedNik  = protectLeadingZero(p.nik || p.NIK);
  const formattedNoHp = protectLeadingZero(p.noHpWa || p.NomorHP);
  const formattedRt   = protectLeadingZero(p.rt || p.RT, 3);
  const formattedRw   = protectLeadingZero(p.rw || p.RW, 3);
  const formattedKodePos = protectLeadingZero(p.kodePos || p.KodePos);
  const formattedKK   = protectLeadingZero(p.nomorKartuKeluarga || p.NomorKartuKeluarga);
  const formattedNikAyah = protectLeadingZero(p.nikAyah || p.NIKAyah);
  const formattedNikIbu  = protectLeadingZero(p.nikIbu || p.NIKIbu);

  if (targetRowIndex > 1) {
    const currentRow = sheet.getRange(targetRowIndex, 1, 1, headers.length).getValues()[0];
    const updatedRow = currentRow.slice();

    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];

      if (h.includes('skesanggupan') || h.includes('kesanggupan') || h.includes('spernyataan') || h.includes('pernyataan')) {
        continue;
      }

      if (h === 'nopdkt' || h.includes('pdkt')) {
        if (formattedPdkt !== '-') updatedRow[c] = formattedPdkt;
      } else if (h === 'nisn') {
        if (formattedNisn !== '-') updatedRow[c] = formattedNisn;
      } else if (h === 'namalengkap' || h === 'nama') {
        if (p.namaLengkap || p.NamaLengkap) updatedRow[c] = p.namaLengkap || p.NamaLengkap;
      } else if (h === 'jeniskelamin') {
        if (p.jenisKelamin || p.JenisKelamin) updatedRow[c] = p.jenisKelamin || p.JenisKelamin;
      } else if (h === 'tempat lahir' || h === 'tempatlahir') {
        if (p.tempatLahir || p.TempatLahir) updatedRow[c] = p.tempatLahir || p.TempatLahir;
      } else if (h === 'tanggallahir') {
        if (p.tanggalLahir || p.TanggalLahir) updatedRow[c] = p.tanggalLahir || p.TanggalLahir;
      } else if (h === 'nik') {
        if (formattedNik !== '-') updatedRow[c] = formattedNik;
      } else if (h === 'agama') {
        if (p.agama || p.Agama) updatedRow[c] = p.agama || p.Agama;
      } else if (h === 'golongan darah' || h === 'golongandarah') {
        if (p.golonganDarah || p['Golongan Darah']) updatedRow[c] = p.golonganDarah || p['Golongan Darah'];
      } else if (h === 'tinggibadan(cm)' || h.includes('tinggibadan')) {
        if (p.tinggiBadan || p['TinggiBadan(cm)']) updatedRow[c] = p.tinggiBadan || p['TinggiBadan(cm)'];
      } else if (h === 'beratbadan(kg)' || h.includes('beratbadan')) {
        if (p.beratBadan || p['BeratBadan(kg)']) updatedRow[c] = p.beratBadan || p['BeratBadan(kg)'];
      } else if (h === 'prestasi') {
        if (p.prestasi || p.Prestasi) updatedRow[c] = p.prestasi || p.Prestasi;
      } else if (h === 'hobi') {
        if (p.hobi || p.Hobi) updatedRow[c] = p.hobi || p.Hobi;
      } else if (h === 'catatan penting' || h === 'catatanpenting') {
        if (p.catatanPenting || p['Catatan Penting']) updatedRow[c] = p.catatanPenting || p['Catatan Penting'];
      } else if (h === 'alamat') {
        if (p.alamat || p.Alamat) updatedRow[c] = p.alamat || p.Alamat;
      } else if (h === 'rt') {
        if (formattedRt !== '-') updatedRow[c] = formattedRt;
      } else if (h === 'rw') {
        if (formattedRw !== '-') updatedRow[c] = formattedRw;
      } else if (h === 'kelurahan') {
        if (p.kelurahan || p.Kelurahan) updatedRow[c] = p.kelurahan || p.Kelurahan;
      } else if (h === 'kecamatan') {
        if (p.kecamatan || p.Kecamatan) updatedRow[c] = p.kecamatan || p.Kecamatan;
      } else if (h === 'kota') {
        if (p.kota || p.Kota) updatedRow[c] = p.kota || p.Kota;
      } else if (h === 'provinsi') {
        if (p.provinsi || p.Provinsi) updatedRow[c] = p.provinsi || p.Provinsi;
      } else if (h === 'kodepos') {
        if (formattedKodePos !== '-') updatedRow[c] = formattedKodePos;
      } else if (h === 'jenistinggal' || h === 'jenis tinggal') {
        const val = p.jenisTinggal || p.JenisTinggal;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'alattransportasi' || h === 'alat transportasi' || h === 'transportasi') {
        const val = p.alatTransportasi || p.AlatTransportasi;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'nomorhp' || h === 'nohpwa' || h === 'nohp') {
        if (formattedNoHp !== '-') updatedRow[c] = formattedNoHp;
      } else if (h === 'e-mail' || h === 'email') {
        if (p.email || p['E-Mail']) updatedRow[c] = p.email || p['E-Mail'];
      } else if (h === 'asalsekolah' || h === 'asal sekolah') {
        const val = p.asalSekolah || p.AsalSekolah;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'skhun') {
        const val = p.skhun || p.SKHUN;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'penerimakps' || h === 'penerima kps' || h === 'kps') {
        const val = p.penerimaKPS || p.PenerimaKPS;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'pasfoto' || h === 'foto') {
        if (photoUrl) updatedRow[c] = photoUrl;
        else if (p.pasFoto || p.PasFoto) updatedRow[c] = p.pasFoto || p.PasFoto;
      } else if (h === 'nomorkartukeluarga' || h === 'nomor kartu keluarga' || h === 'nokk' || h === 'kk') {
        if (formattedKK !== '-') updatedRow[c] = formattedKK;
      } else if (h === 'namaayah' || h === 'nama ayah') {
        const val = p.namaAyah || p.NamaAyah;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'nikayah' || h === 'nik ayah') {
        if (formattedNikAyah !== '-') updatedRow[c] = formattedNikAyah;
      } else if (h === 'tempatlahirayah' || h === 'tempat lahir ayah') {
        const val = p.tempatLahirAyah || p.TempatLahirAyah;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'tanggallahirayah' || h === 'tanggal lahir ayah') {
        const val = p.tanggalLahirAyah || p.TanggalLahirAyah;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'pendidikanayah' || h === 'pendidikan ayah') {
        const val = p.pendidikanAyah || p.PendidikanAyah;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'pekerjaanayah' || h === 'pekerjaan ayah') {
        const val = p.pekerjaanAyah || p.PekerjaanAyah;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'penghasilanayah' || h === 'penghasilan ayah') {
        const val = p.penghasilanAyah || p.PenghasilanAyah;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'tlpayah' || h === 'tlp ayah' || h === 'teleponayah' || h === 'telepon ayah') {
        const val = protectLeadingZero(p.tlpAyah || p.TlpAyah);
        if (val !== '-') updatedRow[c] = val;
      } else if (h === 'statusayah' || h === 'status ayah') {
        const val = p.statusAyah || p.StatusAyah;
        if (val && !val.toLowerCase().includes('terkonfirmasi')) {
          updatedRow[c] = val;
        } else if (String(updatedRow[c]).toLowerCase().includes('terkonfirmasi')) {
          updatedRow[c] = 'Masih Hidup';
        }
      } else if (h === 'namaibu' || h === 'nama ibu') {
        const val = p.namaIbu || p.NamaIbu;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'nikibu' || h === 'nik ibu') {
        if (formattedNikIbu !== '-') updatedRow[c] = formattedNikIbu;
      } else if (h === 'tempatlahiribu' || h === 'tempat lahir ibu') {
        const val = p.tempatLahirIbu || p.TempatLahirIbu;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'tanggallahiribu' || h === 'tanggal lahir ibu') {
        const val = p.tanggalLahirIbu || p.TanggalLahirIbu;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'pendidikanibu' || h === 'pendidikan ibu') {
        const val = p.pendidikanIbu || p.PendidikanIbu;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'pekerjaanibu' || h === 'pekerjaan ibu') {
        const val = p.pekerjaanIbu || p.PekerjaanIbu;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'penghasilanibu' || h === 'penghasilan ibu') {
        const val = p.penghasilanIbu || p.PenghasilanIbu;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'tlpibu' || h === 'tlp ibu' || h === 'teleponibu' || h === 'telepon ibu') {
        const val = protectLeadingZero(p.tlpIbu || p.TlpIbu);
        if (val !== '-') updatedRow[c] = val;
      } else if (h === 'statusibu' || h === 'status ibu') {
        const val = p.statusIbu || p.StatusIbu;
        if (val) updatedRow[c] = val;
      } else if (h === 'statusyatim' || h === 'status yatim') {
        const val = p.statusYatim || p.StatusYatim;
        if (val) updatedRow[c] = val;
      } else if (h === 'namawali' || h === 'nama wali') {
        const val = p.namaWali || p.NamaWali;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'tempatlahirwali' || h === 'tempat lahir wali') {
        const val = p.tempatLahirWali || p.TempatLahirWali;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'tgllahirwali' || h === 'tgl lahir wali' || h === 'tanggallahirwali' || h === 'tanggal lahir wali') {
        const val = p.tglLahirWali || p.TglLahirWali || p.tanggalLahirWali || p.TanggalLahirWali;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'pendidikanwali' || h === 'pendidikan wali') {
        const val = p.pendidikanWali || p.PendidikanWali;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'pekerjaanwali' || h === 'pekerjaan wali') {
        const val = p.pekerjaanWali || p.PekerjaanWali;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'penghasilanwali' || h === 'penghasilan wali') {
        const val = p.penghasilanWali || p.PenghasilanWali;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'hubungan' || h === 'hubungan wali') {
        const val = p.hubungan || p.Hubungan;
        if (val !== undefined && val !== null && val !== '') updatedRow[c] = val;
      } else if (h === 'tlp.wali' || h === 'tlpwali' || h === 'teleponwali' || h === 'tlp wali') {
        const val = protectLeadingZero(p.tlpWali || p['Tlp.Wali']);
        if (val !== '-') updatedRow[c] = val;
      } else if (h === 'kelassaatini' || h === 'kelas saat ini') {
        const kls = p.KelasSaatini || p.kelasSaatIni || p.kelasRombel;
        if (kls) updatedRow[c] = kls;
      }
    }

    sheet.getRange(targetRowIndex, 1, 1, updatedRow.length).setNumberFormat('@').setValues([updatedRow]);
    return true;
  }

  return false;
}

function updateRekapStatusAksiFlags(ss, targetPdkt, targetNama, waStatus, pdfStatus) {
  const sheet = ss.getSheetByName('REKAP_STATUS_AKSI');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const cleanPdkt = String(targetPdkt || '').replace(/['\\s]/g, '').toLowerCase();
  const cleanNama = String(targetNama || '').trim().toLowerCase();

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowNama = String(row[1] || '').trim().toLowerCase();
    const rowPdkt = String(row[3] || '').replace(/['\\s]/g, '').toLowerCase();

    if ((cleanPdkt && rowPdkt === cleanPdkt) || (cleanNama && rowNama === cleanNama)) {
      if (waStatus) sheet.getRange(r + 1, 10).setValue(waStatus);
      if (pdfStatus) sheet.getRange(r + 1, 11).setValue(pdfStatus);
      break;
    }
  }
}

function savePhotoToDrive(base64Data, fileName) {
  try {
    const splitData = base64Data.split('base64,');
    const contentType = splitData[0].split(':')[1].split(';')[0];
    const decoded = Utilities.base64Decode(splitData[1]);
    const blob = Utilities.newBlob(decoded, contentType, fileName);

    let folder;
    try {
      folder = DriveApp.getFolderById(FOLDER_ID_FOTO);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }

    const existing = folder.getFilesByName(fileName);
    if (existing.hasNext()) {
      const file = existing.next();
      file.setContent(decoded);
      return file.getUrl();
    }

    const newFile = folder.createFile(blob);
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newFile.getUrl();
  } catch (err) {
    Logger.log('Drive save error: ' + err.toString());
    return '';
  }
}

function savePdfToDrive(base64Data, fileName) {
  try {
    if (!base64Data) return '';
    let rawBase64 = base64Data;
    let contentType = 'application/pdf';

    if (base64Data.includes('base64,')) {
      const splitData = base64Data.split('base64,');
      if (splitData[0].includes(':') && splitData[0].includes(';')) {
        contentType = splitData[0].split(':')[1].split(';')[0];
      }
      rawBase64 = splitData[1];
    }

    const decoded = Utilities.base64Decode(rawBase64);
    const blob = Utilities.newBlob(decoded, contentType, fileName);

    let folder;
    try {
      folder = DriveApp.getFolderById(FOLDER_ID_PDF);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }

    const existing = folder.getFilesByName(fileName);
    if (existing.hasNext()) {
      const file = existing.next();
      file.setContent(decoded);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {}
      return file.getUrl();
    }

    const newFile = folder.createFile(blob);
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}
    return newFile.getUrl();
  } catch (err) {
    Logger.log('Drive save PDF error: ' + err.toString());
    return '';
  }
}

function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getKonfirmasiHeaders() {
  return [
    'Kode_Verifikasi', 'nopdkt', 'NISN', 'NIK', 'NamaLengkap', 'KelasSaatini',
    'JenisKelamin', 'Tempat Lahir', 'TanggalLahir', 'NomorHP', 'Kelurahan',
    'Status_Yatim', 'Status_Bekerja', 'Nama_Tempat_Kerja', 'Jabatan_Pekerjaan',
    'Bidang_Usaha', 'Alamat_Kerja'
  ];
}

function getJadwalHeaders() {
  return [
    'Kode_Jadwal', 'nopdkt', 'NISN', 'NIK', 'NamaLengkap', 'KelasSaatini',
    'Hari1', 'jam1', 'Hari2', 'jam2', 'Hari3', 'jam3'
  ];
}

function getRekapHariHeaders() {
  return ['nohari', 'NamaLengkap', 'KelasSaatini', 'Hari', 'Jam'];
}

function getRekapSudahHeaders() {
  return [
    'No', 'Kode_Verifikasi', 'nopdkt', 'NISN', 'NIK', 'NamaLengkap', 'KelasSaatini',
    'JenisKelamin', 'NomorHP', 'Status_Bekerja', 'Hari_Belajar_3x', 'Jam_Belajar',
    'Status_Materai_10000', 'Nama_File_Surat', 'Link_Berkas_Drive', 'Tanggal_Konfirmasi',
    'Status_Verifikasi', 'Catatan_Admin'
  ];
}

function getRekapStatusAksiHeaders() {
  return [
    'No', 'NamaLengkap', 'NISN', 'nopdkt', 'KelasSaatini', 'Tanggal_Konfirmasi',
    'Status_Konfirmasi', 'SKesanggupan', 'SPernyataan', 'Status_Kirim_WA', 'Status_Download_PDF', 'Link_Drive_PDF', 'Link_Drive_Foto'
  ];
}

function perbaikiStatusAyahYangSalah(ss) {
  try {
    const activeSs = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = activeSs.getSheetByName('SISWA');
    if (!sheet) return 0;
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return 0;
    const headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    const statusAyahIdx = headers.findIndex(function(h) { return h === 'statusayah' || h === 'status ayah'; });
    if (statusAyahIdx === -1) return 0;

    let fixedCount = 0;
    for (let r = 1; r < data.length; r++) {
      const val = String(data[r][statusAyahIdx] || '');
      if (val.toLowerCase().includes('terkonfirmasi') || val.toLowerCase().includes('aktif (terkonfirmasi')) {
        sheet.getRange(r + 1, statusAyahIdx + 1).setValue('Masih Hidup');
        fixedCount++;
      }
    }
    Logger.log('Berhasil membersihkan ' + fixedCount + ' data StatusAyah.');
    return fixedCount;
  } catch (err) {
    Logger.log('Gagal perbaiki StatusAyah: ' + err.toString());
    return 0;
  }
}
`;
