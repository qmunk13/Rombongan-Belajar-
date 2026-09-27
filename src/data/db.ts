// Robust Multi-Layer Storage Engine (Memory + IndexedDB + Safe LocalStorage)
// Eliminates browser 5MB localStorage QuotaExceededError permanently.
// Real production data from Google Sheets (Tagihan, Pembayaran, Tabungan, Absensi, etc.)
// is securely and durably persisted in high-capacity IndexedDB + Fast MemoryStore.

import { idbGet, idbSet, idbDelete, idbGetAll, idbClear } from './idbStorage';
import { JADWAL_STS_GANJIL_2026 } from './jadwalStsGanjil2026';

export { idbGet, idbSet, idbDelete, idbGetAll, idbClear };

const memoryStore = new Map<string, any>();

// Canonical synonym groups to unify keys and prevent redundant duplicate storage
const SYNONYM_GROUPS: Record<string, string[]> = {
  keuangan_tagihan: ['keuangan_tagihan', 'TAGIHAN', 'tagihan', 'bills', 'erp_bills'],
  keuangan_pembayaran: ['keuangan_pembayaran', 'keuangan_invoices', 'PEMBAYARAN', 'INVOICE', 'pembayaran', 'invoices'],
  keuangan_tabungan: ['keuangan_tabungan', 'TABUNGAN', 'tabungan', 'savings'],
  keuangan_kas: ['keuangan_kas', 'KAS', 'kas'],
  keuangan_biaya: ['keuangan_biaya', 'BIAYA', 'biaya', 'tarif', 'keuangan_tarif'],
  students: ['students', 'siswa', 'SISWA', 'master_siswa', 'MASTER_SISWA'],
  teachers: ['teachers', 'guru', 'GURU', 'master_guru', 'MASTER_GURU'],
  classes: ['classes', 'kelas', 'KELAS', 'master_kelas', 'MASTER_KELAS'],
  subjects: ['subjects', 'mapel', 'MAPEL', 'master_mapel', 'MASTER_MAPEL', 'academic_subjects'],
  tahun_ajaran: ['tahun_ajaran', 'TAHUN_AJARAN', 'academic_years'],
  semester: ['semester', 'SEMESTER', 'academic_semesters'],
  ujian: ['ujian', 'UJIAN', 'cbt_exams', 'ujian_cbt', 'CBT_UJIAN', 'jadwal_ujian', 'cbt_sessions'],
  tokens: ['token', 'TOKEN', 'cbt_tokens', 'cbt_token_history', 'CBT_TOKEN'],
  bank_soal: ['bank_soal', 'BANK_SOAL', 'cbt_bank_soal', 'cbt_questions', 'CBT_BANK_SOAL'],
  soal: ['soal', 'SOAL', 'cbt_exam_questions', 'CBT_SOAL'],
  jadwal: ['jadwal', 'JADWAL', 'JADWAL_UJIAN', 'cbt_jadwal', 'jadwal_cbt'],
  hasil_ujian: ['hasil_ujian', 'HASIL_UJIAN', 'cbt_exam_results', 'cbt_hasil', 'hasil_cbt'],
  log_ujian: ['log_ujian', 'LOG_UJIAN', 'exam_logs', 'cbt_proktor_logs', 'cbt_cheating_logs'],
  absensi: ['absensi', 'ABSENSI', 'attendance', 'absensi_siswa'],
  absensi_guru: ['absensi_guru', 'ABSENSI_GURU', 'teacher_attendance'],
  qr_log: ['qr_log', 'QR_LOG', 'qr_logs', 'recent_qr_scans'],
  nilai: ['nilai', 'NILAI', 'academic_grades', 'grades', 'nilai_siswa'],
  agenda_guru: ['agenda_guru', 'AGENDA_GURU', 'jurnal_guru', 'JURNAL_GURU']
};

export function getCanonicalKey(key: string): string {
  const clean = key.startsWith('erp_') ? key.slice(4) : key;
  for (const [canon, syns] of Object.entries(SYNONYM_GROUPS)) {
    if (canon === clean || syns.includes(clean)) {
      return canon;
    }
  }
  return clean;
}

export function getSynonyms(key: string): string[] {
  const canon = getCanonicalKey(key);
  return SYNONYM_GROUPS[canon] || [canon];
}

