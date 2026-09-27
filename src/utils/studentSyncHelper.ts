import { db, getNormalizedStatus } from '../data/db';
import { parseAllSiswa } from '../data/parser';
import { Siswa, User, Guru } from '../types';

export interface SyncStats {
  addedCount: number;
  updatedCount: number;
  totalSynced: number;
}

/**
 * Normalizes student status strings into strict schema status enum values.
 */
export function normalizeStudentStatus(status?: string): 'AKTIF' | 'TIDAK AKTIF' | 'BELUM' | 'PINDAH' | 'KELUAR' | 'LULUS' {
  return getNormalizedStatus(status);
}

/**
 * Propagates Status and Kelas updates back to the master SISWA collection
 * and triggers global event notifications.
 */
export function updateStudentStatusAndClass(
  studentIdOrPdkt: string,
  updates: { status?: string; kelasId?: string; kelas?: string; kelasSaatIni?: string }
): boolean {
  if (!studentIdOrPdkt) return false;
  const targetKey = studentIdOrPdkt.trim().toUpperCase();
  const siswaList = db.get<Siswa>('siswa') || [];

  let modified = false;
  const updatedList = siswaList.map((s) => {
    const sId = (s.id || '').trim().toUpperCase();
    const sPdkt = (s.noPdkt || '').trim().toUpperCase();
    const sNisn = (s.nisn || '').trim().toUpperCase();

    if (sId === targetKey || sPdkt === targetKey || sNisn === targetKey) {
      modified = true;
      const normStatus = updates.status ? getNormalizedStatus(updates.status) : s.status;
      const targetKelas = updates.kelasId || updates.kelas || updates.kelasSaatIni || s.kelasId;
      
      const newClassHistory = {
        ...(s.classHistory || {}),
      };
      if (targetKelas) {
        newClassHistory['2026/2027'] = targetKelas;
      }

      return {
        ...s,
        status: normStatus,
        kelasId: targetKelas || s.kelasId,
        kelas: targetKelas || s.kelas,
        kelasSaatIni: targetKelas || s.kelasSaatIni,
        classHistory: newClassHistory,
      };
    }
    return s;
  });

  if (modified) {
    db.set('siswa', updatedList);
    window.dispatchEvent(new CustomEvent('erp-db-synced', { detail: { key: 'siswa' } }));
    window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'siswa', val: updatedList } }));
  }

  return modified;
}

/**
 * Automatically synchronizes student profiles and classroom assignments
 * between master data sources and the live database.
 * Preserves all live edits made in the ERP system while merging duplicate noPdkt entries.
 */
