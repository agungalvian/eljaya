import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileSpreadsheet, HardHat,
  Handshake, Wallet, Calculator, Receipt, Menu, X, Shield, Users
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, permissionKey: 'dashboard' },
  { to: '/rekening-koran', label: 'Rekening Koran', icon: FileSpreadsheet, permissionKey: 'bankStatement' },
  { to: '/rab-proyek', label: 'RAB & Proyek', icon: HardHat, permissionKey: 'projects' },
  { to: '/hutang-piutang', label: 'Hutang & Piutang', icon: Handshake, permissionKey: 'debts' },
  { to: '/gaji', label: 'Gaji Karyawan', icon: Users, permissionKey: 'payroll' },
  { to: '/aset', label: 'Aset & Depresiasi', icon: Wallet, permissionKey: 'assets' },
  { to: '/laporan-keuangan', label: 'Laporan Keuangan', icon: Calculator, permissionKey: 'reports' },
  { to: '/bukti-transaksi', label: 'Bukti Transaksi', icon: Receipt, permissionKey: 'receipts' },
  { to: '/manajemen-user', label: 'Manajemen User', icon: Shield, permissionKey: 'users' },
];

function NavItem({ to, label, icon: Icon, exact, onClick }) {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive
        ? 'bg-amber-500 text-slate-950 shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

// Desktop sidebar
export function Sidebar() {
  const { hasPermission } = useAuth();
  const allowedItems = navItems.filter((item) => hasPermission(item.permissionKey, 'read'));

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 min-h-screen border-r border-slate-800 no-print fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 p-1.5 shadow-sm">
            <img src="/logo.png" alt="CV. EL JAYA PONDASI" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm leading-tight">CV. EL JAYA</h1>
            <p className="text-slate-400 text-xs font-bold tracking-wider">PONDASI</p>
          </div>
        </div>
        <p className="text-slate-500 text-[11px] mt-3 leading-relaxed">
          Jasa Konstruksi & Rental Alat Berat · Badung, Bali
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-slate-500 text-xs font-medium">0816 4702 632</p>
        <p className="text-slate-600 text-[10px]">eljayapondasi@gmail.com</p>
      </div>
    </aside>
  );
}

// Mobile bottom navigation bar
export function MobileBottomNav() {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const allowedItems = navItems.filter((item) => hasPermission(item.permissionKey, 'read'));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 no-print">
      <div className="flex items-stretch h-16 overflow-x-auto scrollbar-none">
        {allowedItems.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex-1 min-w-[72px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${isActive ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Icon size={20} />
              <span className="line-clamp-1 px-0.5">{label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

