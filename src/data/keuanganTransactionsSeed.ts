import { KeuanganTagihan, KeuanganInvoice } from './keuanganSeed';

export interface KeuanganPembayaranItem {
  id: string;
  tagihanId?: string;
  siswaId: string;
  kelasId: string;
  tglBayar: string;
  metode: string;
  jumlah: number;
  catatan: string;
  createdBy: string;
  createdAt: string;
  invoiceId: string;
  tagihanIds: string[];
  namaSiswa: string;
}

export function parseRawTagihanTSV(tsvText: string): KeuanganTagihan[] {
  const lines = tsvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const result: KeuanganTagihan[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t').map(c => c.trim());
    if (cols.length < 6) continue;

    const id = cols[0] || `TGH_${Date.now()}_${i}`;
    const siswaId = cols[1] || '';
    const kelasId = cols[2] || '';
    const biayaId = cols[3] || '';
    const namaBiaya = cols[4] || '';
    
    const rawNom = cols[5] ? cols[5].replace(/,/g, '').replace(/\./g, '') : '0';
    const nominalAsli = parseInt(rawNom, 10) || 0;
    
    const periode = cols[6] || '2024-07';
    const jatuhTempo = cols[7] || '2025-06-30';
    const statusRaw = (cols[8] || 'BELUM').toUpperCase();
    const status: 'BELUM' | 'SEBAGIAN' | 'LUNAS' = 
      statusRaw.includes('LUNAS') ? 'LUNAS' : 
      statusRaw.includes('SEBAGIAN') ? 'SEBAGIAN' : 'BELUM';
    
    const paidAt = cols[9] || '';
    const paidBy = cols[10] || '';
    const createdAt = cols[11] || jatuhTempo;

    const rawPaid = cols[12] ? cols[12].replace(/,/g, '').replace(/\./g, '') : '0';
    const paidAmount = parseInt(rawPaid, 10) || (status === 'LUNAS' ? nominalAsli : 0);

    const rawRemaining = cols[13] ? cols[13].replace(/,/g, '').replace(/\./g, '') : '0';
    const sisaTagihan = parseInt(rawRemaining, 10) || Math.max(0, nominalAsli - paidAmount);

    const paymentType = cols[14] || (status === 'SEBAGIAN' ? 'CICILAN' : 'FULL');
    const namaSiswa = cols[15] || 'Siswa';

    result.push({
      id,
      tagihanId: id,
      siswaId,
      namaSiswa,
      kelasId,
      kelasNama: kelasId,
      biayaId,
      namaBiaya,
      nominal: sisaTagihan,
      nominalAsli,
      totalTagihan: nominalAsli,
      paidAmount,
      totalBayar: paidAmount,
      sisaTagihan,
      periode,
      jatuhTempo,
      tanggalJatuhTempo: jatuhTempo,
      status,
      paidAt,
      paidBy,
      paymentType,
      createdAt,
      updatedAt: createdAt
    });
  }
  return result;
}

export function parseRawPembayaranTSV(tsvText: string): KeuanganPembayaranItem[] {
  const lines = tsvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const result: KeuanganPembayaranItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t').map(c => c.trim());
    if (cols.length < 5) continue;

    const id = cols[0] || `BYR_${Date.now()}_${i}`;
    const tagihanId = cols[1] || '';
    const siswaId = cols[2] || '';
    const kelasId = cols[3] || '';
    const tglBayar = cols[4] || new Date().toISOString().slice(0, 10);
    const metode = cols[5] || 'TABUNGAN';

    const rawJml = cols[6] ? cols[6].replace(/,/g, '').replace(/\./g, '') : '0';
    const jumlah = parseInt(rawJml, 10) || 0;

    const catatan = cols[7] || '';
    const createdBy = cols[8] || 'superadmin';
    const createdAt = cols[9] || tglBayar;
    const invoiceId = cols[10] || '';
    
    let tagihanIds: string[] = [];
    if (cols[11]) {
      try {
        tagihanIds = JSON.parse(cols[11]);
      } catch {
        tagihanIds = cols[11].replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (tagihanId && !tagihanIds.includes(tagihanId)) {
      tagihanIds.push(tagihanId);
    }

    const namaSiswa = cols[12] || 'Siswa';

    result.push({
      id,
      tagihanId,
      siswaId,
      kelasId,
      tglBayar,
      metode,
      jumlah,
      catatan,
      createdBy,
      createdAt,
      invoiceId,
      tagihanIds,
      namaSiswa
    });
  }
  return result;
}

export function parseRawInvoiceTSV(tsvText: string, payments?: KeuanganPembayaranItem[]): KeuanganInvoice[] {
  const lines = tsvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const result: KeuanganInvoice[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t').map(c => c.trim());
    if (cols.length < 5) continue;

    const id = cols[0] || `INV_${Date.now()}_${i}`;
    const invoiceId = cols[1] || id;
    const siswaId = cols[2] || '';
    const kelasId = cols[3] || '';
    const tglBayar = cols[4] || new Date().toISOString().slice(0, 10);
    const metode = cols[5] || 'TABUNGAN';

    const rawTotal = cols[6] ? cols[6].replace(/,/g, '').replace(/\./g, '') : '0';
    const total = parseInt(rawTotal, 10) || 0;

    const status = (cols[7] || 'PAID').toUpperCase() as 'PAID';
    const createdBy = cols[8] || 'superadmin';
    const createdAt = cols[9] || tglBayar;
    const namaSiswa = cols[10] || 'Siswa';

    // Find linked payments for this invoice
    const linkedPayments = payments ? payments.filter(p => p.invoiceId === invoiceId) : [];
    const tagihanIds = linkedPayments.flatMap(p => p.tagihanIds);

    const items = linkedPayments.length > 0
      ? linkedPayments.map(p => ({
          namaBiaya: p.catatan || 'Pembayaran Sekolah',
          periode: tglBayar.slice(0, 7),
          nominal: p.jumlah
        }))
      : [{
          namaBiaya: 'Pembayaran Tagihan Siswa',
          periode: tglBayar.slice(0, 7),
          nominal: total
        }];

    result.push({
      id,
      pembayaranId: id,
      invoiceId,
      siswaId,
      namaSiswa,
      kelasId,
      namaKelas: kelasId,
      tglBayar,
      tanggal: tglBayar,
      total,
      nominal: total,
      metode,
      metodePembayaran: metode,
      petugasId: createdBy,
      createdBy,
      status: status === 'PAID' ? 'PAID' : 'SUKSES',
      tagihanIds,
      items,
      createdAt,
      updatedAt: createdAt
    });
  }
  return result;
}
