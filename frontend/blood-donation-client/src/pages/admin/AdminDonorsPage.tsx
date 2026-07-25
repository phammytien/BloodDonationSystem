import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarChar, getDisplayName } from '../../utils/avatarHelper';
import { Pagination } from '../../components/common/Pagination';

interface DonorProfile {
  donorId: number;
  fullName: string | null;
  gender: boolean | null;
  dateOfBirth: string | null;
  citizenId: string | null;
  phone: string;
  email: string;
  address: string | null;
  province: string | null;
  ward: string | null;
  occupation: string | null;
  bloodTypeId: number | null;
  bloodGroup: string;
  weight: number | null;
  height: number | null;
  avatar: string | null;
  lastDonationDate: string | null;
  totalDonationTimes: number;
}

export const AdminDonorsPage: React.FC = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<DonorProfile | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchDonors = async (search: string = '') => {
    if (!user) return;
    setLoading(true);
    try {
      const url = search 
        ? `http://localhost:5028/api/donor/admin/list?search=${encodeURIComponent(search)}`
        : `http://localhost:5028/api/donor/admin/list`;
        
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDonors(res.data);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải danh sách người hiến máu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [user]);

  const filteredDonors = donors.filter(d => 
    (d.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || d.phone?.includes(searchTerm) || d.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedDonors = filteredDonors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(donors.map((d, index) => ({
      'STT': index + 1,
      'Họ tên': d.fullName,
      'Email': d.email,
      'SĐT': d.phone,
      'CCCD': d.citizenId,
      'Nhóm máu': d.bloodGroup || 'Chưa rõ',
      'Số lần hiến': d.totalDonationTimes,
      'Lần cuối': d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString('vi-VN') : ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Donors");
    XLSX.writeFile(wb, "DanhSachNguoiHienMau.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Danh Sach Nguoi Hien Mau", 14, 15);
    
    const tableColumn = ["STT", "Ho ten", "Email", "SDT", "Nhom mau", "So lan"];
    const tableRows: any[] = [];

    donors.forEach((d, index) => {
      const row = [
        index + 1,
        d.fullName || 'Unknown',
        d.email,
        d.phone || '',
        d.bloodGroup || 'Chua ro',
        d.totalDonationTimes
      ];
      tableRows.push(row);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save("DanhSachNguoiHienMau.pdf");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDonors(searchTerm);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch { return dateStr; }
  };

  return (
    <div className="fade-in position-relative">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Quản Lý Danh Sách Donor
          </h4>
          <p className="text-muted small mb-0">
            Xem và quản lý hồ sơ những người hiến máu trên hệ thống
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-3 shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between" style={{ border: '1px solid #E5E7EB' }}>
        <form onSubmit={handleSearch} className="d-flex align-items-center flex-grow-1" style={{ maxWidth: '400px', position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px' }}>
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Tìm kiếm theo tên, CCCD, email..." 
            style={{ paddingLeft: '38px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.9rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary ms-2" style={{ borderRadius: '8px', backgroundColor: '#1B4FD8', border: 'none', fontSize: '0.9rem' }}>
            Tìm
          </button>
        </form>
        <div className="d-flex gap-2 align-items-center">
          <button onClick={exportToExcel} className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" style={{ borderRadius: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Xuất Excel
          </button>
          <button onClick={exportToPDF} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" style={{ borderRadius: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Xuất PDF
          </button>
          <div className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>
            Tổng: <strong className="text-dark">{donors.length}</strong>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3 shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Người Hiến</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Liên hệ</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nhóm Máu</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Số lần hiến</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lần cuối</th>
                <th className="py-3 px-4 text-muted fw-semibold text-end" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thao tác</th>
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
              ) : filteredDonors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <div className="d-flex flex-column align-items-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1" className="mb-3">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span style={{ fontSize: '0.95rem' }}>Không tìm thấy người hiến máu nào</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDonors.map((donor) => (
                  <tr key={donor.donorId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                          style={{
                            width: '40px', height: '40px',
                            background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)',
                            color: '#fff', fontWeight: 700, fontSize: '0.9rem'
                          }}
                        >
                          {getAvatarChar(donor.fullName, donor.email)}
                        </div>
                        <div>
                          <div className="fw-bold" style={{ color: '#111827' }}>{getDisplayName(donor.fullName, donor.email)}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>CCCD: {donor.citizenId || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-dark">{donor.phone || '—'}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{donor.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {donor.bloodGroup ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded" style={{ fontSize: '0.85rem' }}>
                          {donor.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-muted fst-italic">Chưa rõ</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="fw-semibold text-dark">{donor.totalDonationTimes}</span> lần
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(donor.lastDonationDate)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button 
                        className="btn btn-sm btn-light text-primary fw-semibold px-3"
                        style={{ borderRadius: '6px' }}
                        onClick={() => setSelectedDonor(donor)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredDonors.length > 0 && (
          <div className="p-3 border-top">
            <Pagination 
              currentPage={currentPage}
              totalItems={filteredDonors.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedDonor && ReactDOM.createPortal(
        <>
          <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}></div>
          <div className="modal d-block" tabIndex={-1} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" style={{ margin: '1.75rem auto' }}>
              <div className="modal-content rounded-4 border-0 shadow-lg fade-in">
                <div className="modal-header border-bottom-0 pb-0">
                  <button type="button" className="btn-close" onClick={() => setSelectedDonor(null)}></button>
                </div>
                <div className="modal-body px-4 px-md-5 pb-5">
                  <div className="text-center mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #1B4FD8 0%, #8B5CF6 100%)', color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
                      {getAvatarChar(selectedDonor.fullName, selectedDonor.email)}
                    </div>
                    <h4 className="fw-bold mb-1" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
                      {getDisplayName(selectedDonor.fullName, selectedDonor.email)}
                    </h4>
                    <p className="text-muted mb-0">{selectedDonor.email}</p>
                  </div>

                  <div className="row g-4">
                    <div className="col-12">
                      <h6 className="fw-bold text-primary border-bottom pb-2 mb-3" style={{ fontFamily: 'Montserrat' }}>Thông Tin Cá Nhân</h6>
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Họ và tên</span>
                          <div className="fw-medium text-dark">{selectedDonor.fullName || '—'}</div>
                        </div>
                        <div className="col-sm-6">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>CCCD/Hộ chiếu</span>
                          <div className="fw-medium text-dark">{selectedDonor.citizenId || '—'}</div>
                        </div>
                        <div className="col-sm-6">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Số điện thoại</span>
                          <div className="fw-medium text-dark">{selectedDonor.phone || '—'}</div>
                        </div>
                        <div className="col-sm-6">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Ngày sinh</span>
                          <div className="fw-medium text-dark">{formatDate(selectedDonor.dateOfBirth)}</div>
                        </div>
                        <div className="col-sm-6">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Giới tính</span>
                          <div className="fw-medium text-dark">
                            {selectedDonor.gender === null ? '—' : (selectedDonor.gender ? 'Nam' : 'Nữ')}
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nghề nghiệp</span>
                          <div className="fw-medium text-dark">{selectedDonor.occupation || '—'}</div>
                        </div>
                        <div className="col-12">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Địa chỉ liên hệ</span>
                          <div className="fw-medium text-dark">
                            {[selectedDonor.address, selectedDonor.ward, selectedDonor.province].filter(Boolean).join(', ') || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-danger border-bottom pb-2 mb-3" style={{ fontFamily: 'Montserrat' }}>Hồ Sơ Hiến Máu</h6>
                      <div className="row g-3 bg-light rounded-3 p-3 border">
                        <div className="col-6 col-md-3">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nhóm máu</span>
                          <div className="fw-bold text-danger fs-5">{selectedDonor.bloodGroup || '—'}</div>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Số lần hiến</span>
                          <div className="fw-bold text-dark fs-5">{selectedDonor.totalDonationTimes}</div>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Lần hiến cuối</span>
                          <div className="fw-medium text-dark mt-1">{formatDate(selectedDonor.lastDonationDate)}</div>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="small text-muted d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Thể trạng</span>
                          <div className="fw-medium text-dark mt-1">
                            {selectedDonor.height && selectedDonor.weight ? `${selectedDonor.height} cm / ${selectedDonor.weight} kg` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>, document.body
      )}
    </div>
  );
};