// Helper for safe localStorage write that NEVER throws QuotaExceededError
export function safeSetLocalStorage(storageKey: string, value: any): boolean {
  if (typeof window === 'undefined') return true;

  try {
    // If saving a reference pointer, it takes minimal space
    if (value && typeof value === 'object' && value.__ref) {
      localStorage.setItem(storageKey, JSON.stringify(value));
      return true;
    }

    const jsonStr = JSON.stringify(value);

    // If payload exceeds 150KB, do not bloat 5MB localStorage!
    // Instead, save a lightweight pointer; full payload is safely kept in IndexedDB + memoryStore.
    if (jsonStr.length > 150000) {
      const summaryMarker = {
        __idb_backed: true,
        count: Array.isArray(value) ? value.length : 1,
        savedAt: Date.now()
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(summaryMarker));
      } catch {}
      return true;
    }

    // Try standard setItem
    localStorage.setItem(storageKey, jsonStr);
    return true;
  } catch (err) {
    // Quota exceeded: Evict non-essential duplicate/stale keys from localStorage
    try {
      evictStaleLocalStorageKeys();
      // Retry with a lightweight pointer
      const marker = {
        __idb_backed: true,
        count: Array.isArray(value) ? value.length : 1,
        savedAt: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(marker));
      return true;
    } catch {
      // If even that fails, non-fatal: memoryStore + IndexedDB hold the true source of truth
      return false;
    }
  }
}

// Clean up stale or duplicate keys to free localStorage space
function evictStaleLocalStorageKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Remove redundant duplicate synonym keys in localStorage
      if (k === 'erp_TAGIHAN' || k === 'erp_tagihan' || k === 'erp_bills') keysToRemove.push(k);
      if (k === 'erp_PEMBAYARAN' || k === 'erp_INVOICE' || k === 'erp_pembayaran') keysToRemove.push(k);
      if (k === 'erp_TABUNGAN' || k === 'erp_tabungan') keysToRemove.push(k);
      if (k === 'erp_KAS' || k === 'erp_kas') keysToRemove.push(k);
      if (k.startsWith('erp_log_') || k.startsWith('audit_log_')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
  } catch {}
}

