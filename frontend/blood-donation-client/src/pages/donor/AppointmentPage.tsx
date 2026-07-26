import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getAvatarChar, getDisplayName } from '../../utils/avatarHelper';

interface Campaign {
  campaignId: number;
  campaignName: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: string;
  description: string;
  maxParticipants: number;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  registrantCount: number;
  status: number;
}

interface AppointmentHistory {
  appointmentId: number;
  campaignName: string;
  location: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  note: string;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: string;
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

const TIME_SLOTS = [
  'Buổi sáng: 07:30 - 09:30',
  'Buổi sáng: 09:30 - 11:30',
  'Buổi chiều: 13:30 - 15:30',
  'Buổi chiều: 15:30 - 17:30',
];

const getStatusBadge = (statusStr: string | null) => {
  if (!statusStr) return <span className="badge bg-light text-dark px-2 py-1 rounded-pill">Chờ duyệt</span>;
  switch (statusStr.toLowerCase()) {
    case 'pending': return <span className="badge bg-warning text-dark px-2 py-1 rounded-pill">Chờ duyệt</span>;
    case 'confirmed': return <span className="badge bg-info text-white px-2 py-1 rounded-pill">Đã xác nhận</span>;
    case 'completed': return <span className="badge bg-success text-white px-2 py-1 rounded-pill">Đã hoàn thành</span>;
    case 'cancelled': return <span className="badge bg-secondary text-white px-2 py-1 rounded-pill">Đã hủy</span>;
    case 'absent': return <span className="badge bg-danger text-white px-2 py-1 rounded-pill">Vắng mặt</span>;
    default: return <span className="badge bg-light text-dark px-2 py-1 rounded-pill">{statusStr}</span>;
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Chưa từng hiến';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr || ''; }
};

export const AppointmentPage: React.FC = () => {
  const { user, profilePromptDismissed, dismissProfilePrompt } = useAuth();
  const navigate = useNavigate();

  // ── Scroll to Top state ──────────────────────────────────────
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleDismissModal = () => {
    dismissProfilePrompt();
  };

  useEffect(() => {
    const shouldPrompt = user && user.roleName.toLowerCase() === 'donor' && !user.isProfileUpdated && !profilePromptDismissed;
    if (shouldPrompt) {
      const timer = setTimeout(() => setShowProfileModal(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setShowProfileModal(false);
    }
  }, [user, profilePromptDismissed]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (showProfileModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showProfileModal]);

  // ── Form state ──────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const currentCampaign = campaigns.find(c => c.campaignId.toString() === selectedCampaignId);
  const isCampaignFull = !!(currentCampaign && currentCampaign.maxParticipants && currentCampaign.registrantCount >= currentCampaign.maxParticipants);
  const isCampaignEnded = !!(currentCampaign && new Date(currentCampaign.endDate) < new Date());
  const isCampaignClosedOrCancelled = !!(currentCampaign && (currentCampaign.status === 2 || currentCampaign.status === 3));
  const canRegister = !isCampaignFull && !isCampaignEnded && !isCampaignClosedOrCancelled;

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  // ── History state ────────────────────────────────────────────
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Donor profile state (pre-filled on mount) ────────────────
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);


  // Reset appointment date if it falls outside the new campaign's date range
  useEffect(() => {
    if (!currentCampaign) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const campaignStartStr = currentCampaign.startDate.split('T')[0];
    const minDate = campaignStartStr > todayStr ? campaignStartStr : todayStr;
    const maxDate = currentCampaign.endDate.split('T')[0];

    if (appointmentDate && (appointmentDate < minDate || appointmentDate > maxDate)) {
      setAppointmentDate('');
    }
  }, [selectedCampaignId]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollBtn(true);
      else setShowScrollBtn(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch campaigns (public)
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCampaignId = searchParams.get('campaignId');

  useEffect(() => {
    axios.get('http://localhost:5028/api/appointment/campaigns')
      .then(res => {
        setCampaigns(res.data);
        if (initialCampaignId && res.data.some((c: any) => String(c.campaignId) === initialCampaignId)) {
          setSelectedCampaignId(initialCampaignId);
        } else if (res.data.length > 0) {
          setSelectedCampaignId(String(res.data[0].campaignId));
        }
      })
      .catch(err => console.error('Lỗi tải chiến dịch', err));
  }, [initialCampaignId]);

  // Fetch donor profile for pre-filling/displaying (requires auth)
  const fetchDonorProfile = () => {
    if (!user) return;
    setProfileLoading(true);
    axios.get('http://localhost:5028/api/donor/profile', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => setDonorProfile(res.data))
      .catch(err => console.error('Lỗi tải hồ sơ người hiến', err))
      .finally(() => setProfileLoading(false));
  };

  // Fetch history (requires auth)
  const fetchHistory = () => {
    if (!user) return;
    setHistoryLoading(true);
    axios.get('http://localhost:5028/api/appointment/history', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => setHistory(res.data))
      .catch(err => { console.error(err); toast.error('Không thể tải lịch sử.'); })
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    if (user) {
      fetchDonorProfile();
      fetchHistory();
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước tệp tin không được vượt quá 5MB.');
      return;
    }

    setFileUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5028/api/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.token}`
        }
      });
      setUploadedFile(file);
      setUploadedFileId(res.data.fileId);
      toast.success('Tải lên tài liệu khám sức khỏe thành công!');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi tải tệp lên.';
      toast.error(errMsg);
    } finally {
      setFileUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileId(null);
    const fileInput = document.getElementById('health-check-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login?redirect=/appointment'); return; }
    if (!selectedCampaignId || !appointmentDate || !timeSlot) {
      toast.warning('Vui lòng điền đầy đủ thông tin lịch hẹn.'); return;
    }
    setFormLoading(true);
    try {
      const res = await axios.post('http://localhost:5028/api/appointment/register',
        { campaignId: parseInt(selectedCampaignId), appointmentDate, timeSlot, note, fileId: uploadedFileId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      await Swal.fire({
        icon: 'success',
        title: 'Đăng ký thành công!',
        text: res.data.message || 'Lịch hẹn của bạn đã được ghi nhận.',
        confirmButtonColor: '#1B4FD8',
        confirmButtonText: 'Xem lịch sử'
      });
      
      setNote(''); setAppointmentDate('');
      setUploadedFile(null);
      setUploadedFileId(null);
      navigate('/history');
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      Swal.fire({
        icon: 'error',
        title: 'Không thể đăng ký',
        text: errorMsg,
        confirmButtonColor: '#1B4FD8',
        confirmButtonText: 'Đã hiểu'
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh', backgroundColor: '#F8FAFF' }}>
      <ToastContainer position="top-center" autoClose={3000} />

      {/* ── HERO HEADER ───────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #1B4FD8 0%, #2563EB 60%, #1D4ED8 100%)', padding: '3rem 0 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 75% 40%, rgba(255,255,255,0.08) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }} />
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: '0.4rem' }}>Đặt lịch trực tuyến</span>
          <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '1.85rem', color: '#fff', margin: '0.3rem 0 0.5rem' }}>Đăng Ký Hiến Máu Nhân Đạo</h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.9rem', maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            Chọn chiến dịch phù hợp, đặt lịch hẹn và theo dõi trạng thái xét duyệt của bạn ngay tại đây.
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">

          {/* ── TOP: Horizontal Rectangle Form Card ──────────────────── */}
          <div className="col-12">
            <div className="bg-white rounded-4 p-4 p-md-5 position-relative overflow-hidden" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>

              {/* Subtle watermark decoration */}
              <svg style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.03, pointerEvents: 'none' }} width="180" height="180" viewBox="0 0 24 24" fill="#1B4FD8">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>

              {!user ? (
                /* Not logged in overlay */
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-4">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 64, height: 64, backgroundColor: '#EFF6FF', color: '#1B4FD8' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h5 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#111827' }}>Yêu cầu đăng nhập</h5>
                  <p className="text-muted small mb-4" style={{ maxWidth: 380, lineHeight: 1.6 }}>
                    Bạn cần đăng nhập để đặt lịch hẹn hiến máu và theo dõi lịch sử đăng ký của mình.
                  </p>
                  <Link to="/login?redirect=/appointment" className="btn fw-bold rounded-pill px-4 py-2" style={{ fontFamily: 'Montserrat', fontSize: '0.88rem', backgroundColor: '#1B4FD8', color: '#fff' }}>
                    Đăng nhập ngay
                  </Link>
                  <p className="text-muted small mt-3 mb-0">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="text-primary fw-semibold text-decoration-none">Đăng ký miễn phí</Link>
                  </p>
                </div>
              ) : (
                /* Form for logged-in Donor (Sleek Horizontal Layout) */
                <div>
                  <div className="row align-items-center g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <h4 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827', margin: 0, fontSize: '1.25rem' }}>Điền thông tin đặt lịch hẹn</h4>
                      <p className="text-muted small mb-0">Hồ sơ người hiến máu sẽ được đính kèm tự động vào lịch hẹn này.</p>
                    </div>
                    {/* User profile badge right-aligned */}
                    <div className="col-12 col-md-6 d-flex justify-content-md-end">
                      <div className="d-flex align-items-center gap-2.5 px-3 py-2" style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                          {getAvatarChar(donorProfile?.fullName || user.fullName, user.username)}
                        </div>
                        <div className="d-flex flex-column text-start">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF', lineHeight: '1.2' }}>
                            {getDisplayName(donorProfile?.fullName || user.fullName, user.username)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#4B5563', lineHeight: '1.2', marginTop: '2px' }}>
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── PROFILE INFORMATION PRE-FILLED BOX ────────────────── */}
                  {profileLoading ? (
                    <div className="text-center py-3">
                      <span className="spinner-border spinner-border-sm" style={{ color: '#1B4FD8' }} />
                    </div>
                  ) : donorProfile ? (
                    <div className="rounded-3 mb-4 overflow-hidden" style={{ border: '1px solid #DBEAFE' }}>
                      {/* Header bar */}
                      <div className="d-flex justify-content-between align-items-center px-4 py-3" style={{ backgroundColor: '#EFF6FF', borderBottom: '1px solid #DBEAFE' }}>
                        <span style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.83rem', color: '#1E40AF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          THÔNG TIN NGƯỜI HIẾN MÁU
                          <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#60A5FA', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>(Tự động đính kèm)</span>
                        </span>
                        <Link to="/profile" className="text-decoration-none d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2563EB' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Cập nhật thông tin
                        </Link>
                      </div>
                      {/* Fields grid: label on top, value below, 6pt row gap */}
                      <div className="px-4 py-3" style={{ backgroundColor: '#F8FAFF' }}>
                        <div className="row" style={{ rowGap: '6pt', columnGap: 0 }}>
                          {[
                            { label: 'Họ và tên', value: donorProfile.fullName || 'Chưa cập nhật' },
                            { label: 'Số điện thoại', value: donorProfile.phone || '—' },
                            { label: 'Địa chỉ email', value: donorProfile.email },
                            { label: 'Nhóm máu', value: donorProfile.bloodGroup || 'Chưa cập nhật', highlight: true },
                            { label: 'Số CCCD', value: donorProfile.citizenId || 'Chưa cập nhật' },
                            { label: 'Ngày sinh', value: donorProfile.dateOfBirth ? formatDate(donorProfile.dateOfBirth) : 'Chưa cập nhật' },
                            { label: 'Giới tính', value: (donorProfile.gender !== null && donorProfile.gender !== undefined) ? (donorProfile.gender ? 'Nam' : 'Nữ') : 'Chưa cập nhật' },
                            { label: 'Thể trạng', value: (donorProfile.height && donorProfile.weight) ? `${donorProfile.height} cm · ${donorProfile.weight} kg` : 'Chưa cập nhật' },
                            { label: 'Địa chỉ', value: donorProfile.province ? `${donorProfile.address ? donorProfile.address + ', ' : ''}${donorProfile.ward}, ${donorProfile.province}` : 'Chưa cập nhật' },
                          ].map((field, idx) => (
                            <div key={idx} className="col-12 col-sm-6 col-md-4" style={{ marginBottom: '6pt' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                                {field.label}
                              </div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: field.highlight ? '#1B4FD8' : '#1E293B' }}>
                                {field.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3 px-4 py-3 mb-4 d-flex align-items-center gap-2" style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', fontSize: '0.82rem', color: '#1E40AF' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Không tìm thấy hồ sơ. Vui lòng <Link to="/profile" className="fw-bold text-decoration-none" style={{ color: '#1B4FD8' }}>cập nhật hồ sơ cá nhân</Link> của bạn.
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="row g-3">
                    {/* Campaign Selector */}
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-muted mb-1">Chiến dịch hiến máu <span className="text-danger">*</span></label>
                      <select
                        className="form-select custom-input"
                        style={{
                          height: 46,
                          fontSize: '0.88rem',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          paddingRight: '35px'
                        }}
                        value={selectedCampaignId}
                        onChange={e => setSelectedCampaignId(e.target.value)}
                        required
                      >
                        {campaigns.length === 0
                          ? <option value="">Đang tải chiến dịch...</option>
                          : campaigns.map(c => {
                              const isEnded = new Date(c.endDate) < new Date();
                              return (
                                <option key={c.campaignId} value={c.campaignId}>
                                  {c.campaignName}{isEnded ? ' (Đã kết thúc)' : ''}
                                </option>
                              );
                            })
                        }
                      </select>
                    </div>

                    {/* Appointment Date */}
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-muted mb-1">Ngày hẹn hiến <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control custom-input"
                        style={{ height: 46, fontSize: '0.88rem' }}
                        value={appointmentDate}
                        onChange={e => setAppointmentDate(e.target.value)}
                        min={
                          currentCampaign
                            ? (currentCampaign.startDate.split('T')[0] > new Date().toISOString().split('T')[0]
                              ? currentCampaign.startDate.split('T')[0]
                              : new Date().toISOString().split('T')[0])
                            : new Date().toISOString().split('T')[0]
                        }
                        max={currentCampaign ? currentCampaign.endDate.split('T')[0] : undefined}
                        required
                      />
                    </div>

                    {/* Time Slot Selector */}
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-muted mb-1">Khung giờ hẹn <span className="text-danger">*</span></label>
                      <select className="form-select custom-input" style={{ height: 46, fontSize: '0.88rem' }} value={timeSlot} onChange={e => setTimeSlot(e.target.value)} required>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Note input */}
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-muted mb-1">Ghi chú sức khoẻ</label>
                      <input type="text" className="form-control custom-input" style={{ height: 46, fontSize: '0.88rem' }} placeholder="VD: Nhóm O-, huyết áp thấp..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>

                    {/* File Upload for Health Check */}
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-muted mb-1">Phiếu khám sức khỏe (nếu có)</label>
                      <div className="d-flex align-items-center gap-2" style={{ height: 46 }}>
                        <input
                          type="file"
                          id="health-check-file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('health-check-file')?.click()}
                          className={`btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 h-100 ${uploadedFile ? '' : 'w-100'}`}
                          style={{
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            border: '1.5px dashed #1B4FD8',
                            color: '#1B4FD8',
                            fontFamily: 'Montserrat',
                            fontWeight: 600,
                            padding: '0.5rem 1rem'
                          }}
                          disabled={fileUploading}
                        >
                          {fileUploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              Đính kèm tệp
                            </>
                          )}
                        </button>
                        {uploadedFile && (
                          <div 
                            className="d-flex align-items-center justify-content-between px-2.5 rounded-2 flex-grow-1 h-100" 
                            style={{ 
                              backgroundColor: '#E8F0FE', 
                              border: '1px solid #C7D7FA',
                              minWidth: '120px',
                              overflow: 'hidden'
                            }}
                          >
                            <div className="d-flex align-items-center gap-1.5 overflow-hidden flex-grow-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B4FD8" strokeWidth="2.5" className="flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              <span 
                                className="text-dark small fw-semibold text-truncate" 
                                style={{ fontSize: '0.78rem' }}
                                title={uploadedFile.name}
                              >
                                {uploadedFile.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="btn-close ms-1 flex-shrink-0"
                              style={{ width: '6px', height: '6px', fontSize: '0.55rem' }}
                              aria-label="Remove"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Campaign Details Box */}
                    {currentCampaign && (
                      <div className="col-12 mt-3">
                        <div 
                          className="rounded-3 p-4 text-start" 
                          style={{ 
                            background: 'linear-gradient(to right, #F8FAFF 0%, #EFF6FF 100%)', 
                            border: '1px solid #BFDBFE', 
                            borderRadius: '12px',
                            animation: 'fadeInDown 0.2s ease'
                          }}
                        >
                          <h6 className="mb-3 d-flex align-items-center justify-content-between fw-bold" style={{ color: '#1E40AF', fontSize: '0.88rem', letterSpacing: '0.03em' }}>
                            <span className="d-flex align-items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              THÔNG TIN CHI TIẾT CHIẾN DỊCH ĐÃ CHỌN
                            </span>
                            {isCampaignEnded ? (
                              <span className="badge bg-danger text-white rounded-pill px-2.5 py-1" style={{ fontSize: '0.7rem', fontFamily: 'Montserrat' }}>
                                CHIẾN DỊCH ĐÃ KẾT THÚC
                              </span>
                            ) : isCampaignClosedOrCancelled ? (
                              <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1" style={{ fontSize: '0.7rem', fontFamily: 'Montserrat' }}>
                                ĐÃ ĐÓNG ĐĂNG KÝ
                              </span>
                            ) : null}
                          </h6>
                          <div className="row g-3" style={{ fontSize: '0.85rem' }}>
                            <div className="col-12 col-md-6">
                              <div className="mb-2">
                                <span className="text-muted fw-semibold d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Tên chiến dịch</span>
                                <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{currentCampaign.campaignName}</strong>
                              </div>
                              <div className="mb-2">
                                <span className="text-muted fw-semibold d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Ban tổ chức</span>
                                <span className="text-dark fw-semibold">{currentCampaign.organizer}</span>
                              </div>
                              <div className="mb-2">
                                <span className="text-muted fw-semibold d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Thời gian tổ chức</span>
                                <span className="text-dark fw-semibold">
                                  {new Date(currentCampaign.startDate).toLocaleDateString('vi-VN')} - {new Date(currentCampaign.endDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <div className="mb-2">
                                <span className="text-muted fw-semibold d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Địa điểm hiến máu</span>
                                <span className="text-dark fw-semibold">{currentCampaign.location}</span>
                              </div>
                              <div className="mt-3">
                                <span className="text-muted fw-semibold d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Giới hạn đăng ký & Số lượng đã nhận</span>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                  <strong className="text-dark" style={{ fontSize: '0.95rem' }}>{currentCampaign.registrantCount} người</strong>
                                  <span className="text-muted">/</span>
                                  <span className="text-secondary fw-semibold" style={{ fontSize: '0.85rem' }}>
                                    {currentCampaign.maxParticipants ? `Tối đa ${currentCampaign.maxParticipants} người` : 'Không giới hạn'}
                                  </span>
                                </div>
                                {currentCampaign.maxParticipants && (
                                  <>
                                    <div className="progress mt-2" style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E5E7EB' }}>
                                      <div 
                                        className="progress-bar" 
                                        role="progressbar" 
                                        style={{ 
                                          width: `${Math.min(100, (currentCampaign.registrantCount / currentCampaign.maxParticipants) * 100)}%`,
                                          backgroundColor: 
                                            currentCampaign.registrantCount >= currentCampaign.maxParticipants 
                                              ? '#D42B2B' 
                                              : (currentCampaign.registrantCount / currentCampaign.maxParticipants) >= 0.8 
                                                ? '#D97706' 
                                                : '#1B4FD8',
                                          borderRadius: '3px',
                                          transition: 'width 0.3s ease'
                                        }} 
                                        aria-valuenow={currentCampaign.registrantCount} 
                                        aria-valuemin={0} 
                                        aria-valuemax={currentCampaign.maxParticipants}
                                      />
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-1.5 text-muted" style={{ fontSize: '0.72rem' }}>
                                      {isCampaignEnded ? (
                                        <span className="text-danger fw-bold d-flex align-items-center gap-1">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                          CHIẾN DỊCH ĐÃ KẾT THÚC
                                        </span>
                                      ) : currentCampaign.registrantCount >= currentCampaign.maxParticipants ? (
                                        <span className="text-danger fw-bold d-flex align-items-center gap-1">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                          ĐÃ HẾT SLOT
                                        </span>
                                      ) : (
                                        <span>Còn lại: <strong className="text-dark">{Math.max(0, currentCampaign.maxParticipants - currentCampaign.registrantCount)}</strong> chỗ trống</span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="col-12 col-md-6 d-flex flex-column justify-content-between">
                              <div className="mb-3">
                                <span className="text-muted fw-semibold d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Giới thiệu / Nội dung</span>
                                <p className="text-secondary mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                                  {currentCampaign.description || 'Chưa có mô tả chi tiết cho chiến dịch này.'}
                                </p>
                              </div>
                              {currentCampaign.attachmentUrl && (
                                <div className="mt-auto">
                                  <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Tài liệu đính kèm (Kế hoạch / Tuyên bố)</span>
                                  <a 
                                    href={currentCampaign.attachmentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="d-inline-flex align-items-center gap-2 text-decoration-none fw-bold px-3 py-2" 
                                    style={{ 
                                      color: '#1B4FD8', 
                                      backgroundColor: '#E8F0FE', 
                                      border: '1px solid #BFDBFE',
                                      fontSize: '0.78rem',
                                      transition: 'all 0.2s',
                                      borderRadius: '8px'
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.backgroundColor = '#C7D7FA';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.backgroundColor = '#E8F0FE';
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    {currentCampaign.attachmentName || 'TaiLieuDinhKem.pdf'}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full-width submit button */}
                    <div className="col-12 mt-3">
                      <button
                        type="submit"
                        disabled={formLoading || !canRegister}
                        className="btn fw-bold rounded-pill w-100"
                        style={{ 
                          fontFamily: 'Montserrat', 
                          fontSize: '0.92rem', 
                          backgroundColor: (!canRegister) ? '#9CA3AF' : '#1B4FD8', 
                          color: '#fff', 
                          border: 'none', 
                          boxShadow: (!canRegister) ? 'none' : '0 6px 20px rgba(27,79,216,0.3)', 
                          height: 48, 
                          transition: 'all 0.2s',
                          cursor: (!canRegister) ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={e => {
                          if (canRegister) e.currentTarget.style.backgroundColor = '#1E40AF';
                        }}
                        onMouseLeave={e => {
                          if (canRegister) e.currentTarget.style.backgroundColor = '#1B4FD8';
                        }}
                      >
                        {formLoading ? (
                          <><span className="spinner-border spinner-border-sm me-2" />Đang đăng ký...</>
                        ) : isCampaignEnded ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Chiến dịch đã kết thúc
                          </span>
                        ) : isCampaignClosedOrCancelled ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Chiến dịch đã bị đóng hoặc hủy
                          </span>
                        ) : isCampaignFull ? (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Chiến dịch đã đủ số lượng đăng ký
                          </span>
                        ) : (
                          <span className="d-flex align-items-center justify-content-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Gửi yêu cầu đăng ký hiến máu
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTTOM: Left Info Cards & Right History Table ───────── */}

          {/* Info cards (Left) */}
          <div className="col-12 col-xl-4 d-flex flex-column gap-3">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#D42B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                ),
                bg: '#FEF0F0',
                title: '5 phút cứu sống 3 người',
                desc: 'Một đơn vị máu hiến tặng có thể tách thành hồng cầu, tiểu cầu và huyết tương để cứu sống 3 người bệnh.'
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                    <path d="M9 11l3 3L22 4M21 12a9 9 0 1 1-9-9" />
                  </svg>
                ),
                bg: '#EFF6FF',
                title: 'Quy trình nhanh gọn',
                desc: 'Đăng ký online → Sàng lọc sức khỏe → Hiến máu (10-15 phút) → Nghỉ ngơi & Nhận chứng nhận hiến máu.'
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                ),
                bg: '#FFFBEB',
                title: 'Thông báo tức thời',
                desc: 'Hệ thống tự động thông báo kết quả phê duyệt lịch hẹn và gửi nhắc nhở lịch hẹn qua tài khoản của bạn.'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-4 p-4 d-flex gap-3 align-items-start" style={{ border: '1px solid #E5E7EB', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 44, height: 44, backgroundColor: item.bg }}>
                  {item.icon}
                </div>
                <div>
                  <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111827', fontFamily: 'Montserrat' }}>{item.title}</h6>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* History table (Right) */}
          <div className="col-12 col-xl-8">
            <div className="bg-white rounded-4 p-4 h-100 d-flex flex-column" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', minHeight: 330 }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#111827', fontSize: '1rem', margin: 0 }}>Lịch sử đăng ký (Gần đây)</h5>
                {history.length > 0 && (
                  <Link to="/history" className="text-decoration-none fw-semibold" style={{ fontSize: '0.82rem', color: '#1B4FD8' }}>
                    Xem tất cả &rarr;
                  </Link>
                )}
              </div>

              {!user ? (
                <div className="text-center py-5 my-auto text-muted small">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" className="mb-2 opacity-50">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="mb-0">Đăng nhập để xem lịch sử đăng ký hiến máu của bạn.</p>
                </div>
              ) : historyLoading ? (
                <div className="text-center py-5 my-auto">
                  <div className="spinner-border text-danger spinner-border-sm" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-5 my-auto text-muted small">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="50" height="50" className="mb-3 opacity-50 text-primary">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="mb-3">Bạn chưa có lịch hẹn nào.</p>
                  <Link to="/history" className="btn btn-outline-primary rounded-pill px-4 fw-semibold" style={{ fontSize: '0.85rem' }}>
                    Đi đến trang Lịch sử
                  </Link>
                </div>
              ) : (
                <div className="table-responsive my-auto">
                  <table className="table align-middle table-hover mb-0" style={{ fontSize: '0.84rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Chiến dịch / Địa điểm</th>
                        <th>Ngày hẹn</th>
                        <th>Trạng thái</th>
                        <th>Phiếu khám</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 3).map(a => (
                        <tr key={a.appointmentId}>
                          <td>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>{a.campaignName}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{a.location}</div>
                          </td>
                          <td>
                            <div className="fw-semibold text-primary">{formatDate(a.appointmentDate)}</div>
                          </td>
                          <td>{getStatusBadge(a.status)}</td>
                          <td>
                            {a.fileUrl ? (
                              <a href={`http://localhost:5028${a.fileUrl}`} target="_blank" rel="noopener noreferrer" className="d-inline-flex align-items-center gap-1 text-decoration-none fw-bold small" style={{ color: '#1B4FD8' }} title="Tải xuống">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                Xem
                              </a>
                            ) : <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {history.length > 3 && (
                    <div className="text-center mt-3">
                      <Link to="/history" className="text-decoration-none fw-bold" style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        Xem tất cả lịch sử ({history.length})
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── SCROLL TO TOP FLOATING BUTTON ────────────────────────── */}
      {showScrollBtn && (
        <button
          onClick={scrollToTop}
          className="d-flex align-items-center justify-content-center position-fixed border-0 shadow-lg"
          style={{
            right: '25px',
            bottom: '25px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#1B4FD8',
            color: '#fff',
            zIndex: 9999,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          title="Cuộn lên đầu trang"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* ── PROFILE UPDATE PROMPT MODAL ────────────────────────── */}
      {showProfileModal && (
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
            zIndex: 10000,
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div 
            className="bg-white rounded-4 p-4 text-center shadow-2xl mx-3" 
            style={{ 
              maxWidth: '460px', 
              border: '1px solid #E2E8F0',
              animation: 'fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" 
              style={{ width: '64px', height: '64px', backgroundColor: '#EFF6FF', color: '#1B4FD8' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h4 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>
              Cập nhật thông tin cá nhân
            </h4>
            <p className="text-muted small mb-4" style={{ lineHeight: 1.6 }}>
              Chào mừng bạn đến với <strong>LifeGive</strong>! Để có thể đặt lịch hẹn hiến máu và nhận thông tin hỗ trợ tốt nhất, vui lòng hoàn tất cập nhật hồ sơ của bạn.
            </p>
            <div className="d-flex flex-column gap-2">
              <Link 
                to="/profile" 
                className="btn-primary-custom w-100 py-2.5 d-flex align-items-center justify-content-center"
                style={{ fontSize: '0.9rem' }}
                onClick={handleDismissModal}
              >
                Cập nhật ngay
              </Link>
              <button 
                className="btn btn-link text-decoration-none text-muted small py-2"
                onClick={handleDismissModal}
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
