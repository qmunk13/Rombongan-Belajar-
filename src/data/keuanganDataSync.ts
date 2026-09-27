import { db } from './db';
import { DEFAULT_TABUNGAN_LIST } from './tabunganSeedData';
import { KeuanganTabungan, KeuanganTagihan, KeuanganInvoice } from './keuanganSeed';

// Helper to clean nominal (e.g. "180.000" -> 180000)
export function parseIdr(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val).replace(/Rp/gi, '').replace(/\./g, '').replace(/,/g, '').trim();
  const n = Number(clean);
  return isNaN(n) ? 0 : n;
}

// Auto sync or seed all 4 datasets
export function syncAllKeuanganData(studentsList: any[] = []) {
  const existingTabungan = db.get<KeuanganTabungan>('keuangan_tabungan');
  if (!existingTabungan || existingTabungan.length === 0) {
    db.set('keuangan_tabungan', DEFAULT_TABUNGAN_LIST);
  }
}

