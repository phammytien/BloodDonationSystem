import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

// --- Validation helpers ---
const validateUsername = (val: string) => {
  if (!val.trim()) return 'Tên đăng nhập không được để trống.';
  if (val.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự.';
  if (val.length > 50) return 'Tên đăng nhập không được quá 50 ký tự.';
  if (/\s/.test(val)) return 'Tên đăng nhập không được chứa khoảng trắng.';
  if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới (_).';
  return '';
};
const validateEmail = (val: string) => {
  if (!val.trim()) return 'Email không được để trống.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Email không đúng định dạng (VD: abc@gmail.com).';
  return '';
};
const validatePhone = (val: string) => {
  if (!val.trim()) return 'Số điện thoại không được để trống.';
  if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(val)) return 'Số điện thoại không hợp lệ (VD: 0912345678).';
  return '';
};
const validatePassword = (val: string) => {
  if (!val) return 'Mật khẩu không được để trống.';
  if (val.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (!/[A-Z]/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ hoa (A-Z).';
  if (!/[0-9]/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ số (0-9).';
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
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ username: false, email: false, phone: false, password: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const errors = {
    username: validateUsername(username),
    email: validateEmail(email),
    phone: validatePhone(phone),
    password: validatePassword(password),
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, email: true, phone: true, password: true });
    if (errors.username || errors.email || errors.phone || errors.password) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5028/api/auth/register', {
        username,
        password,
        email,
        phone
      });
      toast.success(response.data.message || 'Đăng ký thành công!');
      setTimeout(() => navigate(`/verify-otp?username=${encodeURIComponent(username)}`), 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof typeof errors) =>
    `form-control custom-input${touched[field] && errors[field] ? ' is-invalid-custom' : touched[field] && !errors[field] ? ' is-valid-custom' : ''}`;

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
              Trở thành anh hùng của ai đó
            </h1>
            <p className="text-white-50 mb-0">
              Đăng ký tài khoản hiến máu để lưu trữ lịch sử, đăng ký hiến máu nhanh chóng và nhận thông báo các chiến dịch khẩn cấp.
            </p>
          </div>
          <div className="my-4 text-center">
            <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="70" fill="rgba(255,255,255,0.08)" />
              <path d="M60 90C60 70 80 50 100 50C120 50 140 70 140 90C140 120 100 150 100 150C100 150 60 120 60 90Z" stroke="#38bdf8" strokeWidth="4" strokeDasharray="6 4" />
              <circle cx="100" cy="90" r="25" fill="#1B4FD8" />
              <path d="M95 90H105M100 85V95" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {/* Password strength hints */}
          <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-white-50 small mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Yêu cầu mật khẩu</p>
            {[
              { label: 'Tối thiểu 6 ký tự', ok: password.length >= 6 },
              { label: 'Ít nhất 1 chữ hoa (A-Z)', ok: /[A-Z]/.test(password) },
              { label: 'Ít nhất 1 chữ số (0-9)', ok: /[0-9]/.test(password) },
            ].map((rule, i) => (
              <div key={i} className="d-flex align-items-center gap-2 mb-1">
                <svg viewBox="0 0 24 24" fill="none" stroke={rule.ok ? '#34d399' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="2.5" strokeLinecap="round" width="13" height="13">
                  {rule.ok
                    ? <polyline points="20 6 9 17 4 12" />
                    : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                  }
                </svg>
                <span style={{ fontSize: '0.78rem', color: rule.ok ? '#34d399' : 'rgba(255,255,255,0.45)' }}>{rule.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-sidebar-features text-white-50 small d-flex justify-content-between w-100">
            <span>✦ Kích hoạt qua OTP</span>
            <span>✦ Quản lý lịch hiến</span>
            <span>✦ Tra cứu nhóm máu</span>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-container">
          <div className="mb-4">
            <h2 className="h3 mb-2 font-weight-bold">Đăng ký tài khoản</h2>
            <p className="text-muted small">Tạo tài khoản để tham gia các chiến dịch hiến máu nhân đạo.</p>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3" noValidate>
            {/* Username */}
            <div className="form-group">
              <label className="form-label small text-muted font-weight-semibold">
                Tên đăng nhập <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={inputClass('username')}
                placeholder="Chữ, số và dấu gạch dưới, tối thiểu 3 ký tự"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
              />
              {touched.username && errors.username && (
                <div className="field-error-msg">
                  <AlertIcon /> {errors.username}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label small text-muted font-weight-semibold">
                Địa chỉ Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className={inputClass('email')}
                placeholder="VD: nguyenvana@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && errors.email && (
                <div className="field-error-msg">
                  <AlertIcon /> {errors.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label small text-muted font-weight-semibold">
                Số điện thoại <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                className={inputClass('phone')}
                placeholder="VD: 0912345678"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => handleBlur('phone')}
                maxLength={10}
              />
              {touched.phone && errors.phone && (
                <div className="field-error-msg">
                  <AlertIcon /> {errors.phone}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label small text-muted font-weight-semibold">
                Mật khẩu <span className="text-danger">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass('password')}
                  placeholder="Tối thiểu 6 ký tự, 1 chữ hoa, 1 số"
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
              {touched.password && errors.password && (
                <div className="field-error-msg">
                  <AlertIcon /> {errors.password}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary-custom w-100 py-3 mt-2" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              Đăng ký tài khoản
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-decoration-none text-primary fw-bold">Đăng nhập ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
