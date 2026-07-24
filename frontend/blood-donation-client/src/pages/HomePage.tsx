import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { getAvatarChar, getDisplayName } from '../utils/avatarHelper';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { NotificationBell } from '../components/NotificationBell';

interface BloodCompatibility {
  giveTo: string[];
  receiveFrom: string[];
  description: string;
}

const bloodCompatibilityData: Record<string, BloodCompatibility> = {
  'O-': {
    giveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    receiveFrom: ['O-'],
    description: 'Nhóm máu O- là nhóm máu "Hiến Tặng Toàn Năng" — có thể hiến cho mọi nhóm máu khác, nhưng chỉ có thể nhận từ chính nó.'
  },
  'O+': {
    giveTo: ['O+', 'A+', 'B+', 'AB+'],
    receiveFrom: ['O-', 'O+'],
    description: 'Nhóm máu O+ phổ biến nhất. Có thể hiến cho hầu hết nhóm máu dương tính và nhận từ nhóm máu O.'
  },
  'A-': {
    giveTo: ['A-', 'A+', 'AB-', 'AB+'],
    receiveFrom: ['O-', 'A-'],
    description: 'Nhóm máu A- có thể hiến cho cả nhóm A và AB (âm hay dương), và nhận từ O- và A-.'
  },
  'A+': {
    giveTo: ['A+', 'AB+'],
    receiveFrom: ['O-', 'O+', 'A-', 'A+'],
    description: 'Nhóm máu A+ phổ biến thứ hai. Hiến cho A+ và AB+, nhận từ nhóm O và A.'
  },
  'B-': {
    giveTo: ['B-', 'B+', 'AB-', 'AB+'],
    receiveFrom: ['O-', 'B-'],
    description: 'Nhóm máu B- có thể hiến cho cả nhóm B và AB (âm hay dương), và nhận từ O- và B-.'
  },
  'B+': {
    giveTo: ['B+', 'AB+'],
    receiveFrom: ['O-', 'O+', 'B-', 'B+'],
    description: 'Nhóm máu B+ có thể hiến cho B+ và AB+, nhận từ nhóm O và B.'
  },
  'AB-': {
    giveTo: ['AB-', 'AB+'],
    receiveFrom: ['O-', 'A-', 'B-', 'AB-'],
    description: 'Nhóm máu AB- rất hiếm. Hiến cho nhóm AB, nhận từ tất cả nhóm máu âm tính.'
  },
  'AB+': {
    giveTo: ['AB+'],
    receiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    description: 'Nhóm máu AB+ là "Nhận Toàn Năng" — người sở hữu có thể nhận máu từ bất kỳ nhóm máu nào.'
  }
};

const initialInventory: Record<string, number> = {
  'O-': 25, 'O+': 55, 'A-': 35, 'A+': 65,
  'B-': 40, 'B+': 75, 'AB-': 20, 'AB+': 85
};

