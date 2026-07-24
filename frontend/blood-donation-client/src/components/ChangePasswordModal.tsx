import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Vui lòng đăng nhập để đổi mật khẩu.');
      return;
    }

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

    setLoading(false);
    setLoading(true);

    try {
      await axios.post(
        'http://localhost:5028/api/auth/change-password',
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      toast.success('Đổi mật khẩu thành công!');
      // Reset form fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 11000,
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        className="bg-white rounded-4 p-4 shadow-2xl mx-3 position-relative" 
        style={{ 
          maxWidth: '440px', 
          width: '100%',
          border: '1px solid #E2E8F0',
          animation: 'fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: 'Nunito, sans-serif'
        }}
      >
        <button 
          onClick={onClose}
          className="position-absolute border-0 bg-transparent text-muted hover-primary"
          style={{ top: '16px', right: '16px', fontSize: '1.25rem', cursor: 'pointer' }}
          title="Đóng"
        >
          &times;
        </button>

        <h4 className="mb-1" style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
          Đổi mật khẩu
        </h4>
        <p className="text-muted small mb-4">
          Vui lòng điền thông tin bên dưới để cập nhật mật khẩu mới của bạn.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Mật khẩu cũ */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Mật khẩu hiện tại</label>
            <div className="password-input-wrapper">
              <input
                type={showOldPassword ? 'text' : 'password'}
                className="form-control"
                style={{ borderRadius: '8px', fontSize: '0.9rem', padding: '0.55rem 0.75rem' }}
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
                style={{ borderRadius: '8px', fontSize: '0.9rem', padding: '0.55rem 0.75rem' }}
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
                style={{ borderRadius: '8px', fontSize: '0.9rem', padding: '0.55rem 0.75rem' }}
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

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light"
              style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '0.55rem 1.2rem', fontWeight: 600 }}
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary-custom d-flex align-items-center justify-content-center"
              style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '0.55rem 1.5rem', border: 'none' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang lưu...
                </>
              ) : (
                'Đổi mật khẩu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
