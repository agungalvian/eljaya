import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import BankStatement from './pages/BankStatement';
import Projects from './pages/Projects';
import DebtReceivables from './pages/DebtReceivables';
import Payroll from './pages/Payroll';
import Assets from './pages/Assets';
import FinancialReports from './pages/FinancialReports';
import Receipts from './pages/Receipts';
import Users from './pages/Users';
import Login from './pages/Login';
import Profile from './pages/Profile';

function ProtectedRoute({ children, requiredPermission }) {
  const { token, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-amber-500"></div>
        <p className="text-slate-500 text-xs font-semibold">Memuat sistem...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission, 'read')) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route
              path="rekening-koran"
              element={
                <ProtectedRoute requiredPermission="bankStatement">
                  <BankStatement />
                </ProtectedRoute>
              }
            />
            <Route
              path="rab-proyek"
              element={
                <ProtectedRoute requiredPermission="projects">
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="hutang-piutang"
              element={
                <ProtectedRoute requiredPermission="debts">
                  <DebtReceivables />
                </ProtectedRoute>
              }
            />
            <Route
              path="gaji"
              element={
                <ProtectedRoute requiredPermission="payroll">
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="aset"
              element={
                <ProtectedRoute requiredPermission="assets">
                  <Assets />
                </ProtectedRoute>
              }
            />
            <Route
              path="laporan-keuangan"
              element={
                <ProtectedRoute requiredPermission="reports">
                  <FinancialReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="bukti-transaksi"
              element={
                <ProtectedRoute requiredPermission="receipts">
                  <Receipts />
                </ProtectedRoute>
              }
            />
            <Route
              path="manajemen-user"
              element={
                <ProtectedRoute requiredPermission="users">
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="profil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

