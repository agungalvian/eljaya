import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { employeesApi } from '../api/client';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRupiah, formatCurrencyInput, parseCurrencyInput } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users, Download, Upload, ShieldAlert, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function EmployeeForm({ onSubmit, loading, defaultValues }) {
  const formattedDefaultValues = defaultValues ? {
    ...defaultValues,
    salary: defaultValues.salary ? Number(defaultValues.salary).toLocaleString('id-ID') : '',
  } : { status: 'LUNAS' };

  const { register, handleSubmit } = useForm({
    defaultValues: formattedDefaultValues
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nama Karyawan</label>
        <input {...register('name', { required: true })} placeholder="I Made Arta" className="input" />
      </div>
      <div>
        <label className="label">Jabatan / Posisi</label>
        <input {...register('position')} placeholder="Operator Excavator" className="input" />
      </div>
      <div>
        <label className="label">Gaji Pokok & Tunjangan (IDR)</label>
        <input
          type="text"
          {...register('salary', {
            required: true,
            setValueAs: parseCurrencyInput
          })}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
          }}
          placeholder="6.500.000"
          className="input"
        />
      </div>
      <div>
        <label className="label">Status Pembayaran</label>
        <select {...register('status')} className="input">
          <option value="LUNAS">Lunas (Sudah Dibayar)</option>
          <option value="BELUM_LUNAS">Belum Lunas (Hutang Gaji)</option>
        </select>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        <Plus size={16} /> {defaultValues ? 'Simpan Perubahan' : 'Tambah Karyawan'}
      </button>
    </form>
  );
}

export default function Payroll() {
  const { hasPermission } = useAuth();
  const isWritable = hasPermission('payroll', 'write');
  const [editEmployee, setEditEmployee] = useState(null);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const qc = useQueryClient();

  // Period Selector logic (Default: Month - 1)
  const getDefaultPeriod = () => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  };
  const defaultPeriod = getDefaultPeriod();
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);

  // Fetch employees for the selected period
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', selectedMonth, selectedYear],
    queryFn: () => employeesApi.list({ month: selectedMonth, year: selectedYear }),
  });

  const totalGaji = employees.reduce((s, e) => s + e.salary, 0);
  const totalGajiBelum = employees.filter(e => e.status === 'BELUM_LUNAS').reduce((s, e) => s + e.salary, 0);

  // Mutations
  const empCreate = useMutation({
    mutationFn: (data) => employeesApi.create({
      ...data,
      month: selectedMonth,
      year: selectedYear,
    }),
    onSuccess: () => {
      toast.success('Karyawan ditambahkan');
      qc.invalidateQueries({ queryKey: ['employees', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] }); // Invalidate financial summaries too
      setShowAddEmp(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const empUpdate = useMutation({
    mutationFn: ({ id, data }) => employeesApi.update(id, {
      ...data,
      month: selectedMonth,
      year: selectedYear,
    }),
    onSuccess: () => {
      toast.success('Data karyawan diperbarui');
      qc.invalidateQueries({ queryKey: ['employees', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] });
      setEditEmployee(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const empDelete = useMutation({
    mutationFn: employeesApi.remove,
    onSuccess: () => {
      toast.success('Data karyawan dihapus');
      qc.invalidateQueries({ queryKey: ['employees', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const csvImportMutation = useMutation({
    mutationFn: (file) => employeesApi.importCSV(file, selectedMonth, selectedYear),
    onSuccess: (data) => {
      toast.success(data.message || 'CSV karyawan berhasil diimpor');
      qc.invalidateQueries({ queryKey: ['employees', selectedMonth, selectedYear] });
      qc.invalidateQueries({ queryKey: ['reports'] });
      setCsvFile(null);
      // Reset file input
      const fileInput = document.getElementById('employee-csv-input');
      if (fileInput) fileInput.value = '';
    },
    onError: (e) => toast.error(e.message || 'Gagal mengimpor CSV'),
  });

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nama,Jabatan,Gaji,Status\n"
      + "\"I Made Arta\",\"Operator Excavator\",6500000,\"Lunas\"\n"
      + "\"Wayan Sudi\",\"Helper Strausspile\",4800000,\"Lunas\"\n"
      + "\"Siti Rahma\",\"Admin & Finance\",4500000,\"Belum Lunas\"\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `template_karyawan_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template CSV diunduh');
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    csvImportMutation.mutate(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-amber-500" /> Gaji Karyawan
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Kelola daftar gaji karyawan dan status pembayaran per periode</p>
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

      {!isWritable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <ShieldAlert className="text-amber-600 flex-shrink-0" size={18} />
          <span>Mode Baca-Saja: Anda tidak memiliki izin untuk mengimpor atau memodifikasi data gaji karyawan.</span>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 border-l-4 border-l-emerald-400">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Beban Gaji</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(totalGaji)}</p>
          <p className="text-xs text-slate-400 mt-1">{employees.length} karyawan terdaftar pada periode ini</p>
        </div>
        <div className="card p-4 border-l-4 border-l-rose-400">
          <p className="text-xs font-semibold uppercase text-slate-500">Hutang Gaji</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatRupiah(totalGajiBelum)}</p>
          <p className="text-xs text-slate-400 mt-1">Total gaji belum dibayar (status Belum Lunas)</p>
        </div>
      </div>

      {/* Table & Actions */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-slate-500" /> Daftar Gaji Periode
          </h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Download size={14} /> Unduh Template
            </button>

            {isWritable && (
              <>
                <label className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50">
                  <Upload size={14} />
                  <span>{csvImportMutation.isPending ? 'Mengimpor...' : 'Impor CSV'}</span>
                  <input
                    id="employee-csv-input"
                    type="file"
                    accept=".csv"
                    onChange={handleUploadCSV}
                    className="sr-only"
                    disabled={csvImportMutation.isPending}
                  />
                </label>

                <button
                  onClick={() => setShowAddEmp(true)}
                  className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Tambah Karyawan
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr>
                  <th className="table-th">Nama Karyawan</th>
                  <th className="table-th">Jabatan / Posisi</th>
                  <th className="table-th text-right">Gaji Pokok & Tunjangan</th>
                  <th className="table-th text-center">Status</th>
                  {isWritable && <th className="table-th w-24 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={isWritable ? 5 : 4} className="table-td text-center text-slate-400 py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle size={24} className="text-slate-300" />
                        <p>Belum ada karyawan untuk periode ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : employees.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td font-semibold text-slate-800">{e.name}</td>
                    <td className="table-td text-slate-500">{e.position || '-'}</td>
                    <td className="table-td text-right font-medium text-slate-700">{formatRupiah(e.salary)}</td>
                    <td className="table-td text-center">
                      <span className={e.status === 'LUNAS' ? 'badge-green' : 'badge-red'}>
                        {e.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                    {isWritable && (
                      <td className="table-td">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setEditEmployee(e)} className="btn-ghost p-1.5 text-indigo-600">
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus data gaji untuk "${e.name}"?`)) {
                                empDelete.mutate(e.id);
                              }
                            }}
                            className="btn-ghost p-1.5 text-rose-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showAddEmp} onClose={() => setShowAddEmp(false)} title="Tambah Karyawan Baru">
        <EmployeeForm onSubmit={d => empCreate.mutate(d)} loading={empCreate.isPending} />
      </Modal>

      <Modal isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} title="Edit Data Gaji Karyawan">
        {editEmployee && (
          <EmployeeForm
            defaultValues={editEmployee}
            onSubmit={d => empUpdate.mutate({ id: editEmployee.id, data: d })}
            loading={empUpdate.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
