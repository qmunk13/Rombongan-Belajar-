// Helper for initial Tabungan data import
import { KeuanganTabungan } from './keuanganSeed';

export function parseRawTabunganTSV(tsvText: string): KeuanganTabungan[] {
  const lines = tsvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const result: KeuanganTabungan[] = [];
  const header = lines[0].split('\t').map(h => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t').map(c => c.trim());
    if (cols.length < 5) continue;

    const id = cols[0] || `TAB_${Date.now()}_${i}`;
    const siswaId = cols[1] || '';
    const tanggal = cols[2] || new Date().toISOString().slice(0, 10);
    const jenis = (cols[3] || 'SETOR').toUpperCase().includes('TARIK') ? 'TARIK' : 'SETOR';
    
    // Parse nominal (e.g. "5,000" -> 5000)
    const rawNom = cols[4] ? cols[4].replace(/,/g, '').replace(/\./g, '') : '0';
    const nominal = parseInt(rawNom, 10) || 0;

    const catatan = cols[5] || cols[4] || '-';
    const createdBy = cols[6] || 'superadmin';
    const createdAt = cols[7] || tanggal;
    const namaSiswa = cols[8] || cols[5] || 'Siswa';

    result.push({
      id,
      tabunganId: id,
      siswaId,
      namaSiswa,
      tanggal,
      jenisTransaksi: jenis,
      jenis,
      nominal,
      debit: jenis === 'SETOR' ? nominal : 0,
      kredit: jenis === 'TARIK' ? nominal : 0,
      saldo: 0,
      petugasId: createdBy,
      keterangan: catatan,
      catatan,
      status: 'SUKSES',
      createdBy,
      createdAt,
      updatedAt: createdAt
    });
  }

  return result;
}
