import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getAvatarChar } from '../../utils/avatarHelper';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

export const CampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [timeFilter, setTimeFilter] = useState<string>('Tất cả');
  const [locationFilter, setLocationFilter] = useState<string>('Tất cả');
  const [sortFilter, setSortFilter] = useState<string>('Mới nhất');

  // Selected Campaign & Registrants
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [showAllRegistrants, setShowAllRegistrants] = useState(false);
  
  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    axios.get('http://localhost:5028/api/appointment/campaigns')
      .then(res => {
        setCampaigns(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedCampaign(res.data[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch registrants when selectedCampaign changes
  useEffect(() => {
    if (selectedCampaign) {
      setLoadingRegistrants(true);
      axios.get(`http://localhost:5028/api/appointment/campaign/${selectedCampaign.campaignId}/registrants`)
        .then(res => {
          setRegistrants(res.data || []);
          setShowAllRegistrants(false);
        })
        .catch(err => console.error('Lỗi tải danh sách người đăng ký', err))
        .finally(() => setLoadingRegistrants(false));
    } else {
      setRegistrants([]);
      setShowAllRegistrants(false);
    }
  }, [selectedCampaign]);

  // Fetch comments when selectedCampaign changes
  useEffect(() => {
    if (selectedCampaign) {
      setLoadingComments(true);
      axios.get(`http://localhost:5028/api/campaign/${selectedCampaign.campaignId}/comments`)
        .then(res => setComments(res.data || []))
        .catch(err => console.error('Lỗi tải bình luận', err))
        .finally(() => setLoadingComments(false));
    } else {
      setComments([]);
    }
  }, [selectedCampaign]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedCampaign) return;

    if (!user) {
      toast.warning('Vui lòng đăng nhập để bình luận!');
      return;
    }

    setIsSubmittingComment(true);
    axios.post(`http://localhost:5028/api/campaign/${selectedCampaign.campaignId}/comments`, 
      { content: newComment },
      { headers: { Authorization: `Bearer ${user.token}` } }
    )
    .then(res => {
      setComments([res.data, ...comments]); // Prepend new comment
      setNewComment('');
    })
    .catch(err => {
      console.error(err);
      toast.error('Lỗi khi gửi bình luận');
    })
    .finally(() => setIsSubmittingComment(false));
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('Tất cả');
    setTimeFilter('Tất cả');
    setLocationFilter('Tất cả');
    setSortFilter('Mới nhất');
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (search && !c.campaignName.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Status Filter
    if (statusFilter !== 'Tất cả') {
      const now = new Date();
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      let status = '';
      if (now < start) status = 'Sắp diễn ra';
      else if (now > end) status = 'Đã kết thúc';
      else status = 'Đang diễn ra';

      if (statusFilter !== status) return false;
    }

    // Time Filter
    if (timeFilter !== 'Tất cả') {
      const start = new Date(c.startDate);
      const now = new Date();
      if (timeFilter === 'Tháng này') {
        if (start.getMonth() !== now.getMonth() || start.getFullYear() !== now.getFullYear()) return false;
      } else if (timeFilter === 'Tháng tới') {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        if (start.getMonth() !== nextMonth.getMonth() || start.getFullYear() !== nextMonth.getFullYear()) return false;
      }
    }

    // Location Filter
    if (locationFilter !== 'Tất cả') {
      if (!c.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortFilter === 'Mới nhất') {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const currentCampaigns = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, timeFilter, locationFilter, sortFilter]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép liên kết trang vào clipboard!");
  };

  const getStatusBadge = (startStr: string, endStr: string) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (now < start) return <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '0.75rem', fontWeight: 600 }}>Sắp diễn ra</span>;
    if (now > end) return <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: '0.75rem', fontWeight: 600 }}>Đã kết thúc</span>;
    return <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.75rem', fontWeight: 600 }}>Đang diễn ra</span>;
  };

  const isCampaignEnded = (endStr: string) => new Date() > new Date(endStr);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const renderRegistrants = () => {
    if (loadingRegistrants) {
      return <div className="text-center text-muted small py-3">Đang tải danh sách...</div>;
    }
    
    if (registrants.length === 0) {
      return <div className="text-center text-muted small py-3">Chưa có người đăng ký nào.</div>;
    }
    
    const displayed = showAllRegistrants ? registrants : registrants.slice(0, 3);
    
    return displayed.map((m, i) => (
      <div key={i} className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0" 
               style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #DC2626, #F87171)', fontSize: '0.85rem' }}>
            {getAvatarChar(m.donorName || "Anonymous")}
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '0.85rem', color: '#111827' }}>{m.donorName || "Người hiến máu"}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.phone || "Không công khai"}</div>
          </div>
        </div>
        <div className="text-end">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: m.status === 'Đã xác nhận' ? '#059669' : '#D97706' }}>{m.status}</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Đăng ký: {formatDate(m.createdAt)}</div>
        </div>
      </div>
    ));
  };

  return (
    <div className="fade-in" style={{ backgroundColor: '#F8FAFF', minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Search Header */}
      <div className="bg-white" style={{ padding: '2rem 0 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="mb-1" style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827' }}>
                <svg className="me-2" width="24" height="24" viewBox="0 0 24 24" fill="#DC2626"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                Chiến dịch hiến máu
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Tham gia các chiến dịch hiến máu nhân đạo để cứu sống nhiều người hơn.</p>
            </div>
            <div className="position-relative" style={{ minWidth: '300px' }}>
              <input 
                type="text" 
                className="form-control rounded-pill ps-4" 
                style={{ height: 42, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
                placeholder="Tìm kiếm chiến dịch..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg className="position-absolute text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ top: 13, right: 16 }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Filters */}
          <div className="d-flex align-items-center flex-wrap gap-3 mt-4">
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="small text-muted fw-semibold mb-1">Trạng thái</label>
              <select className="form-select border-0 bg-light" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>Tất cả</option>
                <option>Đang diễn ra</option>
                <option>Sắp diễn ra</option>
                <option>Đã kết thúc</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="small text-muted fw-semibold mb-1">Thời gian</label>
              <select className="form-select border-0 bg-light" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
                <option>Tất cả</option>
                <option>Tháng này</option>
                <option>Tháng tới</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="small text-muted fw-semibold mb-1">Địa điểm</label>
              <select className="form-select border-0 bg-light" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                <option>Tất cả</option>
                <option>Hà Nội</option>
                <option>TP.HCM</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="small text-muted fw-semibold mb-1">Sắp xếp</label>
              <select className="form-select border-0 bg-light" value={sortFilter} onChange={e => setSortFilter(e.target.value)}>
                <option>Mới nhất</option>
                <option>Cũ nhất</option>
              </select>
            </div>
            <div className="d-flex align-items-end" style={{ minWidth: '100px' }}>
              <button onClick={handleReset} className="btn bg-white border w-100" style={{ height: 38, fontSize: '0.85rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-4">
        <div className="row g-4">
          {/* Left Column: List */}
          <div className="col-12 col-lg-8">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm">
                <span className="text-muted">Không tìm thấy chiến dịch nào phù hợp.</span>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {currentCampaigns.map(c => (
                  <div key={c.campaignId} onClick={() => setSelectedCampaign(c)} 
                       className={`card border-0 rounded-4 shadow-sm overflow-hidden p-0 position-relative ${selectedCampaign?.campaignId === c.campaignId ? 'ring-2 ring-danger' : ''}`}
                       style={{ cursor: 'pointer', transition: 'all 0.2s', border: selectedCampaign?.campaignId === c.campaignId ? '2px solid #DC2626' : '1px solid transparent' }}>
                    <div className="row g-0">
                      <div className="col-md-4">
                        <img src={c.attachmentUrl || 'https://via.placeholder.com/300x200?text=Campaign+Image'} 
                             className="img-fluid w-100 h-100 object-fit-cover" 
                             alt={c.campaignName} 
                             style={{ minHeight: '200px' }}
                             onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80'; }}
                        />
                      </div>
                      <div className="col-md-8">
                        <div className="card-body p-4 d-flex flex-column h-100">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              {getStatusBadge(c.startDate, c.endDate)}
                              <h5 className="fw-bold mt-2 mb-1" style={{ color: '#111827' }}>{c.campaignName}</h5>
                            </div>
                          </div>
                          
                          <div className="text-muted small mb-2 d-flex align-items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            {c.location}
                          </div>
                          <div className="text-muted small mb-3 d-flex align-items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            {formatDate(c.startDate)} - {formatDate(c.endDate).split(' ')[1]}
                          </div>

                          <div className="mt-auto d-flex flex-wrap align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ backgroundColor: '#F3F4F6', fontSize: '0.8rem' }}>
                              <span className="text-muted">Đã đăng ký</span>
                              <span className="fw-bold text-dark">{c.registrantCount} / {c.maxParticipants}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ backgroundColor: '#F3F4F6', fontSize: '0.8rem' }}>
                              <span className="text-muted">Còn lại</span>
                              <span className="fw-bold text-dark">{c.maxParticipants - c.registrantCount}</span>
                            </div>
                            <div className="ms-auto">
                              {!isCampaignEnded(c.endDate) ? (
                                <Link to={`/appointment?campaignId=${c.campaignId}`} onClick={(e) => e.stopPropagation()} className="btn btn-danger rounded-pill px-4" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Đăng ký ngay</Link>
                              ) : (
                                <button className="btn btn-secondary rounded-pill px-4" style={{ fontSize: '0.85rem', fontWeight: 600 }} disabled>Đã kết thúc</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted small">Hiển thị {filteredCampaigns.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} trong tổng số {filteredCampaigns.length} chiến dịch</span>
                  <div className="d-flex gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn border bg-white rounded text-muted px-2 py-1">&laquo;</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`btn border rounded px-3 py-1 ${currentPage === page ? 'bg-danger text-white' : 'bg-white text-muted'}`}>
                        {page}
                      </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="btn border bg-white rounded text-muted px-2 py-1">&raquo;</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Details Sticky Sidebar */}
          <div className="col-12 col-lg-4">
            {selectedCampaign ? (
              <div style={{ position: 'sticky', top: '100px' }}>
                <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-3">
                  <div style={{ height: '220px', position: 'relative' }}>
                    <img src={selectedCampaign.attachmentUrl || 'https://via.placeholder.com/600x400'} 
                         className="w-100 h-100 object-fit-cover" 
                         alt={selectedCampaign.campaignName}
                         onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80'; }} 
                    />
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      {getStatusBadge(selectedCampaign.startDate, selectedCampaign.endDate)}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h5 className="fw-bold mb-3" style={{ color: '#111827' }}>{selectedCampaign.campaignName}</h5>
                    
                    <div className="d-flex flex-column gap-3 mb-4">
                      <div className="d-flex align-items-start gap-3">
                        <div className="text-danger mt-1">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                          <div className="small text-muted mb-1">Thời gian</div>
                          <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{formatDate(selectedCampaign.startDate)} - {formatDate(selectedCampaign.endDate)}</div>
                        </div>
                      </div>
                      
                      <div className="d-flex align-items-start gap-3">
                        <div className="text-danger mt-1">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </div>
                        <div>
                          <div className="small text-muted mb-1">Địa điểm</div>
                          <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{selectedCampaign.location}</div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-4">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          18 - 60 tuổi
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                          Cân nặng ≥ 45kg
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small fw-semibold text-muted">Đã đăng ký {selectedCampaign.registrantCount}</span>
                        <span className="small text-muted">Còn lại: {selectedCampaign.maxParticipants - selectedCampaign.registrantCount} người</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-danger" style={{ width: `${(selectedCampaign.registrantCount / selectedCampaign.maxParticipants) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      {!isCampaignEnded(selectedCampaign.endDate) ? (
                        <Link to={`/appointment?campaignId=${selectedCampaign.campaignId}`} className="btn btn-danger flex-grow-1 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          Đăng ký ngay
                        </Link>
                      ) : (
                        <button className="btn btn-secondary flex-grow-1 fw-bold py-2 shadow-sm" disabled>Đã kết thúc</button>
                      )}
                      <button onClick={handleShare} className="btn border bg-white px-3 fw-bold text-muted d-flex align-items-center gap-2 hover-bg-light">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        Chia sẻ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-bold m-0">Người đã đăng ký ({selectedCampaign.registrantCount})</h6>
                    {registrants.length > 3 && (
                      <button onClick={() => setShowAllRegistrants(!showAllRegistrants)} className="btn btn-link p-0 text-decoration-none small">
                        {showAllRegistrants ? 'Thu gọn' : 'Xem tất cả'}
                      </button>
                    )}
                  </div>
                  
                  {renderRegistrants()}

                  {registrants.length > 3 && !showAllRegistrants && (
                    <button onClick={() => setShowAllRegistrants(true)} className="btn border w-100 mt-2 text-danger fw-semibold" style={{ fontSize: '0.85rem' }}>Xem danh sách đầy đủ</button>
                  )}
                </div>

                {/* THẢO LUẬN / COMMENTS */}
                <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    Thảo luận ({comments.length})
                  </h6>
                  
                  {/* Comment Input */}
                  <form onSubmit={handleSubmitComment} className="mb-4">
                    <div className="d-flex gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-circle bg-light text-secondary flex-shrink-0" style={{ width: 36, height: 36, fontWeight: 600 }}>
                        {user ? getAvatarChar(user.fullName, user.username) : '?'}
                      </div>
                      <div className="flex-grow-1 position-relative">
                        <textarea 
                          className="form-control" 
                          rows={1}
                          placeholder={user ? "Viết bình luận..." : "Vui lòng đăng nhập để bình luận"}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          disabled={!user || isSubmittingComment}
                          style={{ fontSize: '0.875rem', borderRadius: '1rem', resize: 'none', paddingRight: '40px' }}
                        ></textarea>
                        <button 
                          type="submit" 
                          className="btn btn-link position-absolute text-danger" 
                          style={{ right: '5px', bottom: '0px', padding: '5px' }}
                          disabled={!user || !newComment.trim() || isSubmittingComment}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Comment List */}
                  <div className="d-flex flex-column gap-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {loadingComments ? (
                      <div className="text-center text-muted small py-3">Đang tải bình luận...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center text-muted small py-3">Hãy là người đầu tiên bình luận!</div>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.commentId} className="d-flex gap-2 align-items-start">
                          <div className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0" 
                               style={{ width: 32, height: 32, fontSize: '0.8rem', background: 'linear-gradient(135deg, #4B5563, #6B7280)', fontWeight: 600 }}>
                            {getAvatarChar(comment.fullName, comment.username)}
                          </div>
                          <div className="bg-light rounded-3 p-2 px-3" style={{ fontSize: '0.85rem' }}>
                            <div className="fw-bold mb-1" style={{ color: '#111827' }}>{comment.fullName}</div>
                            <div style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                              {new Date(comment.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-danger bg-opacity-10 rounded-4 p-3 d-flex gap-3 border border-danger border-opacity-25">
                  <div className="text-danger mt-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  </div>
                  <div>
                    <div className="fw-bold text-danger mb-1" style={{ fontSize: '0.85rem' }}>Lưu ý khi đăng ký</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>Bạn có thể hủy đăng ký trước 24 giờ so với thời gian hiến máu.</div>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
