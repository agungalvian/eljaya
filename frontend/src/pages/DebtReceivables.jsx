import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { debtsApi } from '../api/client';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRupiah, parseCurrencyInput } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Handshake, TrendingDown, TrendingUp, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function DebtForm({ onSubmit, loading, defaultValues }) {
  const formattedDefault = defaultValues ? {
    ...defaultValues,
    initialAmount: defaultValues.initialAmount ? Number(defaultValues.initialAmount).toLocaleString('id-ID') : '',
    manualPaid: defaultValues.manualPaid ? Number(defaultValues.manualPaid).toLocaleString('id-ID') : '',
  } : { type: 'HUTANG' };

  const { register, handleSubmit, watch } = useForm({
    defaultValues: formattedDefault,
  });
  const type = watch('type');
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Jenis Komitmen</label>
        <div className="grid grid-cols-2 gap-2">
          <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer text-sm font-semibold transition-all ${type === 'HUTANG' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-600'}`}>
            <input type="radio" {...register('type')} value="HUTANG" className="sr-only" />
            <TrendingDown size={16} /> Hutang Perusahaan
          </label>
          <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer text-sm font-semibold transition-all ${type === 'PIUTANG' ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-600'}`}>
            <input type="radio" {...register('type')} value="PIUTANG" className="sr-only" />
            <TrendingUp size={16} /> Piutang Mitra
          </label>
        </div>
      </div>
      <div>
        <label className="label">Nama Rekan Bisnis / Mitra</label>
        <input {...register('vendor', { required: true })} placeholder="Contoh: PT Adhi Jaya Beton / Pak Putu" className="input" />
      </div>
      <div>
        <label className="label">Keterangan Transaksi</label>
        <input {...register('description')} placeholder="Contoh: Pembelian Solar / Sewa Crane" className="input" />
      </div>
      <div>
        <label className="label">Jumlah Komitmen (IDR)</label>
        <input
          type="text"
          {...register('initialAmount', {
            required: true,
            setValueAs: parseCurrencyInput
          })}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
          }}
          placeholder="Rp"
          className="input"
        />
      </div>
      {defaultValues && (
        <div>
          <label className="label">Pembayaran Manual Tambahan (IDR)</label>
          <input
            type="text"
            {...register('manualPaid', {
              setValueAs: parseCurrencyInput
            })}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
            }}
            placeholder="Rp"
            className="input"
          />
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        <Plus size={16} /> {defaultValues ? 'Simpan Perubahan' : 'Tambah Komitmen'}
      </button>
    </form>
  );
}

