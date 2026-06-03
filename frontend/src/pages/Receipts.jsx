import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { transactionsApi, receiptsApi } from '../api/client';
import { formatRupiah, formatDateIndo, terbilang, parseCurrencyInput } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Receipt, Printer, Plus, Trash2, Wand2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Receipts() {
  const { hasPermission } = useAuth();
  const isWritable = hasPermission('receipts', 'write');
  const [preview, setPreview] = useState(null);
  const canvasRef = useRef(null);
  const qc = useQueryClient();

  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: () => transactionsApi.list() });
  const { data: receipts = [], isLoading } = useQuery({ queryKey: ['receipts'], queryFn: receiptsApi.list });

  const createMutation = useMutation({
    mutationFn: receiptsApi.create,
    onSuccess: () => { toast.success('Kuitansi tersimpan'); qc.invalidateQueries({ queryKey: ['receipts'] }); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: receiptsApi.remove,
    onSuccess: () => { toast.success('Dihapus'); qc.invalidateQueries({ queryKey: ['receipts'] }); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    mode: 'onChange',
    defaultValues: {
      receiptNumber: `EJP/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/001`,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const rawAmount = watch('amount');
  const amount = typeof rawAmount === 'string' ? parseCurrencyInput(rawAmount) : (parseFloat(rawAmount) || 0);

  const fillFromTx = (txId) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;
    const txVal = tx.debit > 0 ? tx.debit : tx.kredit;
    setValue('amount', Number(txVal).toLocaleString('id-ID'));
    setValue('date', tx.date);
    setValue('description', tx.description);
    setValue('partyName', 'Mitra Bisnis');
  };

  const onSubmit = (data) => {
    const receipt = {
      ...data,
      amount: parseFloat(data.amount) || 0,
    };
    setPreview(receipt);
    createMutation.mutate(receipt);
  };

  const printCanvas = () => {
    if (!canvasRef.current) return;
    const content = canvasRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Cetak Kuitansi EJP</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body class="bg-slate-100 p-8 flex items-center justify-center min-h-screen">
          <div class="border-4 border-slate-300 rounded-xl p-6 bg-amber-50/20 w-full max-w-2xl shadow-inner font-sans space-y-4">
            ${content}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
          <Receipt size={22} className="text-amber-500" /> Bukti Transaksi & Kuitansi
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card p-5 h-fit space-y-4">
          <h3 className="font-bold text-slate-900">Generator Kuitansi</h3>
          {isWritable ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Pilih dari Mutasi Koran (Opsional)</label>
                <select onChange={(e) => fillFromTx(e.target.value)} className="input text-xs">
                  <option value="">— Pilih mutasi —</option>
                  {transactions.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.date}] {formatRupiah(t.debit || t.kredit)} - {t.description.substring(0, 25)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">No. Kuitansi</label>
                  <input
                    {...register('receiptNumber', {
                      required: 'Nomor kuitansi wajib diisi',
                      validate: (value) => {
                        const isDuplicate = receipts.some(
                          (r) => r.receiptNumber.trim().toLowerCase() === value.trim().toLowerCase()
                        );
                        return !isDuplicate || 'Nomor kuitansi sudah digunakan';
                      }
                    })}
                    className={`input ${errors.receiptNumber ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                  />
                  {errors.receiptNumber && (
                    <span className="text-xs text-rose-500 block mt-1">
                      {errors.receiptNumber.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="label">Tanggal</label>
                  <input
                    type="date"
                    {...register('date', { required: 'Tanggal wajib diisi' })}
                    className={`input ${errors.date ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                  />
                  {errors.date && (
                    <span className="text-xs text-rose-500 block mt-1">
                      {errors.date.message}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="label">Diterima dari / Dibayarkan kepada</label>
                <input
                  {...register('partyName', { required: 'Nama pihak wajib diisi' })}
                  placeholder="Nama pihak"
                  className={`input ${errors.partyName ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
                {errors.partyName && (
                  <span className="text-xs text-rose-500 block mt-1">
                    {errors.partyName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="label">Jumlah (IDR)</label>
                <input
                  type="text"
                  {...register('amount', {
                    required: 'Jumlah wajib diisi',
                    setValueAs: parseCurrencyInput
                  })}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
                  }}
                  placeholder="Rp"
                  className={`input ${errors.amount ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
                {errors.amount && (
                  <span className="text-xs text-rose-500 block mt-1">
                    {errors.amount.message}
                  </span>
                )}
              </div>
              <div>
                <label className="label">Untuk Pembayaran</label>
                <textarea
                  {...register('description', { required: 'Keterangan wajib diisi' })}
                  rows={2}
                  placeholder="Keterangan pembayaran"
                  className={`input resize-none ${errors.description ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
                {errors.description && (
                  <span className="text-xs text-rose-500 block mt-1">
                    {errors.description.message}
                  </span>
                )}
              </div>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full justify-center py-3">
                <Wand2 size={16} /> Buat Kuitansi
              </button>
            </form>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
              <ShieldAlert className="text-amber-600 flex-shrink-0" size={18} />
              <span>Mode Baca-Saja: Anda tidak memiliki izin untuk membuat kuitansi baru.</span>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Tampilan Kuitansi</h3>
            {preview && (
              <button onClick={printCanvas} className="btn-secondary text-xs px-3 py-1.5">
                <Printer size={14} /> Cetak
              </button>
            )}
          </div>

          {preview ? (
            <div ref={canvasRef} className="border-4 border-slate-300 rounded-xl p-6 bg-amber-50/20 max-w-2xl shadow-inner font-sans space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-dashed border-slate-400 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-base tracking-wide">CV. EL JAYA PONDASI</h4>
                  <p className="text-[10px] text-slate-500">Mengwi, Badung, Bali · 0816 4702 632</p>
                </div>
                <div className="text-right">
                  <span className="bg-slate-800 text-white text-xs font-black px-2 py-0.5 rounded tracking-widest">KUITANSI</span>
                  <p className="text-[10px] text-slate-600 font-semibold mt-1">No: {preview.receiptNumber}</p>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2.5 text-sm">
                <div className="grid grid-cols-3 items-end">
                  <span className="text-xs text-slate-500 uppercase font-bold">Telah Diterima Dari:</span>
                  <span className="col-span-2 border-b border-dashed border-slate-300 font-bold pb-0.5">{preview.partyName}</span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="text-xs text-slate-500 uppercase font-bold">Uang Sejumlah:</span>
                  <span className="col-span-2 bg-indigo-50 border border-indigo-100 rounded p-1 font-semibold text-indigo-700 text-xs italic">
                    {terbilang(amount)} Rupiah
                  </span>
                </div>
                <div className="grid grid-cols-3 items-end">
                  <span className="text-xs text-slate-500 uppercase font-bold">Untuk Pembayaran:</span>
                  <span className="col-span-2 border-b border-dashed border-slate-300 pb-0.5">{preview.description}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end pt-4">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Nominal</span>
                  <span className="bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded text-lg border border-amber-500 inline-block">
                    {formatRupiah(amount)}
                  </span>
                </div>
                <div className="text-center text-xs">
                  <p className="text-slate-500">Badung, {formatDateIndo(preview.date)}</p>
                  <div className="h-14 border-b border-slate-300 w-32 mx-auto mt-1" />
                  <p className="font-bold text-slate-800 mt-1">CV. EL JAYA PONDASI</p>
                  <p className="text-[10px] text-slate-400">Kasir & Bendahara</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <Receipt size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Isi form dan klik "Buat Kuitansi" untuk melihat preview</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {!isLoading && receipts.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Riwayat Kuitansi</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm min-w-[500px]">
              <thead><tr>
                <th className="table-th">No. Kuitansi</th>
                <th className="table-th">Tanggal</th>
                <th className="table-th">Pihak</th>
                <th className="table-th">Keterangan</th>
                <th className="table-th text-right">Jumlah</th>
                {isWritable && <th className="table-th w-16">Hapus</th>}
              </tr></thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="table-td font-mono text-xs text-slate-500">{r.receiptNumber}</td>
                    <td className="table-td text-xs">{formatDateIndo(r.date)}</td>
                    <td className="table-td font-semibold">{r.partyName}</td>
                    <td className="table-td text-slate-500 text-xs max-w-[200px] truncate">{r.description}</td>
                    <td className="table-td text-right font-bold text-amber-600">{formatRupiah(r.amount)}</td>
                    {isWritable && (
                      <td className="table-td text-center">
                        <button onClick={() => { if (window.confirm('Hapus kuitansi ini?')) deleteMutation.mutate(r.id); }} className="btn-ghost p-1.5 text-rose-600">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
