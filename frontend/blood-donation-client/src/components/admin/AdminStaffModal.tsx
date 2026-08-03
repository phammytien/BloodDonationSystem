import React, { useState, useEffect } from 'react';
import type { StaffDto } from '../../types/staff';
import { User, Mail, Phone, Lock, Calendar, Shield, Info, Activity } from 'lucide-react';

interface AdminStaffModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (staff: Partial<StaffDto>) => Promise<void>;
  initialData?: StaffDto | null;
  mode: 'create' | 'edit' | 'view';
}

export const AdminStaffModal: React.FC<AdminStaffModalProps> = ({
  show,
  onHide,
  onSubmit,
  initialData,
  mode
}) => {
  const [formData, setFormData] = useState<Partial<StaffDto>>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      if (initialData && (mode === 'edit' || mode === 'view')) {
        setFormData({
          username: initialData.username || '',
          fullName: initialData.fullName || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          password: '' // Don't show existing password
        });
      } else {
        setFormData({
          username: '',
          fullName: '',
          email: '',
          phone: '',
          password: ''
        });
      }
    }
  }, [show, initialData, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onHide();
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
      onHide();
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const isViewMode = mode === 'view';

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1045 }} aria-hidden="true" onClick={(e) => e.target === e.currentTarget && onHide()}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
            
            {/* Header Section */}
            <div className="modal-header border-bottom py-4 px-4 px-md-5" style={{ backgroundColor: isViewMode ? '#F8FAFC' : '#FEF2F2' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px', backgroundColor: isViewMode ? '#E2E8F0' : '#FEE2E2', color: isViewMode ? '#475569' : '#DC2626' }}>
                  {isViewMode ? <Info size={24} strokeWidth={2} /> : <Shield size={24} strokeWidth={2} />}
                </div>
                <div>
                  <h4 className="modal-title fw-bold text-dark mb-1" style={{ fontFamily: 'Montserrat' }}>
                    {mode === 'create' && 'Thêm Nhân Viên Y Tế Mới'}
                    {mode === 'edit' && 'Cập Nhật Thông Tin Nhân Viên'}
                    {mode === 'view' && 'Hồ Sơ Nhân Viên Y Tế'}
                  </h4>
                  <p className="text-muted small mb-0">
                    {mode === 'create' && 'Điền thông tin bên dưới để khởi tạo tài khoản nhân viên mới.'}
                    {mode === 'edit' && 'Bạn có thể chỉnh sửa thông tin và cấp lại mật khẩu mới nếu cần.'}
                    {mode === 'view' && 'Xem chi tiết thông tin và trạng thái hoạt động của nhân viên.'}
                  </p>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={onHide} aria-label="Close" style={{ backgroundColor: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}></button>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body px-4 px-md-5 py-4 bg-white">
                
                {/* View Mode specific info block at the top */}
                {isViewMode && initialData && (
                  <div className="d-flex flex-wrap gap-4 mb-4 p-4 rounded-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm fw-bold text-primary" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                        {initialData.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="fw-bold mb-1">{initialData.fullName || initialData.username}</h5>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge" style={{ backgroundColor: initialData.isActive ? '#D1FAE5' : '#FEE2E2', color: initialData.isActive ? '#065F46' : '#991B1B' }}>
                            {initialData.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
                          </span>
                          <span className="text-muted small">ID: #{initialData.userId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-4">
                  {/* Left Column */}
                  <div className="col-12 col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold text-muted small d-flex align-items-center gap-2 mb-2">
                        <User size={16} /> Tên đăng nhập <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control px-3 py-2"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={isViewMode}
                        placeholder="Ví dụ: nguyen.van.a"
                        style={{ backgroundColor: isViewMode ? '#F8FAFC' : '#fff', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="col-12 col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold text-muted small d-flex align-items-center gap-2 mb-2">
                        <User size={16} /> Họ và tên đầy đủ
                      </label>
                      <input
                        type="text"
                        className="form-control px-3 py-2"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        style={{ backgroundColor: isViewMode ? '#F8FAFC' : '#fff', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold text-muted small d-flex align-items-center gap-2 mb-2">
                        <Mail size={16} /> Địa chỉ Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control px-3 py-2"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isViewMode}
                        placeholder="Ví dụ: nhanvien@lifegive.vn"
                        style={{ backgroundColor: isViewMode ? '#F8FAFC' : '#fff', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold text-muted small d-flex align-items-center gap-2 mb-2">
                        <Phone size={16} /> Số điện thoại
                      </label>
                      <input
                        type="tel"
                        className="form-control px-3 py-2"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isViewMode}
                        placeholder="Ví dụ: 0901234567"
                        style={{ backgroundColor: isViewMode ? '#F8FAFC' : '#fff', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  {/* Password block for Create/Edit */}
                  {!isViewMode && (
                    <div className="col-12">
                      <div className="p-4 rounded-4" style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
                        <div className="d-flex align-items-start gap-3">
                          <div className="text-muted"><Lock size={20} /></div>
                          <div className="flex-grow-1">
                            {mode === 'create' ? (
                              <>
                                <h6 className="fw-bold mb-1 text-dark">Mật khẩu tài khoản</h6>
                                <p className="text-muted small mb-0">Hệ thống sẽ cấp mật khẩu mặc định là <code className="fw-bold fs-6 bg-white px-2 py-1 rounded shadow-sm">Staff@123</code></p>
                              </>
                            ) : (
                              <>
                                <h6 className="fw-bold mb-3 text-dark">Thay đổi mật khẩu</h6>
                                <input
                                  type="password"
                                  className="form-control bg-white"
                                  name="password"
                                  value={formData.password}
                                  onChange={handleChange}
                                  placeholder="Nhập mật khẩu mới (Bỏ trống nếu không muốn đổi)"
                                  style={{ border: '1px solid #CBD5E1', borderRadius: '8px' }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Created At for View Mode */}
                  {isViewMode && initialData && (
                    <div className="col-12">
                      <div className="d-flex align-items-center gap-2 text-muted small mt-2">
                        <Calendar size={14} />
                        <span>Ngày tạo tài khoản: {new Date(initialData.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer Section */}
              <div className="modal-footer border-top-0 px-4 px-md-5 pb-4 pt-0 bg-white">
                <button 
                  type="button" 
                  className="btn fw-semibold" 
                  onClick={onHide} 
                  disabled={loading}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '8px', padding: '10px 24px' }}
                >
                  {isViewMode ? 'Đóng' : 'Huỷ bỏ'}
                </button>
                
                {!isViewMode && (
                  <button 
                    type="submit" 
                    className="btn text-white fw-semibold shadow-sm d-flex align-items-center gap-2" 
                    disabled={loading} 
                    style={{ backgroundColor: '#D42B2B', borderRadius: '8px', padding: '10px 24px', transition: 'all 0.2s' }}
                  >
                    {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                    {mode === 'create' ? 'Tạo Tài Khoản' : 'Lưu Thay Đổi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
