
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarChar } from '../../utils/avatarHelper';
import { Pagination } from '../../components/common/Pagination';

export const AdminHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const res = await axios.get('http://localhost:5028/api/blooddonation/admin/history', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setHistory(res.data);
      } catch (err) {
        toast.error('Không thể tải dữ liệu lịch sử hiến máu');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Lịch Sử Hiến Máu
          </h4>
          <p className="text-muted small mb-0">
            Danh sách tất cả các phiếu hiến máu đã thực hiện thành công
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3 shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Phiếu hiến</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Người hiến</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Nhóm máu</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Thể tích</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Ngày hiến</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">Chưa có lịch sử hiến máu nào</td>
                </tr>
              ) : (
                history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    <td className="px-4 py-3 fw-bold text-dark">#{item.donationId}</td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white flex-shrink-0" style={{ width: 32, height: 32, fontSize: '0.85rem', fontWeight: 'bold' }}>
                          {getAvatarChar(item.donorName, item.donorEmail)}
                        </div>
                        <div>
                          <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{item.donorName}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.donorEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge bg-danger fs-6 px-3">{item.bloodGroup}</span></td>
                    <td className="px-4 py-3 fw-medium">{item.volumeML} ML</td>
                    <td className="px-4 py-3 text-muted">{new Date(item.donationDate).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-dark">{item.staffName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && history.length > 0 && (
          <div className="p-3 border-top">
            <Pagination 
              currentPage={currentPage}
              totalItems={history.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
