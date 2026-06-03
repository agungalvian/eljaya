import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { projectsApi } from '../api/client';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRupiah, parseCurrencyInput } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, HardHat, TrendingUp, CheckCircle, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function ProjectForm({ onSubmit, loading, defaultValues }) {
  const formattedDefault = defaultValues ? {
    ...defaultValues,
    contractValue: defaultValues.contractValue ? Number(defaultValues.contractValue).toLocaleString('id-ID') : '',
    budgetAlat: defaultValues.budgetAlat ? Number(defaultValues.budgetAlat).toLocaleString('id-ID') : '',
    budgetGaji: defaultValues.budgetGaji ? Number(defaultValues.budgetGaji).toLocaleString('id-ID') : '',
    budgetTransport: defaultValues.budgetTransport ? Number(defaultValues.budgetTransport).toLocaleString('id-ID') : '',
    budgetMaterial: defaultValues.budgetMaterial ? Number(defaultValues.budgetMaterial).toLocaleString('id-ID') : '',
  } : { status: 'berjalan' };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: formattedDefault
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nama Proyek / Kode RAB</label>
        <input {...register('name', { required: 'Wajib diisi' })} placeholder="Contoh: Fondasi Borepile Jembatan Mengwi" className="input" />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nilai Kontrak (IDR)</label>
          <input
            type="text"
            {...register('contractValue', {
              required: 'Wajib diisi',
              setValueAs: parseCurrencyInput
            })}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
            }}
            placeholder="150.000.000"
            className="input"
          />
        </div>
        <div>
          <label className="label">Status Proyek</label>
          <select {...register('status')} className="input">
            <option value="berjalan">Berjalan</option>
            <option value="ditunda">Ditunda</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Budget Alat</label>
          <input
            type="text"
            {...register('budgetAlat', {
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
        <div>
          <label className="label">Budget Gaji</label>
          <input
            type="text"
            {...register('budgetGaji', {
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
        <div>
          <label className="label">Budget Transport</label>
          <input
            type="text"
            {...register('budgetTransport', {
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
        <div>
          <label className="label">Budget Material</label>
          <input
            type="text"
            {...register('budgetMaterial', {
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
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        <Plus size={16} /> {defaultValues ? 'Simpan Perubahan' : 'Tambah Proyek & RAB'}
      </button>
    </form>
  );
}

function ProjectCard({ project, onEdit, onDelete, isWritable }) {
  const tx = project.transactions || [];
  const rev = tx.filter(t => t.category === 'project_revenue').reduce((s, t) => s + t.kredit, 0);
  const totalBudget = project.budgetAlat + project.budgetGaji + project.budgetTransport + project.budgetMaterial;
  const targetProfit = project.contractValue - totalBudget;
  const targetProfitPct = project.contractValue > 0 ? Math.round((targetProfit / project.contractValue) * 100) : 0;
  const remaining = project.contractValue - rev;
  const collectionPct = project.contractValue > 0 ? Math.min(100, Math.round((rev / project.contractValue) * 100)) : 0;

  const status = rev === 0 ? 'pending'
    : collectionPct >= 80 ? 'healthy'
    : collectionPct >= 40 ? 'warning'
    : 'low';

  const StatusBadge = () => {
    const configs = {
      pending: { icon: XCircle, cls: 'badge-slate', label: 'Belum Ada Pemasukan' },
      healthy: { icon: CheckCircle, cls: 'badge-green', label: 'Koleksi Sehat' },
      warning: { icon: AlertTriangle, cls: 'badge-amber', label: 'Koleksi Sedang' },
      low: { icon: TrendingUp, cls: 'badge-red', label: 'Koleksi Rendah' },
    };
    const { icon: Icon, cls, label } = configs[status];
    return <span className={cls}><Icon size={11} />{label}</span>;
  };

  const ProjectStatusBadge = ({ statusVal }) => {
    const configs = {
      berjalan: { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Berjalan' },
      ditunda: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Ditunda' },
      selesai: { cls: 'bg-slate-100 text-slate-700 border border-slate-200', label: 'Selesai' },
    };
    const config = configs[statusVal] || configs.berjalan;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.cls}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 leading-tight">{project.name}</h4>
            <ProjectStatusBadge statusVal={project.status} />
          </div>
          <p className="text-xs text-slate-400">Kontrak: {formatRupiah(project.contractValue)}</p>
        </div>
        {isWritable && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(project)} className="btn-ghost p-2 text-indigo-600"><Pencil size={15} /></button>
            <button onClick={() => onDelete(project)} className="btn-ghost p-2 text-rose-600"><Trash2 size={15} /></button>
          </div>
        )}
      </div>

      {/* Collection progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-600 font-medium mb-1.5">
          <span>Realisasi Pemasukan</span>
          <span>{formatRupiah(rev)} ({collectionPct}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : status === 'low' ? 'bg-rose-500' : 'bg-slate-300'}`}
            style={{ width: `${collectionPct}%` }}
          />
        </div>
      </div>

      {/* RAB vs Target */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 text-xs">
        <div>
          <p className="text-slate-500 uppercase font-semibold tracking-wide">Target Profit RAB</p>
          <p className="font-bold text-indigo-600 mt-0.5">{formatRupiah(targetProfit)}</p>
          <p className="text-slate-400">({targetProfitPct}% margin)</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase font-semibold tracking-wide">Sisa Penagihan</p>
          <p className="font-bold text-amber-600 mt-0.5">{formatRupiah(remaining)}</p>
          <StatusBadge />
        </div>
      </div>

      {/* Budget breakdown */}
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        {[
          { label: 'Alat', val: project.budgetAlat },
          { label: 'Gaji', val: project.budgetGaji },
          { label: 'Transport', val: project.budgetTransport },
          { label: 'Material', val: project.budgetMaterial },
        ].map(({ label, val }) => (
          <div key={label} className="text-center bg-white border border-slate-100 rounded-lg p-2">
            <p className="text-slate-400 font-semibold uppercase">{label}</p>
            <p className="font-bold text-slate-700 mt-0.5">{formatRupiah(val, false)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Projects() {
  const { hasPermission } = useAuth();
  const isWritable = hasPermission('projects', 'write');
  const [editProject, setEditProject] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => { toast.success('Proyek baru berhasil ditambahkan'); qc.invalidateQueries({ queryKey: ['projects'] }); setShowAdd(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => projectsApi.update(id, data),
    onSuccess: () => { toast.success('Proyek berhasil diperbarui'); qc.invalidateQueries({ queryKey: ['projects'] }); setEditProject(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsApi.remove(id),
    onSuccess: () => { toast.success('Proyek berhasil dihapus'); qc.invalidateQueries({ queryKey: ['projects'] }); },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = (p) => {
    if (window.confirm(`Hapus proyek "${p.name}"? Semua alokasi transaksi terkait akan direset.`)) {
      deleteMutation.mutate(p.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <HardHat size={22} className="text-amber-500" /> RAB & Manajemen Proyek
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Pantau target keuntungan vs realisasi per proyek</p>
        </div>
        {isWritable && (
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} /> Proyek Baru
          </button>
        )}
      </div>

      {!isWritable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <ShieldAlert className="text-amber-600 flex-shrink-0" size={18} />
          <span>Mode Baca-Saja: Anda tidak memiliki izin untuk menambah, mengubah, atau menghapus data proyek.</span>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="lg:col-span-2 card p-12 text-center">
              <HardHat size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada proyek.</p>
            </div>
          ) : projects.map(p => (
            <ProjectCard key={p.id} project={p} onEdit={setEditProject} onDelete={handleDelete} isWritable={isWritable} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Buat Proyek Baru / RAB">
        <ProjectForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit RAB Proyek">
        {editProject && (
          <ProjectForm
            defaultValues={editProject}
            onSubmit={(data) => updateMutation.mutate({ id: editProject.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