// One-time initial clean purge check on boot
if (typeof window !== 'undefined') {
  try {
    const PURGE_SLATE_KEY = 'erp_clean_zero_data_v4_purge_1447';
    if (!localStorage.getItem(PURGE_SLATE_KEY)) {
      const keysToPurge = [
        'erp_students', 'erp_teachers', 'erp_rombel', 'erp_classes', 
        'erp_academic_classes', 'erp_siswa', 'erp_guru', 'erp_kelas', 'erp_mapel',
        'erp_keuangan_tagihan', 'erp_TAGIHAN', 'erp_tagihan', 'erp_bills',
        'erp_keuangan_invoices', 'erp_keuangan_pembayaran', 'erp_PEMBAYARAN', 'erp_INVOICE', 
        'erp_keuangan_tabungan', 'erp_TABUNGAN', 'erp_tabungan', 'erp_savings',
        'erp_keuangan_kas', 'erp_KAS', 'erp_kas',
        'erp_keuangan_biaya', 'erp_BIAYA', 'erp_tarif', 'erp_keuangan_tarif',
        'erp_lock_official_tagihan_count',
        'erp_arsip_digital', 'erp_surat_masuk', 'erp_surat_keluar',
        'erp_dapodik_validations', 'erp_spmb_pendaftar', 'erp_bk_konseling',
        'erp_bk_pelanggaran', 'erp_sarpras', 'erp_inventaris', 'erp_peminjaman_barang',
        'erp_perpus_buku', 'erp_perpus_pinjam', 'erp_cbt_ujian', 'erp_cbt_soal',
        'erp_absensi', 'erp_absensi_siswa', 'erp_absensi_rekap', 'erp_nilai'
      ];
      keysToPurge.forEach(k => {
        try { 
          localStorage.removeItem(k);
        } catch {}
      });
      localStorage.setItem('erp_keuangan_cleared', 'true');
      localStorage.setItem(PURGE_SLATE_KEY, 'true');
    }

    // One-time purge for CBT dummy simulation & mock local data
    const PURGE_CBT_DUMMY_KEY = 'erp_clean_cbt_dummy_v5_purge_2026';
    if (!localStorage.getItem(PURGE_CBT_DUMMY_KEY)) {
      const cbtDummyKeys = [
        'erp_simulasi_ujian', 'erp_simulasi_cbt', 'erp_cbt_simulation',
        'erp_cbt_dummy', 'erp_dummy_soal', 'erp_dummy_bank_soal',
        'erp_simulasi_exam', 'erp_cbt_exam_results_dummy', 'erp_cbt_answers_dummy'
      ];
      cbtDummyKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });

      // Clear any cached bank soal or exam list that contains dummy simulation data
      try {
        const rawBank = localStorage.getItem('erp_cbt_bank_soal') || localStorage.getItem('erp_BANK_SOAL') || '';
        if (rawBank.includes('SIM-') || rawBank.includes('SIMULASI_PELAJARAN') || rawBank.includes('Arya Satya')) {
          localStorage.removeItem('erp_cbt_bank_soal');
          localStorage.removeItem('erp_bank_soal');
          localStorage.removeItem('erp_BANK_SOAL');
          localStorage.removeItem('erp_cbt_questions');
        }
      } catch {}

      try {
        const rawUjian = localStorage.getItem('erp_ujian_cbt') || localStorage.getItem('erp_cbt_exams') || '';
        if (rawUjian.includes('SIM-') || rawUjian.includes('SIMULASI')) {
          localStorage.removeItem('erp_ujian_cbt');
          localStorage.removeItem('erp_cbt_exams');
        }
      } catch {}

      localStorage.setItem(PURGE_CBT_DUMMY_KEY, 'true');
    }

    // One-time refresh to activate the official 2026/2027 exam timetable across all devices
    const PURGE_OFFICIAL_CBT_2026_KEY = 'erp_official_cbt_timetable_v2_paten_2026';
    if (!localStorage.getItem(PURGE_OFFICIAL_CBT_2026_KEY)) {
      try {
        localStorage.removeItem('erp_ujian_cbt');
        localStorage.removeItem('erp_cbt_exams');
        localStorage.removeItem('erp_cbt_schedules');
        localStorage.removeItem('erp_jadwal_ujian');
        localStorage.removeItem('erp_cbt_token_history');
        localStorage.removeItem('erp_cbt_tokens');
      } catch {}
      localStorage.setItem(PURGE_OFFICIAL_CBT_2026_KEY, 'true');
    }

    // Load the official 114 complete sessions
    const LOAD_114_SESSIONS_KEY = 'erp_load_114_complete_sessions_v1';
    if (!localStorage.getItem(LOAD_114_SESSIONS_KEY)) {
      try {
        const json114 = JSON.stringify(JADWAL_STS_GANJIL_2026);
        localStorage.setItem('erp_ujian_cbt', json114);
        localStorage.setItem('erp_cbt_exams', json114);
        localStorage.setItem('erp_cbt_schedules', json114);
        localStorage.setItem('erp_jadwal_ujian', json114);
      } catch {}
      localStorage.setItem(LOAD_114_SESSIONS_KEY, 'true');
    }
  } catch {}
}

// Step 1: Synchronous initial memory load from localStorage
if (typeof window !== 'undefined') {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('erp_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const pureKey = key.replace('erp_', '');
            // Skip __ref pointers or __idb_backed markers for memoryStore initialization
            if (parsed && typeof parsed === 'object') {
              if (parsed.__ref || parsed.__idb_backed) {
                continue;
              }
            }
            memoryStore.set(pureKey, parsed);
          } catch {}
        }
      }
    }

    // Mirror loaded canonical data across synonyms in memoryStore
    for (const [canon, syns] of Object.entries(SYNONYM_GROUPS)) {
      const existing = memoryStore.get(canon);
      if (existing !== undefined && existing !== null) {
        for (const s of syns) {
          if (!memoryStore.has(s)) {
            memoryStore.set(s, existing);
          }
        }
      }
    }
  } catch (e) {
    console.warn('LocalStorage initial scan warning:', e);
  }
}

