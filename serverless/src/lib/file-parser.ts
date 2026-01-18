"use client";

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function parseSpreadsheetFile(file: File): Promise<Record<string, string>[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'ods' || extension === 'xlsx' || extension === 'xls') {
    return parseExcelOrODS(file);
  } else {
    throw new Error(`Formato file non supportato: .${extension}. Usa .csv, .ods, .xlsx o .xls`);
  }
}

function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Convert all values to strings
        const data = (results.data as Record<string, unknown>[]).map(row => {
          const stringRow: Record<string, string> = {};
          for (const [key, value] of Object.entries(row)) {
            stringRow[key] = value === null || value === undefined ? '' : String(value);
          }
          return stringRow;
        });
        resolve(data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

async function parseExcelOrODS(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
          raw: false // This ensures all values are converted to strings
        });
        
        // Ensure all values are strings
        const stringData = jsonData.map(row => {
          const stringRow: Record<string, string> = {};
          for (const [key, value] of Object.entries(row)) {
            stringRow[key] = value === null || value === undefined ? '' : String(value);
          }
          return stringRow;
        });
        
        resolve(stringData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Errore nella lettura del file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(data: object[], filename: string): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Prepare data with Hash column as explicit text to avoid formula interpretation
  const safeData = data.map(row => {
    const newRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (key === 'Hash') {
        // Remove the leading apostrophe if present (it was for CSV)
        const hashValue = String(value).replace(/^'/, '');
        newRow[key] = hashValue;
      } else {
        newRow[key] = value;
      }
    }
    return newRow;
  });
  
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(safeData);
  
  // Find the Hash column index
  const headers = Object.keys(data[0] || {});
  const hashColIndex = headers.indexOf('Hash');
  
  if (hashColIndex !== -1) {
    // Get the column letter for Hash
    const hashColLetter = XLSX.utils.encode_col(hashColIndex);
    
    // Set the Hash column format to text for all cells
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellAddress = `${hashColLetter}${row + 1}`;
      const cell = worksheet[cellAddress];
      if (cell) {
        // Force cell type to string/text
        cell.t = 's';
        // Add number format to ensure it's treated as text
        cell.z = '@';
      }
    }
    
    // Set column width for better visibility
    if (!worksheet['!cols']) worksheet['!cols'] = [];
    worksheet['!cols'][hashColIndex] = { wch: 10 };
  }
  
  // Set column widths for other columns
  if (!worksheet['!cols']) worksheet['!cols'] = [];
  headers.forEach((header, index) => {
    if (!worksheet['!cols']![index]) {
      worksheet['!cols']![index] = { wch: Math.max(header.length, 12) };
    }
  });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Voti');
  
  // Generate the Excel file and trigger download
  XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
}