export function runBackgroundStudentSync(): SyncStats {
  const stats: SyncStats = {
    addedCount: 0,
    updatedCount: 0,
    totalSynced: 0
  };

  // Skip auto background sync if manually purged clean by admin
  if (localStorage.getItem('ERP_siswa_purged_all') === 'true') {
    return stats;
  }

  try {
    const liveSiswaList = db.get<Siswa>('siswa') || [];
    const masterSiswaList = parseAllSiswa() || [];

    // Deduplicate and normalize live list first based on noPdkt / ID / NISN
    const updatedSiswaList: Siswa[] = [];
    const seenPdkt = new Set<string>();

    for (const item of liveSiswaList) {
      if (!item) continue;
      const pdktKey = (item.noPdkt || item.id || item.nisn || '').toString().trim().toUpperCase();
      const normStatus = getNormalizedStatus(item.status);
      item.status = normStatus;

      if (pdktKey && seenPdkt.has(pdktKey)) {
        // Merge duplicate nopdkt entry into existing record
        const existing = updatedSiswaList.find(s => 
          (s.noPdkt || s.id || s.nisn || '').toString().trim().toUpperCase() === pdktKey
        );
        if (existing) {
          Object.keys(item).forEach(k => {
            const exVal = (existing as any)[k];
            const itemVal = (item as any)[k];
            if ((exVal === undefined || exVal === '' || exVal === null) && itemVal !== undefined && itemVal !== '') {
              (existing as any)[k] = itemVal;
            }
          });
          // Merge class history
          if (item.classHistory) {
            existing.classHistory = {
              ...(item.classHistory || {}),
              ...(existing.classHistory || {}),
            };
          }
        }
        continue;
      }

      if (pdktKey) seenPdkt.add(pdktKey);
      updatedSiswaList.push(item);
    }

    let isDbModified = false;

    for (const masterSiswa of masterSiswaList) {
      if (!masterSiswa) continue;
      masterSiswa.status = getNormalizedStatus(masterSiswa.status);

      // Find existing student by ID, PDKT code, or NISN
      const existingIndex = updatedSiswaList.findIndex(
        (s) => (s.id && masterSiswa.id && s.id.trim().toUpperCase() === masterSiswa.id.trim().toUpperCase()) || 
               (s.noPdkt && masterSiswa.noPdkt && s.noPdkt.trim().toUpperCase() === masterSiswa.noPdkt.trim().toUpperCase()) || 
               (s.nisn && masterSiswa.nisn && s.nisn.trim() === masterSiswa.nisn.trim())
      );

      if (existingIndex === -1) {
        // Not found in local database: Add as new student
        updatedSiswaList.push(masterSiswa);
        stats.addedCount++;
        isDbModified = true;
      } else {
        const existingSiswa = updatedSiswaList[existingIndex];
        let isStudentModified = false;

        // Fields to complement if currently empty in live database
        const syncFields: (keyof Siswa)[] = [
          'nama',
          'jk',
          'status',
          'kelasId',
          'tahunMasuk',
          'tempatLahir',
          'tglLahir',
          'nik',
          'noHp',
          'email',
          'asalSekolah',
          'noKk',
          'namaAyah',
          'nikAyah',
          'tempatLahirAyah',
          'tglLahirAyah',
          'pekerjaanAyah',
          'tlpAyah',
          'namaIbu',
          'nikIbu',
          'tempatLahirIbu',
          'tglLahirIbu',
          'pekerjaanIbu'
        ];

        const updatedStudentObj = { ...existingSiswa };

        for (const field of syncFields) {
          const masterVal = masterSiswa[field];
          const existingVal = existingSiswa[field];

          // Fill in missing empty fields from master data without overwriting live values
          if (masterVal !== undefined && masterVal !== '' && (existingVal === undefined || existingVal === '' || existingVal === null)) {
            (updatedStudentObj as any)[field] = masterVal;
            isStudentModified = true;
          }
        }

        // Merge classHistory without losing existing entries
        if (masterSiswa.classHistory) {
          const mergedHistory = { 
            ...(masterSiswa.classHistory || {}),
            ...(existingSiswa.classHistory || {})
          };
          if (JSON.stringify(existingSiswa.classHistory) !== JSON.stringify(mergedHistory)) {
            updatedStudentObj.classHistory = mergedHistory;
            isStudentModified = true;
          }
        }

        if (isStudentModified) {
          updatedSiswaList[existingIndex] = updatedStudentObj;
          stats.updatedCount++;
          isDbModified = true;
        }
      }
    }

    if (isDbModified) {
      db.set('siswa', updatedSiswaList);
    }

    // Auto-sync user accounts for students and teachers
    syncUserAccountsFromMasterData();

    stats.totalSynced = updatedSiswaList.length;
  } catch (error) {
    console.error('Failed to run automatic background student synchronization:', error);
  }

  return stats;
}

import { StorageService } from '../services/storageService';

/**
 * Ensures every active student and teacher has a corresponding account in USERS table.
 * Aturan Password Siswa: Nama depan sebelum spasi (lowercase) + Nomor PDKT (contoh: asep036).
 */
