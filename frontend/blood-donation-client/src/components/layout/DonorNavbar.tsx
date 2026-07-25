import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarChar, getDisplayName } from '../../utils/avatarHelper';
import { NotificationBell } from '../NotificationBell';

export const DonorNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const scrollToTop = () => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollTo = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      // Simple hack for cross-page hash routing
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg bg-white sticky-top"
      style={{
        borderBottom: '1px solid #F3F4F6',
        boxShadow: '0 2px 15px rgba(0,0,0,0.03)',
        padding: '0.85rem 0',
        zIndex: 1040
      }}
    >
      <div className="container">
        <Link to="/" className="d-flex align-items-center text-decoration-none gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fff" />
              <path d="M12 7v10M9 12h6" stroke="#fff" strokeWidth="25%" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '1.25rem', color: '#1B4FD8' }}>LifeGive</span>
        </Link>

        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-3 my-2 my-lg-0">
            <li className="nav-item">
              <button onClick={scrollToTop} className="nav-link-custom btn py-2">Trang chủ</button>
            </li>
            <li className="nav-item position-relative" 
                onMouseEnter={(e) => {
                  const menu = e.currentTarget.querySelector('.custom-dropdown-menu') as HTMLElement;
                  if(menu) menu.style.display = 'block';
                }}
                onMouseLeave={(e) => {
                  const menu = e.currentTarget.querySelector('.custom-dropdown-menu') as HTMLElement;
                  if(menu) menu.style.display = 'none';
                }}
            >
              <button className="nav-link-custom btn py-2 d-flex align-items-center gap-1">
                Giới thiệu
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div 
                className="custom-dropdown-menu position-absolute bg-white shadow-sm border" 
                style={{ display: 'none', top: '100%', left: 0, minWidth: '200px', borderRadius: '12px', padding: '0.5rem 0', zIndex: 1050 }}
              >
                {['intro', 'process', 'inventory-status', 'compatibility', 'testimonials', 'news'].map((id, i) => {
                  const labels = ['Về chúng tôi', 'Quy trình hiến máu', 'Kho dự trữ', 'Tương thích nhóm máu', 'Cảm nhận người hiến', 'Tin tức sự kiện'];
                  return (
                    <button key={id} onClick={() => {
                        scrollTo(id);
                        const menu = document.querySelector('.custom-dropdown-menu') as HTMLElement;
                        if(menu) menu.style.display = 'none';
                      }} 
                      className="dropdown-item py-2 px-3 text-start bg-transparent border-0 w-100" 
                      style={{ fontSize: '0.9rem', color: '#4B5563', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.color = '#1B4FD8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#4B5563'; }}
                    >
                      {labels[i]}
                    </button>
                  );
                })}
              </div>
            </li>
            <li className="nav-item">
              <Link to="/campaigns" className="nav-link-custom btn py-2 text-decoration-none">Chiến dịch</Link>
            </li>
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
                <div className="position-relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="d-flex align-items-center justify-content-center rounded-circle border-0"
                    style={{
                      width: '38px', height: '38px',
                      background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)',
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: showUserMenu ? '0 4px 12px rgba(27, 79, 216, 0.4)' : '0 2px 8px rgba(27, 79, 216, 0.15)'
                    }}
                    onBlur={() => setTimeout(() => setShowUserMenu(false), 150)}
                  >
                    {getAvatarChar(user.fullName, user.username)}
                  </button>
                  {showUserMenu && (
                    <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg" style={{ minWidth: '220px', zIndex: 1000, border: '1px solid #E5E7EB', animation: 'fadeInDown 0.15s ease' }}>
                      <div className="p-3 border-bottom" style={{ fontSize: '0.82rem', color: '#4B5563' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                            {getAvatarChar(user.fullName, user.username)}
                          </div>
                          <div>
                            <div className="fw-bold" style={{ color: '#111827' }}>{getDisplayName(user.fullName, user.username)}</div>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{user.email}</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link to="/profile" className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2" style={{ fontSize: '0.85rem', color: '#1B4FD8' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>Thông tin tài khoản</Link>
                        <Link to="/history" className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2" style={{ fontSize: '0.85rem', color: '#1B4FD8' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>Lịch sử hiến máu</Link>
                        <Link to="/change-password" className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2" style={{ fontSize: '0.85rem', color: '#4B5563' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>Đổi mật khẩu</Link>
                        <button onClick={handleLogout} className="w-100 d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent rounded-2 text-start" style={{ fontSize: '0.85rem', color: '#D42B2B' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF0F0')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>Đăng xuất</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login?redirect=/appointment" className="btn-primary-custom d-flex align-items-center gap-2" style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', padding: '0.55rem 1.2rem' }}>Đăng ký hiến máu</Link>
                <Link to="/login" style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '0.88rem', color: '#1B4FD8', textDecoration: 'none' }}>Đăng nhập</Link>
                <Link to="/register" className="btn btn-outline-danger fw-bold px-3 py-2 rounded-pill" style={{ fontFamily: 'Montserrat', fontSize: '0.82rem' }}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
