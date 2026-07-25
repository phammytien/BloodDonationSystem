import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { Pagination } from '../../components/common/Pagination';

export const AdminAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filterCampaignId, setFilterCampaignId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [adminNote, setAdminNote] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCampaigns();
    fetchAppointments();
  }, [user, filterCampaignId, filterStatus]);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('http://localhost:5028/api/campaign');
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5028/api/appointment/admin/list?';
      if (filterCampaignId) url += `campaignId=${filterCampaignId}&`;
      if (filterStatus) url += `status=${filterStatus}&`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setAppointments(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách đơn đăng ký', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (app: any) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setAdminNote('');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    try {
      await axios.put(`http://localhost:5028/api/appointment/admin/status/${selectedApp.appointmentId}`, {
        status: newStatus,
        note: adminNote
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Cập nhật trạng thái thành công', { position: 'top-center' });
      setShowStatusModal(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra', { position: 'top-center' });
    }
  };

  const getStatusBadge = (status: number) => {
    switch(status) {
      case 0: return <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill fw-semibold">Chờ duyệt</span>;
      case 1: return <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold">Đã xác nhận</span>;
      case 2: return <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-semibold">Hoàn thành</span>;
      case 3: return <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill fw-semibold">Đã hủy</span>;
      default: return null;
    }
  };

  if (loading && appointments.length === 0) return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-danger" role="status"></div>
    </div>
  );

  return (
    <>
      <div className="container-fluid fade-in py-2">
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
        
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827', margin: 0 }}>Duyệt Đơn Đăng Ký</h3>
            <p className="text-muted small mt-1 mb-0">Quản lý và xét duyệt các đơn đăng ký hiến máu.</p>
          </div>
          
          <div className="d-flex gap-2">
            <select 
              className="form-select border-0 shadow-sm rounded-pill px-3" 
              value={filterCampaignId}
              onChange={(e) => setFilterCampaignId(e.target.value)}
              style={{ minWidth: '200px', fontSize: '0.9rem' }}
            >
              <option value="">Tất cả chiến dịch</option>
              {campaigns.map(c => (
                <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>
              ))}
            </select>

            <select 
              className="form-select border-0 shadow-sm rounded-pill px-3" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: '160px', fontSize: '0.9rem' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="0">Chờ duyệt</option>
              <option value="1">Đã xác nhận</option>
              <option value="2">Hoàn thành</option>
              <option value="3">Đã hủy</option>
            </select>
          </div>
        </div>

        <div className="glass-card p-4 bg-white" style={{ border: '1px solid #E5E7EB', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderRadius: '1rem' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '1000px' }}>
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Mã Đơn / Ngày Tạo</th>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Người Hiến Máu</th>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Chiến dịch đăng ký</th>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Trạng thái</th>
                  <th className="text-uppercase text-muted fw-bold text-end" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="text-muted mb-2">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </div>
                      <span className="fw-semibold">Không tìm thấy đơn đăng ký nào</span>
                    </td>
                  </tr>
                ) : (
                  appointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(a => (
                    <tr key={a.appointmentId} style={{ transition: 'all 0.2s' }}>
                      <td className="py-3">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>#{a.appointmentId}</div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                          {new Date(a.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{a.donorName}</div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                          <span className="me-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>{a.donorPhone}</span>
                          <span className="badge bg-danger rounded-pill px-2">{a.bloodGroup}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-dark fw-semibold" style={{ fontSize: '0.85rem' }}>{a.campaignName}</div>
                        <div className="text-muted mt-1 d-flex gap-2" style={{ fontSize: '0.8rem' }}>
                          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>{new Date(a.appointmentDate).toLocaleDateString('vi-VN')}</span>
                          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>{a.timeSlot}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {getStatusBadge(a.status)}
                      </td>
                      <td className="py-3 text-end">
                        <button 
                          className="btn btn-sm btn-light text-primary rounded-pill border-0 px-3 fw-semibold" 
                          onClick={() => handleOpenStatusModal(a)}
                          style={{ fontSize: '0.8rem' }}
                        >
                          Cập nhật
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && appointments.length > 0 && (
            <div className="p-3 border-top">
              <Pagination 
                currentPage={currentPage}
                totalItems={appointments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedApp && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg p-3" style={{ borderRadius: '1rem' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Montserrat' }}>Cập nhật Đơn Đăng Ký</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)}></button>
              </div>
              <div className="modal-body pt-3 row g-3">
                <div className="col-12">
                  <div className="p-3 rounded mb-3" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <div className="fw-semibold mb-1">Mã đơn: <span className="text-danger">#{selectedApp.appointmentId}</span></div>
                    <div className="small text-muted">Người hiến: <strong>{selectedApp.donorName}</strong> ({selectedApp.bloodGroup})</div>
                    <div className="small text-muted">Chiến dịch: {selectedApp.campaignName}</div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">CHUYỂN TRẠNG THÁI</label>
                  <select 
                    className="form-select" 
                    value={newStatus} 
                    onChange={e => setNewStatus(Number(e.target.value))}
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.6rem 1rem' }}
                  >
                    <option value={0}>Chờ duyệt</option>
                    <option value={1}>Đã xác nhận</option>
                    <option value={2}>Hoàn thành</option>
                    <option value={3}>Đã hủy</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">GHI CHÚ DÀNH CHO DONOR (TUỲ CHỌN)</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={adminNote} 
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder="Nhập ghi chú hoặc lý do (VD: Hủy do máu không đạt chuẩn)..."
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                  />
                </div>
              </div>
              
              <div className="modal-footer border-0 pt-0 mt-3 d-flex gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold" onClick={() => setShowStatusModal(false)}>Đóng</button>
                <button type="button" className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" onClick={handleUpdateStatus}>
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
