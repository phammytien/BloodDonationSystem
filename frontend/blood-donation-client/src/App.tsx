import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OtpPage } from './pages/auth/OtpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCampaignsPage } from './pages/admin/AdminCampaignsPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminDonorsPage } from './pages/admin/AdminDonorsPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminHistoryPage } from './pages/admin/AdminHistoryPage';
import { AdminBloodTypesPage } from './pages/admin/AdminBloodTypesPage';
import { HomePage } from './pages/donor/HomePage';
import { AppointmentPage } from './pages/donor/AppointmentPage';
import { ProfilePage } from './pages/donor/ProfilePage';
import { CampaignsPage } from './pages/donor/CampaignsPage';
import { HistoryPage } from './pages/donor/HistoryPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { DonorLayout } from './components/layout/DonorLayout';
import { DashboardPage as StaffDashboardPage } from './pages/staff/DashboardPage';

const Spinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
    <div className="spinner-border text-danger" role="status">
      <span className="visually-hidden">Đang tải...</span>
    </div>
  </div>
);

const isDonor = (role: string) => role.toLowerCase() === 'donor';

// Any authenticated user
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin / Staff only — Donors → home
const StaffAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (isDonor(user.roleName)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Redirect already-logged-in users away from auth pages
const AnonymousRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <>{children}</>;
  // Donors go to home, Admin/Staff go to dashboard
  return <Navigate to={isDonor(user.roleName) ? '/' : '/dashboard'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth pages — blocked for logged-in users - NO LAYOUT */}
          <Route path="/login" element={<AnonymousRoute><LoginPage /></AnonymousRoute>} />
          <Route path="/register" element={<AnonymousRoute><RegisterPage /></AnonymousRoute>} />
          <Route path="/verify-otp" element={<AnonymousRoute><OtpPage /></AnonymousRoute>} />
          <Route path="/forgot-password" element={<AnonymousRoute><ForgotPasswordPage /></AnonymousRoute>} />

          {/* Donor Routes (Protected or other public pages) inside DonorLayout */}
          <Route element={<DonorLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/appointment" element={<AppointmentPage />} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            {/* Add more donor routes here later like /campaigns, /my-appointments */}
          </Route>

          {/* Admin / Staff Routes inside AdminLayout */}
          <Route element={<StaffAdminRoute><AdminLayout /></StaffAdminRoute>}>
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
            <Route path="/admin/campaigns" element={<AdminCampaignsPage />} />
            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            <Route path="/admin/donors" element={<AdminDonorsPage />} />
            <Route path="/admin/inventory" element={<AdminInventoryPage />} />
            <Route path="/admin/history" element={<AdminHistoryPage />} />
            <Route path="/admin/blood-types" element={<AdminBloodTypesPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
