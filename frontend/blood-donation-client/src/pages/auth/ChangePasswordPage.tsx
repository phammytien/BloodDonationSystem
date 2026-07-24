import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { getAvatarChar, getDisplayName } from '../../utils/avatarHelper';
import { NotificationBell } from '../../components/NotificationBell';

export const ChangePasswordPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thực hiện đổi mật khẩu.');
      navigate('/login?redirect=/change-password');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    navigate('/');
    logout();
    toast.success('Đăng xuất thành công!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warning('Vui lòng nhập đầy đủ tất cả các trường.');
      return;
    }

    if (newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Nhập lại mật khẩu mới không khớp.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        'http://localhost:5028/api/auth/change-password',
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      toast.success('Đổi mật khẩu thành công!');
      // Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Navigate to profile or home after a small delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFF' }}>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="navbar navbar-expand-lg sticky-top bg-white" style={{ borderBottom: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="container">
          <Link to="/" className="d-flex align-items-center text-decoration-none gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#1B4FD8,#2563EB)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fff" />
                <path d="M12 7v10M9 12h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#1B4FD8' }}>LifeGive</span>
          </Link>

          <div className="d-flex align-items-center gap-3 ms-auto">
            <Link to="/" className="text-muted text-decoration-none small fw-semibold" style={{ fontFamily: 'Nunito' }}>← Trang chủ</Link>
            <Link to="/profile" className="text-muted text-decoration-none small fw-semibold" style={{ fontFamily: 'Nunito' }}>Thông tin tài khoản</Link>
            {user.roleName.toLowerCase() === 'donor' && (
              <Link to="/appointment" className="text-muted text-decoration-none small fw-semibold" style={{ fontFamily: 'Nunito' }}>Lịch hẹn của tôi</Link>
            )}
            <Link to="/change-password" className="text-decoration-none small fw-semibold" style={{ fontFamily: 'Nunito', color: '#1B4FD8' }}>Đổi mật khẩu</Link>
            {user && <NotificationBell />}
            <div className="position-relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="d-flex align-items-center justify-content-center rounded-circle border-0"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: showUserMenu ? '0 4px 12px rgba(27, 79, 216, 0.4)' : '0 2px 8px rgba(27, 79, 216, 0.15)'
                }}
                tabIndex={0}
              >
                {getAvatarChar(user.fullName, user.username)}
              </button>
              {showUserMenu && (
                <div
                  className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg"
                  style={{
                    minWidth: '210px',
                    zIndex: 1000,
                    border: '1px solid #E5E7EB',
                    animation: 'fadeInDown 0.15s ease'
                  }}
                >
                  <div className="p-3 border-bottom" style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{
                          width: '30px',
                          height: '30px',
                          background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        {getAvatarChar(user.fullName, user.username)}
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: '#111827', fontSize: '0.82rem' }}>{getDisplayName(user.fullName, user.username)}</div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-100 d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent rounded-2 text-start"
                      style={{
                        fontSize: '0.82rem',
                        color: '#D42B2B',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF0F0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
        <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border" style={{ maxWidth: '850px', width: '100%', borderColor: '#E5E7EB' }}>
          <div className="row g-4">
            {/* Left Column: Security guidelines & lock icon */}
            <div className="col-12 col-md-5 d-flex flex-column align-items-center justify-content-center text-center border-end pe-md-4 mb-3 mb-md-0" style={{ borderColor: '#E5E7EB' }}>
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle mb-3" 
                style={{ width: '70px', height: '70px', backgroundColor: '#EFF6FF', color: '#1B4FD8' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h5 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#1F2937', marginBottom: '0.5rem' }}>Bảo mật tài khoản</h5>
              <p className="text-muted small mb-0" style={{ lineHeight: 1.6, maxWidth: '240px' }}>
                Để bảo vệ thông tin hiến máu cá nhân, hãy thiết lập mật khẩu mạnh có tối thiểu <strong>6 ký tự</strong> và không chia sẻ mật khẩu cho người khác.
              </p>
            </div>

            {/* Right Column: Password form */}
            <div className="col-12 col-md-7 ps-md-4">
              <form onSubmit={handleSubmit}>
                {/* Mật khẩu cũ */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Mật khẩu hiện tại</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{ borderRadius: '8px', fontSize: '0.9rem', padding: '0.65rem 0.85rem' }}
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Mật khẩu mới</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{ borderRadius: '8px', fontSize: '0.9rem', padding: '0.65rem 0.85rem' }}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Nhập lại mật khẩu mới */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Nhập lại mật khẩu mới</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{ borderRadius: '8px', fontSize: '0.9rem', padding: '0.65rem 0.85rem' }}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu mới"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-end">
                  <button
                    type="submit"
                    className="btn btn-primary-custom px-4 py-2.5 d-inline-flex align-items-center justify-content-center"
                    style={{ borderRadius: '8px', fontSize: '0.9rem', border: 'none', minWidth: '160px' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu mật khẩu mới'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
