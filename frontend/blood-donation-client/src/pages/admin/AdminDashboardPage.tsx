import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getAvatarChar } from '../../utils/avatarHelper';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AdminStats {
  totalDonors: number;
  totalCampaigns: number;
  totalBloodVolume: number;
  pendingAppointments: number;
  recentDonations: any[];
  dailyBloodVolumes: { date: string, volume: number }[];
  bloodTypeStats: { bloodGroup: string, count: number }[];
  recentCampaigns: any[];
  pendingAppointmentsList: any[];
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const res = await axios.get('http://localhost:5028/api/dashboard/admin/stats', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStats(res.data);
      } catch (err: any) {
        console.error(err);
        toast.error('Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center h-100 py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  const barData = {
    labels: stats?.dailyBloodVolumes?.length 
      ? stats.dailyBloodVolumes.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) 
      : ['Chưa có dữ liệu'],
    datasets: [
      {
        label: 'Lượng máu (ml)',
        data: stats?.dailyBloodVolumes?.length ? stats.dailyBloodVolumes.map(d => d.volume) : [0],
        backgroundColor: '#F87171',
        borderRadius: 4,
        barPercentage: 0.6,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          color: '#6B7280',
          font: { family: 'Inter', size: 12 }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { color: '#9CA3AF', callback: (value: any) => value === 0 ? '0' : (value / 1000) + 'K' },
        border: { display: false },
        grid: { color: '#F3F4F6' }
      },
      x: {
        ticks: { color: '#9CA3AF', maxTicksLimit: 8 },
        border: { display: false },
        grid: { display: false }
      }
    }
  };

  const doughnutData = {
    labels: stats?.bloodTypeStats?.length ? stats.bloodTypeStats.map(b => b.bloodGroup) : ['Chưa có dữ liệu'],
    datasets: [
      {
        data: stats?.bloodTypeStats?.length ? stats.bloodTypeStats.map(b => b.count) : [1],
        backgroundColor: stats?.bloodTypeStats?.length ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'] : ['#E5E7EB'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }
    },
    cutout: '70%'
  };

  const Sparkline = ({ color }: { color: string }) => (
    <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none" style={{ marginTop: '10px' }}>
      <path 
        d="M0 20 Q 10 10, 20 15 T 40 10 T 60 25 T 80 15 T 100 20" 
        stroke={color} 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round" 
      />
    </svg>
  );

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontFamily: 'Montserrat', color: '#111827' }}>Tổng quan hệ thống</h4>
          <p className="text-muted small mb-0">Xem nhanh các chỉ số hoạt động của Blood Donation System</p>
        </div>
        <div className="d-flex align-items-center bg-white border rounded-pill px-3 py-2 shadow-sm" style={{ fontSize: '0.9rem', color: '#4B5563' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Hôm nay
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bg-white rounded-4 p-4 shadow-sm position-relative overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div>
                <div className="text-uppercase fw-semibold" style={{ fontSize: '0.75rem', color: '#6B7280', letterSpacing: '0.5px' }}>Người Hiến Máu</div>
                <h3 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'Montserrat' }}>{stats?.totalDonors || 0}</h3>
              </div>
            </div>
            <Sparkline color="#EF4444" />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bg-white rounded-4 p-4 shadow-sm position-relative overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#D1FAE5', color: '#10B981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <div className="text-uppercase fw-semibold" style={{ fontSize: '0.75rem', color: '#6B7280', letterSpacing: '0.5px' }}>Chiến Dịch</div>
                <h3 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'Montserrat' }}>{stats?.totalCampaigns || 0}</h3>
              </div>
            </div>
            <Sparkline color="#10B981" />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bg-white rounded-4 p-4 shadow-sm position-relative overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#DBEAFE', color: '#3B82F6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
              </div>
              <div>
                <div className="text-uppercase fw-semibold" style={{ fontSize: '0.75rem', color: '#6B7280', letterSpacing: '0.5px' }}>Lượng Máu (ML)</div>
                <h3 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'Montserrat' }}>{(stats?.totalBloodVolume || 0).toLocaleString()}</h3>
              </div>
            </div>
            <Sparkline color="#3B82F6" />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bg-white rounded-4 p-4 shadow-sm position-relative overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#FEF3C7', color: '#F59E0B' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div>
                <div className="text-uppercase fw-semibold" style={{ fontSize: '0.75rem', color: '#6B7280', letterSpacing: '0.5px' }}>Đơn Đăng Ký Chờ Duyệt</div>
                <h3 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'Montserrat' }}>{stats?.pendingAppointments || 0}</h3>
              </div>
            </div>
            <Sparkline color="#F59E0B" />
          </div>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="row g-4 mb-4">
        {/* Bar Chart */}
        <div className="col-12 col-xl-8">
          <div className="bg-white rounded-4 p-4 shadow-sm h-100" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0" style={{ fontFamily: 'Montserrat' }}>Lượng máu thu được theo ngày</h6>
            </div>
            <div style={{ height: '300px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="col-12 col-xl-4">
          <div className="bg-white rounded-4 p-4 shadow-sm h-100" style={{ border: '1px solid #F3F4F6' }}>
            <h6 className="fw-bold mb-4" style={{ fontFamily: 'Montserrat' }}>Tỷ lệ nhóm máu</h6>
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '240px', position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
              {/* Center Text */}
              <div className="position-absolute d-flex flex-column align-items-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Tổng:</div>
                <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>{stats?.totalDonors || 0} người</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="d-flex flex-wrap gap-2 justify-content-center" style={{ fontSize: '0.8rem' }}>
                {stats?.bloodTypeStats?.map((b, i) => {
                  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];
                  return (
                    <span key={i} className="d-flex align-items-center me-2">
                      <span className="d-inline-block rounded-circle me-1" style={{ width: 8, height: 8, backgroundColor: colors[i % colors.length] }}></span>
                      Nhóm {b.bloodGroup}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Columns */}
      <div className="row g-4">
        {/* Chiến dịch nổi bật */}
        <div className="col-12 col-xl-4">
          <div className="bg-white rounded-4 p-4 shadow-sm h-100" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0" style={{ fontFamily: 'Montserrat' }}>Chiến dịch mới nhất</h6>
              <a href="/admin/campaigns" className="text-danger text-decoration-none" style={{ fontSize: '0.85rem' }}>Xem tất cả &rarr;</a>
            </div>
            <div className="d-flex flex-column gap-3">
              {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                stats.recentCampaigns.map(c => (
                  <div key={c.campaignId} className="d-flex align-items-center gap-3 p-2 rounded-3 hover-bg-light">
                    <div className="bg-danger bg-opacity-10 rounded text-center d-flex align-items-center justify-content-center text-danger fw-bold" style={{ width: 60, height: 60, flexShrink: 0, fontSize: '0.8rem' }}>CD</div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold text-dark mb-1 text-truncate" style={{ fontSize: '0.9rem', maxWidth: '200px' }}>{c.campaignName}</div>
                      <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>{new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                      <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.75rem', color: '#4B5563' }}>
                        <span className="d-flex align-items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 
                          {c.registrantCount} người
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted text-center py-4">Chưa có chiến dịch</div>
              )}
            </div>
          </div>
        </div>

        {/* Lịch sử hiến máu */}
        <div className="col-12 col-xl-4">
          <div className="bg-white rounded-4 p-4 shadow-sm h-100" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0" style={{ fontFamily: 'Montserrat' }}>Lịch sử hiến máu (gần đây)</h6>
              <a href="/admin/history" className="text-danger text-decoration-none" style={{ fontSize: '0.85rem' }}>Xem tất cả &rarr;</a>
            </div>
            <div className="d-flex flex-column gap-2">
              {stats?.recentDonations && stats.recentDonations.length > 0 ? (
                stats.recentDonations.map(d => (
                  <div key={d.donationId} className="d-flex align-items-center justify-content-between p-2 rounded-3 hover-bg-light">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold bg-danger" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                        {getAvatarChar(d.donorName, "")}
                      </div>
                      <div className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>{d.donorName}</div>
                    </div>
                    <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.85rem' }}>
                      <span className="text-danger fw-bold">{d.bloodGroup}</span>
                      <span className="text-muted">{d.volumeML} ml</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', width: '70px', textAlign: 'right' }}>{new Date(d.donationDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-muted text-center py-4">Chưa có dữ liệu hiến máu</div>
              )}
            </div>
          </div>
        </div>

        {/* Yêu cầu chờ duyệt */}
        <div className="col-12 col-xl-4">
          <div className="bg-white rounded-4 p-4 shadow-sm h-100" style={{ border: '1px solid #F3F4F6' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0" style={{ fontFamily: 'Montserrat' }}>Đơn đăng ký chờ duyệt</h6>
              <a href="/admin/appointments" className="text-danger text-decoration-none" style={{ fontSize: '0.85rem' }}>Xem tất cả &rarr;</a>
            </div>
            <div className="d-flex flex-column gap-3">
              {stats?.pendingAppointmentsList && stats.pendingAppointmentsList.length > 0 ? (
                stats.pendingAppointmentsList.map(a => (
                  <div key={a.appointmentId} className="d-flex align-items-center justify-content-between p-2 rounded-3 hover-bg-light">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning bg-opacity-10 text-warning" style={{ width: 36, height: 36 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div className="fw-medium text-dark text-truncate" style={{ fontSize: '0.9rem', maxWidth: '140px' }}>{a.donorName}</div>
                    </div>
                    <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.85rem' }}>
                      <span className="text-warning fw-medium">
                        Nhóm {a.bloodGroup}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', width: '70px', textAlign: 'right' }}>{new Date(a.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-muted text-center py-4">Không có đơn chờ duyệt</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
