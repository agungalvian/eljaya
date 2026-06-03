import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRupiah } from '../utils/formatters';
import { Calculator, Printer, Calendar } from 'lucide-react';

const TABS = [
  { id: 'pl', label: 'Laba Rugi' },
  { id: 'bs', label: 'Neraca' },
  { id: 'cf', label: 'Arus Kas' },
  { id: 'notes', label: 'CALK' },
];

const MONTH_LABELS = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
  7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
};

function ReportRow({ label, value, bold, indent, highlight, color }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${indent ? 'pl-5' : ''} ${highlight ? 'bg-slate-50 rounded-lg px-3 py-2 font-bold' : ''} ${bold ? 'font-bold' : ''} border-b border-slate-50 last:border-0`}>
      <span className={`text-sm ${color || 'text-slate-700'}`}>{label}</span>
      <span className={`text-sm font-medium tabular-nums ${color || (value < 0 ? 'text-rose-600' : '')}`}>{formatRupiah(value)}</span>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="border-b border-slate-200 pb-1 mb-2 mt-5 first:mt-0">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h4>
    </div>
  );
}

function ProfitLossReport({ data }) {
  if (!data) return <LoadingSpinner />;
  return (
    <div className="space-y-1 text-sm">
      <SectionHeader title="I. Pendapatan Usaha" />
      <ReportRow label="Penerimaan Proyek Kontrak" value={data.pendapatan.proyek} indent />
      <ReportRow label="Penerimaan Rental Alat Berat" value={data.pendapatan.rental} indent />
      <ReportRow label="Total Pendapatan Bersih" value={data.pendapatan.total} bold />

      <SectionHeader title="II. Beban Langsung Operasional" />
      <ReportRow label="Ongkos Transportasi & Mobilisasi" value={data.bebanLangsung.transport} indent />
      <ReportRow label="Gaji Tenaga Kerja & Operator" value={data.bebanLangsung.gaji} indent />
      <ReportRow label="Material & Beton" value={data.bebanLangsung.material} indent />
      <ReportRow label="Total Beban Langsung" value={data.bebanLangsung.total} bold />

      <div className="bg-slate-100 rounded-xl p-3 my-3 flex justify-between font-bold">
        <span>LABA USAHA KOTOR (Gross Profit)</span>
        <span className={data.labaKotor >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatRupiah(data.labaKotor)}</span>
      </div>

      <SectionHeader title="III. Beban Umum & Administrasi" />
      <ReportRow label="Beban Administrasi Bank & Pajak" value={data.bebanUmum.bank} indent />
      <ReportRow label="Beban Penyusutan Alat Berat" value={data.bebanUmum.depresiasi} indent />
      <ReportRow label="Total Beban Umum" value={data.bebanUmum.total} bold />

      <div className={`rounded-xl p-3 my-3 flex justify-between font-extrabold text-base ${data.labaBersih >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
        <span>LABA USAHA BERSIH (Net Income)</span>
        <span>{formatRupiah(data.labaBersih)}</span>
      </div>
    </div>
  );
}

