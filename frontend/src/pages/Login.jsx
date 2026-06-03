import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login gagal. Hubungi administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Left side: Premium branding */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        {/* Top: Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden p-1.5 shadow-lg shadow-black/20">
            <img src="/logo.png" alt="CV. EL JAYA PONDASI" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-lg leading-tight tracking-wider">CV. EL JAYA</h1>
            <p className="text-amber-500 text-xs font-bold tracking-widest">PONDASI</p>
          </div>
        </div>

        {/* Middle: Content/Statement */}
        <div className="z-10 my-auto py-12 max-w-md">
          <h2 className="text-white text-3xl font-extrabold leading-tight mb-4">
            Sistem Laporan Keuangan <br />
            <span className="text-amber-400">&amp; Manajemen Proyek</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Akses aman dan real-time untuk memantau arus kas, alokasi anggaran proyek (RAB), gaji karyawan, penyusutan aset, dan kwitansi CV. EL JAYA PONDASI.
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700">Badung, Bali</span>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            <span>Jasa Konstruksi &amp; Alat Berat</span>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="z-10 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CV. EL JAYA PONDASI. All rights reserved.</p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-12 md:w-1/2">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile view branding */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden p-1.5 shadow-md">
              <img src="/logo.png" alt="CV. EL JAYA PONDASI" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-sm leading-tight">CV. EL JAYA</h1>
              <p className="text-slate-400 text-xs font-bold tracking-wider">PONDASI</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-white sm:text-3xl">Selamat Datang</h3>
            <p className="mt-2 text-sm text-slate-400">
              Silakan masukkan kredensial Anda untuk masuk ke sistem.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-shake">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-800 bg-slate-900 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-800 bg-slate-900 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Masuk ke Sistem'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
