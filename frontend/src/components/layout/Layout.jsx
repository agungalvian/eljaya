import { Outlet } from 'react-router-dom';
import { Sidebar, MobileBottomNav } from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 sm:px-6 py-6 pb-24 lg:pb-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