function BalanceSheetReport({ data }) {
  if (!data) return <LoadingSpinner />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-bold text-indigo-900 border-b-2 border-indigo-900 pb-1 uppercase text-xs tracking-wider mb-3">ASET (AKTIVA)</h4>
        <p className="text-xs font-bold uppercase text-slate-500 mb-1.5">A. Aset Lancar</p>
        <ReportRow label="Kas & Setara Kas (BRI)" value={data.aset.kas} indent />
        <ReportRow label="Piutang Usaha" value={data.aset.piutang} indent />
        <ReportRow label="Subtotal Aset Lancar" value={data.aset.totalLancar} bold />
        <p className="text-xs font-bold uppercase text-slate-500 mb-1.5 mt-4">B. Aset Tetap</p>
        <ReportRow label="Peralatan & Mesin (Alat Berat)" value={data.aset.asetTetap} indent />
        <ReportRow label="Akumulasi Penyusutan" value={-data.aset.akumPenyusutan} indent color="text-rose-600" />
        <ReportRow label="Nilai Buku Aset Tetap" value={data.aset.nilaiAsetTetap} bold />
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 mt-3 flex justify-between font-bold text-indigo-950">
          <span>TOTAL ASET</span><span>{formatRupiah(data.aset.totalAset)}</span>
        </div>
      </div>
      <div>
        <h4 className="font-bold text-slate-900 border-b-2 border-slate-900 pb-1 uppercase text-xs tracking-wider mb-3">KEWAJIBAN & EKUITAS</h4>
        <p className="text-xs font-bold uppercase text-slate-500 mb-1.5">A. Kewajiban (Liabilitas)</p>
        <ReportRow label="Hutang Usaha (Vendor)" value={data.pasiva.hutangUsaha} indent />
        <ReportRow label="Subtotal Kewajiban" value={data.pasiva.totalKewajiban} bold />
        <p className="text-xs font-bold uppercase text-slate-500 mb-1.5 mt-4">B. Ekuitas (Modal)</p>
        <ReportRow label="Modal Pemilik" value={data.pasiva.modalAwal} indent />
        <ReportRow label="Laba Ditahan Berjalan" value={data.pasiva.labaDitahan} indent />
        <ReportRow label="Subtotal Ekuitas" value={data.pasiva.totalEkuitas} bold />
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 mt-3 flex justify-between font-bold text-slate-950">
          <span>TOTAL KEWAJIBAN & EKUITAS</span><span>{formatRupiah(data.pasiva.totalPasiva)}</span>
        </div>
      </div>
    </div>
  );
}

function CashflowReport({ data }) {
  if (!data) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <div>
        <SectionHeader title="1. Arus Kas dari Aktivitas Operasional" />
        <ReportRow label="Penerimaan dari Klien" value={data.operasional.terimaKlien} color="text-emerald-600" indent />
        <ReportRow label="Pembayaran Gaji" value={-data.operasional.bayarGaji} color="text-rose-600" indent />
        <ReportRow label="Pembayaran Transportasi" value={-data.operasional.bayarTransport} color="text-rose-600" indent />
        <ReportRow label="Pembayaran Material" value={-data.operasional.bayarMaterial} color="text-rose-600" indent />
        <ReportRow label="Biaya Administrasi Bank" value={-data.operasional.bayarBank} color="text-rose-600" indent />
        <ReportRow label="Arus Kas Bersih — Operasional" value={data.operasional.total} bold highlight />
      </div>
      <div>
        <SectionHeader title="2. Arus Kas dari Aktivitas Investasi" />
        <ReportRow label="Perolehan Aset Tetap Baru" value={0} indent />
        <ReportRow label="Arus Kas Bersih — Investasi" value={data.investasi.total} bold highlight />
      </div>
      <div>
        <SectionHeader title="3. Arus Kas dari Aktivitas Pendanaan" />
        <ReportRow label="Pembayaran / Pelunasan Hutang" value={-data.pendanaan.bayarHutang} color="text-rose-600" indent />
        <ReportRow label="Penerimaan Piutang" value={data.pendanaan.terimaPiutang} color="text-emerald-600" indent />
        <ReportRow label="Arus Kas Bersih — Pendanaan" value={data.pendanaan.total} bold highlight />
      </div>
      <div className="border-t-2 border-slate-200 pt-3 space-y-2">
        <ReportRow label="KENAIKAN / (PENURUNAN) BERSIH KAS" value={data.netChange} bold />
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex justify-between font-bold text-indigo-950 text-sm">
          <span>KAS PADA AKHIR PERIODE</span>
          <span>{formatRupiah(data.kasAkhir)}</span>
        </div>
      </div>
    </div>
  );
}

