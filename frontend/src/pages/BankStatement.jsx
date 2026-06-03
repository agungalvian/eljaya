import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, projectsApi, debtsApi, periodLocksApi } from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRupiah, CATEGORY_LABELS } from '../utils/formatters';
import toast from 'react-hot-toast';
import { UploadCloud, Trash2, Filter, FileSpreadsheet, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORY_OPTIONS = [
  { value: 'unclassified', label: '— Belum Dialokasikan —' },
  { value: 'project_revenue', label: 'Pemasukan Proyek' },
  { value: 'rental_revenue', label: 'Pemasukan Rental Alat' },
  { value: 'transportation_expense', label: 'Ongkos Transportasi' },
  { value: 'wage_expense', label: 'Gaji & Upah' },
  { value: 'material_expense', label: 'Material & Beton' },
  { value: 'bank_expense', label: 'Biaya Bank & Admin' },
  { value: 'debt_payment', label: 'Pembayaran Hutang' },
  { value: 'receivable_collection', label: 'Penerimaan Piutang' },
  { value: 'mobilization_expense', label: 'Sewa Alat / Mobilisasi' },
];

export default function BankStatement() {
  const { hasPermission } = useAuth();
  const isWritable = hasPermission('bankStatement', 'write');
  
  const getDefaultPeriod = () => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  };
  const defaultPeriod = getDefaultPeriod();
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: lockStatus = { isLocked: false } } = useQuery({
    queryKey: ['periodLock', selectedMonth, selectedYear],
    queryFn: () => periodLocksApi.getStatus(selectedMonth, selectedYear),
  });
  const isLocked = lockStatus.isLocked;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', selectedMonth, selectedYear],
    queryFn: () => transactionsApi.list({ month: selectedMonth, year: selectedYear }),
  });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });
  const { data: debts = [] } = useQuery({ queryKey: ['debts'], queryFn: debtsApi.list });

  const importMutation = useMutation({
    mutationFn: ({ file, month, year }) => transactionsApi.importCSV(file, month, year),
    onSuccess: (data) => {
      toast.success(`Berhasil mengimpor ${data.count} transaksi`);
      qc.invalidateQueries({ queryKey: ['transactions', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const clearMutation = useMutation({
    mutationFn: () => transactionsApi.clearAll(selectedMonth, selectedYear),
    onSuccess: () => {
      toast.success('Data transaksi periode ini dibersihkan');
      qc.invalidateQueries({ queryKey: ['transactions', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const lockMutation = useMutation({
    mutationFn: ({ month, year, lock }) => periodLocksApi.setLockStatus(month, year, lock),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['periodLock', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['transactions', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success(variables.lock ? 'Periode berhasil disimpan dan dikunci!' : 'Periode dibuka untuk pengeditan.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLockToggle = (lockVal) => {
    if (lockVal) {
      if (transactions.length === 0) {
        toast.error('Gagal mengunci: Belum ada data transaksi.');
        return;
      }
      if (unclassifiedCount > 0) {
        toast.error(`Gagal mengunci: Masih ada ${unclassifiedCount} transaksi yang belum dialokasikan.`);
        return;
      }
    }
    lockMutation.mutate({ month: selectedMonth, year: selectedYear, lock: lockVal });
  };

  const handleFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Hanya file .csv yang diterima');
      return;
    }
    importMutation.mutate({ file, month: selectedMonth, year: selectedYear });
  }, [importMutation, selectedMonth, selectedYear]);

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCategoryChange = (id, val) => {
    const parts = val.split(':');
    const category = parts[0];
    const relationId = parts[1] || null;

    const data = { category, projectId: null, debtId: null };
    if (category === 'project_revenue') {
      data.projectId = relationId;
    } else if (category === 'debt_payment' || category === 'receivable_collection') {
      data.debtId = relationId;
    }
    updateMutation.mutate({ id, data });
  };

  const getCategoryLabel = (tx) => {
    if (tx.projectId && tx.project) {
      return `🏗️ Proyek: ${tx.project.name}`;
    }
    if (tx.debtId && tx.debt) {
      const type = tx.debt.type === 'HUTANG' ? 'Bayar Hutang' : 'Terima Piutang';
      return `🤝 ${type}: ${tx.debt.vendor}`;
    }
    const standard = CATEGORY_OPTIONS.find(o => o.value === tx.category);
    return standard ? standard.label : tx.category;
  };

  const filtered = transactions.filter(tx => {
    if (filter === 'debit' && !tx.debit) return false;
    if (filter === 'kredit' && !tx.kredit) return false;
    if (filter === 'unclassified' && tx.category !== 'unclassified') return false;
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unclassifiedCount = transactions.filter(t => t.category === 'unclassified').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload area */}
      <div className="card p-6">
        <h2 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-amber-500" /> Import Rekening Koran BRI (CSV)
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Format ekspor rekening koran Corporate BRI / IBIZ. Data diproses di server secara aman.
        </p>

        {isWritable ? (
          <>
            {/* Period Selector */}
            <div className="flex flex-wrap gap-4 items-end mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Bulan Periode Import
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
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
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tahun Periode Import (2025 - 2030)
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {Array.from({ length: 6 }, (_, i) => 2025 + i).map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] flex items-end">
                <div className="w-full flex gap-2">
                  {isLocked ? (
                    <button
                      onClick={() => handleLockToggle(false)}
                      disabled={lockMutation.isPending}
                      className="w-full btn-secondary text-xs px-3 py-2.5 flex items-center justify-center gap-1.5 font-bold border-amber-300 bg-amber-50/20 hover:bg-amber-50"
                    >
                      <Lock size={14} className="text-amber-600" /> Edit Periode
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLockToggle(true)}
                      disabled={lockMutation.isPending || transactions.length === 0}
                      className="w-full btn-primary text-xs px-3 py-2.5 flex items-center justify-center gap-1.5 font-bold"
                    >
                      <Unlock size={14} /> Simpan & Kunci
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isLocked && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
                <Lock className="text-amber-600 flex-shrink-0" size={16} />
                <span>Periode ini telah disimpan dan dikunci. Klik tombol "Edit Periode" di atas jika ingin melakukan perubahan data atau upload ulang.</span>
              </div>
            )}

            {!isLocked && (
              <div
                className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => document.getElementById('csv-upload').click()}
              >
                <UploadCloud size={36} className="text-slate-400 group-hover:text-amber-500 mx-auto mb-3 transition-colors" />
                <p className="font-semibold text-slate-700">Klik atau seret file CSV ke sini</p>
                <p className="text-xs text-slate-400 mt-1">Hanya menerima format .csv (BRI/IBIZ)</p>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            )}

            {transactions.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-sm text-emerald-800 font-semibold flex items-center gap-2">
                  ✅ {transactions.length} transaksi dimuat
                  {unclassifiedCount > 0 && (
                    <span className="badge-amber">{unclassifiedCount} belum diklasifikasi</span>
                  )}
                </div>
                {!isLocked && (
                  <button
                    onClick={() => { if (window.confirm('Hapus semua data transaksi periode ini?')) clearMutation.mutate(); }}
                    className="btn-danger text-xs px-3 py-1.5"
                  >
                    <Trash2 size={14} /> Bersihkan
                  </button>
                )}
              </div>
            )}

            {importMutation.isPending && (
              <div className="mt-3 text-center text-sm text-amber-600 font-medium animate-pulse">
                ⏳ Sedang mengimpor dan memproses CSV...
              </div>
            )}
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
            <ShieldAlert className="text-amber-600 flex-shrink-0" size={18} />
            <span>Mode Baca-Saja: Anda tidak memiliki izin untuk mengimpor atau membersihkan mutasi rekening koran.</span>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Alokasi & Klasifikasi Mutasi</h3>
            <p className="text-sm text-slate-500">Tetapkan setiap baris ke pos anggaran atau proyek yang sesuai</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input text-xs px-3 py-2 w-full sm:w-48"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input text-xs px-3 py-2 w-auto">
              <option value="all">Semua</option>
              <option value="debit">Debit</option>
              <option value="kredit">Kredit</option>
              <option value="unclassified">Belum Alokasi</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="table-th w-10">#</th>
                  <th className="table-th w-28">Tanggal</th>
                  <th className="table-th min-w-[200px]">Deskripsi</th>
                  <th className="table-th text-right w-32">Debit (Keluar)</th>
                  <th className="table-th text-right w-32">Kredit (Masuk)</th>
                  <th className="table-th w-56">Alokasi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="table-td text-center text-slate-400 py-12">
                    {transactions.length === 0 ? 'Belum ada data. Upload file CSV terlebih dahulu.' : 'Tidak ada transaksi yang sesuai filter.'}
                  </td></tr>
                ) : filtered.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50 transition-colors ${tx.kredit > 0 ? 'bg-emerald-50/30' : ''} ${tx.category === 'unclassified' ? 'border-l-2 border-l-amber-400' : ''}`}
                  >
                    <td className="table-td text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="table-td text-xs text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className="table-td max-w-[220px]">
                      <span className="truncate block text-slate-700" title={tx.description}>{tx.description}</span>
                    </td>
                    <td className="table-td text-right text-rose-600 font-medium whitespace-nowrap">
                      {tx.debit > 0 ? formatRupiah(tx.debit) : '—'}
                    </td>
                    <td className="table-td text-right text-emerald-600 font-medium whitespace-nowrap">
                      {tx.kredit > 0 ? formatRupiah(tx.kredit) : '—'}
                    </td>
                    <td className="table-td">
                      {isLocked ? (
                        tx.category === 'unclassified' ? (
                          <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 inline-block">
                            ⚠️ Belum Dialokasikan
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 inline-block max-w-[220px] truncate" title={getCategoryLabel(tx)}>
                            {getCategoryLabel(tx)}
                          </span>
                        )
                      ) : (
                        <select
                          value={tx.projectId ? `project_revenue:${tx.projectId}` : tx.debtId ? `${tx.category}:${tx.debtId}` : tx.category}
                          disabled={!isWritable}
                          onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          {CATEGORY_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                          <optgroup label="— Alokasi Proyek —">
                            {projects.map(p => (
                              <option key={p.id} value={`project_revenue:${p.id}`}>{p.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="— Hutang / Piutang —">
                            {debts.map(d => {
                              const val = d.type === 'HUTANG' ? 'debt_payment' : 'receivable_collection';
                              return (
                                <option key={d.id} value={`${val}:${d.id}`}>
                                  {d.type === 'HUTANG' ? 'Bayar: ' : 'Terima: '}{d.vendor}
                                </option>
                              );
                            })}
                          </optgroup>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