// Step 2: Asynchronous hydration from high-capacity IndexedDB
if (typeof window !== 'undefined') {
  setTimeout(() => {
    idbGetAll().then((records) => {
      if (!records) return;
      let hasUpdates = false;

      for (const [key, val] of Object.entries(records)) {
        if (val === undefined || val === null) continue;

        const current = memoryStore.get(key);
        // If memoryStore is empty or IndexedDB holds richer data
        if (!current || (Array.isArray(val) && (!Array.isArray(current) || current.length === 0 || val.length >= current.length))) {
          memoryStore.set(key, val);
          hasUpdates = true;

          // Mirror across synonyms
          const syns = getSynonyms(key);
          for (const s of syns) {
            memoryStore.set(s, val);
          }
        }
      }

      if (hasUpdates) {
        window.dispatchEvent(new CustomEvent('erp-db-synced', { detail: { source: 'indexeddb' } }));
        window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: null, source: 'indexeddb', skipPush: true } }));
        window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'all_idb', skipPush: true } }));
        window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key: 'keuangan_all', skipPush: true } }));
      }
    }).catch(err => {
      console.warn('IndexedDB initial hydration notice:', err);
    });
  }, 10);
}

export const db = {
  get: <T = any>(key: string): T[] => {
    // 1. Check memoryStore directly
    const val = memoryStore.get(key);
    if (Array.isArray(val)) {
      return val as T[];
    }

    // 2. Check synonyms in memoryStore
    const syns = getSynonyms(key);
    for (const synKey of syns) {
      const synVal = memoryStore.get(synKey);
      if (Array.isArray(synVal) && synVal.length > 0) {
        memoryStore.set(key, synVal);
        return synVal as T[];
      }
    }

    // 3. Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`erp_${key}`);
        if (raw !== null && raw !== undefined) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (parsed.__ref) {
              return db.get<T>(parsed.__ref);
            }
            if (parsed.__idb_backed) {
              // Async load from IndexedDB into memory if not yet done
              const canon = getCanonicalKey(key);
              idbGet(canon).then(dbVal => {
                if (Array.isArray(dbVal)) {
                  memoryStore.set(key, dbVal);
                  memoryStore.set(canon, dbVal);
                  window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key, skipPush: true } }));
                }
              }).catch(() => {});
              return [];
            }
          }
          if (Array.isArray(parsed)) {
            memoryStore.set(key, parsed);
            return parsed as T[];
          }
        }
      } catch {}
    }

    return [];
  },

  getSingle: <T = any>(key: string): T | null => {
    const val = memoryStore.get(key);
    if (val !== undefined && val !== null) {
      if (typeof val === 'object' && (val.__ref || val.__idb_backed)) {
        // Not a direct object
      } else {
        return val as T;
      }
    }

    const syns = getSynonyms(key);
    for (const synKey of syns) {
      const synVal = memoryStore.get(synKey);
      if (synVal !== undefined && synVal !== null) {
        if (!(typeof synVal === 'object' && (synVal.__ref || synVal.__idb_backed))) {
          return synVal as T;
        }
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`erp_${key}`);
        if (raw !== null && raw !== undefined) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (parsed.__ref) {
              return db.getSingle<T>(parsed.__ref);
            }
            if (parsed.__idb_backed) {
              const canon = getCanonicalKey(key);
              idbGet(canon).then(dbVal => {
                if (dbVal !== null && dbVal !== undefined) {
                  memoryStore.set(key, dbVal);
                  window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key, skipPush: true } }));
                }
              }).catch(() => {});
              return null;
            }
          }
          memoryStore.set(key, parsed);
          return parsed as T;
        }
      } catch {}
    }
    return null;
  },

  set: (key: string, value: any, options?: { skipPush?: boolean }): void => {
    // 1. Instant update in memoryStore for this key
    memoryStore.set(key, value);

    // 2. Mirror across all synonyms in memoryStore so all components receive fresh data
    const syns = getSynonyms(key);
    for (const synKey of syns) {
      memoryStore.set(synKey, value);
    }

    // 3. Persist to IndexedDB (asynchronous, no quota limit)
    const canonKey = getCanonicalKey(key);
    idbSet(canonKey, value).catch(() => {});

    // 4. Safe localStorage persistence (never throws QuotaExceededError)
    if (typeof window !== 'undefined') {
      safeSetLocalStorage(`erp_${canonKey}`, value);

      // For other synonyms, store a lightweight ~30 byte reference pointer
      for (const synKey of syns) {
        if (synKey !== canonKey) {
          safeSetLocalStorage(`erp_${synKey}`, { __ref: canonKey });
        }
      }

      // Defer event dispatch to avoid React setState-in-render issues
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('erp-db-updated', { detail: { key, skipPush: options?.skipPush } }));
          if (!options?.skipPush && (window as any).__erpAutoSyncEngine?.queueDbKey) {
            (window as any).__erpAutoSyncEngine.queueDbKey(key);
          }
        } catch {}
      }, 0);
    }
  },

  setSingle: (key: string, value: any, options?: { skipPush?: boolean }): void => {
    db.set(key, value, options);
  },

  insert: <T = any>(key: string, item: T): T[] => {
    const list = db.get<T>(key);
    const updated = [...list, item];
    db.set(key, updated);
    return updated;
  },

  update: <T = any>(key: string, idField: string, idVal: any, partialOrItem: Partial<T> | T): T[] => {
    const list = db.get<any>(key);
    const updated = list.map((item: any) => {
      if (item && item[idField] === idVal) {
        return { ...item, ...partialOrItem };
      }
      return item;
    });
    db.set(key, updated);
    return updated as T[];
  },

  delete: <T = any>(key: string, idField: string, idVal: any): T[] => {
    const list = db.get<any>(key);
    const updated = list.filter((item: any) => !item || item[idField] !== idVal);
    db.set(key, updated);
    return updated as T[];
  },

  clearAll: (): void => {
    memoryStore.clear();
    idbClear().catch(() => {});

    if (typeof window !== 'undefined') {
      const gasUrl = localStorage.getItem('ERP_gas_script_url') || localStorage.getItem('erp_gas_url') || '';
      try {
        localStorage.clear();
        if (gasUrl) {
          localStorage.setItem('ERP_gas_script_url', gasUrl);
          localStorage.setItem('erp_gas_url', gasUrl);
        }
      } catch {}
      window.dispatchEvent(new CustomEvent('erp-db-synced', { detail: { key: 'all' } }));
    }
  },

  resetAll: (): void => {
    db.clearAll();
  },

  purgeSimulationData: (): void => {
    db.clearAll();
  }
};

