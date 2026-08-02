import React, { useState, useEffect, useRef } from 'react';
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
  const [showProfileError, setShowProfileError] = useState(false);
  const profileSectionRef = useRef<HTMLDivElement>(null);


  // Reset or auto-fill appointment date based on the new campaign's date range
  useEffect(() => {
    if (!currentCampaign) return;
    // Helper to get local date string YYYY-MM-DD to avoid timezone bugs
    const getLocalDateStr = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };
    
    const todayStr = getLocalDateStr(new Date());
    const campaignStartStr = currentCampaign.startDate.split('T')[0];
    const minDate = campaignStartStr > todayStr ? campaignStartStr : todayStr;
    const maxDate = currentCampaign.endDate.split('T')[0];

    // Auto-select if there's only 1 valid day
    if (minDate === maxDate) {
      setAppointmentDate(minDate);
    } else if (appointmentDate && (appointmentDate < minDate || appointmentDate > maxDate)) {
      setAppointmentDate('');
    }
  }, [selectedCampaignId, currentCampaign, appointmentDate]);

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
        } else {
          setSelectedCampaignId(''); // Không tự động chọn, bắt buộc người dùng tự chọn
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
      .then(res => setHistory(res.data.items || []))
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
        confirmButtonColor: '#DC2626',
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
        confirmButtonColor: '#DC2626',
        confirmButtonText: 'Đã hiểu'
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh', backgroundColor: '#FFF1F2' }}>
      <ToastContainer position="top-center" autoClose={3000} />

      {/* ── HERO HEADER ───────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #FDF2F2 0%, #FEE2E2 50%, #FECACA 100%)',
        padding: '3rem 0 5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Wavy background decoration */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'radial-gradient(#F87171 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
        <div className="container position-relative d-flex justify-content-between align-items-center" style={{ zIndex: 1 }}>
          <div style={{ maxWidth: 600 }}>
            <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '0.3rem 0.8rem', borderRadius: '20px', marginBottom: '1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" className="me-2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
              ĐẶT LỊCH TRỰC TUYẾN
            </span>
            <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '2.5rem', color: '#1E293B', margin: '0.3rem 0 0.8rem', lineHeight: 1.3 }}>Đăng Ký Hiến Máu Nhân Đạo</h1>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, maxWidth: '400px' }}>
              Chọn chiến dịch phù hợp, đặt lịch hẹn và theo dõi trạng thái xét duyệt của bạn ngay tại đây.
            </p>
          </div>
          {/* Decorative Blood Drop Area */}
          <div className="d-none d-lg-block position-relative" style={{ width: 160, height: 160, marginRight: '40px' }}>
            <div style={{ width: 140, height: 140, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', boxShadow: '0 10px 30px rgba(220,38,38,0.4)', position: 'absolute', top: 10, right: 10 }} className="d-flex align-items-center justify-content-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" width="48" height="48" style={{ transform: 'rotate(45deg)' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            {/* Floating hearts */}
            <svg viewBox="0 0 24 24" fill="#FCA5A5" width="24" height="24" style={{ position: 'absolute', top: 0, left: -20, opacity: 0.8, animation: 'pulse 2s infinite' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            <svg viewBox="0 0 24 24" fill="#F87171" width="32" height="32" style={{ position: 'absolute', bottom: -10, left: -40, opacity: 0.6, animation: 'pulse 3s infinite' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            {/* Background pattern */}
            <div style={{ position: 'absolute', right: '-80px', top: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', opacity: 0.3 }}>
              {Array.from({length: 16}).map((_, i) => <div key={i} style={{width: '6px', height: '6px', backgroundColor: '#fff', borderRadius: '50%'}}></div>)}
            </div>
          </div>
        </div>
        {/* Wave effect SVG at bottom */}
        <svg style={{ position: 'absolute', bottom: -2, left: 0, right: 0, width: '100%', height: 60 }} preserveAspectRatio="none" viewBox="0 0 1440 320" fill="#FFF1F2">
          <path fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <div className="container py-5">
        <div className="row g-4">

          {/* ── TOP: Horizontal Rectangle Form Card ──────────────────── */}
          <div className="col-12" style={{ marginTop: '-40px', zIndex: 10, position: 'relative' }}>
            <div className="bg-white rounded-4 p-4 p-md-5 position-relative" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
              
              {/* Decorative background layer for clipping the watermark without clipping the badge */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '1rem', pointerEvents: 'none', zIndex: 0 }}>
                {/* Subtle watermark decoration */}
                <svg style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.03 }} width="180" height="180" viewBox="0 0 24 24" fill="#DC2626">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>

              {/* Keep contents above the watermark layer */}
              <div style={{ position: 'relative', zIndex: 1 }}>

              {!user ? (
                /* Not logged in overlay */
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-4">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 64, height: 64, backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h5 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#111827' }}>Yêu cầu đăng nhập</h5>
                  <p className="text-muted small mb-4" style={{ maxWidth: 380, lineHeight: 1.6 }}>
                    Bạn cần đăng nhập để đặt lịch hẹn hiến máu và theo dõi lịch sử đăng ký của mình.
                  </p>
                  <Link to="/login?redirect=/appointment" className="btn fw-bold rounded-pill px-4 py-2" style={{ fontFamily: 'Montserrat', fontSize: '0.88rem', backgroundColor: '#DC2626', color: '#fff' }}>
                    Đăng nhập ngay
                  </Link>
                  <p className="text-muted small mt-3 mb-0">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="text-primary fw-semibold text-decoration-none">Đăng ký miễn phí</Link>
                  </p>
                </div>
              ) : (
                /* Form for logged-in Donor */
                <div>
                  {/* User profile badge right-aligned, overlapping */}
                  <div className="d-none d-md-flex justify-content-end mb-4" style={{ marginTop: '-75px', position: 'relative', zIndex: 2 }}>
                    <div className="d-flex align-items-center gap-2.5 px-3 py-2 bg-white rounded-pill shadow-sm" style={{ border: '1px solid #FEE2E2', paddingRight: '1.5rem' }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                        {getAvatarChar(donorProfile?.fullName || user.fullName, user.username)}
                      </div>
                      <div className="d-flex flex-column text-start">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', lineHeight: '1.2' }}>
                          {getDisplayName(donorProfile?.fullName || user.fullName, user.username)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.2', marginTop: '2px' }}>
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── PROFILE INFORMATION PRE-FILLED BOX ────────────────── */}
                  {profileLoading ? (
                    <div className="text-center py-3">
                      <span className="spinner-border spinner-border-sm" style={{ color: '#DC2626' }} />
                    </div>
                  ) : donorProfile ? (
                    <div className="rounded-3 mb-4 overflow-hidden" style={{ border: '1px solid #FEE2E2' }}>
                      {/* Header bar */}
                      <div className="d-flex justify-content-between align-items-center px-4 py-3" style={{ backgroundColor: '#FEF2F2', borderBottom: '1px solid #FEE2E2' }}>
                        <span style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.83rem', color: '#B91C1C', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          THÔNG TIN NGƯỜI HIẾN MÁU
                          <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#F87171', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>(Tự động đính kèm)</span>
                        </span>
                        <Link to="/profile" className="text-decoration-none d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#EF4444' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          Cập nhật thông tin
                        </Link>
                      </div>
                      {/* Fields grid: label on top, value below, 6pt row gap */}
                      <div className="px-4 py-3" style={{ backgroundColor: '#FFF1F2' }}>
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
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                                {field.label}
                              </div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: field.highlight ? '#DC2626' : '#1E293B' }}>
                                {field.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3 px-4 py-3 mb-4 d-flex align-items-center gap-2" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', fontSize: '0.82rem', color: '#B91C1C' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      Không tìm thấy hồ sơ. Vui lòng <Link to="/profile" className="fw-bold text-decoration-none" style={{ color: '#DC2626' }}>cập nhật hồ sơ cá nhân</Link> của bạn.
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
                          : (
                            <>
                              <option value="" disabled>-- Vui lòng chọn chiến dịch --</option>
                              {campaigns.filter(c => new Date(c.endDate) >= new Date()).map(c => {
                                const isEnded = false; // We already filtered them out
                                return (
                                  <option key={c.campaignId} value={c.campaignId}>
                                    {c.campaignName}{isEnded ? ' (Đã kết thúc)' : ''}
                                  </option>
                                );
                              })}
                            </>
                          )
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
                            ? (() => {
                                const offset = new Date().getTimezoneOffset();
                                const todayLocal = new Date(new Date().getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
                                const start = currentCampaign.startDate.split('T')[0];
                                return start > todayLocal ? start : todayLocal;
                              })()
                            : (() => {
                                const offset = new Date().getTimezoneOffset();
                                return new Date(new Date().getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
                              })()
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
                      <div className="d-flex align-items-center gap-2">
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
                          className={`btn d-flex flex-column align-items-center justify-content-center w-100`}
                          style={{
                            borderRadius: '8px',
                            backgroundColor: '#FEF2F2',
                            border: '1.5px dashed #FCA5A5',
                            color: '#DC2626',
                            fontFamily: 'Montserrat',
                            fontWeight: 600,
                            padding: '1rem',
                            minHeight: '60px'
                          }}
                          disabled={fileUploading}
                        >
                          {fileUploading ? (
                            <div className="d-flex align-items-center gap-2">
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                              <span style={{ fontSize: '0.82rem' }}>Đang tải...</span>
                            </div>
                          ) : uploadedFile ? (
                            <div className="d-flex align-items-center justify-content-between w-100">
                              <div className="d-flex align-items-center gap-1.5 overflow-hidden flex-grow-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" className="flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                <span className="text-dark small fw-semibold text-truncate" style={{ fontSize: '0.78rem' }}>
                                  {uploadedFile.name}
                                </span>
                              </div>
                              <div
                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                                className="ms-2 flex-shrink-0 text-danger"
                                style={{ fontSize: '1rem', lineHeight: 1 }}
                              >
                                &times;
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="d-flex align-items-center gap-1">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Đính kèm tệp
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '4px', fontWeight: 400 }}>Định dạng: PDF, JPG, PNG (Tối đa 5MB)</div>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Selected Campaign Details Box */}
                    {currentCampaign && (
                      <div className="col-12 mt-4">
                        <div
                          className="rounded-4 overflow-hidden"
                          style={{
                            background: '#FFF5F5',
                            border: '1px solid #FEE2E2',
                            animation: 'fadeInDown 0.2s ease'
                          }}
                        >
                          <div className="p-4 row g-4">
                            <div className="col-12 col-md-6 border-end border-danger border-opacity-25 pe-md-4">
                              <h6 className="mb-3 d-flex align-items-center fw-bold text-danger" style={{ fontSize: '0.9rem', letterSpacing: '0.03em' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                Thông tin chi tiết chiến dịch đã chọn
                              </h6>
                              <div className="mb-2">
                                <span className="text-muted d-block small mb-1">Tên chiến dịch</span>
                                <strong className="text-dark" style={{ fontSize: '0.95rem' }}>{currentCampaign.campaignName}</strong>
                              </div>
                              <div className="mb-2">
                                <span className="text-muted d-block small mb-1">Ban tổ chức</span>
                                <strong className="text-dark" style={{ fontSize: '0.85rem' }}>{currentCampaign.organizer}</strong>
                              </div>
                              <div className="mb-2">
                                <span className="text-muted d-block small mb-1">Thời gian tổ chức</span>
                                <strong className="text-dark d-flex align-items-center gap-1" style={{ fontSize: '0.85rem' }}>
                                  {new Date(currentCampaign.startDate).toLocaleDateString('vi-VN')} - {new Date(currentCampaign.endDate).toLocaleDateString('vi-VN')}
                                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" width="14" height="14" className="ms-1" style={{backgroundColor: '#FEF2F2', borderRadius: '4px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                </strong>
                              </div>
                              <div className="mb-3">
                                <span className="text-muted d-block small mb-1">Địa điểm hiến máu</span>
                                <strong className="text-dark d-flex align-items-center gap-1" style={{ fontSize: '0.85rem' }}>
                                  {currentCampaign.location}
                                  <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" width="14" height="14" className="ms-1" style={{backgroundColor: '#F3E8FF', borderRadius: '4px'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                </strong>
                              </div>
                              <div>
                                <span className="text-muted d-block small mb-1">Giới hạn đăng ký & số lượng đã nhận</span>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <strong className="text-dark" style={{ fontSize: '0.85rem' }}>{currentCampaign.registrantCount} người</strong>
                                  <span className="text-muted">/</span>
                                  <strong className="text-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.85rem' }}>
                                    {currentCampaign.maxParticipants ? `Tối đa ${currentCampaign.maxParticipants} người` : 'Không giới hạn'}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" width="14" height="14" className="ms-1" style={{backgroundColor: '#FDF2F8', borderRadius: '4px'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                  </strong>
                                </div>
                                {currentCampaign.maxParticipants && (
                                  <div className="text-dark small mt-2">
                                    Còn lại: <strong className="text-dark">{Math.max(0, currentCampaign.maxParticipants - currentCampaign.registrantCount)} chỗ trống</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="col-12 col-md-6 position-relative ps-md-4">
                                {/* Watermark heart drop on right */}
                                <svg style={{ position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)', opacity: 0.05, pointerEvents: 'none' }} width="140" height="140" viewBox="0 0 24 24" fill="#DC2626">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                <div className="position-relative" style={{ zIndex: 1 }}>
                                  <span className="text-muted d-block small mb-1">Giới thiệu / Nội dung</span>
                                  <p className="text-secondary mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                    {currentCampaign.description || 'Chưa có mô tả chi tiết cho chiến dịch này.'}
                                  </p>
                                  {currentCampaign.attachmentUrl && (
                                    <div className="mt-3">
                                      <span className="text-muted d-block small mb-1">Tài liệu đính kèm (Kế hoạch / Tuyên bố)</span>
                                      <a
                                        href={currentCampaign.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="d-inline-flex align-items-center gap-2 text-decoration-none fw-bold px-3 py-2"
                                        style={{
                                          color: '#DC2626',
                                          backgroundColor: '#FEF2F2',
                                          border: '1px solid #FCA5A5',
                                          fontSize: '0.78rem',
                                          transition: 'all 0.2s',
                                          borderRadius: '8px'
                                        }}
                                        onMouseEnter={e => {
                                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                                        }}
                                        onMouseLeave={e => {
                                          e.currentTarget.style.backgroundColor = '#FEF2F2';
                                        }}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                        {currentCampaign.attachmentName || 'TaiLieuDinhKem.pdf'}
                                      </a>
                                    </div>
                                  )}
                                </div>
                            </div>
                          </div>
                          
                          {/* Submit button attached to the bottom of the details box */}
                          <button
                            type="submit"
                            disabled={formLoading || !canRegister}
                            className="btn fw-bold w-100 py-3 rounded-0"
                            style={{
                              fontFamily: 'Montserrat',
                              fontSize: '0.95rem',
                              backgroundColor: (!canRegister) ? '#9CA3AF' : '#EA4335',
                              color: '#fff',
                              border: 'none',
                              transition: 'all 0.2s',
                              cursor: (!canRegister) ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={e => {
                              if (canRegister) e.currentTarget.style.backgroundColor = '#D93025';
                            }}
                            onMouseLeave={e => {
                              if (canRegister) e.currentTarget.style.backgroundColor = '#EA4335';
                            }}
                          >
                            {formLoading ? (
                              <><span className="spinner-border spinner-border-sm me-2" />Đang xử lý...</>
                            ) : isCampaignEnded ? (
                              <span className="d-flex align-items-center justify-content-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                Chiến dịch đã kết thúc
                              </span>
                            ) : isCampaignClosedOrCancelled ? (
                              <span className="d-flex align-items-center justify-content-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                Chiến dịch đã bị đóng hoặc hủy
                              </span>
                            ) : isCampaignFull ? (
                              <span className="d-flex align-items-center justify-content-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                Chiến dịch đã đủ số lượng đăng ký
                              </span>
                            ) : (
                              <span className="d-flex align-items-center justify-content-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                Gửi yêu cầu đăng ký hiến máu
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
              </div>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                    <path d="M9 11l3 3L22 4M21 12a9 9 0 1 1-9-9" />
                  </svg>
                ),
                bg: '#FEF2F2',
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
                  <Link to="/history" className="text-decoration-none fw-semibold" style={{ fontSize: '0.82rem', color: '#DC2626' }}>
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
                              <a href={`http://localhost:5028${a.fileUrl}`} target="_blank" rel="noopener noreferrer" className="d-inline-flex align-items-center gap-1 text-decoration-none fw-bold small" style={{ color: '#DC2626' }} title="Tải xuống">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
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
                        Xem tất cả lịch sử ({history.length > 3 ? 'nhiều hơn 3' : history.length})
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
            backgroundColor: '#DC2626',
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
              style={{ width: '64px', height: '64px', backgroundColor: '#FEF2F2', color: '#DC2626' }}
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