export const HomePage: React.FC = () => {
  const { user, logout, profilePromptDismissed, dismissProfilePrompt } = useAuth();
  const navigate = useNavigate();
  const [selectedBlood, setSelectedBlood] = useState<string>('O-');
  const [bloodInventory, setBloodInventory] = useState<Record<string, number>>(initialInventory);
  const [simulateType, setSimulateType] = useState<string>('O-');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  // Toast on logout success
  useEffect(() => {
    if (localStorage.getItem('logout_success_toast') === 'true') {
      toast.success('Đăng xuất thành công!');
      localStorage.removeItem('logout_success_toast');
    }
  }, []);

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

  const handleSimulateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setTimeout(() => {
      setBloodInventory(prev => ({
        ...prev,
        [simulateType]: Math.min(100, prev[simulateType] + 15)
      }));
      setIsSimulating(false);
      toast.success(`🎉 Cảm ơn! Kho dự trữ nhóm ${simulateType} đã tăng thêm +15%.`);
    }, 1000);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInventoryColor = (pct: number) =>
    pct < 30 ? '#D42B2B' : pct < 50 ? '#D97706' : '#059669';

  const getInventoryLabel = (pct: number) =>
    pct < 30 ? 'Cực thấp' : pct < 50 ? 'Thấp' : 'An toàn';

  const getInventoryBadgeClass = (pct: number) =>
    pct < 30 ? 'bg-danger' : pct < 50 ? 'bg-warning text-dark' : 'bg-success';

  return (
    <div className="fade-in" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <ToastContainer position="top-right" autoClose={3500} />

      {/* ── NAVBAR ───────────────────────────────────────────── */}
      <nav
        className="navbar navbar-expand-lg bg-white sticky-top"
        style={{
          borderBottom: '1px solid #F3F4F6',
          boxShadow: '0 2px 15px rgba(0,0,0,0.03)',
          padding: '0.85rem 0'
        }}
      >
        <div className="container">
          <Link to="/" className="d-flex align-items-center text-decoration-none gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#fff"
                />
                <path
                  d="M12 7v10M9 12h6"
                  stroke="#fff"
                  strokeWidth="25%"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '1.25rem', color: '#1B4FD8' }}>
              LifeGive
            </span>
          </Link>

          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto gap-3 my-2 my-lg-0">
              {['intro', 'process', 'inventory-status', 'compatibility', 'testimonials', 'news'].map((id, i) => {
                const labels = ['Giới thiệu', 'Quy trình', 'Kho dự trữ', 'Tương thích', 'Cảm nhận', 'Tin tức'];
                return (
                  <li key={id} className="nav-item">
                    <button onClick={() => scrollTo(id)} className="nav-link-custom btn py-2">{labels[i]}</button>
                  </li>
                );
              })}
            </ul>

            <div className="d-flex align-items-center gap-3">
              {user ? (
                <>
                  {user.roleName.toLowerCase() === 'donor' && (
                    <Link to="/appointment" className="btn-primary-custom">
                      Đăng ký hiến máu
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" /></svg>
                    </Link>
                  )}
                  {user.roleName.toLowerCase() === 'staff' && (
                    <Link to="/dashboard" className="btn-primary-custom">
                      Bảng điều khiển
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </Link>
                  )}
                  <NotificationBell />
                  {/* User Avatar Dropdown */}
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
                      onBlur={() => setTimeout(() => setShowUserMenu(false), 150)}
                      tabIndex={0}
                    >
                      {getAvatarChar(user.fullName, user.username)}
                    </button>
                    {showUserMenu && (
                      <div
                        className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg"
                        style={{
                          minWidth: '220px',
                          zIndex: 1000,
                          border: '1px solid #E5E7EB',
                          animation: 'fadeInDown 0.15s ease'
                        }}
                      >
                        <div className="p-3 border-bottom" style={{ fontSize: '0.82rem', color: '#4B5563' }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                              style={{
                                width: '32px',
                                height: '32px',
                                background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}
                            >
                              {getAvatarChar(user.fullName, user.username)}
                            </div>
                            <div>
                              <div className="fw-bold" style={{ color: '#111827' }}>{getDisplayName(user.fullName, user.username)}</div>
                              <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{user.email}</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2"
                            style={{
                              fontSize: '0.85rem',
                              color: '#1B4FD8',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              borderRadius: '10px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            Thông tin tài khoản
                          </Link>
                          <Link
                            to="/change-password"
                            className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2"
                            style={{
                              fontSize: '0.85rem',
                              color: '#4B5563',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              borderRadius: '10px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Đổi mật khẩu
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-100 d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent rounded-2 text-start"
                            style={{
                              fontSize: '0.85rem',
                              color: '#D42B2B',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF0F0')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login?redirect=/appointment"
                    className="btn-primary-custom d-flex align-items-center gap-2"
                    style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', padding: '0.55rem 1.2rem' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    Đăng ký hiến máu
                  </Link>
                  <Link to="/login" style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.88rem', color: '#1B4FD8', textDecoration: 'none' }}>Đăng nhập</Link>
                  <Link to="/register" className="btn btn-outline-danger fw-bold px-3 py-2 rounded-pill" style={{ fontFamily: 'Montserrat', fontSize: '0.82rem' }}>Đăng ký</Link>
                </>
              )
              }
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER ──────────────────────────────────────── */}
      <header className="hero-section" style={{ position: 'relative' }}>
        {/* Faded Background Image requested by User */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://i.pinimg.com/1200x/a2/09/7d/a2097d18300e3110a9a6722c5427d423.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.14,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Background blobs */}
        <div className="blob-container">
          <div className="bg-blob bg-blob-red"></div>
          <div className="bg-blob bg-blob-blue"></div>
        </div>

        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-5">

            {/* Left: Copy */}
            <div className="col-12 col-lg-6 text-center text-lg-start">
              <div className="medical-badge-pill">
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                Sức Khoẻ Cộng Đồng · Nhiệm Vụ Của Chúng Tôi
              </div>

              <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, lineHeight: 1.2, color: '#0F172A' }}>
                Hệ Thống Kết Nối<br />
                <span className="text-gradient" style={{ color: '#A71D2A', display: 'inline-block', marginTop: '6px', whiteSpace: 'nowrap' }}>Hiến Máu Nhân Đạo</span>
              </h1>

              <p className="mt-3 mb-5" style={{ fontSize: '1.05rem', color: '#4B5563', maxWidth: '520px', margin: '1.25rem auto 2.5rem', lineHeight: 1.75 }}>
                LifeGive số hóa toàn bộ quy trình hiến máu — từ đặt lịch, giám sát kho máu LIVE đến kết nối khẩn cấp người hiến khi có ca cấp cứu cần nhóm máu hiếm.
              </p>

              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
                <Link
                  to={user
                    ? (user.roleName.toLowerCase() === 'donor' ? '/appointment' : '/dashboard')
                    : '/login?redirect=/appointment'
                  }
                  className="btn-primary-custom"
                  style={{ fontSize: '0.95rem', padding: '0.9rem 2.2rem' }}
                >
                  Đăng ký hiến máu ngay
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
                <button onClick={() => scrollTo('process')} className="btn-secondary-custom" style={{ fontSize: '0.95rem', padding: '0.85rem 2.2rem' }}>
                  Tìm hiểu quy trình
                </button>
              </div>
            </div>

            {/* Right: Bootstrap Carousel */}
            <div className="col-12 col-lg-6">
              <div
                id="heroCarousel"
                className="carousel slide carousel-fade hero-carousel-wrapper"
                data-bs-ride="carousel"
              >
                <div className="carousel-indicators" style={{ marginBottom: '0.75rem' }}>
                  {[0, 1, 2].map(i => (
                    <button key={i} type="button" data-bs-target="#heroCarousel" data-bs-slide-to={i}
                      className={i === 0 ? 'active' : ''} aria-label={`Slide ${i + 1}`}
                      style={{ width: 28, height: 4, borderRadius: 4, margin: '0 3px' }}
                    ></button>
                  ))}
                </div>

                <div className="carousel-inner">
                  {[
                    { src: 'https://i.pinimg.com/736x/e1/f4/d4/e1f4d4eb33fb65a7835bbb9b371dee27.jpg', title: 'World Blood Donor Day', sub: 'Today, you can be someone\'s lifeline.' },
                    { src: 'https://i.pinimg.com/1200x/c1/54/c5/c154c50f5c4048a416eafa3230f02a3f.jpg', title: 'Một Giọt Máu — Triệu Tấm Lòng', sub: 'Chương trình nhân đạo chung tay vì cộng đồng.' },
                    { src: 'https://i.pinimg.com/736x/62/eb/ec/62ebec179f681716a7aa490f26b31c03.jpg', title: 'Kết Nối Trái Tim Nhân Ái', sub: 'Chia sẻ yêu thương, đem lại cơ hội hồi sinh.' }
                  ].map((slide, i) => (
                    <div key={i} className={`carousel-item${i === 0 ? ' active' : ''}`} data-bs-interval="4500">
                      <img src={slide.src} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="carousel-caption-custom">
                        <h5>{slide.title}</h5>
                        <p>{slide.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Trước</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Tiếp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Curved wave bottom */}
        <div className="hero-wave">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,80 L1440,80 L1440,20 C1080,80 720,80 360,40 C180,20 90,10 0,20 Z" fill="#ffffff" />
          </svg>
        </div>
      </header>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section className="pt-0 pb-5" style={{ backgroundColor: '#fff' }}>
        <div className="container">
          <div className="stats-bar-overlap">
            <div className="row g-0 text-center align-items-center">
              {[
                {
                  svgPath: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M19 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" /><rect x="1" y="9" width="22" height="6" rx="2" /><line x1="12" y1="9" x2="12" y2="15" /></svg>,
                  num: '4.250+', label: 'Lượt hiến máu', color: '#D42B2B'
                },
                {
                  svgPath: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                  num: '1.280+', label: 'Người đăng ký', color: '#1B4FD8'
                },
                {
                  svgPath: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
                  num: '15+', label: 'Bệnh viện liên kết', color: '#059669'
                },
                {
                  svgPath: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
                  num: '98%', label: 'Hài lòng đánh giá', color: '#D97706'
                },
              ].map((s, i) => (
                <div key={i} className={`col-6 col-md-3 stat-item py-2 py-md-0`}>
                  <div className="d-flex align-items-center justify-content-center gap-3">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                      {s.svgPath}
                    </div>
                    <div className="text-start">
                      <p className="stat-number" style={{ color: s.color }}>{s.num}</p>
                      <p className="stat-label">{s.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT / INTRO ────────────────────────────────────── */}
      <section id="intro" className="py-5 position-relative overflow-hidden" style={{ backgroundColor: '#F8FAFF' }}>
        {/* Faded Background Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://i.pinimg.com/1200x/a2/09/7d/a2097d18300e3110a9a6722c5427d423.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.08,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
        <div className="container py-4 position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-6">
              <div className="position-relative d-inline-block w-100">
                <div style={{ position: 'absolute', top: 24, left: 24, right: -24, bottom: -24, borderRadius: 24, background: 'linear-gradient(135deg,#E8F0FE,#EDE9FE)', zIndex: 0 }}></div>
                <img
                  src="https://i.pinimg.com/1200x/06/7d/37/067d375989943631ab9ded1413c6aa8f.jpg"
                  alt="Đội ngũ y tế chuyên nghiệp"
                  style={{ width: '100%', borderRadius: 20, boxShadow: '0 20px 48px rgba(0,0,0,0.10)', border: '5px solid #fff', position: 'relative', zIndex: 1, objectFit: 'cover', maxHeight: 400 }}
                />
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <span className="section-eyebrow">Về LifeGive</span>
              <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
                Hành Trình Kết Nối<br />
                <span className="text-gradient" style={{ color: '#A71D2A', display: 'inline-block', marginTop: '4px', whiteSpace: 'nowrap' }}>Sự Sống Cho Triệu Người</span>
              </h2>
              <div className="section-divider left"></div>
              <p style={{ fontSize: '0.97rem', lineHeight: 1.8, color: '#4B5563', marginBottom: '2rem' }}>
                LifeGive tạo ra cầu nối công nghệ y tế đáng tin cậy — giảm thiểu thủ tục hành chính, rút ngắn thời gian tiếp nhận máu và nâng cao nhận thức về hiến máu nhân đạo trên toàn quốc.
              </p>

              <div className="row g-3">
                {[
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                    title: 'Hỗ trợ 24/7', sub: 'Phản hồi khẩn cấp', color: '#1B4FD8', bg: '#E8F0FE'
                  },
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="10" y1="13" x2="14" y2="13" /></svg>,
                    title: 'Y tế uy tín', sub: 'Bác sĩ chuyên môn', color: '#D42B2B', bg: '#FEF0F0'
                  },
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h4m-4 0v4m0-4H3m18-7v4m0 0H9m10 0v8m0 0H9m10 0H9v-4" /></svg>,
                    title: 'Thiết bị hiện đại', sub: 'Vô trùng tuyệt đối', color: '#059669', bg: '#D1FAE5'
                  },
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
                    title: 'Bảo mật dữ liệu', sub: 'Lịch sử tự động', color: '#0891B2', bg: '#E0F7FA'
                  },
                ].map((f, i) => (
                  <div key={i} className="col-6">
                    <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 44, height: 44, backgroundColor: f.bg, color: f.color }}>
                        {f.svg}
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.88rem', color: '#111827', margin: 0 }}>{f.title}</p>
                        <p style={{ fontFamily: 'Nunito', fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>{f.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS / SERVICE CARDS ──────────────────────────── */}
      <section id="process" className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="section-eyebrow">Quy trình chuẩn y tế</span>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
              Quy Trình Hiến Máu <span style={{ color: '#A71D2A' }}>4 Bước</span>
            </h2>
            <div className="section-divider"></div>
            <p className="mx-auto" style={{ maxWidth: 600, color: '#6B7280', fontSize: '0.95rem' }}>
              An toàn, nhanh chóng và khép kín theo tiêu chuẩn Bộ Y tế — chỉ mất khoảng 30 phút.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                img: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&q=80',
                title: 'Đăng ký trực tuyến',
                desc: 'Tạo tài khoản và đặt lịch hiến máu qua website. Điền thông tin sức khoẻ cơ bản, chọn khung giờ phù hợp và nhận xác nhận qua email ngay tức thì.',
                num: '01'
              },
              {
                img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
                title: 'Khám sàng lọc',
                desc: 'Bác sĩ kiểm tra huyết áp, nhịp tim và xét nghiệm nồng độ huyết sắc tố. Đảm bảo bạn có đủ điều kiện sức khoẻ trước khi tiến hành hiến máu.',
                num: '02'
              },
              {
                img: 'https://i.pinimg.com/736x/9e/de/42/9ede421a760c726763674653241d8a3e.jpg',
                title: 'Hiến máu an toàn',
                desc: 'Lấy máu tĩnh mạch khoảng 10–15 phút bởi kỹ thuật viên chuyên nghiệp. Kim tiêm và túi đựng máu đều dùng một lần, hoàn toàn vô trùng.',
                num: '03'
              },
              {
                img: 'https://i.pinimg.com/1200x/e0/e8/6e/e0e86e9ac60a8a8d3f471809cfe8ecab.jpg',
                title: 'Nghỉ ngơi & Nhận quà',
                desc: 'Nghỉ ngơi tại sảnh chờ ít nhất 15 phút, dùng nước và ăn nhẹ bổ sung. Nhận giấy chứng nhận hiến máu điện tử và phần quà tri ân ý nghĩa.',
                num: '04'
              }
            ].map((step, i) => (
              <div key={i} className="col-12 col-md-6 col-lg-3 d-flex">
                <div className="service-card-custom w-100">
                  {/* Image — overflow:hidden clips zoom only */}
                  <div className="service-card-img-container">
                    <img src={step.img} alt={step.title} className="service-card-img" />
                  </div>
                  {/* Badge wrapper sits OUTSIDE img-container — never clipped */}
                  <div className="service-card-badge-wrapper">
                    <div className="service-card-badge">{step.num}</div>
                  </div>
                  <div className="service-card-body">
                    <h5>{step.title}</h5>
                    <p>{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── LIVE INVENTORY ───────────────────────────────────── */}
      <section id="inventory-status" className="py-5" style={{ backgroundColor: '#F8FAFF' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="section-eyebrow">Giám sát thời gian thực</span>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
              Kho Dự Trữ Máu <span style={{ color: '#A71D2A' }}>LIVE</span>
            </h2>
            <div className="section-divider"></div>
            <p className="mx-auto" style={{ maxWidth: 600, color: '#6B7280', fontSize: '0.95rem' }}>
              Dữ liệu cập nhật liên tục từ các bệnh viện đối tác. Hãy đăng ký hiến ngay nếu nhóm máu của bạn đang ở mức cảnh báo!
            </p>
          </div>

          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              <div className="hero-dashboard">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Hệ thống kho dự trữ khu vực</h3>
                    <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: 0 }}>Hội Chữ Thập Đỏ & Bệnh viện liên kết</p>
                  </div>
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    LIVE UPDATE
                  </div>
                </div>

                <div className="row g-3">
                  {Object.entries(bloodInventory).map(([type, pct]) => (
                    <div key={type} className="col-6 col-md-3">
                      <div className="p-3 rounded-3 bg-white h-100" style={{ border: '1px solid #E5E7EB' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Nhóm {type}</span>
                          <span className={`badge ${getInventoryBadgeClass(pct)} rounded-pill`} style={{ fontSize: '0.68rem' }}>
                            {getInventoryLabel(pct)}
                          </span>
                        </div>
                        <div className="inventory-progress mb-1">
                          <div className="inventory-fill" style={{ width: `${pct}%`, backgroundColor: getInventoryColor(pct) }}></div>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>Mức chứa: {pct}%</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSimulateDonation} className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#F8FAFF', border: '1px solid #E5E7EB' }}>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <span style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Mô phỏng hiến tặng nhóm:</span>
                      <select
                        value={simulateType}
                        onChange={e => setSimulateType(e.target.value)}
                        className="form-select form-select-sm"
                        style={{ width: 85, fontFamily: 'Montserrat', fontWeight: 700, borderColor: '#D1D5DB' }}
                      >
                        {Object.keys(bloodCompatibilityData).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isSimulating}
                      className="btn btn-danger fw-bold d-flex align-items-center gap-2 rounded-pill"
                      style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', padding: '0.55rem 1.4rem' }}
                    >
                      {isSimulating
                        ? <><span className="spinner-border spinner-border-sm"></span> Đang bổ sung...</>
                        : <>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                          Hiến máu mô phỏng
                        </>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────── */}
      <section id="benefits" className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="section-eyebrow">Khoa học & Sức khoẻ</span>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
              Lợi Ích Của Việc <span style={{ color: '#A71D2A' }}>Hiến Máu</span>
            </h2>
            <div className="section-divider"></div>
            <p className="mx-auto" style={{ maxWidth: 600, color: '#6B7280', fontSize: '0.95rem' }}>
              Hiến máu định kỳ không chỉ cứu người mà còn mang lại nhiều lợi ích sức khoẻ thiết thực cho bản thân bạn.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
                title: 'Tái tạo tế bào máu', color: '#D42B2B', bg: '#FEF0F0',
                desc: 'Sau khi hiến máu, tủy xương được kích thích sản xuất hồng cầu và tiểu cầu mới, tối ưu hoá quá trình trao đổi chất toàn thân.'
              },
              {
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
                title: 'Bảo vệ tim mạch', color: '#1B4FD8', bg: '#E8F0FE',
                desc: 'Hiến máu giúp giảm lượng sắt dư thừa trong máu, từ đó làm chậm tiến trình oxy hoá tế bào và bảo vệ hệ tim mạch hiệu quả.'
              },
              {
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>,
                title: 'Khám sức khoẻ miễn phí', color: '#059669', bg: '#D1FAE5',
                desc: 'Bạn được sàng lọc miễn phí các chỉ số quan trọng: huyết áp, nhịp tim, cân nặng và phát hiện sớm một số bệnh truyền nhiễm.'
              },
              {
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
                title: 'Lan toả tình nhân ái', color: '#D97706', bg: '#FEF3C7',
                desc: 'Một đơn vị máu có thể tách thành nhiều thành phần, cứu sống đến 3 bệnh nhân khác nhau. Hành động nhỏ, ý nghĩa lớn!'
              },
            ].map((b, i) => (
              <div key={i} className="col-12 col-md-6 col-lg-3">
                <div className="benefit-card" style={{ borderLeft: `4px solid ${b.color}` }}>
                  <div className="d-flex align-items-center justify-content-center rounded-3 mb-3" style={{ width: 52, height: 52, backgroundColor: b.bg, color: b.color }}>
                    {b.svg}
                  </div>
                  <h4 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{b.title}</h4>
                  <p style={{ fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOOD COMPATIBILITY ──────────────────────────────── */}
      <section id="compatibility" className="py-5" style={{ backgroundColor: '#F8FAFF' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="section-eyebrow">Tra cứu y khoa</span>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
              Tương Thích <span style={{ color: '#A71D2A' }}>Nhóm Máu</span>
            </h2>
            <div className="section-divider"></div>
            <p className="mx-auto" style={{ maxWidth: 600, color: '#6B7280', fontSize: '0.95rem' }}>
              Chọn nhóm máu của bạn để biết ngay ai có thể hiến cho bạn và bạn có thể hiến cho ai.
            </p>
          </div>

          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <div className="interactive-widget">
                <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                  {Object.keys(bloodCompatibilityData).map(t => (
                    <button key={t} onClick={() => setSelectedBlood(t)} className={`compatibility-btn${selectedBlood === t ? ' active' : ''}`}>{t}</button>
                  ))}
                </div>

                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <div className="p-4 rounded-3 h-100 text-center" style={{ backgroundColor: '#FEF0F0', border: '1px solid #FAD0D0' }}>
                      <span className="badge rounded-pill fw-bold mb-3 px-3 py-2" style={{ backgroundColor: '#D42B2B', fontFamily: 'Montserrat', letterSpacing: '0.5px' }}>
                        CÓ THỂ HIẾN CHO
                      </span>
                      <p style={{ fontSize: '0.88rem', color: '#6B7280', marginBottom: '1.5rem' }}>
                        Nhóm <strong style={{ color: '#111827' }}>{selectedBlood}</strong> hiến được cho:
                      </p>
                      <div className="d-flex flex-wrap justify-content-center gap-2">
                        {bloodCompatibilityData[selectedBlood].giveTo.map(t => (
                          <div key={t} style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #D42B2B', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.9rem', color: '#D42B2B' }}>{t}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-4 rounded-3 h-100 text-center" style={{ backgroundColor: '#E8F0FE', border: '1px solid #C7D7FA' }}>
                      <span className="badge rounded-pill fw-bold mb-3 px-3 py-2" style={{ backgroundColor: '#1B4FD8', fontFamily: 'Montserrat', letterSpacing: '0.5px' }}>
                        CÓ THỂ NHẬN TỪ
                      </span>
                      <p style={{ fontSize: '0.88rem', color: '#6B7280', marginBottom: '1.5rem' }}>
                        Nhóm <strong style={{ color: '#111827' }}>{selectedBlood}</strong> nhận được từ:
                      </p>
                      <div className="d-flex flex-wrap justify-content-center gap-2">
                        {bloodCompatibilityData[selectedBlood].receiveFrom.map(t => (
                          <div key={t} style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #1B4FD8', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.9rem', color: '#1B4FD8' }}>{t}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-3 text-center" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: '0.88rem', color: '#4B5563', margin: 0, lineHeight: 1.7 }}>
                    <strong style={{ color: '#111827' }}>Chú thích y học:</strong> {bloodCompatibilityData[selectedBlood].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section id="testimonials" className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="section-eyebrow">Cộng đồng chia sẻ</span>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
              Cảm Nhận Từ <span style={{ color: '#A71D2A' }}>Người Hiến Máu</span>
            </h2>
            <div className="section-divider"></div>
            <p className="mx-auto" style={{ maxWidth: 600, color: '#6B7280', fontSize: '0.95rem' }}>
              Những câu chuyện chân thực từ các tình nguyện viên tích cực của hệ thống LifeGive.
            </p>
          </div>

          <div className="row g-4">
            {[
              { avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', name: 'Nguyễn Văn Nam', meta: '5 lần hiến · Nhóm O+', quote: 'Trước đây mỗi lần hiến máu tôi đều phải ghi phiếu giấy rất mất thời gian. Từ khi dùng LifeGive, chỉ 1 phút là đặt xong lịch, lịch sử cũng tự động lưu — tiện lợi vô cùng!' },
              { avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', name: 'Trần Thị Mai', meta: '12 lần hiến · Nhóm A-', quote: 'Nhờ tính năng cảnh báo khẩn cấp, tôi nhận thông báo ngay khi có bệnh nhân cần nhóm A- hiếm và đến giúp kịp thời. Cảm giác cứu người thật sự rất ý nghĩa và hệ thống cũng rất nhân văn!' },
              { avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', name: 'Lê Minh Hoàng', meta: '3 lần hiến · Nhóm AB+', quote: 'Trang web thiết kế hiện đại, thông tin hữu ích, đặc biệt là bảng tra tương thích nhóm máu rất hay. Quy trình khám nhanh gọn, admin phản hồi cực nhanh khi tôi gửi góp ý.' },
            ].map((t, i) => (
              <div key={i} className="col-12 col-md-4 d-flex">
                <div className="testimonial-card">
                  <div className="mb-3" style={{ color: '#F59E0B', fontSize: '1.1rem', letterSpacing: 2 }}>★★★★★</div>
                  <blockquote className="flex-grow-1 mb-4">"{t.quote}"</blockquote>
                  <div className="d-flex align-items-center gap-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
                    <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8F0FE' }} />
                    <div>
                      <p className="author-name">{t.name}</p>
                      <p className="author-meta">{t.meta}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWS ─────────────────────────────────────────────── */}
      <section id="news" className="py-5" style={{ backgroundColor: '#F8FAFF' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="section-eyebrow">Góc sức khoẻ</span>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#0F172A' }}>
              Tin Tức & Hoạt Động <span style={{ color: '#A71D2A' }}>Nổi Bật</span>
            </h2>
            <div className="section-divider"></div>
            <p className="mx-auto" style={{ maxWidth: 600, color: '#6B7280', fontSize: '0.95rem' }}>
              Cập nhật liên tục các chiến dịch hiến máu và kiến thức y học bổ ích.
            </p>
          </div>

          <div className="row g-4">
            {[
              { img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80', tag: 'SỰ KIỆN', tagColor: '#D42B2B', date: '18 tháng 7, 2026', title: 'Chiến dịch hiến máu vì cộng đồng tại khu vực Thủ Đức', desc: 'LifeGive phối hợp cùng UBND triển khai chiến dịch lưu động thu hút hơn 800 tình nguyện viên, bổ sung 450+ đơn vị máu quý giá cho hệ thống.' },
              { img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80', tag: 'KHOA HỌC', tagColor: '#1B4FD8', date: '12 tháng 7, 2026', title: 'Y học chứng minh: Hiến máu giúp giảm nguy cơ đột quỵ', desc: 'Nghiên cứu lâm sàng mới nhất cho thấy hiến máu định kỳ mỗi 6 tháng giúp cân bằng lượng sắt và phòng ngừa xơ vữa động mạch hiệu quả.' },
              { img: 'https://i.pinimg.com/736x/fc/72/d7/fc72d7f996f7bca849f9ce9d7b8d100a.jpg', tag: 'Ý NGHĨA', tagColor: '#059669', date: '5 tháng 7, 2026', title: 'Kịp thời truyền máu cứu sống bệnh nhân đa chấn thương', desc: 'Ca phẫu thuật phức tạp tại bệnh viện Chợ Rẫy thành công nhờ kết nối khẩn cấp từ LifeGive đến tình nguyện viên nhóm máu O- hiếm.' },
            ].map((n, i) => (
              <div key={i} className="col-12 col-md-4 d-flex">
                <div className="news-card">
                  <div className="news-img-container">
                    <img src={n.img} alt={n.title} className="news-img" />
                    <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                      <span style={{ display: 'inline-block', backgroundColor: n.tagColor, color: '#fff', fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.68rem', padding: '0.3rem 0.75rem', borderRadius: 6, letterSpacing: '0.8px' }}>{n.tag}</span>
                    </div>
                  </div>
                  <div className="news-card-body">
                    <p className="news-date">{n.date}</p>
                    <h4>{n.title}</h4>
                    <p>{n.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMERGENCY BANNER ─────────────────────────────────── */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="emergency-banner p-4 p-md-5">
            <div className="row align-items-center g-4 position-relative" style={{ zIndex: 1 }}>
              <div className="col-12 col-md-8 text-center text-md-start">
                <div
                  className="d-inline-flex align-items-center gap-2 rounded-pill fw-bold mb-3 glow-urgent"
                  style={{ backgroundColor: '#D42B2B', color: '#fff', fontFamily: 'Montserrat', fontSize: '0.75rem', padding: '0.45rem 1rem', letterSpacing: '0.8px' }}
                >
                  <span className="spinner-grow spinner-grow-sm" style={{ width: '0.6rem', height: '0.6rem' }}></span>
                  YÊU CẦU KHẨN CẤP
                </div>
                <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '1.6rem', color: '#FFFFFF' }}>
                  Chiến dịch hiến máu hè khẩn cấp 2026
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.97rem', lineHeight: 1.75, maxWidth: 580, margin: '0.5rem 0 0' }}>
                  Kho dự trữ nhóm máu hiếm <strong style={{ color: '#FCA5A5' }}>O- và AB-</strong> đang ở mức báo động đỏ tại các bệnh viện đối tác. Nếu bạn thuộc nhóm máu này và đủ điều kiện sức khoẻ, hãy đăng ký hỗ trợ ngay hôm nay.
                </p>
              </div>
              <div className="col-12 col-md-4 text-center text-md-end">
                <a
                  href="tel:19001000"
                  className="btn btn-danger fw-bold btn-lg rounded-pill d-inline-flex align-items-center gap-2"
                  style={{ fontFamily: 'Montserrat', fontSize: '1rem', padding: '0.9rem 2rem', boxShadow: '0 8px 24px rgba(212,43,43,0.4)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" /></svg>
                  1900 1000
                </a>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Đường dây hỗ trợ 24/7</p>
              </div>
            </div>
          </div>

          {/* Contact Form + Map */}
          <div className="row g-4 mt-4 align-items-stretch">

            {/* Left: Info + Form */}
            <div className="col-12 col-lg-6">
              <div className="h-100 p-4 p-md-5 rounded-4 bg-white d-flex flex-column" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.07)', border: '1px solid #E5E7EB' }}>
                <h4 className="mb-1" style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#111827' }}>Gửi thắc mắc cho chúng tôi</h4>
                <p className="text-muted small mb-4">Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>

                {/* Contact info chips */}
                <div className="d-flex flex-column gap-2 mb-4">
                  {[
                    {
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                      label: '118 Hồng Bàng, Phường 12, Quận 5, TP. Hồ Chí Minh'
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.36a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
                      label: '1900 1000  ·  Hotline 24/7'
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
                      label: 'lienhe@lifegive.vn'
                    }
                  ].map((item, i) => (
                    <div key={i} className="d-flex align-items-start gap-2" style={{ fontSize: '0.82rem', color: '#374151' }}>
                      <span style={{ color: '#D42B2B', marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <form
                  className="row g-3 flex-grow-1"
                  onSubmit={e => { e.preventDefault(); toast.success('✅ Ý kiến của bạn đã được ghi nhận. Xin cảm ơn!'); }}
                >
                  <div className="col-12 col-md-6">
                    <input type="text" className="custom-input" placeholder="Họ và tên của bạn" required />
                  </div>
                  <div className="col-12 col-md-6">
                    <input type="email" className="custom-input" placeholder="Địa chỉ email" required />
                  </div>
                  <div className="col-12">
                    <textarea className="custom-input" rows={4} placeholder="Nội dung thắc mắc hoặc thông điệp gửi tới LifeGive..." required></textarea>
                  </div>
                  <div className="col-12 mt-2">
                    <button type="submit" className="btn-primary-custom w-100" style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}>
                      Gửi liên hệ
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Google Map */}
            <div className="col-12 col-lg-6">
              <div className="h-100 rounded-4 overflow-hidden d-flex flex-column" style={{ minHeight: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB' }}>

                {/* Map Info Strip — clean white */}
                <div className="d-flex align-items-center gap-3 px-4 py-3" style={{ backgroundColor: '#fff', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 36, height: 36, backgroundColor: '#FEF0F0', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#D42B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>Bệnh viện Truyền máu – Huyết học TP.HCM</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>118 Hồng Bàng, Phường 12, Quận 5, TP. HCM</p>
                  </div>
                </div>

                {/* Embedded Map — with pin marker on exact address */}
                <iframe
                  title="Vị trí cơ sở hiến máu LifeGive"
                  src="https://maps.google.com/maps?q=Bệnh+viện+Truyền+máu+Huyết+học+TP+HCM,+118+Hồng+Bàng,+Quận+5,+TP+Hồ+Chí+Minh&z=17&output=embed"
                  width="100%"
                  style={{ border: 0, flexGrow: 1, minHeight: 370 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#0F172A', color: 'rgba(255,255,255,0.6)', padding: '4rem 0 2rem' }}>
        <div className="container">
          <div className="row g-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="col-12 col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#1B4FD8,#2563EB)' }}>
                  <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /><line x1="12" y1="8" x2="12" y2="14" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round" /><line x1="9" y1="11" x2="15" y2="11" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
                <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>LifeGive</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                Hệ thống phi lợi nhuận kết nối cộng đồng hiến máu nhân đạo, đơn giản hoá thủ tục và mang lại hy vọng sống cho người bệnh trên cả nước.
              </p>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <h6 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#fff', letterSpacing: '0.8px', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Liên kết</h6>
              <ul className="list-unstyled d-flex flex-column gap-2" style={{ margin: 0 }}>
                {['intro', 'benefits', 'process', 'compatibility', 'news'].map((id, i) => {
                  const lbl = ['Giới thiệu', 'Lợi ích', 'Quy trình', 'Nhóm máu', 'Tin tức'];
                  return (
                    <li key={id}>
                      <button onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito', fontSize: '0.88rem', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                      >{lbl[i]}</button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <h6 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#fff', letterSpacing: '0.8px', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Liên hệ</h6>
              <div className="d-flex flex-column gap-2">
                {[
                  {
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
                    text: 'Hội Chữ Thập Đỏ Việt Nam'
                  },
                  {
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                    text: '123 Nguyễn Huệ, Q.1, TP.HCM'
                  },
                  {
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" /></svg>,
                    text: '1900 1000 (24/7)'
                  },
                  {
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
                    text: 'lienhe@lifegive.org.vn'
                  },
                ].map((item, i) => (
                  <p key={i} className="d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: 'Nunito' }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{item.icon}</span>
                    {item.text}
                  </p>
                ))}
              </div>
            </div>

            <div className="col-12 col-md-4 col-lg-3">
              <h6 style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#fff', letterSpacing: '0.8px', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Bắt đầu ngay</h6>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                Tham gia cùng hơn <strong style={{ color: '#93C5FD' }}>1.280</strong> tình nguyện viên đang hiến máu cứu người mỗi ngày.
              </p>
              <Link to="/register" className="btn-primary-custom" style={{ fontSize: '0.85rem', padding: '0.75rem 1.5rem' }}>
                Đăng ký ngay
              </Link>
            </div>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 pt-4">
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'Nunito' }}>
              © {new Date().getFullYear()} LifeGive · Hệ thống hiến máu nhân đạo Việt Nam
            </p>
            <div className="d-flex gap-3">
              {['Chính sách bảo mật', 'Điều khoản sử dụng'].map((t, i) => (
                <span key={i} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Nunito' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

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
