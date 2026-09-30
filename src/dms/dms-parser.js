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
export function parseDmsExcel(filePath, preferredSheet = 'Dashboard_Ready') {
  const resolvedPath = filePath 
    ? path.resolve(filePath) 
    : path.resolve(process.cwd(), 'DMS_Care_Tools_Cleaned_Ready.xlsx');

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`DMS Excel file not found at path: ${resolvedPath}`);
  }

  const workbook = XLSX.readFile(resolvedPath, {
    cellDates: false,
    raw: false,
  });

  const sheetName = workbook.SheetNames.includes(preferredSheet)
    ? preferredSheet
    : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(`No sheets found in workbook: ${resolvedPath}`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((raw) => normalizeRawRow(raw));
}
