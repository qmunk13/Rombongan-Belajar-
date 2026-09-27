import { KeuanganTagihan, KeuanganInvoice } from './keuanganSeed';

// Helper parser
const parseVal = (v: string | number) => {
  if (typeof v === 'number') return v;
  return parseInt(String(v).replace(/\./g, '').replace(/,/g, '').trim(), 10) || 0;
};

// Default Tagihan initial generator
export function getInitialTagihanData(studentsList: any[] = []): KeuanganTagihan[] {
  const studentMap = new Map<string, any>();
  studentsList.forEach(s => {
    if (s.id) studentMap.set(String(s.id).trim(), s);
    if (s.nis) studentMap.set(String(s.nis).trim(), s);
    if (s.name) studentMap.set(s.name.trim().toLowerCase(), s);
  });

  return defaultRawTagihan.map(row => {
    const [id, siswaId, kelasId, biayaId, namaBiaya, nominal, periode, jatuhTempo, status, paidAt, paidAmount, remainingAmount, paymentType, namaSiswa] = row;
    const sObj = studentMap.get(siswaId) || (namaSiswa ? studentMap.get(namaSiswa.trim().toLowerCase()) : null);
    const resolvedName = sObj ? sObj.name : (namaSiswa || `Siswa ${siswaId}`);
    const nomAsli = parseVal(nominal);
    const paid = parseVal(paidAmount);
    const rem = parseVal(remainingAmount);
    
    return {
      id,
      siswaId,
      namaSiswa: resolvedName,
      nis: sObj?.nis || siswaId,
      kelasId,
      kelasNama: sObj?.class || kelasId,
      biayaId,
      namaBiaya,
      nominal: rem > 0 ? rem : (status === 'LUNAS' ? 0 : nomAsli),
      nominalAsli: nomAsli,
      paidAmount: paid,
      periode,
      jatuhTempo: jatuhTempo || '2026-06-30',
      status: (status as 'BELUM' | 'SEBAGIAN' | 'LUNAS') || 'BELUM',
      paidAt: paidAt || undefined,
      paymentType: paymentType || (status === 'LUNAS' ? 'FULL' : 'CICILAN'),
      createdAt: '2025-06-30'
    };
  });
}

// Default Invoice initial generator
export function getInitialInvoiceData(studentsList: any[] = []): KeuanganInvoice[] {
  const studentMap = new Map<string, any>();
  studentsList.forEach(s => {
    if (s.id) studentMap.set(String(s.id).trim(), s);
    if (s.nis) studentMap.set(String(s.nis).trim(), s);
    if (s.name) studentMap.set(s.name.trim().toLowerCase(), s);
  });

  return defaultRawInvoices.map(row => {
    const [id, invoiceId, siswaId, kelasId, tglBayar, metode, total, status, catatan, namaSiswa] = row;
    const sObj = studentMap.get(siswaId) || (namaSiswa ? studentMap.get(namaSiswa.trim().toLowerCase()) : null);
    const resolvedName = sObj ? sObj.name : (namaSiswa || `Siswa ${siswaId}`);
    const totNum = parseVal(total);

    return {
      id,
      invoiceId,
      siswaId,
      namaSiswa: resolvedName,
      kelasId,
      namaKelas: sObj?.class || kelasId,
      tglBayar,
      metode: metode || 'TABUNGAN',
      total: totNum,
      status: 'PAID' as const,
      catatan: catatan || 'Pembayaran Tagihan Terverifikasi',
      tagihanIds: [],
      items: [{
        namaBiaya: catatan || 'Pembayaran Tagihan Siswa',
        periode: tglBayar.slice(0, 7),
        nominal: totNum
      }],
      createdBy: 'superadmin',
      createdAt: tglBayar
    };
  });
}

export const defaultRawTagihan: any[][] = [];
export const defaultRawInvoices: any[][] = [];