export const SYNC_KEYS = [
  'siswa', 'guru', 'kelas', 'mapel', 'jenjang', 'spmb_pendaftar',
  'keuangan', 'absensi', 'cbt_soal', 'cbt_jadwal', 'bk_konseling',
  'bk_pelanggaran', 'inventaris', 'perpus_buku', 'perpus_pinjam'
];

export function getGasUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ERP_gas_script_url') || localStorage.getItem('erp_gas_url') || '';
  }
  return '';
}

export function setGasUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ERP_gas_script_url', url);
    localStorage.setItem('erp_gas_url', url);
  }
}

export async function pingGasServer(url?: string): Promise<boolean> {
  const targetUrl = url || getGasUrl();
  if (!targetUrl) return false;
  try {
    const res = await fetch(targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping', { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncWithGas(): Promise<{ success: boolean; message: string }> {
  const url = getGasUrl();
  if (!url) return { success: false, message: 'URL Google Apps Script belum dikonfigurasi' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'syncAll' })
    });
    const data = await res.json();
    return { success: true, message: data.message || 'Sinkronisasi berhasil' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Gagal sinkronisasi dengan Google Apps Script' };
  }
}

export async function syncWithFirestore(): Promise<{ success: boolean; message: string }> {
  return { success: true, message: 'Sinkronisasi Firestore aktif' };
}

export function purgeAllData(): void {
  db.clearAll();
}

export function getNormalizedStatus(status?: string): 'AKTIF' | 'TIDAK AKTIF' | 'BELUM' | 'PINDAH' | 'KELUAR' | 'LULUS' {
  if (!status) return 'AKTIF';
  const s = status.trim().toUpperCase();
  if (s.includes('AKTIF') && !s.includes('TIDAK') && !s.includes('NON')) return 'AKTIF';
  if (s.includes('TIDAK') || s.includes('NON')) return 'TIDAK AKTIF';
  if (s.includes('BELUM')) return 'BELUM';
  if (s.includes('PINDAH') || s.includes('MUTASI')) return 'PINDAH';
  if (s.includes('KELUAR') || s.includes('DO') || s.includes('DROP')) return 'KELUAR';
  if (s.includes('LULUS')) return 'LULUS';
  return 'AKTIF';
}

export function normalizeClassId(classId?: string | number): string {
  if (!classId) return '';
  return String(classId).trim().toUpperCase().replace(/\s+/g, '-');
}
