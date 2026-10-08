import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { normalizeRawRow } from './dms-record.js';

/**
 * Parses DMS Care Tools Excel file and returns array of normalized DmsRecord objects.
 * @param {string} [filePath] - Path to DMS_Care_Tools_Cleaned_Ready.xlsx
 * @param {string} [preferredSheet='Dashboard_Ready'] - Target worksheet name
 * @returns {Array<import('./dms-record.js').DmsRecord>}
 */
export function parseDmsExcel(filePath, preferredSheet = 'User_DMS_Cleaned') {
  let resolvedPath = null;

  if (filePath) {
    resolvedPath = path.resolve(filePath);
  } else {
    const candidates = [
      path.resolve(process.cwd(), 'แดชบอร์ด/User_DMS_Cleaned_Ready.xlsx'),
      path.resolve(process.cwd(), 'User_DMS_Cleaned_Ready.xlsx'),
      path.resolve(process.cwd(), 'แดชบอร์ด/User DMS.xlsx'),
      path.resolve(process.cwd(), 'DMS_Care_Tools_Cleaned_Ready.xlsx'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        resolvedPath = candidate;
        break;
      }
    }
  }

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    throw new Error(`DMS Excel file not found at path: ${resolvedPath || 'no candidate found'}`);
  }

  const workbook = XLSX.readFile(resolvedPath, {
    cellDates: false,
    raw: false,
  });

  const candidateSheets = [preferredSheet, 'User_DMS_Cleaned', 'Dashboard_Ready', 'ทะเบียนทั้งหมด5-10-69'];
  let sheetName = candidateSheets.find((s) => workbook.SheetNames.includes(s));
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }

  if (!sheetName) {
    throw new Error(`No sheets found in workbook: ${resolvedPath}`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((raw) => normalizeRawRow(raw));
}
