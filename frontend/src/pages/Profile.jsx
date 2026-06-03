import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Key, Mail, Shield, UserCheck, Lock } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Form 1: Profile info
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      username: user?.username || '',
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Form 2: Password change
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm();

  const onUpdateProfile = async (data) => {
    setUpdatingProfile(true);
    try {
      const response = await authApi.updateProfile({
        username: data.username,
        name: data.name,
        email: data.email,
      });
      setUser(response.user);
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui profil');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data) => {
    setUpdatingPassword(true);
    try {
      await authApi.updateProfile({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password berhasil diperbarui!');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const newPasswordVal = watchPassword('newPassword');

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      <div>
        <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
          <User size={22} className="text-amber-500" /> Profil Saya
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Kelola informasi pribadi dan pengaturan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Summary Card */}
        <div className="card p-6 flex flex-col items-center text-center space-y-4 h-fit">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border-2 border-amber-400 shadow-sm">
            <User size={40} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{user?.name || user?.username}</h3>
            <p className="text-slate-400 text-sm mt-0.5">@{user?.username}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
            <Shield size={12} />
            {user?.roleName}
          </div>
          <div className="w-full border-t border-slate-100 pt-4 text-left text-xs space-y-2 text-slate-500">
            <div className="flex justify-between">
              <span>Username:</span>
              <span className="font-semibold text-slate-700">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="font-semibold text-slate-700 truncate max-w-[140px]">{user?.email || '-'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="md:col-span-2 space-y-6">
          {/* Section A: Basic Info */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck size={18} className="text-indigo-600" /> Informasi Profil
            </h3>
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Username</label>
                  <input
                    {...registerProfile('username', { required: 'Username wajib diisi' })}
                    type="text"
                    className="input"
                    placeholder="username"
                  />
                  {profileErrors.username && (
                    <p className="text-xs text-rose-500 mt-1">{profileErrors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Nama Lengkap</label>
                  <input
                    {...registerProfile('name')}
                    type="text"
                    className="input"
                    placeholder="Nama Lengkap"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email (Opsional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    {...registerProfile('email')}
                    type="email"
                    className="input pl-9"
                    placeholder="email@domain.com"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn-primary px-5 py-2.5"
                >
                  {updatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

          {/* Section B: Security / Change Password */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock size={18} className="text-rose-600" /> Ubah Kata Sandi (Password)
            </h3>
            <form onSubmit={handleSubmitPassword(onUpdatePassword)} className="space-y-4">
              <div>
                <label className="label">Password Saat Ini</label>
                <input
                  {...registerPassword('currentPassword', { required: 'Password saat ini wajib diisi' })}
                  type="password"
                  className="input"
                  placeholder="••••••••"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-rose-500 mt-1">{passwordErrors.currentPassword.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password Baru</label>
                  <input
                    {...registerPassword('newPassword', {
                      required: 'Password baru wajib diisi',
                      minLength: { value: 6, message: 'Minimal 6 karakter' },
                    })}
                    type="password"
                    className="input"
                    placeholder="••••••••"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-rose-500 mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Konfirmasi Password Baru</label>
                  <input
                    {...registerPassword('confirmPassword', {
                      required: 'Konfirmasi password wajib diisi',
                      validate: (val) => val === newPasswordVal || 'Konfirmasi password tidak cocok',
                    })}
                    type="password"
                    className="input"
                    placeholder="••••••••"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-rose-500 mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="btn-danger px-5 py-2.5 flex items-center gap-2"
                >
                  <Key size={16} />
                  {updatingPassword ? 'Mengubah...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
