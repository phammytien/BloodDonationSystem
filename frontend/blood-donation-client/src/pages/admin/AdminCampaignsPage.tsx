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
  const isAdmin = user?.roleName === 'Admin';

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
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTime, setFilterTime] = useState('all');

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
      setAttachmentUrl(campaign.attachmentUrl || '');
      setAttachmentName(campaign.attachmentName || '');
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
      setAttachmentUrl('');
      setAttachmentName('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await axios.post('http://localhost:5028/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.token}`
        }
      });
      setAttachmentUrl('http://localhost:5028' + res.data.url);
      setAttachmentName(res.data.fileName);
      toast.success('Tải ảnh lên thành công');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu', { position: 'top-center' });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      campaignName,
      description,
      location,
      organizer,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      status: Number(status),
      attachmentUrl: attachmentUrl || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
      attachmentName: attachmentName || 'default-campaign.jpg'
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
    } finally {
      setIsSubmitting(false);
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

  const totalCampaigns = campaigns.length;
  const upcomingCampaigns = campaigns.filter(c => c.status === 0).length;
  const ongoingCampaigns = campaigns.filter(c => c.status === 1).length;
  const finishedCampaigns = campaigns.filter(c => c.status === 2).length;

  const filteredCampaigns = campaigns.filter(c => {
    if (searchTerm && !c.campaignName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== 'all' && c.status.toString() !== filterStatus) return false;
    return true;
  }).sort((a, b) => a.campaignId - b.campaignId);

  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      {ReactDOM.createPortal(
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />,
        document.body
      )}
      <div className="container-fluid fade-in py-4 px-4" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827', margin: 0 }}>Quản lý Chiến dịch</h3>
            <p className="text-muted small mt-1 mb-0">Thiết lập và theo dõi các đợt hiến máu nhân đạo.</p>
          </div>
          <button
            className="btn text-white fw-bold px-4 shadow-sm d-flex align-items-center gap-2"
            onClick={() => handleOpenModal()}
            style={{ fontFamily: 'Montserrat', fontSize: '0.9rem', backgroundColor: '#DC2626', borderRadius: '0.5rem', border: 'none', height: '42px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm chiến dịch
          </button>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-3">
            <div className="bg-white rounded-3 p-3 shadow-sm border-0 d-flex align-items-center h-100" style={{ border: '1px solid #F3F4F6' }}>
              <div className="d-flex align-items-center justify-content-center rounded-3 bg-danger bg-opacity-10 text-danger me-3" style={{ width: 48, height: 48 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div>
                <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Tổng chiến dịch</div>
                <h4 className="mb-0 fw-bold text-dark" style={{ fontFamily: 'Montserrat' }}>{totalCampaigns}</h4>
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Tất cả thời gian</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="bg-white rounded-3 p-3 shadow-sm border-0 d-flex align-items-center h-100" style={{ border: '1px solid #F3F4F6' }}>
              <div className="d-flex align-items-center justify-content-center rounded-3 text-success me-3" style={{ width: 48, height: 48, backgroundColor: '#ECFDF5' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Sắp diễn ra</div>
                <h4 className="mb-0 fw-bold text-dark" style={{ fontFamily: 'Montserrat' }}>{upcomingCampaigns}</h4>
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Chưa bắt đầu</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="bg-white rounded-3 p-3 shadow-sm border-0 d-flex align-items-center h-100" style={{ border: '1px solid #F3F4F6' }}>
              <div className="d-flex align-items-center justify-content-center rounded-3 text-primary me-3" style={{ width: 48, height: 48, backgroundColor: '#EFF6FF' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>
              </div>
              <div>
                <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Đang diễn ra</div>
                <h4 className="mb-0 fw-bold text-dark" style={{ fontFamily: 'Montserrat' }}>{ongoingCampaigns}</h4>
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Hiện tại</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="bg-white rounded-3 p-3 shadow-sm border-0 d-flex align-items-center h-100" style={{ border: '1px solid #F3F4F6' }}>
              <div className="d-flex align-items-center justify-content-center rounded-3 text-secondary me-3" style={{ width: 48, height: 48, backgroundColor: '#F3F4F6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              </div>
              <div>
                <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>Đã kết thúc</div>
                <h4 className="mb-0 fw-bold text-dark" style={{ fontFamily: 'Montserrat' }}>{finishedCampaigns}</h4>
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4" style={{ borderRadius: '1rem', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
          {/* Filters Area */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex gap-3 align-items-center">
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input type="text" className="form-control bg-light border-0 py-2 ps-5" style={{ borderRadius: '0.5rem', width: '280px', fontSize: '0.9rem' }} placeholder="Tìm kiếm chiến dịch..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '0.8rem' }}>Trạng thái</span>
                <select className="form-select bg-light border-0 py-2 px-3 text-dark fw-semibold" style={{ borderRadius: '0.5rem', fontSize: '0.9rem', width: '130px', cursor: 'pointer' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="0">Sắp diễn ra</option>
                  <option value="1">Đang diễn ra</option>
                  <option value="2">Đã kết thúc</option>
                </select>
              </div>

              {/* <div className="d-flex align-items-center gap-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '0.8rem' }}>Thời gian</span>
                <select className="form-select bg-light border-0 py-2 px-3 text-dark fw-semibold" style={{ borderRadius: '0.5rem', fontSize: '0.9rem', width: '130px', cursor: 'pointer' }} value={filterTime} onChange={e => setFilterTime(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="month">Tháng này</option>
                  <option value="year">Năm nay</option>
                </select>
              </div> */}
            </div>

            <button className="btn btn-light bg-white border d-flex align-items-center gap-2 text-dark fw-semibold" style={{ borderRadius: '0.5rem', fontSize: '0.85rem' }} onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterTime('all'); setCurrentPage(1); fetchCampaigns(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Làm mới
            </button>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                  <th className="text-uppercase text-muted fw-bold pb-3 pt-0 border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', width: '30%' }}>Chiến dịch</th>
                  <th className="text-uppercase text-muted fw-bold pb-3 pt-0 border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', width: '25%' }}>Địa điểm & Thời gian</th>
                  <th className="text-uppercase text-muted fw-bold pb-3 pt-0 border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', width: '20%' }}>Số lượng</th>
                  <th className="text-uppercase text-muted fw-bold pb-3 pt-0 border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', width: '15%' }}>Trạng thái</th>
                  <th className="text-uppercase text-muted fw-bold pb-3 pt-0 border-0 text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', width: '10%' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="text-muted mb-2">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                      </div>
                      <span className="fw-semibold">Không tìm thấy chiến dịch nào</span>
                    </td>
                  </tr>
                ) : (
                  paginatedCampaigns.map(c => (
                    <tr key={c.campaignId} style={{ transition: 'all 0.2s', borderBottom: '1px solid #F3F4F6' }}>
                      <td className="py-4 border-0">
                        <div className="d-flex align-items-center gap-3">
                          <div className="flex-shrink-0 rounded-4 overflow-hidden d-flex align-items-center justify-content-center bg-danger bg-opacity-10" style={{ width: 56, height: 56 }}>
                            {c.attachmentUrl ? (
                              <img src={c.attachmentUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>
                            )}
                          </div>
                          <div>
                            <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>{c.campaignName}</div>
                            <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                              {c.organizer}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 border-0">
                        <div className="text-dark fw-semibold mb-1" style={{ fontSize: '0.9rem' }}>{c.location}</div>
                        <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {new Date(c.startDate).toLocaleDateString('vi-VN')} - {new Date(c.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-4 border-0">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="progress flex-grow-1 bg-light" style={{ height: '6px', borderRadius: '4px' }}>
                            <div
                              className="progress-bar bg-danger"
                              style={{ width: `${c.maxParticipants ? Math.min((c.registrantCount / c.maxParticipants) * 100, 100) : 100}%`, borderRadius: '4px' }}
                            ></div>
                          </div>
                          <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                            {c.registrantCount}
                          </span>
                        </div>
                        <div className="text-muted text-end" style={{ fontSize: '0.75rem' }}>
                          / {c.maxParticipants ? c.maxParticipants : 'Không giới hạn'}
                        </div>
                      </td>
                      <td className="py-4 border-0">
                        <span className={`badge px-3 py-2 rounded-pill fw-semibold ${c.status === 0 ? 'bg-primary bg-opacity-10 text-primary' : c.status === 1 ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`} style={{ fontSize: '0.75rem' }}>
                          {c.status === 0 ? 'Sắp diễn ra' : c.status === 1 ? 'Đang diễn ra' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="py-4 border-0 text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm bg-white text-primary rounded-2 border d-flex align-items-center justify-content-center"
                            onClick={() => handleOpenModal(c)}
                            title="Chỉnh sửa"
                            style={{ width: '32px', height: '32px', borderColor: '#E5E7EB' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-sm bg-white text-danger rounded-2 border d-flex align-items-center justify-content-center"
                              onClick={() => confirmDelete(c.campaignId)}
                              title="Xoá"
                              style={{ width: '32px', height: '32px', borderColor: '#E5E7EB' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          )}
                          {/* <button
                            className="btn btn-sm bg-white text-secondary rounded-2 border d-flex align-items-center justify-content-center"
                            title="Thêm"
                            style={{ width: '32px', height: '32px', borderColor: '#E5E7EB' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredCampaigns.length > 0 && (
            <div className="pt-4 border-top mt-2 d-flex justify-content-between align-items-center">
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCampaigns.length)} - {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} trong tổng số {filteredCampaigns.length} mục
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredCampaigns.length}
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
        <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040 }}></div>,
        document.body
      )}
      {showModal && ReactDOM.createPortal(
        <div className="modal fade show d-block" tabIndex={-1} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered my-5">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
              <div className="modal-header border-bottom-0 bg-white px-4 pt-4 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Montserrat', color: '#111827', fontSize: '1.25rem' }}>
                  {isEditing ? 'Cập nhật chiến dịch' : 'Thêm chiến dịch mới'}
                </h5>
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCloseModal(); }} className="d-flex align-items-center justify-content-center rounded-circle border-0" style={{ width: 36, height: 36, backgroundColor: '#F3F4F6', color: '#4B5563', cursor: 'pointer', transition: '0.2s', position: 'relative', zIndex: 50, pointerEvents: 'auto' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E5E7EB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4 pt-3">
                  {/* Top Row: Image Upload (Left 4 cols) & Name + Hints (Right 8 cols) */}
                  <div className="row g-4 mb-4">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-dark mb-1">Ảnh đại diện</label>
                      <div className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>JPG, PNG (tối đa 2MB)</div>

                      <div className="position-relative w-100 rounded-3 overflow-hidden d-flex flex-column align-items-center justify-content-center" style={{ height: '200px', border: attachmentUrl ? 'none' : '1.5px dashed #D1D5DB', backgroundColor: '#F9FAFB' }}>
                        {attachmentUrl ? (
                          <img src={attachmentUrl} alt="Campaign Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-primary">
                            <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 mb-2" style={{ width: 64, height: 64 }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chọn ảnh</span>
                          </div>
                        )}

                        <label className="position-absolute" style={{ inset: 0, cursor: 'pointer', zIndex: 10 }}>
                          <input type="file" className="d-none" accept="image/jpeg, image/png" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                        {isUploading && (
                          <div className="position-absolute d-flex align-items-center justify-content-center" style={{ inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 20 }}>
                            <span className="spinner-border text-primary"></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-md-8">
                      <div className="mb-3">
                        <label className="form-label small fw-bold" style={{ color: '#111827' }}>Tên chiến dịch <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input type="text" className="form-control border py-2" style={{ fontSize: '0.95rem', borderRadius: '0.5rem', borderColor: '#E5E7EB', paddingRight: '60px' }} value={campaignName} onChange={e => setCampaignName(e.target.value)} required placeholder="Nhập tên chiến dịch" maxLength={100} />
                          <div className="position-absolute text-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem' }}>{campaignName.length}/100</div>
                        </div>
                      </div>

                      <div className="bg-primary bg-opacity-10 rounded-3 p-3" style={{ border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                        <div className="d-flex align-items-center text-primary mb-2 fw-semibold" style={{ fontSize: '0.9rem' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>
                          Gợi ý:
                        </div>
                        <ul className="list-unstyled mb-0 ms-1" style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.8' }}>
                          <li className="d-flex align-items-start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-2 flex-shrink-0 mt-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Đặt tên ngắn gọn, dễ nhớ</li>
                          <li className="d-flex align-items-start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-2 flex-shrink-0 mt-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Nêu rõ mục tiêu hoặc chủ đề chiến dịch</li>
                          <li className="d-flex align-items-start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-2 flex-shrink-0 mt-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Ví dụ: "Hiến máu tình nguyện – Xuân Hồng 2026"</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold" style={{ color: '#111827' }}>Đơn vị tổ chức <span className="text-danger">*</span></label>
                      <div className="position-relative">
                        <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg></div>
                        <input type="text" className="form-control border py-2 ps-5" style={{ borderRadius: '0.5rem', borderColor: '#E5E7EB' }} value={organizer} onChange={e => setOrganizer(e.target.value)} required placeholder="VD: Bệnh viện Chợ Rẫy" />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold" style={{ color: '#111827' }}>Địa điểm <span className="text-danger">*</span></label>
                      <div className="position-relative">
                        <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
                        <input type="text" className="form-control border py-2 ps-5" style={{ borderRadius: '0.5rem', borderColor: '#E5E7EB' }} value={location} onChange={e => setLocation(e.target.value)} required placeholder="Nơi diễn ra" />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold" style={{ color: '#111827' }}>Ngày bắt đầu <span className="text-danger">*</span></label>
                      <input type="date" className="form-control border py-2 px-3" style={{ borderRadius: '0.5rem', borderColor: '#E5E7EB' }} value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold" style={{ color: '#111827' }}>Ngày kết thúc <span className="text-danger">*</span></label>
                      <input type="date" className="form-control border py-2 px-3" style={{ borderRadius: '0.5rem', borderColor: '#E5E7EB' }} value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold" style={{ color: '#111827' }}>Số lượng đăng ký tối đa</label>
                      <div className="position-relative">
                        <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                        <input type="number" className="form-control border py-2 ps-5" style={{ borderRadius: '0.5rem', borderColor: '#E5E7EB' }} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} min="1" placeholder="Bỏ trống nếu không giới hạn" />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold" style={{ color: '#111827' }}>Trạng thái <span className="text-danger">*</span></label>
                      <select className="form-select border py-2 px-3" style={{ borderRadius: '0.5rem', borderColor: '#E5E7EB' }} value={status} onChange={e => setStatus(Number(e.target.value))}>
                        <option value={0}>Sắp diễn ra</option>
                        <option value={1}>Đang diễn ra</option>
                        <option value={2}>Đã kết thúc</option>
                      </select>
                    </div>

                    <div className="col-12 mt-4">
                      <label className="form-label small fw-bold" style={{ color: '#111827' }}>Mô tả chi tiết</label>
                      <div className="position-relative">
                        <textarea className="form-control border p-3" style={{ borderRadius: '0.5rem', borderColor: '#E5E7EB', paddingBottom: '35px' }} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Nhập thêm thông tin lưu ý, mục tiêu, nội dung chương trình..." maxLength={500}></textarea>
                        <div className="position-absolute text-muted" style={{ right: '12px', bottom: '10px', fontSize: '0.75rem' }}>{description.length}/500</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top-0 bg-white px-4 pb-4 pt-0 d-flex justify-content-end gap-3">
                  <button type="button" className="btn bg-white text-dark px-4 py-2 fw-semibold" style={{ borderRadius: '0.5rem', border: '1px solid #D1D5DB' }} onClick={handleCloseModal}>Hủy bỏ</button>
                  <button type="submit" className="btn btn-primary px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2" style={{ borderRadius: '0.5rem', fontFamily: 'Montserrat', background: '#2563EB', border: 'none' }} disabled={isSubmitting}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
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

