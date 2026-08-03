import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AppointmentDetailModal } from '../../components/AppointmentDetailModal';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

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

const getStatusBadge = (statusStr: string | null) => {
  if (!statusStr) return <span className="badge bg-warning text-dark px-2 py-1 rounded-pill" style={{ fontWeight: 500, fontSize: '0.75rem' }}>Đang chờ duyệt</span>;
  switch (statusStr.toLowerCase()) {
    case 'pending': return <span className="badge px-2 py-1 rounded-pill" style={{ backgroundColor: '#FFF8E1', color: '#F57F17', fontWeight: 500, fontSize: '0.75rem' }}>Đang chờ duyệt</span>;
    case 'confirmed': return <span className="badge px-2 py-1 rounded-pill" style={{ backgroundColor: '#E3F2FD', color: '#1976D2', fontWeight: 500, fontSize: '0.75rem' }}>Đã xác nhận</span>;
    case 'completed': return <span className="badge px-2 py-1 rounded-pill" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 500, fontSize: '0.75rem' }}>Đã hoàn thành</span>;
    case 'cancelled': return <span className="badge px-2 py-1 rounded-pill" style={{ backgroundColor: '#FFEBEE', color: '#C62828', fontWeight: 500, fontSize: '0.75rem' }}>Đã hủy</span>;
    case 'absent': return <span className="badge px-2 py-1 rounded-pill" style={{ backgroundColor: '#FFEBEE', color: '#C62828', fontWeight: 500, fontSize: '0.75rem' }}>Vắng mặt</span>;
    default: return <span className="badge bg-light text-dark px-2 py-1 rounded-pill" style={{ fontWeight: 500, fontSize: '0.75rem' }}>{statusStr}</span>;
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return dateStr || ''; }
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  } catch { return dateStr || ''; }
};

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Tất cả');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // Pagination
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  const fetchHistory = (page: number = 1) => {
    if (!user) return;
    setLoading(true);
    axios.get(`http://localhost:5028/api/appointment/history?pageIndex=${page}&pageSize=10`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => {
        if (page === 1) {
          setHistory(res.data.items);
        } else {
          setHistory(prev => [...prev, ...res.data.items]);
        }
        setTotalCount(res.data.totalCount);
        setHasMore(res.data.pageIndex < res.data.totalPages);
      })
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng tải lại trang hoặc đăng nhập lại.');
        } else {
          toast.error('Không thể tải lịch sử.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPageIndex(1);
    fetchHistory(1);
  }, [user]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = pageIndex + 1;
      setPageIndex(nextPage);
      fetchHistory(nextPage);
    }
  };

  if (!user) {
    return (
      <div className="container py-5 text-center mt-5">
        <h4>Yêu cầu đăng nhập</h4>
        <Link to="/login" className="btn btn-primary mt-3">Đăng nhập ngay</Link>
      </div>
    );
  }

  const handleCancelRegistration = async (appointmentId: number) => {
    const confirm = await Swal.fire({
      title: 'Hủy đăng ký?',
      text: "Bạn có chắc chắn muốn hủy đăng ký hiến máu này không? Hành động này không thể hoàn tác.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Không'
    });

    if (confirm.isConfirmed && user) {
      try {
        await axios.put(`http://localhost:5028/api/appointment/donor/cancel/${appointmentId}`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        toast.success('Hủy đăng ký thành công.');
        fetchHistory();
      } catch (error) {
        console.error('Error canceling appointment:', error);
        toast.error('Không thể hủy đăng ký.');
      }
    }
  };

  const handleDownloadCertificate = async (appointment: AppointmentHistory) => {
    const certElement = document.getElementById(`certificate-${appointment.appointmentId}`);
    if (!certElement) return;

    // Show briefly to render
    certElement.style.display = 'block';

    try {
      const canvas = await html2canvas(certElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape A4
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      pdf.save(`ChungNhanHienMau_REG${appointment.appointmentId}.pdf`);
      toast.success('Đã tải chứng nhận thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo chứng nhận.');
    } finally {
      // Hide again
      certElement.style.display = 'none';
    }
  };

  const tabs = ['Tất cả', 'Đang chờ duyệt', 'Đã xác nhận', 'Đã hoàn thành', 'Đã hủy', 'Vắng mặt'];

  // Calculate stats - Note: this is based on current loaded items, in a real app this should come from a separate API summary
  const total = totalCount || history.length;
  const completed = history.filter(x => x.status.toLowerCase() === 'completed').length;
  const pending = history.filter(x => x.status.toLowerCase() === 'pending').length;
  const volume = completed * 350;

  // Filter items
  const filteredHistory = history.filter(h => {
    const s1 = (activeTab === 'Tất cả') || (
      (activeTab === 'Đang chờ duyệt' && h.status.toLowerCase() === 'pending') ||
      (activeTab === 'Đã xác nhận' && h.status.toLowerCase() === 'confirmed') ||
      (activeTab === 'Đã hoàn thành' && h.status.toLowerCase() === 'completed') ||
      (activeTab === 'Đã hủy' && h.status.toLowerCase() === 'cancelled') ||
      (activeTab === 'Vắng mặt' && h.status.toLowerCase() === 'absent')
    );
    const s2 = statusFilter === 'Tất cả' || (
      (statusFilter === 'Đang chờ duyệt' && h.status.toLowerCase() === 'pending') ||
      (statusFilter === 'Đã xác nhận' && h.status.toLowerCase() === 'confirmed') ||
      (statusFilter === 'Đã hoàn thành' && h.status.toLowerCase() === 'completed') ||
      (statusFilter === 'Đã hủy' && h.status.toLowerCase() === 'cancelled') ||
      (statusFilter === 'Vắng mặt' && h.status.toLowerCase() === 'absent')
    );
    const s3 = h.campaignName.toLowerCase().includes(searchTerm.toLowerCase());
    return s1 && s2 && s3;
  });

  return (
    <div className="fade-in" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', paddingBottom: '4rem', fontFamily: "'Inter', sans-serif" }}>
<style>{`
        .custom-tab { color: #6B7280; font-weight: 600; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; }
        .custom-tab.active { color: #DC2626; border-bottom: 2px solid #DC2626; }
        .history-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; transition: all 0.2s; }
        .history-card:hover { border-color: #D1D5DB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .stat-card { border: 1px solid #F3F4F6; background: #fff; border-radius: 12px; }
      `}</style>

      {/* HERO HEADER */}
      <div className="container pt-5 pb-3" style={{ marginTop: '5rem' }}>
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h1 style={{ fontWeight: 800, color: '#111827', fontSize: '2.5rem', marginBottom: '0.2rem' }}>
              Lịch sử đăng ký<br /><span style={{ color: '#DC2626' }}>hiến máu</span>
            </h1>
            <p className="text-muted mt-2" style={{ fontSize: '1rem', maxWidth: 350 }}>
              Theo dõi và quản lý các chiến dịch hiến máu bạn đã đăng ký tham gia.
            </p>
          </div>
          <div className="col-12 col-md-6 d-none d-md-flex justify-content-end">
            <img src="https://firebasestorage.googleapis.com/v0/b/blooddonationsystem-8d4a9.appspot.com/o/blood_bag_illustration.png?alt=media"
              alt="Blood Bag" style={{ height: '220px', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </div>
      </div>

      <div className="container mb-4">
        {/* STATS */}
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="stat-card p-3 shadow-sm d-flex gap-3 align-items-center">
              <div style={{ width: 48, height: 48, backgroundColor: '#FEE2E2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Tổng lượt đăng ký</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{total} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF' }}>Chiến dịch</span></div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card p-3 shadow-sm d-flex gap-3 align-items-center">
              <div style={{ width: 48, height: 48, backgroundColor: '#DCFCE7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Đã hoàn thành</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{completed} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF' }}>Lượt hiến máu</span></div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card p-3 shadow-sm d-flex gap-3 align-items-center">
              <div style={{ width: 48, height: 48, backgroundColor: '#FEF9C3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CA8A04' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Đang chờ duyệt</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{pending} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF' }}>Lượt đăng ký</span></div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card p-3 shadow-sm d-flex gap-3 align-items-center">
              <div style={{ width: 48, height: 48, backgroundColor: '#F3E8FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Lượng máu đã hiến</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{volume} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF' }}>ml Tổng cộng</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-3 shadow-sm p-3 mt-4 mb-3 d-flex flex-wrap gap-3 align-items-end" style={{ border: '1px solid #E5E7EB' }}>
          <div style={{ flex: '1 1 250px' }}>
            <div className="position-relative">
              <svg className="position-absolute" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ top: '10px', left: '12px' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" className="form-control ps-5" placeholder="Tìm kiếm chiến dịch..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ fontSize: '0.875rem' }} />
            </div>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem' }}>Trạng thái</label>
            <select className="form-select" style={{ fontSize: '0.875rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>Tất cả</option>
              <option>Đang chờ duyệt</option>
              <option>Đã xác nhận</option>
              <option>Đã hoàn thành</option>
              <option>Đã hủy</option>
              <option>Vắng mặt</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem' }}>Từ ngày</label>
            <input type="date" className="form-control" style={{ fontSize: '0.875rem' }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem' }}>Đến ngày</label>
            <input type="date" className="form-control" style={{ fontSize: '0.875rem' }} />
          </div>
          <div>
            <button className="btn btn-light d-flex align-items-center gap-2" style={{ border: '1px solid #D1D5DB', fontSize: '0.875rem' }} onClick={() => { setSearchTerm(''); setStatusFilter('Tất cả'); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="d-flex flex-wrap border-bottom mb-4">
          {tabs.map(t => (
            <div key={t}
              className={`custom-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
              style={{ fontSize: '0.875rem' }}>
              {t}
              <span className="ms-1">({
                t === 'Tất cả' ? history.length :
                  history.filter(h => {
                    if (t === 'Đang chờ duyệt') return h.status.toLowerCase() === 'pending';
                    if (t === 'Đã xác nhận') return h.status.toLowerCase() === 'confirmed';
                    if (t === 'Đã hoàn thành') return h.status.toLowerCase() === 'completed';
                    if (t === 'Đã hủy') return h.status.toLowerCase() === 'cancelled';
                    if (t === 'Vắng mặt') return h.status.toLowerCase() === 'absent';
                    return false;
                  }).length
              })</span>
            </div>
          ))}
        </div>

        {/* LIST */}
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-5 text-muted bg-white rounded-3 shadow-sm">Chưa có lịch sử phù hợp.</div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {filteredHistory.map(a => (
              <React.Fragment key={a.appointmentId}>
                {/* Hidden Certificate Template for completed appointments */}
                {a.status.toLowerCase() === 'completed' && (
                  <div
                    id={`certificate-${a.appointmentId}`}
                    style={{
                      display: 'none',
                      width: '1122px', // 297mm equivalent in px at 96dpi
                      height: '794px', // 210mm
                      backgroundColor: '#fff',
                      padding: '40px',
                      boxSizing: 'border-box',
                      position: 'absolute',
                      top: '-9999px',
                      left: '-9999px',
                      fontFamily: "'Times New Roman', serif",
                      backgroundImage: 'radial-gradient(circle, #ffffff 0%, #ffffff 60%, #fef2f2 100%)',
                      color: '#000'
                    }}
                  >
                    <div style={{ border: '8px double #D42B2B', height: '100%', padding: '40px', position: 'relative', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                      <h2 style={{ color: '#D42B2B', fontSize: '28px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </h2>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 30px' }}>
                        Độc lập - Tự do - Hạnh phúc
                      </h3>

                      <div style={{ color: '#D42B2B', marginBottom: '20px' }}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>

                      <h1 style={{ color: '#991B1B', fontSize: '42px', fontWeight: 'bold', margin: '0 0 30px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        GIẤY CHỨNG NHẬN HIẾN MÁU TÌNH NGUYỆN
                      </h1>

                      <p style={{ fontSize: '24px', margin: '20px 0' }}>Chứng nhận Ông/Bà: <strong style={{ fontSize: '32px', color: '#111827', marginLeft: '10px' }}>{user?.fullName || 'Người hiến máu'}</strong></p>

                      <p style={{ fontSize: '22px', margin: '15px 0' }}>Đã tích cực tham gia hiến máu nhân đạo tại chiến dịch:</p>
                      <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1B4FD8', margin: '15px 0' }}>{a.campaignName}</p>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '20px', fontSize: '22px' }}>
                        <p>Thời gian: <strong>{formatDate(a.appointmentDate)}</strong></p>
                        <p>Địa điểm: <strong>{a.location}</strong></p>
                      </div>

                      <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', padding: '0 80px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '20px', marginBottom: '80px', fontStyle: 'italic' }}>Người hiến máu</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{user?.fullName}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '20px', marginBottom: '10px', fontStyle: 'italic' }}>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                          <p style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '50px' }}>Đại diện Ban Tổ Chức</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#D42B2B' }}>LifeGive System</p>
                        </div>
                      </div>

                      <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', textAlign: 'center', fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}>
                        Mã chứng nhận: REG{a.appointmentId.toString().padStart(6, '0')} - Hệ thống quản lý hiến máu LifeGive
                      </div>
                    </div>
                  </div>
                )}

                <div className="history-card p-3">
                  <div className="row g-3 align-items-stretch">
                    {/* Image */}
                    <div className="col-auto">
                      <img src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=300&auto=format&fit=crop"
                        alt="campaign"
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '8px' }} />
                    </div>
                    {/* Main Details */}
                    <div className="col d-flex flex-column justify-content-center border-end pe-3">
                      <div className="mb-2">{getStatusBadge(a.status)}</div>
                      <h5 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.5rem' }}>{a.campaignName}</h5>
                      <div className="d-flex flex-wrap gap-3 text-muted mb-2" style={{ fontSize: '0.8rem' }}>
                        <span className="d-flex align-items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {formatDate(a.appointmentDate)}
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {a.timeSlot}
                        </span>
                      </div>
                      <div className="text-muted d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.8rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {a.location}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Mã đăng ký: REG{a.appointmentId.toString().padStart(6, '0')}</div>
                    </div>

                    {/* Mid Details */}
                    <div className="col-2 d-none d-lg-flex flex-column justify-content-center border-end px-3">
                      <div className="mb-3">
                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Ngày đăng ký</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#111827' }}>{formatDateTime(a.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Lượng máu hiến</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{a.status.toLowerCase() === 'completed' ? '350 ml' : '--'}</div>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="col-12 col-md-3 d-flex flex-column justify-content-center ps-md-3">
                      <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: a.status.toLowerCase() === 'completed' ? '#F0FDF4' : '#FFFBEB', border: a.status.toLowerCase() === 'completed' ? '1px solid #DCFCE7' : '1px solid #FEF3C7' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Trạng thái</span>
                          {getStatusBadge(a.status)}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{a.status.toLowerCase() === 'completed' ? 'Lượng thành lúc' : 'Thông tin'}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111827', textAlign: 'right' }}>
                            {a.status.toLowerCase() === 'completed' ? formatDateTime(a.createdAt) : 'Đang chờ xác nhận từ hệ thống'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedAppointmentId(a.appointmentId); setShowModal(true); }}
                        className={`btn w-100 ${a.status.toLowerCase() === 'completed' ? 'mb-2' : ''}`}
                        style={{ border: '1px solid #DC2626', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}
                      >
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Xem chi tiết
                      </button>
                      {a.status.toLowerCase() === 'completed' && (
                        <button onClick={() => handleDownloadCertificate(a)} className="btn btn-danger w-100 fw-bold" style={{ fontSize: '0.875rem' }}>
                          <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          Tải chứng nhận
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* LOAD MORE */}
        {!loading && hasMore && (
          <div className="text-center mt-4">
            <button className="btn btn-outline-danger px-5 rounded-pill" onClick={handleLoadMore}>
              Tải thêm dữ liệu
            </button>
          </div>
        )}
        
        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border text-danger spinner-border-sm" />
          </div>
        )}
        
        {/* SUMMARY INFO */}
        {!loading && filteredHistory.length > 0 && (
          <div className="text-center mt-3 text-muted" style={{ fontSize: '0.875rem' }}>
            Hiển thị {filteredHistory.length} / {totalCount} kết quả
          </div>
        )}

      </div>

      <AppointmentDetailModal
        show={showModal}
        onHide={() => setShowModal(false)}
        appointmentId={selectedAppointmentId}
      />
    </div>
  );
};
