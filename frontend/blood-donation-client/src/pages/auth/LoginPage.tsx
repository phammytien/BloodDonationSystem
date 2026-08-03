import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

// --- Validation helpers ---
const validateEmail = (val: string) => {
  if (!val) return 'Email không được để trống.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Email không đúng định dạng (VD: abc@gmail.com).';
  return '';
};
const validatePassword = (val: string) => {
  if (!val) return 'Mật khẩu không được để trống.';
  if (val.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  return '';
};

// --- Eye icon SVGs ---
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;

  const emailError   = validateEmail(email);
  const passwordError = validatePassword(password);

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields touched to show errors
    setTouched({ email: true, password: true });
    if (emailError || passwordError) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5028/api/auth/login', { email, password });
      const roleName: string = response.data.roleName || '';
      login({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        username: response.data.username,
        email: response.data.email,
        roleName,
        fullName: response.data.fullName || '',
        isProfileUpdated: response.data.isProfileUpdated
      });
      toast.success('Đăng nhập thành công!');
      const isDonorRole = roleName.toLowerCase() === 'donor';
      // If there's a ?redirect= param use it; otherwise go to home for Donors, dashboard for Admin/Staff
      const destination = redirectTo
        ? redirectTo
        : isDonorRole ? '/' : '/dashboard';
      setTimeout(() => navigate(destination), 800);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 400 && error.response.data.isOtpVerificationRequired) {
        toast.info(error.response.data.message);
        setTimeout(() => navigate(`/verify-otp?username=${encodeURIComponent(email)}`), 2000);
      } else {
        toast.error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean, isTouched: boolean) =>
    `form-control custom-input${isTouched && hasError ? ' is-invalid-custom' : isTouched && !hasError ? ' is-valid-custom' : ''}`;

  return (
    <div className="auth-wrapper fade-in">
<div className="auth-container">
        {/* Left Sidebar */}
        <div className="auth-sidebar d-flex flex-column justify-content-between">
          <div>
            <div className="d-flex align-items-center mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="me-2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ffffff" />
                <path d="M12 5v12" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 12h6" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="h4 font-weight-bold mb-0" style={{ fontFamily: 'Outfit', letterSpacing: '0.5px' }}>LifeGive</span>
            </div>
            <h1 className="h2 text-white font-weight-bold mt-4 mb-3" style={{ fontSize: '2.2rem', lineHeight: '1.2' }}>
              Kết nối nhịp đập, chia sẻ yêu thương
            </h1>
            <p className="text-white-50 mb-0">
              Hệ thống quản lý hiến máu nhân đạo hiện đại, an toàn và nhanh chóng. Một giọt máu cho đi, một cuộc đời ở lại.
            </p>
          </div>
          <div className="my-5 text-center">
            <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.1)" />
              <circle cx="100" cy="100" r="60" fill="rgba(255,255,255,0.1)" />
              <path d="M100 135C122.091 135 140 117.091 140 95C140 68 100 45 100 45C100 45 60 68 60 95C60 117.091 77.9086 135 100 135Z" fill="#ef4444" opacity="0.9" />
              <path d="M75 100H90L95 85L102 115L108 92L112 100H125" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M145 60C149 60 152 63 152 67C152 72 145 77 145 77C145 77 138 72 138 67C138 63 141 60 145 60Z" fill="#38bdf8" />
              <path d="M55 130C59 130 62 133 62 137C62 142 55 147 55 147C55 147 48 142 48 137C48 133 51 130 55 130Z" fill="#38bdf8" />
            </svg>
          </div>
          <div className="auth-sidebar-features text-white-50 small d-flex justify-content-between w-100">
            <span>✦ An toàn tuyệt đối</span>
            <span>✦ Kết nối nhanh chóng</span>
            <span>✦ Bảo mật thông tin</span>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-container">
          <div className="mb-4">
            <h2 className="h3 mb-2 font-weight-bold">Đăng nhập tài khoản</h2>
            <p className="text-muted small">Chào mừng bạn quay lại! Vui lòng nhập thông tin đăng nhập.</p>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3" noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label small text-muted font-weight-semibold">
                Địa chỉ Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className={inputClass(!!emailError, touched.email)}
                placeholder="VD: nguyenvana@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && emailError && (
                <div className="field-error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {emailError}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small text-muted font-weight-semibold mb-0">
                  Mật khẩu <span className="text-danger">*</span>
                </label>
                <Link to="/forgot-password" className="small text-decoration-none text-primary fw-medium">Quên mật khẩu?</Link>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass(!!passwordError, touched.password)}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {touched.password && passwordError && (
                <div className="field-error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {passwordError}
                </div>
              )}
            </div>

            

            <button type="submit" className="btn btn-primary-custom w-100 py-3 mt-2" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              Đăng nhập
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-decoration-none text-primary fw-bold">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
