const fs = require('fs');
const path = require('path');

const content = `// KURIKULUM MODUL DATA RESMI DARI DATASET MASTER 13 KOLOM
import { MASTER_SILABUS_DATA, MasterSilabusItem, SilabusItemRow } from './masterSilabusData';

export interface SubModulItem {
  id: string;
  subModulKe: number;
  kodeSub: string;
  judul: string;
  statusSoal: string;
  keterangan: string;
}

export interface ModulKurikulum {
  id: string;
  noModul: number;
  kode: string;
  nama: string;
  temaModul: string;
  mapel: string;
  mataPelajaran: string;
  singkatanMapel: string;
  singkatan: string;
  tingkat: number;
  kelas: number;
  tingkatLabel: string;
  paket: 'A' | 'B' | 'C';
  semester: 'SM-I' | 'SM-II';
  modulNo: number;
  modulKe: number;
  subBab: string[];
  subModulList: SubModulItem[];
}

export interface KurikulumModulItem extends ModulKurikulum {}

export { MASTER_SILABUS_DATA, type MasterSilabusItem, type SilabusItemRow };
export const SILABUS_MASTER_ROWS: MasterSilabusItem[] = MASTER_SILABUS_DATA;

function buildKurikulumModulData(): KurikulumModulItem[] {
  const modulMap = new Map<string, KurikulumModulItem>();
  let modIndex = 1;

  for (const row of MASTER_SILABUS_DATA) {
    const modKey = \`\${row.paket}_\${row.tingkat}_\${row.singkatan}_\${row.noModulAngka}_\${row.namaModulLengkap}\`;
    if (!modulMap.has(modKey)) {
      const generatedId = \`MOD-\${row.paket}-\${row.tingkat}-\${row.singkatan || 'GEN'}-\${row.noModulAngka || 1}-\${modIndex++}\`;
      modulMap.set(modKey, {
        id: generatedId,
        noModul: row.noModul,
        kode: row.namaModulLengkap,
        nama: row.namaModulBab || row.namaModulLengkap,
        temaModul: row.namaModulBab || row.namaModulLengkap,
        mapel: row.mataPelajaran,
        mataPelajaran: row.mataPelajaran,
        singkatanMapel: row.singkatan,
        singkatan: row.singkatan,
        tingkat: row.tingkat,
        kelas: row.tingkat,
        tingkatLabel: \`Kelas \${row.tingkat}\`,
        paket: row.paket,
        semester: row.semester,
        modulNo: row.noModulAngka,
        modulKe: row.noModulAngka,
        subBab: [],
        subModulList: []
      });
    }

    const modObj = modulMap.get(modKey)!;
    const subTitle = \`\${row.noSubModul}. \${row.judulSubModul}\`;
    modObj.subBab.push(subTitle);
    modObj.subModulList.push({
      id: \`\${modObj.id}-SUB-\${row.noSubModul}\`,
      subModulKe: row.noSubModul,
      kodeSub: row.singkatanDanJudul,
      judul: row.judulSubModul,
      statusSoal: row.statusSoal,
      keterangan: row.keterangan
    });
  }

  return Array.from(modulMap.values());
}

export const KURIKULUM_MODUL_DATABASE: KurikulumModulItem[] = buildKurikulumModulData();
export const KURIKULUM_MODUL_DATA: ModulKurikulum[] = KURIKULUM_MODUL_DATABASE;

export function generateDefaultTugasKBM(): any[] {
  return MASTER_SILABUS_DATA.map((row, idx) => {
    const targetClass = \`\${row.tingkat}A\`;
    const defaultDeadline = new Date(Date.now() + ((idx % 30) + 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    return {
      id: \`TGS-\${row.id}\`,
      noExcel: row.noModul,
      kodeModul: row.namaModulLengkap,
      unitCode: row.singkatanDanJudul,
      subKe: \`Unit \${row.noSubModul}\`,
      subBab: row.judulSubModul,
      temaModul: row.namaModulBab,
      singkatan: row.singkatan,
      modulNo: String(row.noModulAngka),
      paket: row.paket,
      semester: row.semester,
      judul: \`\${row.singkatanDanJudul}: \${row.judulSubModul}\`,
      mapel: row.mataPelajaran,
      kelas: targetClass,
      tingkatKelas: \`Kelas \${row.tingkat}\`,
      tenggat: defaultDeadline,
      kategori: 'Kuis & Modul Pembelajaran',
      deskripsi: \`Tugas \${row.singkatanDanJudul} pada modul \${row.namaModulLengkap} (\${row.mataPelajaran}). Status butir soal: \${row.statusSoal}.\`,
      kumpul: 0,
      totalSiswa: 0,
      status: 'Aktif Mengumpulkan',
      avg: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    };
  });
}
`;

fs.writeFileSync(path.join(__dirname, '../src/data/kurikulumModulData.ts'), content, 'utf8');
console.log('Successfully written kurikulumModulData.ts');
