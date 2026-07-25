import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { getAvatarChar } from '../../utils/avatarHelper';

interface BloodType {
  bloodTypeId: number;
  bloodGroup: string;
}

interface DonorProfile {
  donorId: number;
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
  bloodGroup: string | null;
  weight: number | null;
  height: number | null;
  avatar: string | null;
  lastDonationDate: string | null;
  totalDonationTimes: number;
  updatedAt: string | null;
}

export const ProfilePage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [bloodTypes, setBloodTypes] = useState<BloodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<boolean | null>(null); // true = Nam, false = Nữ, null = Chưa cập nhật
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bloodTypeId, setBloodTypeId] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate fullName - chỉ chữ cái, dấu cách, không số, không ký tự đặc biệt
    if (!fullName.trim()) {
      errors.fullName = 'Họ tên không được để trống';
    } else if (fullName.trim().length < 3) {
      errors.fullName = 'Họ tên phải có ít nhất 3 ký tự';
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Họ tên không được quá 100 ký tự';
    } else if (!/^[a-zA-ZÀ-ỿ\s]+$/.test(fullName.trim())) {
      errors.fullName = 'Họ tên chỉ được phép chứa chữ cái và dấu cách';
    }

    // Validate email
    if (!email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email không đúng định dạng (VD: nguyena@gmail.com)';
    }

    // Validate phone - đúng 10 số, chỉ số không ký tự đặc biệt
    if (!phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!/^\d{10}$/.test(phone.trim().replace(/\D/g, ''))) {
      errors.phone = 'Số điện thoại phải đủ 10 số và chỉ chứa chữ số';
    } else if (!/^0[35789]/.test(phone.trim())) {
      errors.phone = 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09';
    }

    // Validate citizenId - chỉ số, không chữ hay ký tự đặc biệt
    if (!citizenId.trim()) {
      errors.citizenId = 'Số CCCD / Hộ chiếu không được để trống';
    } else if (!/^\d+$/.test(citizenId.trim())) {
      errors.citizenId = 'Số CCCD / Hộ chiếu chỉ được chứa chữ số';
    } else if (citizenId.trim().length < 9) {
      errors.citizenId = 'Số CCCD / Hộ chiếu phải có ít nhất 9 ký tự';
    } else if (citizenId.trim().length > 20) {
      errors.citizenId = 'Số CCCD / Hộ chiếu không được quá 20 ký tự';
    }

    // Validate dateOfBirth (must be at least 18 years old)
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.dateOfBirth = 'Bạn phải đủ 18 tuổi để trở thành người hiến máu';
      }
    }

    // Validate height
    if (height !== '' && (Number(height) < 150 || Number(height) > 250)) {
      errors.height = 'Chiều cao phải trong khoảng 150-250 cm';
    }

    // Validate weight
    if (weight !== '' && (Number(weight) < 40 || Number(weight) > 200)) {
      errors.weight = 'Cân nặng phải trong khoảng 40-200 kg';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch blood types
    axios.get('http://localhost:5028/api/donor/blood-types')
      .then(res => setBloodTypes(res.data))
      .catch(err => console.error('Lỗi tải nhóm máu', err));

    // Fetch profile
    axios.get('http://localhost:5028/api/donor/profile', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => {
        const data: DonorProfile = res.data;
        setProfile(data);
        setFullName(data.fullName || '');
        setGender(data.gender);
        // Format YYYY-MM-DD for date input
        if (data.dateOfBirth && data.dateOfBirth.startsWith('1900-01-01') === false) {
          setDateOfBirth(data.dateOfBirth.split('T')[0]);
        } else {
          setDateOfBirth('');
        }
        setCitizenId(data.citizenId || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setProvince(data.province || '');
        setWard(data.ward || '');
        setOccupation(data.occupation || '');
        setBloodTypeId(data.bloodTypeId);
        setWeight(data.weight ? Number(data.weight) : '');
        setHeight(data.height ? Number(data.height) : '');
      })
      .catch(err => {
        console.error(err);
        toast.error('Không thể tải thông tin hồ sơ.');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (!validateForm()) {
      toast.error('Vui lòng sửa các lỗi trong form trước khi lưu.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        donorId: profile?.donorId || 0,
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        citizenId: citizenId.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        province: province.trim(),
        ward: ward.trim(),
        occupation: occupation ? occupation.trim() : null,
        bloodTypeId,
        bloodGroup: profile?.bloodGroup || '',
        weight: weight !== '' ? parseFloat(weight.toString()) : null,
        height: height !== '' ? parseFloat(height.toString()) : null,
        avatar: profile?.avatar || null,
        lastDonationDate: profile?.lastDonationDate || null,
        totalDonationTimes: profile?.totalDonationTimes || 0
      };

      await axios.put('http://localhost:5028/api/donor/profile', payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (user) {
        login({ ...user, fullName: fullName.trim(), isProfileUpdated: true });
      }

      toast.success('Cập nhật thông tin hồ sơ thành công!');
      setValidationErrors({});

      // Refresh profile data
      setProfile(prev => prev ? { ...prev, ...payload } : null);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.details || 'Không thể lưu thông tin. Vui lòng thử lại.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa từng hiến';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  const renderFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      return (
        <div className="text-danger small fw-semibold mt-1" style={{ fontSize: '0.75rem', color: '#DC2626' }}>
          {validationErrors[fieldName]}
        </div>
      );
    }
    return null;
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = 'form-control custom-input';
    if (validationErrors[fieldName]) {
      return `${baseClass} is-invalid`;
    }
    return baseClass;
  };

  const getInputStyle = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      return { borderColor: '#DC2626', backgroundColor: '#FEF5F5' };
    }
    return {};
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#F8FAFF' }}>
        <div className="spinner-border text-danger" role="status" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFF' }}>
      <ToastContainer position="top-right" autoClose={3000} />



      <div className="container py-5">
        <div className="row g-4 justify-content-center">

          {/* Left panel: Info summary */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-4 p-4 text-center" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
              <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 80, height: 80, backgroundColor: '#EFF6FF', color: '#1B4FD8', fontSize: '2rem', fontWeight: 800 }}>
                {getAvatarChar(fullName || user?.fullName, user?.username)}
              </div>
              <h5 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827', margin: 0 }}>{fullName || 'Người hiến máu'}</h5>
              <p className="text-muted small mt-1">{email}</p>

              <hr className="my-4" style={{ borderColor: '#F3F4F6' }} />

              <div className="row text-start g-3">
                <div className="col-6">
                  <span className="small text-muted d-block">Nhóm máu</span>
                  <strong className="text-danger" style={{ fontSize: '1.1rem' }}>{profile?.bloodGroup || '—'}</strong>
                </div>
                <div className="col-6">
                  <span className="small text-muted d-block">Lần hiến</span>
                  <strong className="text-dark" style={{ fontSize: '1.1rem' }}>{profile?.totalDonationTimes || 0} lần</strong>
                </div>
                <div className="col-12">
                  <span className="small text-muted d-block">Lần hiến cuối</span>
                  <span className="text-dark fw-semibold" style={{ fontSize: '0.88rem' }}>{formatDate(profile?.lastDonationDate || null)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Edit Form */}
          <div className="col-12 col-lg-8">
            <div className="bg-white rounded-4 p-4 p-md-5" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
              <h4 className="mb-4" style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827' }}>Thông Tin Tài Khoản Và Hồ Sơ Người Hiến Máu</h4>
              <p className="text-muted small mb-4">Cập nhật thông tin cá nhân để các lần đăng ký hiến máu và hồ sơ donor luôn được đồng bộ với tài khoản của bạn.</p>

              <form onSubmit={handleSubmit} className="row g-3">
                {/* Họ tên */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Họ và tên <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={getInputClass('fullName')}
                    style={getInputStyle('fullName')}
                    value={fullName}
                    onChange={e => {
                      setFullName(e.target.value);
                      if (validationErrors.fullName) setValidationErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="VD: Nguyễn Văn A"
                    required
                  />
                  {renderFieldError('fullName')}
                </div>

                {/* SĐT */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Số điện thoại <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={getInputClass('phone')}
                    style={getInputStyle('phone')}
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="VD: 0912345678"
                    required
                  />
                  {renderFieldError('phone')}
                </div>

                {/* Email */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Địa chỉ email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className={getInputClass('email')}
                    style={getInputStyle('email')}
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="VD: donor@lifegive.vn"
                    required
                  />
                  {renderFieldError('email')}
                </div>

                {/* CCCD */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Số CCCD / Hộ chiếu <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={getInputClass('citizenId')}
                    style={getInputStyle('citizenId')}
                    value={citizenId}
                    onChange={e => {
                      setCitizenId(e.target.value);
                      if (validationErrors.citizenId) setValidationErrors(prev => ({ ...prev, citizenId: '' }));
                    }}
                    placeholder="VD: 123456789"
                    required
                  />
                  {renderFieldError('citizenId')}
                </div>

                {/* Giới tính */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Giới tính</label>
                  <select 
                    className="form-select custom-input" 
                    value={gender === null ? '' : (gender ? 'true' : 'false')} 
                    onChange={e => setGender(e.target.value === '' ? null : e.target.value === 'true')}
                  >
                    <option value="" disabled>-- Chọn giới tính --</option>
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>

                {/* Ngày sinh */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    className={getInputClass('dateOfBirth')}
                    value={dateOfBirth}
                    onChange={e => {
                      setDateOfBirth(e.target.value);
                      if (validationErrors.dateOfBirth) setValidationErrors(prev => ({ ...prev, dateOfBirth: '' }));
                    }}
                  />
                  {renderFieldError('dateOfBirth')}
                </div>

                {/* Nhóm máu */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Nhóm máu</label>
                  <select
                    className="form-select custom-input"
                    value={bloodTypeId || ''}
                    onChange={e => setBloodTypeId(e.target.value ? Number(e.target.value) : null)}
                    required
                  >
                    <option value="" disabled>-- Chọn nhóm máu --</option>
                    {bloodTypes.map(b => (
                      <option key={b.bloodTypeId} value={b.bloodTypeId}>{b.bloodGroup}</option>
                    ))}
                  </select>
                </div>

                {/* Chiều cao */}
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Chiều cao (cm)</label>
                  <input
                    type="number"
                    className={getInputClass('height')}
                    value={height}
                    onChange={e => {
                      setHeight(e.target.value === '' ? '' : Number(e.target.value));
                      if (validationErrors.height) setValidationErrors(prev => ({ ...prev, height: '' }));
                    }}
                    placeholder="VD: 170"
                    min="150"
                    max="250"
                  />
                  {renderFieldError('height')}
                </div>

                {/* Cân nặng */}
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    className={getInputClass('weight')}
                    value={weight}
                    onChange={e => {
                      setWeight(e.target.value === '' ? '' : Number(e.target.value));
                      if (validationErrors.weight) setValidationErrors(prev => ({ ...prev, weight: '' }));
                    }}
                    placeholder="VD: 60"
                    min="40"
                    max="200"
                  />
                  {renderFieldError('weight')}
                </div>

                {/* Nghề nghiệp */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted mb-1">Nghề nghiệp</label>
                  <input type="text" className="form-control custom-input" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="VD: Kỹ sư, Học sinh..." />
                </div>

                {/* Tỉnh / Thành */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Tỉnh / Thành phố</label>
                  <input type="text" className="form-control custom-input" value={province} onChange={e => setProvince(e.target.value)} placeholder="VD: TP. Hồ Chí Minh" />
                </div>

                {/* Phường / Xã */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Phường / Xã</label>
                  <input type="text" className="form-control custom-input" value={ward} onChange={e => setWard(e.target.value)} placeholder="VD: Phường 12" />
                </div>

                {/* Ấp / Khóm */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Ấp / Khóm / Số nhà</label>
                  <input type="text" className="form-control custom-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="VD: Ấp 3, số 118 Hồng Bàng" />
                </div>

                {/* Submit button */}
                <div className="col-12 mt-4 text-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-danger fw-bold rounded-pill px-4 py-2"
                    style={{
                      fontFamily: 'Montserrat',
                      fontSize: '0.9rem',
                      backgroundColor: '#D42B2B',
                      border: 'none',
                      boxShadow: '0 6px 18px rgba(212,43,43,0.22)',
                      opacity: saving ? 0.7 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {saving ? <>
                      <span className="spinner-border spinner-border-sm me-2" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                      Đang lưu...
                    </> : 'Lưu thay đổi'}
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
