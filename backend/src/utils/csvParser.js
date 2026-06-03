/**
 * Parser for BRI Corporate Bank Statement CSV (IBIZ format)
 * Handles quoted fields, multiple encodings, and auto-detects column positions
 */

function parseCSVLine(line) {
  const arr = [];
  let quote = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      quote = !quote;
    } else if (char === ',' && !quote) {
      arr.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  arr.push(current.trim().replace(/^"|"$/g, ''));
  return arr;
}

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    return { error: 'File CSV kosong atau tidak valid' };
  }

  const headerRow = parseCSVLine(lines[0]);
  const dateIdx = headerRow.findIndex(h => h.includes('TGL_TRAN') || h.toLowerCase().includes('tanggal'));
  const descIdx = headerRow.findIndex(h =>
    h.includes('DESK_TRAN') || h.includes('REMARK_CUSTOM') || h.toLowerCase().includes('keterangan')
  );
  const debitIdx = headerRow.findIndex(h => h.includes('MUTASI_DEBET') || h.toLowerCase().includes('debet'));
  const kreditIdx = headerRow.findIndex(h => h.includes('MUTASI_KREDIT') || h.toLowerCase().includes('kredit'));
  const balanceIdx = headerRow.findIndex(h => h.includes('SALDO_AKHIR') || h.toLowerCase().includes('saldo'));

  if (dateIdx === -1 || debitIdx === -1 || kreditIdx === -1) {
    return { error: 'Format header CSV tidak kompatibel. Pastikan menggunakan format BRI/IBIZ.' };
  }

  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCSVLine(lines[i]);
    if (cols.length < headerRow.length - 2) continue;

    const rawDate = cols[dateIdx] || '';
    const cleanDate = rawDate.split(' ')[0] || rawDate;
    const desc = cols[descIdx] || 'Transaksi Bank';
    const debit = parseFloat((cols[debitIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
    const kredit = parseFloat((cols[kreditIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
    const balance = balanceIdx !== -1
      ? parseFloat((cols[balanceIdx] || '0').replace(/[^0-9.]/g, '')) || 0
      : 0;

    // Auto-classify common patterns
    let category = 'unclassified';
    const descUpper = desc.toUpperCase();
    if (descUpper.includes('ADM') || descUpper.includes('BIAYA BANK') || descUpper.includes('PAJAK LAYANAN')) {
      category = 'bank_expense';
    }

    transactions.push({
      date: cleanDate,
      description: desc,
      debit,
      kredit,
      balance,
      category,
    });
  }

  return { transactions, count: transactions.length };
}

module.exports = { parseCSV };