function NotesReport({ pl, bs }) {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="font-bold border-b pb-1 mb-2">1. Gambaran Umum Perusahaan</h4>
        <p className="text-xs leading-relaxed">CV. EL JAYA PONDASI merupakan badan usaha yang bergerak di bidang konstruksi sipil khususnya fondasi dalam (bore pile, strauss pile) serta persewaan/rental alat berat di wilayah Provinsi Bali.</p>
      </div>
      <div>
        <h4 className="font-bold border-b pb-1 mb-2">2. Dasar Penyusunan</h4>
        <p className="text-xs leading-relaxed">Laporan keuangan disusun berdasarkan SAK EMKM. Dasar pengukuran menggunakan historical cost dan modified cash basis yang diverifikasi dari rekening koran BRI.</p>
      </div>
      <div>
        <h4 className="font-bold border-b pb-1 mb-2">3. Rincian Finansial Tambahan</h4>
        <div className="space-y-1 text-xs">
          <p>• Laba Bersih Berjalan: <strong>{pl ? formatRupiah(pl.labaBersih) : '—'}</strong></p>
          <p>• Total Kewajiban: <strong>{bs ? formatRupiah(bs.pasiva.totalKewajiban) : '—'}</strong></p>
          <p>• Nilai Buku Aset Tetap: <strong>{bs ? formatRupiah(bs.aset.nilaiAsetTetap) : '—'}</strong></p>
        </div>
      </div>
    </div>
  );
}

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState('pl');
  const getDefaultPeriod = () => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  };
  const defaultPeriod = getDefaultPeriod();
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);

  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ['reports', 'pl', selectedMonth, selectedYear],
    queryFn: () => reportsApi.profitLoss({ month: selectedMonth, year: selectedYear }),
  });
  const { data: bs, isLoading: bsLoading } = useQuery({
    queryKey: ['reports', 'bs', selectedMonth, selectedYear],
    queryFn: () => reportsApi.balanceSheet({ month: selectedMonth, year: selectedYear }),
  });
  const { data: cf, isLoading: cfLoading } = useQuery({
    queryKey: ['reports', 'cf', selectedMonth, selectedYear],
    queryFn: () => reportsApi.cashflow({ month: selectedMonth, year: selectedYear }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period selection & Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <Calendar className="text-amber-500" size={18} />
          <span className="text-sm font-bold text-slate-700">Periode Laporan:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-200 focus:outline-none cursor-pointer"
          >
            {Object.entries(MONTH_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-200 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 6 }, (_, i) => 2025 + i).map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
        <button onClick={() => window.print()} className="btn-secondary text-xs px-4 py-2 self-start sm:self-center">
          <Printer size={14} /> Cetak Laporan
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 no-print flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report container */}
      <div className="card p-6 sm:p-10 print-area">
        {/* Letterhead */}
        <div className="border-b-4 border-double border-slate-800 pb-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-wide">CV. EL JAYA PONDASI</h2>
            <p className="text-xs text-slate-500 mt-1">Jalan Raya Oleg, Gg. Jepun, Br. Umopoh, Kec. Mengwi, Kab. Badung, Bali 80351</p>
            <p className="text-xs text-slate-400">0816 4702 632 · eljayapondasi@gmail.com</p>
          </div>
          <div className="text-left sm:text-right text-xs">
            <p className="font-bold text-slate-800 uppercase">Laporan Keuangan</p>
            <p className="text-slate-500">Periode: {MONTH_LABELS[selectedMonth]} {selectedYear}</p>
          </div>
        </div>

        {/* Active report */}
        <div>
          <h3 className="text-center font-bold text-lg uppercase tracking-wider text-slate-900 mb-6">
            {TABS.find(t => t.id === activeTab)?.label}
          </h3>
          {activeTab === 'pl' && (plLoading ? <LoadingSpinner /> : <ProfitLossReport data={pl} />)}
          {activeTab === 'bs' && (bsLoading ? <LoadingSpinner /> : <BalanceSheetReport data={bs} />)}
          {activeTab === 'cf' && (cfLoading ? <LoadingSpinner /> : <CashflowReport data={cf} />)}
          {activeTab === 'notes' && <NotesReport pl={pl} bs={bs} />}
        </div>

        {/* Signature block */}
        <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs gap-4">
          <div>
            <p className="text-slate-500">Disusun oleh,</p>
            <div className="h-16" />
            <p className="font-bold text-slate-800">CV. EL JAYA PONDASI</p>
            <p className="text-slate-400">Staf Keuangan & Admin</p>
          </div>
          <div>
            <p className="text-slate-500">Menyetujui,</p>
            <div className="h-16" />
            <p className="font-bold text-slate-800">I PUTU SUPARDI</p>
            <p className="text-slate-400">Direktur Utama</p>
          </div>
        </div>
      </div>
    </div>
  );
}
