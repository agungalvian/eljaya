import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, projectsApi } from '../api/client';
import { StatCard, ProgressBar } from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRupiah, pct } from '../utils/formatters';
import { Wallet, TrendingUp, TrendingDown, FileText, HardHat, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const getDefaultPeriod = () => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  };
  const defaultPeriod = getDefaultPeriod();
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['reports', 'summary', selectedMonth, selectedYear],
    queryFn: () => reportsApi.summary({ month: selectedMonth, year: selectedYear }),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
    select: (list) => list.filter(p => p.status === 'berjalan'),
  });

  const s = summary || {};
  const totalOps = (s.bebanTransport || 0) + (s.bebanGaji || 0) + (s.bebanMaterial || 0);

  const chartData = [
    { name: 'Transport', value: s.bebanTransport || 0, color: '#f59e0b' },
    { name: 'Gaji', value: s.bebanGaji || 0, color: '#6366f1' },
    { name: 'Material', value: s.bebanMaterial || 0, color: '#10b981' },
    { name: 'Bank', value: s.bebanBank || 0, color: '#64748b' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-xs">Pilih periode laporan untuk memantau ringkasan keuangan</p>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start sm:self-center">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-xs font-bold border-none bg-transparent focus:outline-none text-slate-700 cursor-pointer"
          >
            {[
              { val: 1, label: 'Januari' },
              { val: 2, label: 'Februari' },
              { val: 3, label: 'Maret' },
              { val: 4, label: 'April' },
              { val: 5, label: 'Mei' },
              { val: 6, label: 'Juni' },
              { val: 7, label: 'Juli' },
              { val: 8, label: 'Agustus' },
              { val: 9, label: 'September' },
              { val: 10, label: 'Oktober' },
              { val: 11, label: 'November' },
              { val: 12, label: 'Desember' }
            ].map(m => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>
          <div className="w-[1px] bg-slate-200 self-stretch my-1"></div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-xs font-bold border-none bg-transparent focus:outline-none text-slate-700 cursor-pointer"
          >
            {Array.from({ length: 6 }, (_, i) => 2025 + i).map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Memuat ringkasan keuangan..." />
      ) : (
        <>
          {/* Hero banner */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white overflow-hidden shadow-lg">
            <div className="absolute right-4 bottom-0 opacity-5 text-[160px] leading-none select-none">⚙</div>
            <div className="relative z-10">
              <span className="inline-block bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30 mb-3">
                CV. EL JAYA PONDASI
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Laporan Keuangan <span className="text-amber-400">Realtime</span>
              </h2>
              <p className="text-slate-300 mt-2 text-sm sm:text-base max-w-xl">
                Jasa Konstruksi & Rental Alat Berat · Badung, Bali
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs">
                <span className="bg-white/10 px-3 py-1.5 rounded-lg">
                  🏗 {s.projectCount || 0} Proyek Aktif
                </span>
                <span className="bg-white/10 px-3 py-1.5 rounded-lg">
                  👷 {s.employeeCount || 0} Karyawan
                </span>
                <span className="bg-white/10 px-3 py-1.5 rounded-lg">
                  📊 {s.txCount || 0} Mutasi Koran
                </span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Saldo Bank Akhir"
              value={formatRupiah(s.endingBalance)}
              sub="Saldo rekening BRI"
              icon={Wallet}
              color="indigo"
            />
            <StatCard
              label="Pemasukan Proyek"
              value={formatRupiah(s.totalPemasukan)}
              sub={`${s.txCount || 0} mutasi`}
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              label="Total Beban Ops"
              value={formatRupiah(s.totalBebanOps)}
              sub="Transport + Gaji + Material"
              icon={TrendingDown}
              color="rose"
            />
            <StatCard
              label="Sisa Piutang"
              value={formatRupiah(s.outstandingPiutang)}
              sub="Belum tertagih"
              icon={FileText}
              color="amber"
            />
          </div>

          {/* Projects + Expense breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project monitoring */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <HardHat size={18} className="text-amber-500" /> Pemantauan Proyek
                </h3>
                <Link to="/rab-proyek" className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                  Kelola RAB <ArrowRight size={12} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="table-th rounded-tl-lg">Proyek</th>
                      <th className="table-th text-right">Kontrak</th>
                      <th className="table-th text-right">Pemasukan</th>
                      <th className="table-th text-right rounded-tr-lg">Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr><td colSpan={4} className="table-td text-center text-slate-400 py-8">
                        Belum ada proyek berjalan — <Link to="/rab-proyek" className="text-indigo-500 underline">Tambah sekarang</Link>
                      </td></tr>
                    ) : projects.map(p => {
                      const rev = p.transactions?.filter(t => t.category === 'project_revenue')
                        .reduce((s, t) => s + t.kredit, 0) || 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="table-td font-semibold text-slate-800 max-w-[160px]">
                            <span className="truncate block" title={p.name}>{p.name}</span>
                          </td>
                          <td className="table-td text-right text-slate-600">{formatRupiah(p.contractValue)}</td>
                          <td className="table-td text-right text-emerald-600 font-medium">{formatRupiah(rev)}</td>
                          <td className="table-td text-right text-slate-500">{formatRupiah(p.contractValue - rev)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expense chart */}
            <div className="card p-5 flex flex-col gap-4">
              <h3 className="font-bold text-slate-900">Struktur Pengeluaran</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => [formatRupiah(v), '']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 mt-auto">
                <ProgressBar label="Transportasi" value={s.bebanTransport || 0} total={totalOps} color="amber" />
                <ProgressBar label="Gaji & Upah" value={s.bebanGaji || 0} total={totalOps} color="indigo" />
                <ProgressBar label="Material" value={s.bebanMaterial || 0} total={totalOps} color="emerald" />
              </div>
            </div>
          </div>
        </>)}
    </div>
  );
}
