import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { Pagination } from '../../components/common/Pagination';

export const AdminCampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | string>('');
  const [status, setStatus] = useState<number>(0);

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('http://localhost:5028/api/campaign');
      setCampaigns(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (campaign?: any) => {
    if (campaign) {
      setIsEditing(true);
      setCurrentId(campaign.campaignId);
      setCampaignName(campaign.campaignName);
      setDescription(campaign.description || '');
      setLocation(campaign.location);
      setOrganizer(campaign.organizer);
      setStartDate(campaign.startDate.split('T')[0]);
      setEndDate(campaign.endDate.split('T')[0]);
      setMaxParticipants(campaign.maxParticipants || '');
      setStatus(campaign.status);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setCampaignName('');
      setDescription('');
      setLocation('');
      setOrganizer('');
      setStartDate('');
      setEndDate('');
      setMaxParticipants('');
      setStatus(0);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      campaignName,
      description,
      location,
      organizer,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      status: Number(status)
    };

    try {
      if (isEditing && currentId) {
        await axios.put(`http://localhost:5028/api/campaign/${currentId}`, payload, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        toast.success('Cập nhật chiến dịch thành công', { position: 'top-center' });
      } else {
        await axios.post('http://localhost:5028/api/campaign', payload, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        toast.success('Thêm chiến dịch thành công', { position: 'top-center' });
      }
      setShowModal(false);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra', { position: 'top-center' });
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`http://localhost:5028/api/campaign/${deleteId}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Xoá chiến dịch thành công', { position: 'top-center' });
      setShowDeleteModal(false);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xoá', { position: 'top-center' });
      setShowDeleteModal(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-danger" role="status"></div>
    </div>
  );

  const paginatedCampaigns = campaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="container-fluid fade-in py-2">
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827', margin: 0 }}>Quản lý Chiến dịch</h3>
            <p className="text-muted small mt-1 mb-0">Thiết lập và theo dõi các đợt hiến máu nhân đạo.</p>
          </div>
          <button 
            className="btn btn-danger fw-bold rounded-pill px-4 shadow-sm d-flex align-items-center gap-2" 
            onClick={() => handleOpenModal()}
            style={{ fontFamily: 'Montserrat', fontSize: '0.9rem' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm chiến dịch
          </button>
        </div>

        <div className="glass-card p-4 bg-white" style={{ border: '1px solid #E5E7EB', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderRadius: '1rem' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px' }}>
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Chiến dịch</th>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Địa điểm & Thời gian</th>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Số lượng</th>
                  <th className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Trạng thái</th>
                  <th className="text-uppercase text-muted fw-bold text-end" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="text-muted mb-2">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                      </div>
                      <span className="fw-semibold">Chưa có chiến dịch nào</span>
                    </td>
                  </tr>
                ) : (
                  paginatedCampaigns.map(c => (
                    <tr key={c.campaignId} style={{ transition: 'all 0.2s' }}>
                      <td className="py-3">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{c.campaignName}</div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}><i className="bi bi-building me-1"></i> {c.organizer}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-dark fw-semibold" style={{ fontSize: '0.85rem' }}>{c.location}</div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                          {new Date(c.startDate).toLocaleDateString('vi-VN')} - {new Date(c.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', width: '80px' }}>
                            <div 
                              className="progress-bar bg-danger" 
                              style={{ width: `${c.maxParticipants ? Math.min((c.registrantCount / c.maxParticipants) * 100, 100) : 100}%` }}
                            ></div>
                          </div>
                          <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                            {c.registrantCount} {c.maxParticipants ? `/ ${c.maxParticipants}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge px-3 py-2 rounded-pill fw-semibold ${c.status === 0 ? 'bg-primary bg-opacity-10 text-primary' : c.status === 1 ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                          {c.status === 0 ? 'Sắp diễn ra' : c.status === 1 ? 'Đang diễn ra' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="py-3 text-end">
                        <button 
                          className="btn btn-sm btn-light text-primary rounded-circle me-2 border-0" 
                          onClick={() => handleOpenModal(c)}
                          title="Chỉnh sửa"
                          style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          className="btn btn-sm btn-light text-danger rounded-circle border-0" 
                          onClick={() => confirmDelete(c.campaignId)}
                          title="Xoá"
                          style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && campaigns.length > 0 && (
            <div className="p-3 border-top">
              <Pagination 
                currentPage={currentPage}
                totalItems={campaigns.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ReactDOM.createPortal(
        <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}></div>,
        document.body
      )}
      {showDeleteModal && ReactDOM.createPortal(
        <div className="modal fade show d-block" tabIndex={-1} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-center p-4" style={{ borderRadius: '1rem' }}>
              <div className="mb-3">
                <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle" style={{ width: '60px', height: '60px' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </div>
              </div>
              <h4 className="fw-bold mb-2">Xác nhận xoá</h4>
              <p className="text-muted mb-4">Bạn có chắc chắn muốn xoá chiến dịch này không? Hành động này không thể hoàn tác.</p>
              <div className="d-flex justify-content-center gap-3">
                <button type="button" className="btn btn-light px-4 fw-semibold rounded-pill" onClick={() => setShowDeleteModal(false)}>Hủy bỏ</button>
                <button type="button" className="btn btn-danger px-4 fw-bold rounded-pill" onClick={handleDelete}>Vâng, Xoá</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create/Edit Modal */}
      {showModal && ReactDOM.createPortal(
        <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}></div>,
        document.body
      )}
      {showModal && ReactDOM.createPortal(
        <div className="modal fade show d-block" tabIndex={-1} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <div className="modal-header border-bottom-0 bg-light pb-0">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Montserrat' }}>
                  {isEditing ? 'Cập nhật chiến dịch' : 'Thêm chiến dịch mới'}
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4 pt-3 row g-4">
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted">TÊN CHIẾN DỊCH <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-lg bg-light border-0" style={{ fontSize: '1rem' }} value={campaignName} onChange={e => setCampaignName(e.target.value)} required placeholder="Nhập tên chiến dịch..." />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted">ĐƠN VỊ TỔ CHỨC <span className="text-danger">*</span></label>
                    <input type="text" className="form-control bg-light border-0" value={organizer} onChange={e => setOrganizer(e.target.value)} required placeholder="VD: Bệnh viện Chợ Rẫy" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted">ĐỊA ĐIỂM <span className="text-danger">*</span></label>
                    <input type="text" className="form-control bg-light border-0" value={location} onChange={e => setLocation(e.target.value)} required placeholder="Nơi diễn ra" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted">NGÀY BẮT ĐẦU <span className="text-danger">*</span></label>
                    <input type="date" className="form-control bg-light border-0" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted">NGÀY KẾT THÚC <span className="text-danger">*</span></label>
                    <input type="date" className="form-control bg-light border-0" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted">SỐ LƯỢNG ĐĂNG KÝ TỐI ĐA</label>
                    <input type="number" className="form-control bg-light border-0" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} min="1" placeholder="Bỏ trống nếu không giới hạn" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted">TRẠNG THÁI</label>
                    <select className="form-select bg-light border-0" value={status} onChange={e => setStatus(Number(e.target.value))}>
                      <option value={0}>Sắp diễn ra</option>
                      <option value={1}>Đang diễn ra</option>
                      <option value={2}>Đã kết thúc</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted">MÔ TẢ CHI TIẾT</label>
                    <textarea className="form-control bg-light border-0" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Nhập thêm thông tin lưu ý..."></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top-0 bg-light pt-2 pb-4 px-4">
                  <button type="button" className="btn btn-light px-4 fw-semibold" onClick={handleCloseModal}>Hủy</button>
                  <button type="submit" className="btn btn-danger px-4 fw-bold rounded-pill shadow-sm" style={{ fontFamily: 'Montserrat' }}>
                    {isEditing ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

