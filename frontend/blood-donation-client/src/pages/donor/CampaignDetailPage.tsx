import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

export const CampaignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignDetails();
    fetchRegistrants();
    fetchComments();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5028/api/campaign/${id}`);
      setCampaign(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải thông tin chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrants = async () => {
    try {
      const res = await axios.get(`http://localhost:5028/api/appointment/campaign/${id}/registrants`);
      setRegistrants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5028/api/campaign/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast.info('Bạn cần đăng nhập để bình luận!');
      return;
    }
    
    try {
      await axios.post(`http://localhost:5028/api/campaign/${id}/comments`, {
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNewComment('');
      fetchComments();
      toast.success('Gửi bình luận thành công');
    } catch (err) {
      toast.error('Lỗi khi gửi bình luận');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-danger" role="status"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container py-5 text-center">
        <h4>Không tìm thấy chiến dịch</h4>
        <Link to="/campaigns" className="btn btn-outline-danger mt-3">Quay lại danh sách</Link>
      </div>
    );
  }

  const isCampaignEnded = new Date() > new Date(campaign.endDate);
  
  const getAvatarChar = (name: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <div className="container py-5 fade-in">
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      
      {/* Breadcrumb / Back button */}
      <div className="mb-4">
        <Link to="/campaigns" className="text-decoration-none text-muted d-flex align-items-center gap-2 hover-text-danger transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Quay lại danh sách
        </Link>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: Campaign Details + Comments */}
        <div className="col-12 col-lg-8">
          <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4 border-0">
            <div style={{ height: '350px', backgroundColor: '#f8f9fa', position: 'relative' }}>
              <img 
                src={campaign.attachmentUrl || "https://st2.depositphotos.com/3591429/11952/i/450/depositphotos_119520970-stock-photo-blood-donor-at-donation-with.jpg"} 
                alt="Banner" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div className="position-absolute top-0 end-0 p-3">
                {!isCampaignEnded ? (
                  <span className="badge rounded-pill bg-white text-success px-3 py-2 shadow border border-success border-opacity-25" style={{ fontSize: '0.85rem' }}>Đang / Sắp diễn ra</span>
                ) : (
                  <span className="badge rounded-pill bg-white text-muted px-3 py-2 shadow border" style={{ fontSize: '0.85rem' }}>Đã kết thúc</span>
                )}
              </div>
            </div>
            
            <div className="p-4 p-md-5">
              <h2 className="fw-bold mb-3" style={{ color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>{campaign.campaignName}</h2>
              <p className="text-muted mb-4 fs-6" style={{ lineHeight: '1.7' }}>{campaign.description}</p>
              
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center gap-3 p-4 rounded-4 h-100" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                    <div className="text-danger bg-white p-2 rounded-circle shadow-sm">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div>
                      <div className="small text-danger fw-bold" style={{ letterSpacing: '0.5px' }}>THỜI GIAN</div>
                      <div className="fw-bold text-dark mt-1">{new Date(campaign.startDate).toLocaleDateString('vi-VN')} - {new Date(campaign.endDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center gap-3 p-4 rounded-4 h-100" style={{ backgroundColor: '#F0F9FF', border: '1px solid #E0F2FE' }}>
                    <div className="text-primary bg-white p-2 rounded-circle shadow-sm">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div>
                      <div className="small fw-bold" style={{ color: '#0284C7', letterSpacing: '0.5px' }}>ĐỊA ĐIỂM</div>
                      <div className="fw-bold text-dark mt-1">{campaign.location}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                {!isCampaignEnded ? (
                  <Link to={`/appointment?campaignId=${campaign.campaignId}`} className="btn btn-danger btn-lg w-100 fw-bold rounded-pill shadow d-flex justify-content-center align-items-center gap-2 py-3" style={{ fontSize: '1.1rem' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Đăng ký hiến máu ngay
                  </Link>
                ) : (
                  <button className="btn btn-secondary btn-lg w-100 fw-bold rounded-pill shadow-sm py-3" disabled>Đã kết thúc đăng ký</button>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
            <h4 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-danger"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Bình luận ({comments.length})
            </h4>

            {/* Comment Input */}
            <div className="d-flex gap-3 mb-5 p-4 rounded-4" style={{ backgroundColor: '#F9FAFB' }}>
              <div className="rounded-circle bg-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm border" style={{ width: 48, height: 48, color: '#9CA3AF' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div className="flex-grow-1">
                <textarea 
                  className="form-control bg-white shadow-sm border-0 rounded-4 p-3 mb-3" 
                  rows={3} 
                  placeholder={user ? "Viết bình luận, chia sẻ cảm nghĩ của bạn..." : "Vui lòng đăng nhập để bình luận"}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!user}
                  style={{ resize: 'none' }}
                />
                <div className="d-flex justify-content-end">
                  <button onClick={handlePostComment} disabled={!user || !newComment.trim()} className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm d-flex align-items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    Gửi
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="d-flex flex-column gap-4">
              {comments.length === 0 ? (
                <div className="text-center py-5 rounded-4" style={{ backgroundColor: '#F9FAFB', border: '1px dashed #D1D5DB' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1" className="mb-3"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  <div className="text-muted fw-medium">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ!</div>
                </div>
              ) : (
                comments.map((cmt: any, idx: number) => (
                  <div key={idx} className="d-flex gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm" style={{ width: 45, height: 45, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '1rem', fontWeight: 'bold' }}>
                      {getAvatarChar(cmt.userName)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="bg-light rounded-4 p-3 px-4 shadow-sm" style={{ border: '1px solid #F3F4F6' }}>
                        <div className="d-flex justify-content-between align-items-baseline mb-1">
                          <div className="fw-bold" style={{ color: '#1F2937', fontSize: '0.95rem' }}>{cmt.userName}</div>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {new Date(cmt.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                        <div className="text-dark" style={{ lineHeight: '1.5' }}>{cmt.content}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Registrants */}
        <div className="col-12 col-lg-4">
          <div className="bg-white rounded-4 shadow-sm p-4 sticky-top" style={{ top: '90px' }}>
            <h5 className="fw-bold mb-4 d-flex align-items-center justify-content-between">
              Người tham gia
              <span className="badge bg-danger rounded-pill px-3">{registrants.length}</span>
            </h5>
            
            <div className="d-flex flex-column gap-3 overflow-auto pe-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {registrants.length === 0 ? (
                <div className="text-muted text-center py-5 rounded-4" style={{ backgroundColor: '#F9FAFB' }}>
                  Chưa có người đăng ký.
                </div>
              ) : (
                registrants.map((reg, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-center p-3 rounded-4 transition-all" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0 shadow-sm" 
                           style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #DC2626, #F87171)', fontSize: '0.95rem' }}>
                        {getAvatarChar(reg.donorName)}
                      </div>
                      <div>
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>{reg.donorName}</div>
                        <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          {reg.phone || 'Ẩn số'}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className={`badge rounded-pill shadow-sm border ${reg.status === 'Đã xác nhận' ? 'bg-white text-success border-success border-opacity-25' : 'bg-white text-warning border-warning border-opacity-25'}`}>
                        {reg.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
