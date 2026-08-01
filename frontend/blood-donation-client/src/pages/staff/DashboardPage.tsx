import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';

interface AppointmentHistory {
  appointmentId: number;
  campaignName: string;
  location: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  note: string;
  createdAt: string;
}

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);



  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const res = await axios.get('http://localhost:5028/api/appointment/history', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        setHistory(res.data);
      } catch (err) {
        console.error('Lỗi khi tải lịch sử đăng ký', err);
        toast.error('Không thể tải lịch sử đăng ký hiến máu.');
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case 'pending':
        return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-semibold">Đang chờ duyệt</span>;
      case 'confirmed':
        return <span className="badge bg-info text-white px-3 py-2 rounded-pill fw-semibold">Đã xác nhận</span>;
      case 'completed':
        return <span className="badge bg-success text-white px-3 py-2 rounded-pill fw-semibold">Đã hoàn thành</span>;
      case 'cancelled':
        return <span className="badge bg-secondary text-white px-3 py-2 rounded-pill fw-semibold">Đã hủy</span>;
      case 'absent':
        return <span className="badge bg-danger text-white px-3 py-2 rounded-pill fw-semibold">Vắng mặt</span>;
      default:
        return <span className="badge bg-light text-dark px-3 py-2 rounded-pill fw-semibold">{statusStr}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const totalCompleted = history.filter(a => a.status.toLowerCase() === 'completed').length;

  return (
    <div className="container py-5 fade-in">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Top Navbar */}
      <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
        <Link className="d-flex align-items-center text-decoration-none" to="/">
          <svg width="35" height="35" viewBox="0 0 24 24" fill="none" className="me-2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ef4444" />
            <path d="M12 5v12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 12h6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="h4 font-weight-bold mb-0 text-primary" style={{ fontFamily: 'Outfit' }}>
            LifeGive
          </span>
        </Link>
        <div className="position-relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="d-flex align-items-center justify-content-center rounded-circle border-0"
            style={{
              width: '38px',
              height: '38px',
              background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: showUserMenu ? '0 4px 12px rgba(27, 79, 216, 0.4)' : '0 2px 8px rgba(27, 79, 216, 0.15)'
            }}
            tabIndex={0}
          >
            {user?.username[0].toUpperCase()}
          </button>
          {showUserMenu && (
            <div
              className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg"
              style={{
                minWidth: '210px',
                zIndex: 1000,
                border: '1px solid #E5E7EB',
                animation: 'fadeInDown 0.15s ease'
              }}
            >
              <div className="p-3 border-bottom" style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: '30px',
                      height: '30px',
                      background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}
                  >
                    {user?.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-bold" style={{ color: '#111827', fontSize: '0.82rem' }}>{user?.username}</div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{user?.email}</div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/');
                    logout();
                    toast.success('Đăng xuất thành công!');
                  }}
                  className="w-100 d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent rounded-2 text-start"
                  style={{
                    fontSize: '0.82rem',
                    color: '#D42B2B',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF0F0')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-4">
        {/* User Welcome Card */}
        <div className="col-12 col-md-4">
          <div className="glass-card p-4 text-center h-100 d-flex flex-column align-items-center justify-content-center" style={{ border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            <div className="mb-3 animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="h2 text-primary mb-0 font-weight-bold">
                {user?.username ? user.username[0].toUpperCase() : 'U'}
              </span>
            </div>
            <h3 className="h4 mb-1" style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>{user?.username || 'Người dùng'}</h3>
            <span className="badge bg-primary px-3 py-2 mb-3" style={{ fontSize: '0.85rem', borderRadius: 'var(--radius-pill)' }}>
              {user?.roleName || 'Donor'}
            </span>
            <p className="text-muted small mb-0">{user?.email}</p>
          </div>
        </div>

        {/* Dashboard Statistics & Activity */}
        <div className="col-12 col-md-8">
          <div className="glass-card p-4 h-100" style={{ border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            <h4 className="mb-4" style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Tổng quan hoạt động</h4>
            <div className="row g-3">
              <div className="col-6 col-sm-4">
                <div className="p-3 border rounded text-center bg-light">
                  <h5 className="text-muted small mb-1">Đăng ký thành công</h5>
                  <p className="h2 text-primary font-weight-bold mb-0">{totalCompleted}</p>
                </div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="p-3 border rounded text-center bg-light">
                  <h5 className="text-muted small mb-1">Lần hiến cuối</h5>
                  <p className="text-muted font-weight-semibold mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                    {totalCompleted > 0 ? 'Đã hoàn thành' : 'Chưa thực hiện'}
                  </p>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="p-3 border rounded text-center bg-light">
                  <h5 className="text-muted small mb-1">Yêu cầu chờ duyệt</h5>
                  <p className="h5 text-warning font-weight-bold mb-0 mt-2">
                    {history.filter(a => a.status.toLowerCase() === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--primary-light)', borderLeft: '4px solid var(--primary)' }}>
              <h5 className="h6 text-primary font-weight-bold mb-1">Thông báo chiến dịch mới</h5>
              <p className="small text-muted mb-0">
                Chiến dịch hiến máu nhân đạo hè 2026 sẽ khai mạc vào ngày 1/8 tại Bệnh viện Đa Khoa Trung Ương. Hãy đăng ký tham gia ngay!
              </p>
            </div>
          </div>
        </div>

        {/* Appointment History Table */}
        <div className="col-12">
          <div className="glass-card p-4 mt-2" style={{ border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)', backgroundColor: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h4 style={{ fontFamily: 'Montserrat', fontWeight: 700, margin: 0 }}>Lịch sử Đăng ký Hiến máu</h4>
                <p className="text-muted small mb-0 mt-1">Danh sách chi tiết các cuộc hẹn đăng ký hiến máu của bạn.</p>
              </div>
              <Link to="/#appointment" className="btn btn-danger fw-bold rounded-pill px-4" style={{ fontSize: '0.9rem' }}>
                + Đăng ký hiến máu mới
              </Link>
            </div>

            {historyLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-5 border rounded-3 bg-light">
                <div className="mb-3 text-muted">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h5 className="fw-bold">Bạn chưa có lịch hẹn nào</h5>
                <p className="text-muted small px-3">Hãy chung tay chia sẻ sự sống bằng cách đăng ký tham gia hiến máu nhân đạo ngay hôm nay.</p>
                <Link to="/#appointment" className="btn btn-primary-custom px-4 py-2 mt-2" style={{ fontSize: '0.88rem' }}>
                  Đăng ký hiến máu ngay
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-hover" style={{ minWidth: '700px' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '22%' }}>Chiến dịch</th>
                      <th style={{ width: '22%' }}>Địa điểm</th>
                      <th style={{ width: '18%' }}>Thời gian hẹn</th>
                      <th style={{ width: '18%' }}>Trạng thái</th>
                      <th style={{ width: '20%' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a) => (
                      <tr key={a.appointmentId}>
                        <td>
                          <div className="fw-bold text-dark">{a.campaignName}</div>
                          <div className="text-muted small">Mã LH: #{a.appointmentId}</div>
                        </td>
                        <td className="text-muted small">{a.location}</td>
                        <td>
                          <div className="fw-semibold text-dark">{formatDate(a.appointmentDate)}</div>
                          <div className="text-muted small">{a.timeSlot}</div>
                        </td>
                        <td>{getStatusBadge(a.status)}</td>
                        <td>
                          <div className="text-muted small" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.note || ''}>
                            {a.note || <span className="text-black-50 italic">Không có ghi chú</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
