const fs = require('fs');
const path = require('path');

const parts = [1, 2, 3, 4, 5, 6, 7, 8];
let allLines = [];

for (const p of parts) {
  const filePath = path.join(__dirname, `../csv_part${p}.txt`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    allLines = allLines.concat(lines);
    console.log(`Loaded part ${p}: ${lines.length} lines`);
  } else {
    console.warn(`Part ${p} does not exist at ${filePath}`);
  }
}

console.log(`Total lines read: ${allLines.length}`);

// Parse lines into 13-column record
const rows = [];

for (let i = 0; i < allLines.length; i++) {
  const line = allLines[i];
  const cols = line.split(';').map(c => c.trim());
  if (cols.length < 11) continue;

  const noModulStr = cols[0];
  const namaModulLengkap = cols[1];
  const tingkatStr = cols[2];
  const semesterStr = cols[3];
  const mataPelajaran = cols[4];
  const singkatan = cols[5];
  const noModulAngkaStr = cols[6];
  const namaModulBab = cols[7];
  const noSubModulStr = cols[8];
  const singkatanDanJudul = cols[9];
  const judulSubModul = cols[10];
  const statusSoal = cols[11] || 'Belum Selesai';
  const keterangan = cols[12] || '';

  const noModulNum = parseInt(noModulStr, 10) || (i + 1);
  const tingkatNum = parseInt(tingkatStr, 10) || 4;
  const noModulAngka = parseInt(noModulAngkaStr, 10) || 1;
  const noSubModul = parseInt(noSubModulStr, 10) || 1;
  const semester = semesterStr === 'SM-II' ? 'SM-II' : 'SM-I';

  // Determine Paket (A, B, C)
  let paket = 'A';
  if (tingkatNum >= 4 && tingkatNum <= 6) {
    paket = 'A';
  } else if (tingkatNum >= 7 && tingkatNum <= 9) {
    paket = 'B';
  } else if (tingkatNum >= 10 && tingkatNum <= 12) {
    paket = 'C';
  } else if (namaModulLengkap.startsWith('A')) {
    paket = 'A';
  } else if (namaModulLengkap.startsWith('B')) {
    paket = 'B';
  } else if (namaModulLengkap.startsWith('C')) {
    paket = 'C';
  }

  const row = {
    id: `MS-${noModulNum}-${noSubModul}-${i + 1}`,
    no: noModulNum,
    noModul: noModulNum,
    namaModulLengkap,
    kodePaket: namaModulLengkap,
    tingkat: tingkatNum,
    kelas: tingkatNum,
    paket,
    semester,
    mataPelajaran,
    mapel: mataPelajaran,
    singkatan,
    sing: singkatan,
    noModulAngka,
    modul: noModulAngka,
    namaModulBab,
    temaModul: namaModulBab,
    noSubModul,
    subKe: `Unit ${noSubModul}`,
    singkatanDanJudul,
    kodeSubTugas: singkatanDanJudul,
    judulSubModul,
    topikSubTugas: judulSubModul,
    statusSoal,
    status: statusSoal,
    keterangan,
    catatan: keterangan
  };

  rows.push(row);
}

console.log(`Successfully parsed ${rows.length} master rows.`);

// Generate masterSilabusData.ts
const masterSilabusTs = `// DATASET SILABUS RESMI 1:1 SESUAI DOKUMEN MASTER 13 KOLOM
// Total Records: ${rows.length}

export interface MasterSilabusItem {
  id: string;
  no: number;
  noModul: number;
  namaModulLengkap: string;
  kodePaket: string;
  tingkat: number;
  kelas: number;
  paket: 'A' | 'B' | 'C';
  semester: 'SM-I' | 'SM-II';
  mataPelajaran: string;
  mapel: string;
  singkatan: string;
  sing: string;
  noModulAngka: number;
  modul: number;
  namaModulBab: string;
  temaModul: string;
  noSubModul: number;
  subKe: string;
  singkatanDanJudul: string;
  kodeSubTugas: string;
  judulSubModul: string;
  topikSubTugas: string;
  statusSoal: string;
  status: string;
  keterangan: string;
  catatan: string;
}

export type SilabusItemRow = MasterSilabusItem;

export const MASTER_SILABUS_DATA: MasterSilabusItem[] = ${JSON.stringify(rows, null, 2)};
export const SILABUS_MASTER_ROWS: MasterSilabusItem[] = MASTER_SILABUS_DATA;

export const MASTER_SILABUS_STATS = {
  totalRows: ${rows.length},
  paketACount: ${rows.filter(r => r.paket === 'A').length},
  paketBCount: ${rows.filter(r => r.paket === 'B').length},
  paketCCount: ${rows.filter(r => r.paket === 'C').length},
  semester1Count: ${rows.filter(r => r.semester === 'SM-I').length},
  semester2Count: ${rows.filter(r => r.semester === 'SM-II').length},
};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/masterSilabusData.ts'), masterSilabusTs, 'utf8');
console.log('Wrote src/data/masterSilabusData.ts');

// Now generate grouped database for KurikulumModulItem & ModulKurikulum
const modulMap = new Map();

for (const row of rows) {
  const modKey = `${row.noModul}_${row.namaModulLengkap}`;
  if (!modulMap.has(modKey)) {
    modulMap.set(modKey, {
      id: `MOD-${row.noModul}`,
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
      tingkatLabel: `Kelas ${row.tingkat}`,
      paket: row.paket,
      semester: row.semester,
      modulNo: row.noModulAngka,
      modulKe: row.noModulAngka,
      subBab: [],
      subModulList: []
    });
  }

  const modObj = modulMap.get(modKey);
  const subTitle = `${row.noSubModul}. ${row.judulSubModul}`;
  modObj.subBab.push(subTitle);
  modObj.subModulList.push({
    id: `SUB-${row.noModul}-${row.noSubModul}`,
    subModulKe: row.noSubModul,
    kodeSub: row.singkatanDanJudul,
    judul: row.judulSubModul,
    statusSoal: row.statusSoal,
    keterangan: row.keterangan
  });
}

const kurikulumModulList = Array.from(modulMap.values());
console.log(`Generated ${kurikulumModulList.length} distinct modul groups.`);

const kurikulumModulTs = `// KURIKULUM MODUL DATA RESMI DARI DATASET MASTER 13 KOLOM
// Total Modul: ${kurikulumModulList.length}
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

export interface KurikulumModulItem {
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

export { MASTER_SILABUS_DATA, type MasterSilabusItem, type SilabusItemRow };
export const SILABUS_MASTER_ROWS: MasterSilabusItem[] = MASTER_SILABUS_DATA;

export const KURIKULUM_MODUL_DATA: ModulKurikulum[] = ${JSON.stringify(kurikulumModulList, null, 2)};
export const KURIKULUM_MODUL_DATABASE: KurikulumModulItem[] = ${JSON.stringify(kurikulumModulList, null, 2)};

export function generateDefaultTugasKBM(): any[] {
  return MASTER_SILABUS_DATA.map((row, idx) => {
    const targetClass = row.paket === 'A' 
      ? \`\${row.tingkat}A\` 
      : row.paket === 'B' 
        ? \`\${row.tingkat}A\` 
        : \`\${row.tingkat}A\`;
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

fs.writeFileSync(path.join(__dirname, '../src/data/kurikulumModulData.ts'), kurikulumModulTs, 'utf8');
console.log('Wrote src/data/kurikulumModulData.ts');
