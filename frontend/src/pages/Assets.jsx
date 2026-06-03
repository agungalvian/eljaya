import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { assetsApi } from '../api/client';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRupiah, parseCurrencyInput } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Truck, ShieldAlert, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AssetForm({ onSubmit, loading, defaultValues }) {
  const formattedDefault = defaultValues ? {
    ...defaultValues,
    acquisitionCost: defaultValues.acquisitionCost ? Number(defaultValues.acquisitionCost).toLocaleString('id-ID') : '',
  } : {};

  const { register, handleSubmit, watch } = useForm({
    defaultValues: formattedDefault
  });
  const rawCost = watch('acquisitionCost');
  const cost = typeof rawCost === 'string' ? parseCurrencyInput(rawCost) : (parseFloat(rawCost) || 0);
  const life = parseInt(watch('usefulLifeYears')) || 5;
  const monthly = cost > 0 && life > 0 ? Math.round(cost / (life * 12)) : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nama Alat Berat / Aset</label>
        <input {...register('name', { required: true })} placeholder="Excavator Kobelco SK75" className="input" />
      </div>
      <div>
        <label className="label">Harga Perolehan Awal (IDR)</label>
        <input
          type="text"
          {...register('acquisitionCost', {
            required: true,
            setValueAs: parseCurrencyInput
          })}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
          }}
          placeholder="450.000.000"
          className="input"
        />
      </div>
      <div>
        <label className="label">Masa Manfaat Ekonomis (Tahun)</label>
        <input type="number" {...register('usefulLifeYears', { min: 1, max: 50 })} placeholder="8" className="input" />
      </div>
      {monthly > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
          <p className="text-amber-800 font-semibold">📊 Penyusutan Garis Lurus:</p>
          <p className="text-amber-700 font-bold mt-0.5">{formatRupiah(monthly)} / bulan</p>
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        <Plus size={16} /> {defaultValues ? 'Simpan Perubahan' : 'Tambah Aset'}
      </button>
    </form>
  );
}

export default function Assets() {
  const { hasPermission } = useAuth();
  const isWritable = hasPermission('assets', 'write');
  const [editAsset, setEditAsset] = useState(null);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const qc = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.list
  });

  const totalAsetCost = assets.reduce((s, a) => s + a.acquisitionCost, 0);
  const totalDepresiasi = assets.reduce((s, a) => s + a.monthlyDepreciation, 0);

  const assetCreate = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: () => {
      toast.success('Aset berhasil ditambahkan');
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
      setShowAddAsset(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const assetUpdate = useMutation({
    mutationFn: ({ id, data }) => assetsApi.update(id, data),
    onSuccess: () => {
      toast.success('Data aset diperbarui');
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
      setEditAsset(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const assetDelete = useMutation({
    mutationFn: assetsApi.remove,
    onSuccess: () => {
      toast.success('Aset berhasil dihapus');
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <Truck size={22} className="text-amber-500" /> Aset & Depresiasi
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Kelola daftar inventaris alat berat dan beban penyusutan bulanan</p>
        </div>
        {isWritable && (
          <button onClick={() => setShowAddAsset(true)} className="btn-primary">
            <Plus size={16} /> Aset Baru
          </button>
        )}
      </div>

      {!isWritable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <ShieldAlert className="text-amber-600 flex-shrink-0" size={18} />
          <span>Mode Baca-Saja: Anda tidak memiliki izin untuk memodifikasi data aset atau alat berat.</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 border-l-4 border-l-indigo-400">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Nilai Aset</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatRupiah(totalAsetCost)}</p>
          <p className="text-xs text-slate-400 mt-1">{assets.length} aset terdaftar secara keseluruhan</p>
        </div>
        <div className="card p-4 border-l-4 border-l-rose-400">
          <p className="text-xs font-semibold uppercase text-slate-500">Depresiasi / Bulan</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatRupiah(totalDepresiasi)}</p>
          <p className="text-xs text-slate-400 mt-1">Akumulasi penyusutan nilai aset per bulan</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
          <Truck size={16} className="text-slate-500" /> Daftar Inventaris Aset
        </h3>

        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr>
                  <th className="table-th">Nama Alat Berat / Aset</th>
                  <th className="table-th text-right">Harga Perolehan Awal</th>
                  <th className="table-th text-center">Umur Manfaat</th>
                  <th className="table-th text-right">Depresiasi / Bulan</th>
                  {isWritable && <th className="table-th w-24 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={isWritable ? 5 : 4} className="table-td text-center text-slate-400 py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle size={24} className="text-slate-300" />
                        <p>Belum ada inventaris aset terdaftar.</p>
                      </div>
                    </td>
                  </tr>
                ) : assets.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td font-semibold text-slate-800">{a.name}</td>
                    <td className="table-td text-right font-medium text-slate-700">{formatRupiah(a.acquisitionCost)}</td>
                    <td className="table-td text-center text-slate-500 font-semibold">{a.usefulLifeYears} Tahun</td>
                    <td className="table-td text-right font-bold text-rose-600">{formatRupiah(a.monthlyDepreciation)}</td>
                    {isWritable && (
                      <td className="table-td">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setEditAsset(a)} className="btn-ghost p-1.5 text-indigo-600">
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus data aset "${a.name}"?`)) {
                                assetDelete.mutate(a.id);
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

      <Modal isOpen={showAddAsset} onClose={() => setShowAddAsset(false)} title="Tambah Aset / Alat Berat Baru">
        <AssetForm onSubmit={d => assetCreate.mutate(d)} loading={assetCreate.isPending} />
      </Modal>

      <Modal isOpen={!!editAsset} onClose={() => setEditAsset(null)} title="Edit Data Inventaris Aset">
        {editAsset && (
          <AssetForm
            defaultValues={editAsset}
            onSubmit={d => assetUpdate.mutate({ id: editAsset.id, data: d })}
            loading={assetUpdate.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
