import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

export const OtpPage: React.FC = () => {
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Parse username from query parameters
  const queryParams = new URLSearchParams(location.search);
  const username = queryParams.get('username') || '';

  useEffect(() => {
    if (!username) {
      toast.error('Thiếu thông tin người dùng cần xác thực.');
      setTimeout(() => navigate('/register'), 2000);
    }
  }, [username, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    // Take the last character typed
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace handles focusing previous box
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5028/api/auth/resend-otp', {
        username
      });
      toast.success(response.data.message || 'Hệ thống đã gửi lại mã OTP mới.');
      setTimer(60);
      setOtpValues(Array(6).fill('')); // Clear old inputs
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Gửi lại mã OTP thất bại. Vui lòng thử lại.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      toast.warning('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5028/api/auth/verify-otp', {
        username,
        otpCode
      });

      toast.success(response.data.message || 'Xác thực tài khoản thành công!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper fade-in">
<div className="auth-container" style={{ maxWidth: '600px', minHeight: 'auto' }}>
        <div className="auth-form-container w-100 px-5 py-5 text-center">
          <div className="mb-4">
            {/* Elegant Shield Icon */}
            <div className="d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--primary-light)' }}>
              <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 11l2 2 4-4" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="h3 mb-2 font-weight-bold">Xác thực mã OTP</h2>
            <p className="text-muted small">
              Mã xác thực đã được gửi về địa chỉ email của bạn.<br />
              Vui lòng nhập mã gồm 6 chữ số để kích hoạt tài khoản <strong>{username}</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column align-items-center gap-4">
            <div className="d-flex justify-content-center w-100 my-2">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  className="otp-box"
                  maxLength={1}
                  value={value}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary-custom w-100 py-3"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : null}
              Xác thực và kích hoạt
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              Chưa nhận được mã?{' '}
              {timer > 0 ? (
                <span className="text-primary fw-medium">Gửi lại sau {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="btn btn-link text-primary fw-bold p-0 border-0 bg-transparent small text-decoration-none"
                  style={{ fontSize: '0.875rem' }}
                >
                  Gửi lại mã OTP
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