function DebtTable({ items, type, onEdit, onDelete, isWritable }) {
  const isEmpty = items.length === 0;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr>
            <th className="table-th">Rekan Bisnis</th>
            <th className="table-th">Keterangan</th>
            <th className="table-th text-right">Saldo Awal</th>
            <th className="table-th text-right">Mutasi Rek. Koran</th>
            <th className="table-th text-right">Bayar Manual</th>
            <th className="table-th text-right">Sisa</th>
            {isWritable && <th className="table-th w-20">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr><td colSpan={isWritable ? 7 : 6} className="table-td text-center text-slate-400 py-8">Belum ada catatan.</td></tr>
          ) : items.map(d => {
            const txPaid = (d.transactions || []).reduce((s, tx) => {
              if (type === 'HUTANG' && tx.debit > 0) return s + tx.debit;
              if (type === 'PIUTANG' && tx.kredit > 0) return s + tx.kredit;
              return s;
            }, 0);
            const manualPaid = d.manualPaid || 0;
            const totalPaid = txPaid + manualPaid;
            const sisa = Math.max(0, d.initialAmount - totalPaid);
            const lunas = sisa <= 0;

            return (
              <tr key={d.id} className={`hover:bg-slate-50 ${lunas ? 'opacity-60' : ''}`}>
                <td className="table-td font-semibold text-slate-800">
                  {d.vendor}
                  {lunas && <span className="badge-green ml-2">Lunas</span>}
                </td>
                <td className="table-td text-slate-500 text-xs">{d.description}</td>
                <td className="table-td text-right">{formatRupiah(d.initialAmount)}</td>
                <td className={`table-td text-right font-medium ${type === 'HUTANG' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {txPaid > 0 ? (type === 'HUTANG' ? '-' : '+') : ''}{formatRupiah(txPaid)}
                </td>
                <td className={`table-td text-right font-medium ${type === 'HUTANG' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {manualPaid > 0 ? (type === 'HUTANG' ? '-' : '+') : ''}{formatRupiah(manualPaid)}
                </td>
                <td className="table-td text-right font-bold text-slate-900">{formatRupiah(sisa)}</td>
                {isWritable && (
                  <td className="table-td">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => onEdit(d)} className="btn-ghost p-1.5 text-indigo-600"><Pencil size={13} /></button>
                      <button onClick={() => onDelete(d)} className="btn-ghost p-1.5 text-rose-600"><Trash2 size={13} /></button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function DebtReceivables() {
  const { hasPermission } = useAuth();
  const isWritable = hasPermission('debts', 'write');
  const [editDebt, setEditDebt] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: debtsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: debtsApi.create,
    onSuccess: () => { toast.success('Komitmen baru dicatat'); qc.invalidateQueries({ queryKey: ['debts'] }); setShowAdd(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => debtsApi.update(id, data),
    onSuccess: () => { toast.success('Diperbarui'); qc.invalidateQueries({ queryKey: ['debts'] }); setEditDebt(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => debtsApi.remove(id),
    onSuccess: () => { toast.success('Dihapus'); qc.invalidateQueries({ queryKey: ['debts'] }); },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = (d) => {
    if (window.confirm(`Hapus komitmen "${d.vendor}"?`)) deleteMutation.mutate(d.id);
  };

  const hutang = debts.filter(d => d.type === 'HUTANG');
  const piutang = debts.filter(d => d.type === 'PIUTANG');
  const totalHutang = hutang.reduce((s, d) => {
    const txPaid = (d.transactions || []).reduce((sum, tx) => tx.debit > 0 ? sum + tx.debit : sum, 0);
    const totalPaid = txPaid + (d.manualPaid || 0);
    return s + Math.max(0, d.initialAmount - totalPaid);
  }, 0);
  const totalPiutang = piutang.reduce((s, d) => {
    const txPaid = (d.transactions || []).reduce((sum, tx) => tx.kredit > 0 ? sum + tx.kredit : sum, 0);
    const totalPaid = txPaid + (d.manualPaid || 0);
    return s + Math.max(0, d.initialAmount - totalPaid);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <Handshake size={22} className="text-amber-500" /> Hutang & Piutang Berjalan
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Pantau kewajiban dan hak penagihan perusahaan</p>
        </div>
        {isWritable && (
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} /> Catat Baru
          </button>
        )}
      </div>

      {!isWritable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <ShieldAlert className="text-amber-600 flex-shrink-0" size={18} />
          <span>Mode Baca-Saja: Anda tidak memiliki izin untuk mencatat, mengubah, atau menghapus komitmen hutang/piutang.</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 border-l-4 border-l-rose-400">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Hutang Tersisa</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatRupiah(totalHutang)}</p>
          <p className="text-xs text-slate-400">{hutang.length} komitmen aktif</p>
        </div>
        <div className="card p-4 border-l-4 border-l-indigo-400">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Piutang Tersisa</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatRupiah(totalPiutang)}</p>
          <p className="text-xs text-slate-400">{piutang.length} tagihan aktif</p>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-bold text-sm uppercase text-amber-600 flex items-center gap-2 mb-4">
              <TrendingDown size={16} /> Hutang Perusahaan (Kewajiban)
            </h3>
            <DebtTable items={hutang} type="HUTANG" onEdit={setEditDebt} onDelete={handleDelete} isWritable={isWritable} />
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-sm uppercase text-indigo-600 flex items-center gap-2 mb-4">
              <TrendingUp size={16} /> Piutang Perusahaan (Hak Tagih)
            </h3>
            <DebtTable items={piutang} type="PIUTANG" onEdit={setEditDebt} onDelete={handleDelete} isWritable={isWritable} />
          </div>
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Catat Komitmen Baru">
        <DebtForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!editDebt} onClose={() => setEditDebt(null)} title="Edit Komitmen Hutang/Piutang">
        {editDebt && (
          <DebtForm
            defaultValues={editDebt}
            onSubmit={(data) => updateMutation.mutate({ id: editDebt.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
