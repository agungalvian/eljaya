/**
 * Format number as Indonesian Rupiah
 */
export function formatRupiah(num, withPrefix = true) {
  if (!num && num !== 0) return withPrefix ? 'Rp 0' : '0';
  const formatted = Math.abs(num).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format date string to Indonesian locale
 */
export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format number to Indonesian words (Terbilang)
 */
export function terbilang(nominal) {
  const n = Math.floor(Math.abs(nominal));
  const bil = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  const convert = (num) => {
    if (num === 0) return '';
    if (num < 12) return ' ' + bil[num];
    if (num < 20) return convert(num - 10) + ' Belas';
    if (num < 100) return convert(Math.floor(num / 10)) + ' Puluh' + convert(num % 10);
    if (num < 200) return ' Seratus' + convert(num - 100);
    if (num < 1000) return convert(Math.floor(num / 100)) + ' Ratus' + convert(num % 100);
    if (num < 2000) return ' Seribu' + convert(num - 1000);
    if (num < 1_000_000) return convert(Math.floor(num / 1000)) + ' Ribu' + convert(num % 1000);
    if (num < 1_000_000_000) return convert(Math.floor(num / 1_000_000)) + ' Juta' + convert(num % 1_000_000);
    if (num < 1_000_000_000_000) return convert(Math.floor(num / 1_000_000_000)) + ' Miliar' + convert(num % 1_000_000_000);
    return ' Lebih dari satu Triliun';
  };

  const result = convert(n).trim();
  return result || 'Nol';
}

/**
 * Abbreviate large numbers for display (e.g. 1.5M, 50K)
 */
export function abbreviateNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Jt`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)} Rb`;
  return num.toString();
}

/**
 * Compute percentage safely
 */
export function pct(part, total) {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Map category key to human-readable label
 */
export const CATEGORY_LABELS = {
  unclassified: '— Belum Dialokasikan —',
  project_revenue: 'Pemasukan Proyek',
  rental_revenue: 'Pemasukan Rental Alat',
  transportation_expense: 'Ongkos Transportasi',
  wage_expense: 'Gaji & Upah',
  material_expense: 'Material & Beton',
  bank_expense: 'Biaya Bank & Admin',
  debt_payment: 'Pembayaran Hutang',
  receivable_collection: 'Penerimaan Piutang',
  mobilization_expense: 'Sewa Alat / Mobilisasi',
};

/**
 * Format a raw digit string into Indonesian thousands separators format
 */
export function formatCurrencyInput(val) {
  if (!val && val !== 0) return '';
  const digits = val.toString().replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

/**
 * Parse a formatted currency string back to a float
 */
export function parseCurrencyInput(val) {
  if (!val) return 0;
  const digits = val.toString().replace(/\D/g, '');
  return parseFloat(digits) || 0;
}
