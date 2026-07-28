import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BellRing } from 'lucide-react';

interface NotificationItem {
  notificationId: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Track the highest ID we have seen so far
  const latestNotificationIdRef = useRef<number | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get('http://localhost:5028/api/notification', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const newNotifications: NotificationItem[] = res.data;
      
      if (newNotifications.length > 0) {
        const currentHighestId = Math.max(...newNotifications.map(n => n.notificationId));
        
        // If we already initialized the ref, check if there are new ones
        if (latestNotificationIdRef.current !== null && currentHighestId > latestNotificationIdRef.current) {
          const newlyArrived = newNotifications.filter(n => n.notificationId > (latestNotificationIdRef.current as number));
          
          // Show toast for newly arrived notifications
          newlyArrived.forEach(n => {
            toast.info(
              <div>
                <strong>{n.title}</strong>
                <div style={{ fontSize: '0.85rem' }}>{n.content}</div>
              </div>, 
              { position: "top-center", autoClose: 6000, theme: "colored" }
            );
          });
        }
        
        // Update the ref
        latestNotificationIdRef.current = currentHighestId;
      }
      
      setNotifications(newNotifications);
    } catch (err) {
      console.error('Lỗi tải thông báo', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // 20s
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    if (!user) return;
    try {
      await axios.post(`http://localhost:5028/api/notification/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await axios.post('http://localhost:5028/api/notification/read-all', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) {
      handleMarkAsRead(n.notificationId);
    }
    
    setIsOpen(false);
    
    // Điều hướng dựa vào Role và loại thông báo
    if (user?.roleName === 'Admin' || user?.roleName === 'Staff') {
        if (n.title.toLowerCase().includes('đăng ký hiến máu mới') || n.type === 'StatusUpdate') {
            navigate('/admin/appointments');
        } else if (n.title.toLowerCase().includes('chiến dịch')) {
            navigate('/admin/campaigns');
        }
    } else {
        if (n.title.toLowerCase().includes('chiến dịch')) {
            navigate('/');
        } else {
            navigate('/history');
        }
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="d-flex align-items-center justify-content-center bg-transparent border-0 position-relative p-2"
        style={{
          color: '#4B5563',
          cursor: 'pointer',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          transition: 'all 0.2s',
          backgroundColor: isOpen ? '#F3F4F6' : 'transparent'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="position-absolute d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
            style={{
              top: '4px',
              right: '4px',
              backgroundColor: '#EF4444',
              fontSize: '0.68rem',
              width: '18px',
              height: '18px',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg overflow-hidden"
          style={{
            width: '320px',
            zIndex: 1050,
            border: '1px solid #E5E7EB',
            animation: 'fadeInDown 0.15s ease'
          }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
            <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Thông báo</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-transparent border-0 text-primary p-0 fw-semibold"
                style={{ fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-auto" style={{ maxHeight: '350px' }}>
            {notifications.length === 0 ? (
              <div className="text-center text-muted py-4" style={{ fontSize: '0.82rem' }}>
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  onClick={() => handleNotificationClick(n)}
                  className={`px-3 py-2 border-bottom d-flex align-items-start gap-2 position-relative text-start ${n.type === 'SOS' && !n.isRead ? 'pulse-sos' : ''}`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: n.type === 'SOS' ? (n.isRead ? '#FEF2F2' : '#FEE2E2') : (n.isRead ? 'transparent' : '#EFF6FF'),
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = n.type === 'SOS' ? '#FEE2E2' : (n.isRead ? '#F9FAFB' : '#DBEAFE')}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.type === 'SOS' ? (n.isRead ? '#FEF2F2' : '#FEE2E2') : (n.isRead ? 'transparent' : '#EFF6FF')}
                >
                  {/* Icon depending on notification type */}
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 mt-0.5"
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: n.type === 'SOS' ? '#DC2626' : n.type === 'Remind' ? '#FEF3C7' : n.type === 'ThankYou' ? '#D1FAE5' : '#E0E7FF',
                      color: n.type === 'SOS' ? '#FFFFFF' : n.type === 'Remind' ? '#D97706' : n.type === 'ThankYou' ? '#059669' : '#4F46E5'
                    }}
                  >
                    {n.type === 'SOS' ? (
                      <BellRing size={14} className={!n.isRead ? "animate-pulse" : ""} />
                    ) : n.type === 'Remind' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ) : n.type === 'ThankYou' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    )}
                  </div>

                  <div className="flex-grow-1" style={{ fontSize: '0.8rem' }}>
                    <div className={`fw-bold mb-0.5 ${n.type === 'SOS' ? 'text-danger' : 'text-dark'}`}>{n.title}</div>
                    <div className={n.type === 'SOS' ? 'text-danger opacity-75 fw-medium' : 'text-secondary'} style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>{n.content}</div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>{formatTime(n.createdAt)}</div>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div
                      className="rounded-circle bg-primary flex-shrink-0 align-self-center"
                      style={{ width: '6px', height: '6px' }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
