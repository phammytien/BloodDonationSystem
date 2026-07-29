import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Pagination } from '../../components/common/Pagination';

export const CampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả trạng thái');
  const [timeFilter, setTimeFilter] = useState<string>('Tất cả thời gian');
  const [sortFilter, setSortFilter] = useState<string>('Sắp xếp: Mới nhất');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'list' ? 5 : 6; 

  useEffect(() => {
    axios.get('http://localhost:5028/api/appointment/campaigns')
      .then(res => setCampaigns(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleReset = () => {
    setSearch('');
    setStatusFilter('Tất cả trạng thái');
    setTimeFilter('Tất cả thời gian');
    setSortFilter('Sắp xếp: Mới nhất');
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (search && !c.campaignName.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Status Filter
    if (statusFilter !== 'Tất cả trạng thái') {
      const now = new Date();
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      let status = '';
      if (now < start) status = 'Sắp diễn ra';
      else if (now > end) status = 'Đã kết thúc';
      else status = 'Đang diễn ra';
      
      if (statusFilter === 'Sắp diễn ra' && status !== 'Sắp diễn ra') return false;
      if (statusFilter === 'Đang diễn ra' && status !== 'Đang diễn ra') return false;
      if (statusFilter === 'Đã kết thúc' && status !== 'Đã kết thúc') return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortFilter === 'Sắp xếp: Mới nhất') {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const currentCampaigns = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, timeFilter, sortFilter, viewMode]);

  const getStatusText = (startStr: string, endStr: string) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (now < start) return 'Sắp diễn ra';
    if (now > end) return 'Đã kết thúc';
    return 'Đang diễn ra';
  };

  const isCampaignEnded = (endStr: string) => new Date() > new Date(endStr);

  return (
    <div className="min-vh-100 pb-5" style={{ backgroundColor: '#F8F9FA' }}>
      
      {/* Hero Banner Section */}
      <div 
        className="position-relative d-flex align-items-center"
        style={{ 
          background: 'url("/nen/nen.png") center/cover no-repeat',
          height: '280px',
          borderBottomLeftRadius: '50% 25%',
          borderBottomRightRadius: '50% 25%',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.2)'
        }}
      >
        <div className="container position-relative z-1">
          <div className="row">
            <div className="col-12 col-md-7 col-lg-6" style={{ paddingBottom: '30px' }}>
              <h1 className="fw-bold mb-3 text-white" style={{ fontSize: '3rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontFamily: 'Montserrat, sans-serif' }}>
                Chiến Dịch Hiến Máu
              </h1>
              <p className="lead mb-4 text-white" style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                Kết nối những trái tim nhân ái. Hãy tham gia hiến máu để mang lại cơ hội sống cho hàng ngàn bệnh nhân đang chờ đợi.
              </p>
              
              {/* Stats on Banner */}
              <div className="d-flex flex-wrap gap-3">
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-white" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <div>
                    <div className="fw-bold fs-5 lh-1 text-white">28+</div>
                    <div className="small opacity-75 text-white" style={{ fontSize: '0.75rem' }}>Chiến dịch</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-white" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>
                  <div>
                    <div className="fw-bold fs-5 lh-1 text-white">12.540+</div>
                    <div className="small opacity-75 text-white" style={{ fontSize: '0.75rem' }}>Đơn vị máu</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-white" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  <div>
                    <div className="fw-bold fs-5 lh-1 text-white">8.200+</div>
                    <div className="small opacity-75 text-white" style={{ fontSize: '0.75rem' }}>Người tham gia</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="container position-relative" style={{ marginTop: '-45px', zIndex: 10 }}>
        <div className="bg-white p-2 p-md-3 rounded-pill shadow-sm border d-flex flex-column flex-md-row gap-2 align-items-center">
          
          <div className="position-relative flex-grow-1 w-100 border-end pe-md-2" style={{ minWidth: '250px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="form-control border-0 ps-5 bg-transparent" 
              placeholder="Tìm kiếm chiến dịch..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ boxShadow: 'none' }}
            />
          </div>

          <select className="form-select border-0 bg-transparent text-muted flex-grow-1 w-100 border-end pe-md-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ boxShadow: 'none', cursor: 'pointer' }}>
            <option value="Tất cả trạng thái">Tất cả trạng thái</option>
            <option value="Sắp diễn ra">Sắp diễn ra</option>
            <option value="Đang diễn ra">Đang diễn ra</option>
            <option value="Đã kết thúc">Đã kết thúc</option>
          </select>

          <select className="form-select border-0 bg-transparent text-muted flex-grow-1 w-100 border-end pe-md-2" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ boxShadow: 'none', cursor: 'pointer' }}>
            <option value="Tất cả thời gian">Tất cả thời gian</option>
            <option value="Tháng này">Tháng này</option>
            <option value="Tháng tới">Tháng tới</option>
          </select>

          <select className="form-select border-0 bg-transparent text-muted flex-grow-1 w-100 pe-md-2" value={sortFilter} onChange={e => setSortFilter(e.target.value)} style={{ boxShadow: 'none', cursor: 'pointer' }}>
            <option value="Sắp xếp: Mới nhất">Sắp xếp: Mới nhất</option>
            <option value="Sắp xếp: Cũ nhất">Sắp xếp: Cũ nhất</option>
          </select>

          <button onClick={handleReset} className="btn btn-outline-danger rounded-pill px-4 py-2 fw-medium flex-shrink-0 d-flex align-items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
            Đặt lại
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mt-5">
        
        {/* Header List */}
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          <div className="d-flex align-items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <h5 className="fw-bold m-0 text-dark">Tất cả chiến dịch</h5>
            <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-1 shadow-sm">
              {filteredCampaigns.length} chiến dịch
            </span>
          </div>
          
          {/* View Toggles */}
          <div className="d-flex bg-white rounded-pill shadow-sm border p-1 gap-1">
            <button 
              className={`btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-2 border-0 ${viewMode === 'list' ? 'text-danger bg-danger bg-opacity-10 fw-bold' : 'text-muted bg-transparent'}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              Dạng danh sách
            </button>
            <button 
              className={`btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-2 border-0 ${viewMode === 'grid' ? 'text-danger bg-danger bg-opacity-10 fw-bold' : 'text-muted bg-transparent'}`}
              onClick={() => setViewMode('grid')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Dạng lưới
            </button>
          </div>
        </div>

        {/* Campaign List/Grid */}
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1" className="mb-3"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <h5 className="text-muted fw-bold">Không tìm thấy chiến dịch nào</h5>
          </div>
        ) : viewMode === 'list' ? (
          <div className="d-flex flex-column gap-4">
            {currentCampaigns.map((c, index) => {
              const statusText = getStatusText(c.startDate, c.endDate);
              const statusBadgeColor = statusText === 'Sắp diễn ra' ? '#FEF3C7' : (statusText === 'Đã kết thúc' ? '#F3F4F6' : '#DCFCE7');
              const statusTextColor = statusText === 'Sắp diễn ra' ? '#D97706' : (statusText === 'Đã kết thúc' ? '#4B5563' : '#16A34A');
              const isImageLeft = index % 2 === 0;
              const maxParticipants = c.maxParticipants || 100;
              const progressPercent = Math.min((c.registrantCount / maxParticipants) * 100, 100);

              return (
                <div key={index} className="card border-0 rounded-5 shadow-sm bg-white overflow-hidden horizontal-card" style={{ height: '240px' }}>
                  <div className="row g-0 h-100 position-relative">
                    
                    {/* Fake elements for curved split effect */}
                    <div className={`split-curve ${isImageLeft ? 'curve-left' : 'curve-right'}`}></div>

                    {/* Image Section */}
                    <div className={`col-5 h-100 position-relative z-0 ${isImageLeft ? 'order-1' : 'order-2'}`}>
                      <Link to={`/campaigns/${c.campaignId}`} className="d-block w-100 h-100">
                        <img 
                          src={(c.attachmentUrl && c.attachmentUrl.length > 5) ? c.attachmentUrl : "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=600"} 
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=600"; e.currentTarget.onerror = null; }}
                          alt="Campaign" 
                          className="w-100 h-100 object-fit-cover" 
                        />
                      </Link>
                    </div>
                    
                    {/* Content Section */}
                    <div className={`col-7 h-100 position-relative z-1 ${isImageLeft ? 'order-2 ps-4' : 'order-1 pe-4'}`}>
                      <div className="card-body h-100 d-flex flex-column py-4 px-4 bg-white" style={{ borderRadius: isImageLeft ? '60px 0 0 60px' : '0 60px 60px 0' }}>
                        
                        {/* Top row: Badges & Heart */}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge rounded-pill px-3 py-1 shadow-sm" style={{ backgroundColor: statusBadgeColor, color: statusTextColor }}>
                            {statusText}
                          </span>
                          <button className="btn btn-sm btn-light rounded-circle p-2 text-danger border-0 hover-bg-red">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                          </button>
                        </div>

                        {/* Title */}
                        <Link to={`/campaigns/${c.campaignId}`} className="text-decoration-none">
                          <h4 className="fw-bold text-dark mb-3 line-clamp-2 hover-text-danger" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {c.campaignName}
                          </h4>
                        </Link>
                        
                        {/* Icons Info */}
                        <div className="d-flex align-items-center gap-4 text-muted small fw-medium mb-3 flex-wrap">
                          <div className="d-flex align-items-center gap-1 text-danger">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span>{new Date(c.startDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span className="line-clamp-1" style={{ maxWidth: '180px' }} title={c.location}>{c.location}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1 text-dark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span>Đã đăng ký <span className="fw-bold">{c.registrantCount}</span>/{maxParticipants}</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="d-flex align-items-center gap-3 mb-auto">
                          <div className="progress flex-grow-1" style={{ height: '4px', backgroundColor: '#F3F4F6' }}>
                            <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                          <span className="text-danger fw-bold small" style={{ minWidth: '35px' }}>{Math.round(progressPercent)}%</span>
                        </div>

                        {/* Bottom Row: Avatars & Buttons */}
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          
                          {/* Avatars */}
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-group d-flex">
                              {c.registrantAvatars && c.registrantAvatars.length > 0 ? (
                                c.registrantAvatars.map((ava: string, i: number) => (
                                  <img 
                                    key={i} 
                                    src={ava.startsWith('http') ? ava : `http://localhost:5028${ava}`} 
                                    alt="user" 
                                    className="rounded-circle border border-2 border-white shadow-sm" 
                                    style={{ width: '28px', height: '28px', marginLeft: i === 0 ? '0px' : '-10px', objectFit: 'cover' }} 
                                  />
                                ))
                              ) : (
                                <div className="rounded-circle border border-2 border-white bg-light d-flex align-items-center justify-content-center shadow-sm text-danger fw-bold" style={{ width: '28px', height: '28px', marginLeft: '0px', fontSize: '0.75rem' }}>
                                  ?
                                </div>
                              )}
                              {c.registrantCount > 3 && (
                                <div className="rounded-circle border border-2 border-white bg-light d-flex align-items-center justify-content-center shadow-sm text-muted small" style={{ width: '28px', height: '28px', marginLeft: '-10px', fontSize: '0.65rem', zIndex: 4 }}>
                                  +{c.registrantCount - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-muted small ms-2">{c.registrantCount} người đã đăng ký</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex gap-2">
                            {!isCampaignEnded(c.endDate) ? (
                              <Link to={`/appointment?campaignId=${c.campaignId}`} className="btn btn-danger rounded-pill shadow-sm fw-bold px-4 d-flex align-items-center gap-2 hover-elevate">
                                Đăng ký ngay
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                              </Link>
                            ) : (
                              <button className="btn btn-secondary rounded-pill shadow-sm fw-bold px-4" disabled>Đã kết thúc</button>
                            )}
                            <Link to={`/campaigns/${c.campaignId}`} className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center hover-bg-gray" style={{ width: '42px', height: '42px' }} title="Xem chi tiết">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </Link>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="row g-4">
            {currentCampaigns.map((c, index) => {
              const statusText = getStatusText(c.startDate, c.endDate);
              const statusBadgeColor = statusText === 'Sắp diễn ra' ? '#FEF3C7' : (statusText === 'Đã kết thúc' ? '#F3F4F6' : '#DCFCE7');
              const statusTextColor = statusText === 'Sắp diễn ra' ? '#D97706' : (statusText === 'Đã kết thúc' ? '#4B5563' : '#16A34A');
              const maxParticipants = c.maxParticipants || 100;
              const progressPercent = Math.min((c.registrantCount / maxParticipants) * 100, 100);

              return (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white overflow-hidden grid-card">
                    
                    {/* Top Image & Badges */}
                    <div className="position-relative overflow-hidden" style={{ height: '220px', backgroundColor: '#F3F4F6', borderBottomLeftRadius: '50% 15%', borderBottomRightRadius: '50% 15%' }}>
                      <Link to={`/campaigns/${c.campaignId}`} className="d-block w-100 h-100">
                        <img 
                          src={(c.attachmentUrl && c.attachmentUrl.length > 5) ? c.attachmentUrl : "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=600"} 
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=600"; e.currentTarget.onerror = null; }}
                          alt="Campaign" 
                          className="w-100 h-100 object-fit-cover card-img-anim" 
                        />
                      </Link>
                      {/* Status Badges */}
                      <div className="position-absolute top-0 start-0 w-100 p-3 d-flex justify-content-between align-items-start">
                        <span className="badge bg-white text-danger px-3 py-2 rounded-pill shadow-sm fw-bold">
                          Campaign
                        </span>
                        <span className="badge px-3 py-2 rounded-pill shadow-sm fw-bold" style={{ backgroundColor: statusBadgeColor, color: statusTextColor }}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    <div className="card-body p-4 d-flex flex-column">
                      <Link to={`/campaigns/${c.campaignId}`} className="text-decoration-none">
                        <h5 className="card-title fw-bold text-dark mb-3 line-clamp-2 hover-text-danger" style={{ fontFamily: 'Montserrat, sans-serif', height: '48px' }}>
                          {c.campaignName}
                        </h5>
                      </Link>

                      <div className="d-flex flex-column gap-2 text-muted small fw-medium mb-4">
                        <div className="d-flex align-items-center gap-2 text-danger">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span>{new Date(c.startDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          <span className="line-clamp-1" title={c.location}>{c.location}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2 small fw-medium">
                          <span className="text-dark">Đăng ký: <span className="text-danger fw-bold">{c.registrantCount}</span></span>
                          <span className="text-muted">Mục tiêu: {maxParticipants}</span>
                        </div>
                        <div className="progress mb-4" style={{ height: '6px', borderRadius: '10px' }}>
                          <div className="progress-bar bg-danger rounded-pill" role="progressbar" style={{ width: `${progressPercent}%` }}></div>
                        </div>

                        <div className="d-flex gap-2">
                          {!isCampaignEnded(c.endDate) ? (
                            <Link to={`/appointment?campaignId=${c.campaignId}`} className="btn btn-danger flex-grow-1 rounded-3 fw-bold d-flex align-items-center justify-content-center hover-elevate">
                              Đăng ký ngay
                            </Link>
                          ) : (
                            <button className="btn btn-secondary flex-grow-1 rounded-3 fw-bold" disabled>Đã kết thúc</button>
                          )}
                          <Link to={`/campaigns/${c.campaignId}`} className="btn btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center hover-bg-gray" style={{ width: '45px' }} title="Xem chi tiết">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Use Math.ceil(filteredCampaigns.length / itemsPerPage) or check properly */}
        {filteredCampaigns.length > itemsPerPage && (
          <div className="mt-5 d-flex justify-content-center pb-4">
            <Pagination 
              currentPage={currentPage} 
              totalItems={filteredCampaigns.length} 
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </div>

      <style>{`
        /* List View Curve Magic */
        .horizontal-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .horizontal-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important;
        }
        .split-curve {
          position: absolute;
          top: -10%;
          width: 80px;
          height: 120%;
          background: #fff;
          z-index: 2;
          border-radius: 50%;
        }
        .curve-left {
          left: calc(41.66666667% - 40px); /* Boundary of col-5 */
        }
        .curve-right {
          right: calc(41.66666667% - 40px); /* Boundary of col-5 */
        }
        
        /* Grid View Hover */
        .grid-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .grid-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
        }
        .grid-card:hover .card-img-anim {
          transform: scale(1.05);
        }
        .card-img-anim {
          transition: transform 0.5s ease;
        }
        
        /* Utilities */
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hover-text-danger:hover {
          color: #DC2626 !important;
        }
        .hover-elevate:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2) !important;
        }
        .hover-bg-gray:hover {
          background-color: #F3F4F6 !important;
        }
        .hover-bg-red:hover {
          background-color: #FEE2E2 !important;
        }
      `}</style>
    </div>
  );
};
