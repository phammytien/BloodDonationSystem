import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

export interface DonorProfileDto {
  donorId?: number;
  fullName: string | null;
  gender: boolean | null;
  dateOfBirth: string | null;
  citizenId: string | null;
  phone: string;
  email: string;
  address: string | null;
  province: string | null;
  ward: string | null;
  occupation: string | null;
  bloodTypeId: number | null;
  bloodGroup?: string;
  weight: number | null;
  height: number | null;
  avatar?: string | null;
  isAvailable?: boolean;
}

interface AdminDonorModalProps {
  show: boolean;
  onHide: () => void;
  mode: 'create' | 'edit' | 'view';
  donorData?: DonorProfileDto | null;
  onSuccess: () => void;
}

export const AdminDonorModal: React.FC<AdminDonorModalProps> = ({ show, onHide, mode, donorData, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DonorProfileDto>({
    fullName: '',
    gender: null,
    dateOfBirth: '',
    citizenId: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    ward: '',
    occupation: '',
    bloodTypeId: null,
    weight: null,
    height: null,
  });
  const [bloodTypes, setBloodTypes] = useState<{bloodTypeId: number, bloodGroup: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchBloodTypes();
      if ((mode === 'edit' || mode === 'view') && donorData) {
        setFormData({
          ...donorData,
          dateOfBirth: donorData.dateOfBirth ? donorData.dateOfBirth.split('T')[0] : ''
        });
      } else {
        // Reset
        setFormData({
          fullName: '',
          gender: null,
          dateOfBirth: '',
          citizenId: '',
          phone: '',
          email: '',
          address: '',
          province: '',
          ward: '',
          occupation: '',
          bloodTypeId: null,
          weight: null,
          height: null,
        });
      }
    }
  }, [show, mode, donorData]);

  const fetchBloodTypes = async () => {
    try {
      const res = await axios.get('http://localhost:5028/api/Donor/blood-types');
      setBloodTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : 
              (name === 'weight' || name === 'height' || name === 'bloodTypeId') ? Number(value) : 
              name === 'gender' ? (value === 'true' ? true : value === 'false' ? false : null) : 
              value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return onHide();

    setLoading(true);
    try {
      if (mode === 'create') {
        await axios.post('http://localhost:5028/api/Donor/admin', formData, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        toast.success('Thêm người hiến máu thành công!');
      } else if (mode === 'edit' && formData.donorId) {
        await axios.put(`http://localhost:5028/api/Donor/admin/${formData.donorId}`, formData, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        toast.success('Cập nhật người hiến máu thành công!');
      }
      onSuccess();
      onHide();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return createPortal(
    <>
      <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
          <div className="modal-content rounded-4 border-0 shadow-lg bg-white">
            <div className="modal-header border-bottom p-4 pb-3 bg-white rounded-top-4">
              <h5 className="modal-title fw-bold" style={{ color: '#111827' }}>
                {mode === 'create' ? 'Thêm Người Hiến Máu Mới' : mode === 'edit' ? 'Cập Nhật Thông Tin' : 'Chi Tiết Người Hiến Máu'}
              </h5>
              <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
            </div>
            
            <div className="modal-body p-4 bg-light">
              <form id="donorForm" onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Họ và tên <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="fullName" value={formData.fullName || ''} onChange={handleChange} required disabled={mode === 'view'} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">CCCD / Hộ chiếu <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="citizenId" value={formData.citizenId || ''} onChange={handleChange} required disabled={mode === 'view'} pattern="^(\d{9}|\d{12})$" title="CCCD phải gồm đúng 9 hoặc 12 chữ số" placeholder="079..." />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Số điện thoại <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="phone" value={formData.phone || ''} onChange={handleChange} required disabled={mode === 'view'} placeholder="090..." />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Email <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" name="email" value={formData.email || ''} onChange={handleChange} required disabled={mode === 'view'} placeholder="email@example.com" />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Ngày sinh</label>
                    <input type="date" className="form-control" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} disabled={mode === 'view'} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Giới tính</label>
                    <select className="form-select" name="gender" value={formData.gender === true ? 'true' : formData.gender === false ? 'false' : ''} onChange={handleChange} disabled={mode === 'view'}>
                      <option value="">-- Chọn --</option>
                      <option value="true">Nam</option>
                      <option value="false">Nữ</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Nhóm máu</label>
                    <select className="form-select" name="bloodTypeId" value={formData.bloodTypeId || ''} onChange={handleChange} disabled={mode === 'view'}>
                      <option value="">-- Chọn --</option>
                      {bloodTypes.map(bt => (
                        <option key={bt.bloodTypeId} value={bt.bloodTypeId}>{bt.bloodGroup}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Cân nặng (kg)</label>
                    <input type="number" step="0.1" className="form-control" name="weight" value={formData.weight || ''} onChange={handleChange} disabled={mode === 'view'} placeholder="VD: 60" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Chiều cao (cm)</label>
                    <input type="number" step="0.1" className="form-control" name="height" value={formData.height || ''} onChange={handleChange} disabled={mode === 'view'} placeholder="VD: 170" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Nghề nghiệp</label>
                    <input type="text" className="form-control" name="occupation" value={formData.occupation || ''} onChange={handleChange} disabled={mode === 'view'} />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Địa chỉ chi tiết</label>
                    <input type="text" className="form-control" name="address" value={formData.address || ''} onChange={handleChange} disabled={mode === 'view'} placeholder="Số nhà, đường..." />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="modal-footer border-top p-4 pt-3">
              <button type="button" className="btn btn-light border px-4" onClick={onHide}>Đóng</button>
              {mode !== 'view' && (
                <button type="submit" form="donorForm" className="btn btn-danger px-4" disabled={loading}>
                  {loading ? 'Đang lưu...' : (mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
