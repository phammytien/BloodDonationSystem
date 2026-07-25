import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const isActive = location.pathname.startsWith(to) && (to !== '/dashboard' || location.pathname === '/dashboard');
    return (
      <Link 
        to={to} 
        className="d-flex align-items-center text-decoration-none mb-2 py-2 px-3"
        style={{
          borderRadius: '0 8px 8px 0',
          marginRight: '16px',
          color: isActive ? '#D42B2B' : '#4B5563',
          backgroundColor: isActive ? '#FEF2F2' : 'transparent',
          borderLeft: isActive ? '4px solid #D42B2B' : '4px solid transparent',
          fontWeight: isActive ? 600 : 500,
          transition: 'all 0.2s ease',
          fontSize: '0.95rem'
        }}
      >
        <span className="d-flex align-items-center justify-content-center me-3" style={{ width: '24px', opacity: isActive ? 1 : 0.7 }}>
          {icon}
        </span>
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };


  // SVGs
  const iconHome = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
  const iconDrop = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>;
  const iconFile = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
  const iconClock = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
  const iconUsers = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
  const iconBox = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>;

  const iconSupport = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Sidebar */}
      <div 
        className="d-flex flex-column bg-white shadow-sm" 
        style={{ 
          width: collapsed ? '80px' : '280px', 
          transition: 'width 0.3s ease',
          borderRight: '1px solid #F3F4F6',
          zIndex: 10 
        }}
      >
        {/* Logo Area */}
        <div className="d-flex align-items-center justify-content-between px-3" style={{ height: '70px' }}>
          {!collapsed && (
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="me-2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#D42B2B" />
                <path d="M12 5v12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 12h6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h4 className="m-0 fw-bold" style={{ color: '#D42B2B', fontFamily: 'Montserrat', letterSpacing: '-0.5px' }}>LifeGive</h4>
            </Link>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', border: '1px solid #E5E7EB', margin: collapsed ? '0 auto' : '0' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={collapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}></polyline></svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-grow-1 overflow-y-auto py-3 custom-scrollbar">
          <div className="mt-4 px-3 d-flex flex-column gap-1">
            <NavItem to="/dashboard" icon={iconHome} label="Tổng quan" />

            <div className="mt-4 mb-2 ps-2 text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
              NGHIỆP VỤ HIẾN MÁU
            </div>
            <NavItem to="/admin/campaigns" icon={iconDrop} label="Chiến dịch hiến máu" />
            <NavItem to="/admin/appointments" icon={iconFile} label="Đơn đăng ký hiến máu" />
            <NavItem to="/admin/history" icon={iconClock} label="Lịch sử hiến máu" />

            <div className="mt-4 mb-2 ps-2 text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
              QUẢN LÝ TÀI NGUYÊN
            </div>
            <NavItem to="/admin/donors" icon={iconUsers} label="Danh sách Donor" />
            <NavItem to="/admin/blood-types" icon={iconDrop} label="Nhóm máu" />
            <NavItem to="/admin/inventory" icon={iconBox} label="Kho máu dự trữ" />
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-3 border-top mt-auto bg-white">
          {!collapsed && (
            <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded" style={{ cursor: 'pointer' }}>
              <div className="d-flex align-items-center text-dark">
                <span className="d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px', backgroundColor: '#FEF2F2', borderRadius: '50%', color: '#D42B2B' }}>
                  {iconSupport}
                </span>
                <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>Hỗ trợ</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          )}
          
          <div className="d-flex align-items-center justify-content-center p-2 rounded" style={{ backgroundColor: '#FEF2F2', cursor: 'pointer' }} onClick={handleLogout}>
            <div className="d-flex align-items-center text-danger">
              {!collapsed && <span className="fw-bold" style={{ fontSize: '0.95rem' }}>Đăng xuất</span>}
              {collapsed && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ overflowX: 'hidden' }}>
        <div className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center" style={{ height: '70px', zIndex: 5 }}>
          <div className="text-muted small fw-semibold">
            <span className="text-danger">Admin Portal</span> <span className="mx-2">/</span> {location.pathname === '/dashboard' ? 'Tổng quan' : location.pathname.includes('/campaigns') ? 'Chiến dịch hiến máu' : 'Quản lý'}
          </div>
          <div className="d-flex align-items-center gap-4">
            <button className="btn btn-link text-muted p-0 position-relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                3
              </span>
            </button>
            <div className="d-flex align-items-center gap-2">
              <div className="text-end d-none d-md-block">
                <div className="fw-bold" style={{ fontSize: '0.85rem', color: '#111827' }}>{user?.username}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user?.roleName}</div>
              </div>
              <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold ms-2" style={{ width: '40px', height: '40px', backgroundColor: '#D42B2B', fontSize: '1.2rem' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 flex-grow-1 overflow-auto" style={{ height: 'calc(100vh - 70px)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
