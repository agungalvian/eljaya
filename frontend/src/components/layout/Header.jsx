import { Printer, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/rekening-koran': 'Rekening Koran BRI',
  '/rab-proyek': 'RAB & Manajemen Proyek',
  '/hutang-piutang': 'Hutang & Piutang',
  '/gaji': 'Gaji Karyawan',
  '/aset': 'Aset & Depresiasi',
  '/laporan-keuangan': 'Laporan Keuangan',
  '/bukti-transaksi': 'Bukti Transaksi & Kuitansi',
  '/manajemen-user': 'Manajemen User & Hak Akses',
  '/profil': 'Profil Saya',
};

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const title = PAGE_TITLES[location.pathname] || 'CV. EL JAYA PONDASI';

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 no-print shadow-sm">
      {/* Mobile logo + title */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2.5">
          <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm border border-slate-200">
            <img src="/logo.png" alt="CV. EL JAYA PONDASI" className="w-full h-full object-contain" />
          </div>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{title}</h2>
          <p className="text-slate-400 text-xs hidden sm:block">CV. EL JAYA PONDASI · Badung, Bali</p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* User Profile Summary */}
        {user && (
          <Link to="/profil" className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 group-hover:border-amber-400 transition-colors">
              <User size={15} />
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{user.name || user.username}</p>
              <p className="text-[10px] font-semibold text-amber-600 mt-0.5">{user.roleName}</p>
            </div>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs px-3 py-2"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {user && (
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

