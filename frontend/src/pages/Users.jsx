import { useState, useEffect } from 'react';
import { usersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Edit2, Trash2, Key, Shield, Check, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const MENUS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'bankStatement', label: 'Rekening Koran (BRI)' },
  { id: 'projects', label: 'RAB & Proyek' },
  { id: 'debts', label: 'Hutang & Piutang' },
  { id: 'payrollAssets', label: 'Gaji & Aset' },
  { id: 'reports', label: 'Laporan Keuangan' },
  { id: 'receipts', label: 'Bukti Transaksi' },
  { id: 'users', label: 'Manajemen User' },
];

const DEFAULT_PERMISSIONS = {
  dashboard: 'read',
  bankStatement: 'none',
  projects: 'none',
  debts: 'none',
  payrollAssets: 'none',
  reports: 'none',
  receipts: 'none',
  users: 'none',
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setRoleName('Staff');
    setPermissions(DEFAULT_PERMISSIONS);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingId(user.id);
    setUsername(user.username);
    setPassword(''); // empty password means unchanged
    setRoleName(user.roleName);
    setPermissions({
      ...DEFAULT_PERMISSIONS,
      ...(user.permissions || {}),
    });
    setShowModal(true);
  };

  const handlePermissionChange = (menuId, val) => {
    setPermissions((prev) => ({
      ...prev,
      [menuId]: val,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !roleName.trim()) {
      toast.error('Username dan nama role wajib diisi');
      return;
    }

    if (!editingId && !password) {
      toast.error('Password wajib diisi untuk user baru');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username: username.trim(),
        roleName: roleName.trim(),
        permissions,
      };

      if (password) {
        payload.password = password;
      }

      if (editingId) {
        await usersApi.update(editingId, payload);
        toast.success('User berhasil diperbarui');
      } else {
        await usersApi.create(payload);
        toast.success('User baru berhasil ditambahkan');
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan data user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (id === currentUser.id) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) {
      return;
    }

    try {
      await usersApi.remove(id);
      toast.success('User berhasil dihapus');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal menghapus user');
    }
  };

  // Preset permissions templates helper
  const applyRolePreset = (presetName) => {
    let presetPermissions = { ...DEFAULT_PERMISSIONS };
    if (presetName === 'Administrator') {
      MENUS.forEach((m) => {
        presetPermissions[m.id] = 'write';
      });
    } else if (presetName === 'Keuangan') {
      MENUS.forEach((m) => {
        if (m.id !== 'users') {
          presetPermissions[m.id] = 'write';
        }
      });
    } else if (presetName === 'Staf Lapangan') {
      presetPermissions.dashboard = 'read';
      presetPermissions.projects = 'read';
      presetPermissions.receipts = 'write'; // Can log receipts
    }
    setPermissions(presetPermissions);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manajemen User</h1>
          <p className="text-slate-500 text-xs">Kelola akses, role, dan hak izin menu aplikasi</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary self-start flex items-center gap-2"
        >
          <UserPlus size={16} />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Users List Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-100 border-t-amber-500"></div>
            <p className="text-slate-400 text-xs">Memuat user...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Shield className="mx-auto text-slate-300" size={40} />
            <p className="text-slate-500 font-semibold text-sm">Belum ada user terdaftar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 hidden md:table-cell">Akses Menu</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-950 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-bold uppercase">
                        {u.username.substring(0, 2)}
                      </div>
                      <div>
                        <p>{u.username}</p>
                        {u.id === currentUser.id && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Anda</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full font-bold text-xs">
                        {u.roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {MENUS.map((m) => {
                          const access = u.permissions?.[m.id];
                          if (!access || access === 'none') return null;
                          return (
                            <span
                              key={m.id}
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${access === 'write'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}
                            >
                              {m.label.split(' ')[0]}: {access === 'write' ? 'W' : 'R'}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={u.id === currentUser.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingId ? 'Edit Data User' : 'Tambah User Baru'}
                </h3>
                <p className="text-slate-400 text-xs">
                  {editingId ? 'Ubah kredensial dan hak akses user' : 'Tambahkan kredensial login dan tentukan role user'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    placeholder="Contoh: staff_keuangan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Password {editingId && <span className="text-slate-400 capitalize font-normal">(kosongkan jika tidak diubah)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required={!editingId}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      placeholder={editingId ? '••••••••' : 'Masukkan password'}
                    />
                  </div>
                </div>
              </div>

              {/* Role template selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nama Role / Jabatan
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    placeholder="Contoh: Keuangan, Manager, Staff"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setRoleName('Administrator'); applyRolePreset('Administrator'); }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                    >
                      Preset Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRoleName('Keuangan'); applyRolePreset('Keuangan'); }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                    >
                      Preset Keuangan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRoleName('Staf Lapangan'); applyRolePreset('Staf Lapangan'); }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                    >
                      Preset Lapangan
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions matrix checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Hak Akses Menu (Granular Permissions)
                  </label>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {MENUS.map((menu) => {
                    const currentVal = permissions[menu.id] || 'none';
                    return (
                      <div key={menu.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 text-sm">{menu.label}</p>
                          <p className="text-[11px] text-slate-400">Tentukan izin baca/tulis untuk menu ini</p>
                        </div>

                        {/* Switch options */}
                        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(menu.id, 'none')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentVal === 'none'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                              }`}
                          >
                            Tutup
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(menu.id, 'read')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentVal === 'read'
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-500 hover:text-indigo-600'
                              }`}
                          >
                            Read-Only
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(menu.id, 'write')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentVal === 'write'
                              ? 'bg-white text-emerald-700 shadow-sm'
                              : 'text-slate-500 hover:text-emerald-600'
                              }`}
                          >
                            Read / Write
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prevent lockout notice for Users page */}
              {permissions.users !== 'write' && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl flex items-start gap-2.5 text-xs border border-amber-200">
                  <AlertTriangle className="flex-shrink-0 mt-0.5 text-amber-600" size={16} />
                  <span>
                    <strong>Penting:</strong> User ini tidak memiliki hak tulis di menu <strong>Manajemen User</strong>. Mereka tidak akan dapat mengedit role user lain atau dirinya sendiri di masa mendatang.
                  </span>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary text-xs px-4 py-2.5"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check size={14} />
                )}
                <span>Simpan User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
