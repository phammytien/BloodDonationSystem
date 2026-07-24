import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

// Icon Components
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step state: 1 = Send Email OTP, 2 = Verify OTP & Reset Password
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Form inputs
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error messages
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email không được để trống.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Email không đúng định dạng.';
    return '';
  };

  const validateOtp = (val: string) => {
    if (!val.trim()) return 'Vui lòng nhập mã OTP.';
    if (val.trim().length !== 6 || !/^\d+$/.test(val)) return 'Mã OTP phải có đúng 6 chữ số.';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Mật khẩu mới không được để trống.';
    if (val.length < 6) return 'Mật khẩu phải có tối thiểu 6 ký tự.';
    return '';
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') setEmailError(validateEmail(email));
    if (field === 'otpCode') setOtpError(validateOtp(otpCode));
    if (field === 'newPassword') setPasswordError(validatePassword(newPassword));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true });
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5028/api/auth/forgot-password', { email: email.trim() });
      toast.success(response.data.message || 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.');
      setStep(2);
      setTouched({});
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Email này chưa được đăng ký trong hệ thống.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ otpCode: true, newPassword: true, confirmPassword: true });

    const otpErr = validateOtp(otpCode);
    const passErr = validatePassword(newPassword);
    let confirmErr = '';

    if (!confirmPassword) {
      confirmErr = 'Vui lòng nhập lại mật khẩu xác nhận.';
    } else if (newPassword !== confirmPassword) {
      confirmErr = 'Mật khẩu xác nhận không khớp.';
    }

    setOtpError(otpErr);
    setPasswordError(passErr);
    setConfirmPasswordError(confirmErr);

    if (otpErr || passErr || confirmErr) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5028/api/auth/reset-password', {
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword: newPassword
      });
      toast.success(response.data.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean, isTouched: boolean) =>
    `form-control custom-input${isTouched && hasError ? ' is-invalid-custom' : isTouched && !hasError ? ' is-valid-custom' : ''}`;

  return (
    <div className="auth-wrapper fade-in">
      <ToastContainer position="top-right" autoClose={3000} />
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
              Khôi phục quyền truy cập nhanh
            </h1>
            <p className="text-white-50 mb-0">
              Nhập email đã đăng ký tài khoản của bạn, mã xác thực OTP sẽ được gửi về hộp thư điện tử để đặt lại mật khẩu mới.
            </p>
          </div>
          <div className="my-5 text-center text-white d-flex flex-column align-items-center justify-content-center">
            <div className="d-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 80, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <KeyIcon />
            </div>
            <span className="fw-semibold">Bảo mật đa lớp</span>
          </div>
          <div className="auth-sidebar-features text-white-50 small d-flex justify-content-between w-100">
            <span>✦ Xác thực Email</span>
            <span>✦ Mã OTP bảo mật</span>
            <span>✦ Mã hóa đầu cuối</span>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-container">
          <div className="mb-4">
            <Link to="/login" className="text-decoration-none d-inline-flex align-items-center gap-1.5 small text-primary fw-bold mb-3">
              <ArrowLeftIcon /> Quay lại đăng nhập
            </Link>
            <h2 className="h3 mb-2 font-weight-bold">Quên mật khẩu?</h2>
            <p className="text-muted small">
              {step === 1
                ? 'Nhập email liên kết với tài khoản của bạn để nhận mã xác thực kích hoạt.'
                : 'Nhập mã xác thực gửi tới hộp thư của bạn và tạo mật khẩu mới.'}
            </p>
          </div>

          {step === 1 ? (
            /* STEP 1: Enter Email */
            <form onSubmit={handleSendOtp} className="d-flex flex-column gap-3">
              <div className="form-group">
                <label className="form-label small text-muted font-weight-semibold">
                  Địa chỉ email đăng ký <span className="text-danger">*</span>
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

              <button type="submit" className="btn btn-primary-custom w-100 py-3 mt-2" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                Gửi mã xác thực OTP
              </button>
            </form>
          ) : (
            /* STEP 2: Enter OTP & Reset Password */
            <form onSubmit={handleResetPassword} className="d-flex flex-column gap-3">
              {/* Email (Read-Only) */}
              <div className="form-group">
                <label className="form-label small text-muted font-weight-semibold">Địa chỉ email</label>
                <input type="email" className="form-control custom-input" value={email} disabled style={{ backgroundColor: '#F3F4F6' }} />
              </div>

              {/* OTP Code */}
              <div className="form-group">
                <label className="form-label small text-muted font-weight-semibold">
                  Mã xác thực OTP <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass(!!otpError, touched.otpCode)}
                  placeholder="Nhập 6 chữ số"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={() => handleBlur('otpCode')}
                  maxLength={6}
                />
                {touched.otpCode && otpError && (
                  <div className="field-error-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {otpError}
                  </div>
                )}
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label small text-muted font-weight-semibold">
                  Mật khẩu mới <span className="text-danger">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputClass(!!passwordError, touched.newPassword)}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onBlur={() => handleBlur('newPassword')}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.newPassword && passwordError && (
                  <div className="field-error-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {passwordError}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label small text-muted font-weight-semibold">
                  Nhập lại mật khẩu mới <span className="text-danger">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={inputClass(!!confirmPasswordError, touched.confirmPassword)}
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.confirmPassword && confirmPasswordError && (
                  <div className="field-error-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {confirmPasswordError}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary-custom w-100 py-3 mt-2" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                Khôi phục mật khẩu
              </button>

              <button type="button" className="btn btn-link text-decoration-none text-muted small text-center" onClick={() => setStep(1)} disabled={loading}>
                Nhập lại địa chỉ Email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