export function syncUserAccountsFromMasterData(): void {
  try {
    const liveUsers = db.get<User>('users') || [];
    const liveSiswa = db.get<any>('siswa') || db.get<any>('students') || [];
    const liveGuru = db.get<Guru>('guru') || [];

    const updatedUsers = [...liveUsers];
    let isUsersModified = false;

    const storageUsersToBatch: any[] = [];
    const storagePasswordsToBatch: Record<string, string> = {};

    // 1. Sync Student Accounts dengan Aturan Password: nama depan + nomor pdkt
    for (const s of liveSiswa) {
      const rawName = (s.nama || s.name || s.NamaLengkap || s.Nama || 'Siswa').trim();
      const firstName = rawName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const pdkt = (s.noPdkt || s.nopdkt || s.NoPDKT || s.nis || s.NIS || s.id || '').toString().trim().replace(/^pdkt-?/i, '');
      const studentPassword = `${firstName}${pdkt || (s.nisn ? s.nisn.slice(-3) : '123')}`;

      const username = (s.nisn || pdkt || s.id || '').toString().trim();
      if (!username) continue;

      const userIndex = updatedUsers.findIndex(u => 
        (u.username && u.username.toLowerCase() === username.toLowerCase()) || 
        (pdkt && u.nopdkt === pdkt) ||
        (pdkt && u.username === pdkt) ||
        (s.nisn && u.username === s.nisn) ||
        (u.id && u.id === `USR_${s.id || username}`)
      );

      if (userIndex === -1) {
        updatedUsers.push({
          id: `USR_${s.id || username}`,
          username: username,
          nopdkt: pdkt,
          email: s.email || `${username.toLowerCase()}@siswa.sch.id`,
          password: studentPassword,
          role: 'SISWA',
          name: rawName,
          status: (s.status || s.Status || 'Aktif').toString().trim()
        });
        isUsersModified = true;
      } else {
        const existing = updatedUsers[userIndex];
        if (existing.role === 'SISWA') {
          const currentStatus = (s.status || s.Status || 'Aktif').toString().trim();
          if (existing.password !== studentPassword || existing.nopdkt !== pdkt || existing.name !== rawName || existing.status !== currentStatus) {
            existing.password = studentPassword;
            existing.nopdkt = pdkt;
            existing.name = rawName;
            existing.status = currentStatus;
            isUsersModified = true;
          }
        }
      }

      // Kumpulkan untuk sinkronisasi batch ke StorageService
      const currentStatus = (s.status || s.Status || 'Aktif').toString().trim();
      if (s.nisn) storagePasswordsToBatch[s.nisn] = studentPassword;
      if (pdkt) storagePasswordsToBatch[pdkt] = studentPassword;
      storageUsersToBatch.push({
        idUser: `USR_${s.id || username}`,
        username: username,
        nama: rawName,
        role: 'SISWA',
        status: currentStatus,
        kelas: s.kelas || s.class,
        nopdkt: pdkt,
        twoFactorEnabled: false
      });
    }

    // 2. Sync Orang Tua (Parent) Accounts dengan Aturan Password: nama sebelum spasi + nomor pdkt anak
    for (const s of liveSiswa) {
      const rawName = (s.nama || s.name || s.NamaLengkap || s.Nama || 'Siswa').trim();
      const firstName = rawName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const pdkt = (s.noPdkt || s.nopdkt || s.NoPDKT || s.nis || s.NIS || s.id || '').toString().trim().replace(/^pdkt-?/i, '');
      const parentPassword = `${firstName}${pdkt || (s.nisn ? s.nisn.slice(-3) : '123')}`;

      const childUsername = (s.nisn || pdkt || s.id || '').toString().trim();
      if (!childUsername) continue;

      const parentUsername = `ortu_${childUsername}`;
      const parentName = (s.NamaAyah || s.namaAyah || s.NamaIbu || s.namaIbu || s.NamaWali || s.namaWali || s.parentName || `Orang Tua dari ${rawName}`).trim();
      const parentStatus = (s.status || s.Status || 'Aktif').toString().trim();

      const userIndex = updatedUsers.findIndex(u => 
        (u.username && (u.username.toLowerCase() === parentUsername.toLowerCase() || u.username.toLowerCase() === `ortu_${pdkt.toLowerCase()}`)) ||
        (u.id && u.id === `USR_ORTU_${s.id || childUsername}`)
      );

      if (userIndex === -1) {
        updatedUsers.push({
          id: `USR_ORTU_${s.id || childUsername}`,
          username: parentUsername,
          nopdkt: pdkt,
          email: s.emailOrtu || `${childUsername.toLowerCase()}@ortu.sch.id`,
          password: parentPassword,
          role: 'ORANG_TUA',
          name: parentName,
          status: parentStatus
        });
        isUsersModified = true;
      } else {
        const existing = updatedUsers[userIndex];
        if (existing.role === 'ORANG_TUA') {
          if (existing.password !== parentPassword || existing.nopdkt !== pdkt || existing.name !== parentName || existing.status !== parentStatus) {
            existing.password = parentPassword;
            existing.nopdkt = pdkt;
            existing.name = parentName;
            existing.status = parentStatus;
            isUsersModified = true;
          }
        }
      }

      // Kumpulkan kredensial orang tua untuk sinkronisasi batch ke StorageService
      storagePasswordsToBatch[parentUsername] = parentPassword;
      storageUsersToBatch.push({
        idUser: `USR_ORTU_${s.id || childUsername}`,
        username: parentUsername,
        nama: parentName,
        role: 'ORANG_TUA',
        status: 'AKTIF',
        kelas: s.kelas || s.class,
        nopdkt: pdkt,
        twoFactorEnabled: false
      });
    }

    // Lakukan penyimpanan batch ke StorageService dalam 1 operasi efisien
    try {
      if (storageUsersToBatch.length > 0) {
        StorageService.saveUsersBatch(storageUsersToBatch);
      }
      if (Object.keys(storagePasswordsToBatch).length > 0) {
        StorageService.setPasswordsBatch(storagePasswordsToBatch);
      }
    } catch {}

    // 3. Sync Teacher Accounts
    for (const g of liveGuru) {
      const username = (g.nip || g.email || g.id || '').trim();
      if (!username) continue;

      const userExists = updatedUsers.some(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        (g.nip && u.username === g.nip) ||
        (u.id && u.id === `USR_${g.id}`)
      );

      if (!userExists) {
        updatedUsers.push({
          id: `USR_${g.id || username}`,
          username: username,
          email: g.email || `${username.toLowerCase()}@guru.sch.id`,
          password: 'admin123',
          role: 'GURU',
          name: g.nama || 'Guru',
          status: String(g.status || '').toUpperCase() === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF'
        });
        isUsersModified = true;
      }
    }

    if (isUsersModified || !db.get('USERS')) {
      db.set('users', updatedUsers);

      // Sinkronkan ke sheet USERS terstandarisasi 60 master database
      const sheetUsersRows = updatedUsers.map((u: any, idx: number) => ({
        UserID: u.id || `USR_${idx + 1}`,
        Username: u.username,
        Password: u.password,
        RoleID: u.role === 'SISWA' ? 'RL-026' : u.role === 'ORANG_TUA' ? 'RL-027' : u.role === 'GURU' ? 'RL-019' : 'RL-001',
        Nama: u.name || u.nama || 'User',
        NIP_NISN: u.nisn || u.nopdkt || u.username || '',
        Email: u.email || `${u.username}@rombeltambora.sch.id`,
        NoHP: u.phone || u.noHp || '',
        Status: u.status || 'AKTIF',
        LastLogin: u.lastLogin || '',
        Token: u.token || '',
        CreatedAt: u.createdAt || new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }));
      db.set('USERS', sheetUsersRows);
      db.set('master_users', sheetUsersRows);
    }
  } catch (err) {
    console.error('Failed to sync user accounts from master data:', err);
  }
}

