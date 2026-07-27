import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarChar } from '../../utils/avatarHelper';
import { Download, Search, RefreshCw, Eye, Droplet, Calendar, Users, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular } from '../../assets/fonts/Roboto-Regular';

interface DonationHistoryDto {
  donationId: number;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  bloodGroup: string;
  volumeML: number;
  donationDate: string;
  staffName: string;
  note?: string;
}

export const AdminHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<DonationHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<DonationHistoryDto | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('Tất cả');
  const [timeRangeFilter, setTimeRangeFilter] = useState('Tất cả');
  const [staffFilter, setStaffFilter] = useState('Tất cả');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = 'http://localhost:5028/api/BloodDonation/admin/history';
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setHistory(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải lịch sử hiến máu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (donationId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu hiến máu này? Hành động này không thể hoàn tác!')) return;
    try {
      await axios.delete(`http://localhost:5028/api/BloodDonation/admin/${donationId}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Đã xóa phiếu hiến máu thành công.');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa phiếu hiến máu.');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // Derive filter options
  const uniqueBloodGroups = useMemo(() => Array.from(new Set(history.map(h => h.bloodGroup))), [history]);
  const uniqueStaffs = useMemo(() => Array.from(new Set(history.map(h => h.staffName))), [history]);

  // Derived filtered history
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchSearch = searchTerm === '' ||
        (item.donorName && item.donorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.donorEmail && item.donorEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.donationId && item.donationId.toString().includes(searchTerm));

      const matchBloodGroup = bloodGroupFilter === 'Tất cả' || item.bloodGroup === bloodGroupFilter;
      const matchStaff = staffFilter === 'Tất cả' || item.staffName === staffFilter;

      let matchTime = true;
      if (timeRangeFilter !== 'Tất cả') {
        const date = new Date(item.donationDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (timeRangeFilter === '1 tháng qua' && diffDays > 30) matchTime = false;
        if (timeRangeFilter === '6 tháng qua' && diffDays > 180) matchTime = false;
        if (timeRangeFilter === '1 năm qua' && diffDays > 365) matchTime = false;
      }

      return matchSearch && matchBloodGroup && matchStaff && matchTime;
    });
  }, [history, searchTerm, bloodGroupFilter, timeRangeFilter, staffFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bloodGroupFilter, timeRangeFilter, staffFilter]);

  // Pagination derived
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setBloodGroupFilter('Tất cả');
    setTimeRangeFilter('Tất cả');
    setStaffFilter('Tất cả');
    setCurrentPage(1);
    fetchHistory();
  };

  // Stats calculation
  const totalDonations = history.length;
  const uniqueDonors = new Set(history.map(h => h.donorEmail)).size;
  const last6Months = history.filter(h => {
    const diff = new Date().getTime() - new Date(h.donationDate).getTime();
    return diff <= 180 * 24 * 60 * 60 * 1000;
  }).length;
  const eligibleEstimate = Math.max(0, uniqueDonors - Math.floor(last6Months / 2));

  // Export handlers
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Lịch sử hiến máu');

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LỊCH SỬ HIẾN MÁU';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFB31B1B' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('A2:F2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Tổng số: ${filteredHistory.length} phiếu hiến`;
    subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF808080' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.addRow([]);

    const headerRow = sheet.addRow(['Mã Phiếu', 'Người hiến', 'Nhóm máu', 'Thể tích', 'Ngày hiến', 'Nhân viên']);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB31B1B' } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    filteredHistory.forEach(item => {
      const row = sheet.addRow([
        `#${item.donationId}`,
        item.donorName || '',
        item.bloodGroup || '',
        `${item.volumeML} ML`,
        new Date(item.donationDate).toLocaleString('vi-VN'),
        item.staffName || ''
      ]);
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    sheet.columns = [
      { width: 15 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 25 }, { width: 25 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'LichSuHienMau.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');

    doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    doc.setFontSize(16);
    doc.setTextColor(179, 27, 27);
    doc.setFont("Roboto", "normal");
    doc.text("LỊCH SỬ HIẾN MÁU", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Tổng số: ${filteredHistory.length} phiếu hiến`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const tableColumn = ['Mã Phiếu', 'Người hiến', 'Nhóm máu', 'Thể tích', 'Ngày hiến', 'Nhân viên'];
    const tableRows = filteredHistory.map(item => [
      `#${item.donationId}`,
      item.donorName || '',
      item.bloodGroup || '',
      `${item.volumeML} ML`,
      new Date(item.donationDate).toLocaleString('vi-VN'),
      item.staffName || ''
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { font: "Roboto", fontStyle: "normal", fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [179, 27, 27], textColor: [255, 255, 255], halign: 'center' },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text("File xuất lịch sử hiến máu - LifeGive", doc.internal.pageSize.getWidth() - 14, finalY + 10, { align: 'right' });

    doc.save("LichSuHienMau.pdf");
  };

  return (
    <div className="fade-in pb-4">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="fw-bold mb-2" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Lịch Sử Hiến Máu
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            Danh sách tất cả các phiếu hiến máu đã thực hiện thành công.
          </p>
        </div>
        <div className="d-flex gap-2">
          <div className="dropdown">
            <button className="btn btn-light border d-flex align-items-center gap-2" data-bs-toggle="dropdown">
              <Download size={18} />
              <span>Xuất dữ liệu</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
              <li><button className="dropdown-item" onClick={exportToExcel}>Xuất Excel</button></li>
              <li><button className="dropdown-item" onClick={exportToPDF}>Xuất PDF</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                <Droplet size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Tổng số lần hiến máu</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{totalDonations}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Tất cả thời gian</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, backgroundColor: '#E0F2FE', color: '#3B82F6' }}>
                <Users size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Hiện tại đủ điều kiện</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{eligibleEstimate}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Có thể hiến</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, backgroundColor: '#DCFCE7', color: '#22C55E' }}>
                <Calendar size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Hiến trong 6 tháng</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{last6Months}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Lần hiến</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, backgroundColor: '#F3E8FF', color: '#A855F7' }}>
                <Users size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Người hiến máu</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{uniqueDonors}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Đã tham gia</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
        {/* Filters */}
        <div className="p-3 border-bottom bg-white d-flex gap-3 align-items-center flex-wrap">
          <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
            <Search className="position-absolute text-muted" size={18} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control ps-5 bg-light border-0"
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '42px', borderRadius: '8px' }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nhóm máu</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={bloodGroupFilter} onChange={e => setBloodGroupFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              {uniqueBloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Khoảng thời gian</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={timeRangeFilter} onChange={e => setTimeRangeFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              <option value="1 tháng qua">1 tháng qua</option>
              <option value="6 tháng qua">6 tháng qua</option>
              <option value="1 năm qua">1 năm qua</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nhân viên</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              {uniqueStaffs.map(staff => <option key={staff} value={staff}>{staff}</option>)}
            </select>
          </div>

          <div className="ms-auto mt-4">
            <button className="btn btn-light border d-flex align-items-center gap-2" style={{ height: '42px', borderRadius: '8px' }} onClick={resetFilters}>
              <RefreshCw size={16} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PHIẾU HIẾN <span className="ms-1">↕</span></th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NGƯỜI HIẾN</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NHÓM MÁU</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>THỂ TÍCH</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NGÀY HIẾN</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NHÂN VIÊN</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0 text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">Không tìm thấy dữ liệu phù hợp</td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                  const avatarColor = colors[item.donorName ? item.donorName.charCodeAt(0) % colors.length : 0];

                  return (
                    <tr key={index} className="border-bottom">
                      <td className="px-4 py-3">
                        <div className="fw-bold" style={{ color: '#111827', fontSize: '0.95rem' }}>#{item.donationId}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>PH-{item.donationId.toString().padStart(6, '0')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm" style={{ width: 40, height: 40, fontSize: '1rem', fontWeight: 'bold', backgroundColor: avatarColor }}>
                            {getAvatarChar(item.donorName, item.donorEmail)}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ color: '#111827', fontSize: '0.95rem' }}>{item.donorName}</div>
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>{item.donorEmail}</div>
                            {item.donorPhone && <div className="text-muted" style={{ fontSize: '0.85rem' }}>📞 {item.donorPhone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#EF4444', color: 'white', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {item.bloodGroup}
                        </span>
                      </td>
                      <td className="px-4 py-3 fw-bold" style={{ color: '#111827', fontSize: '0.95rem' }}>
                        {item.volumeML} ML
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={16} className="text-muted" />
                          <div>
                            <div style={{ color: '#374151', fontSize: '0.9rem', fontWeight: 500 }}>
                              {new Date(item.donationDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                              {new Date(item.donationDate).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#374151', fontSize: '0.9rem', fontWeight: 500 }}>
                        {item.staffName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3"
                            style={{ width: 32, height: 32 }}
                            onClick={() => setSelectedDonation(item)}
                          >
                            <Eye size={16} className="text-muted" />
                          </button>
                          {/* <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3" style={{ width: 32, height: 32 }}>
                            <Printer size={16} className="text-muted" />
                          </button> */}
                          <button 
                            className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3 text-danger" 
                            style={{ width: 32, height: 32 }}
                            onClick={() => handleDelete(item.donationId)}
                            title="Xóa phiếu hiến máu"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {!loading && (
          <div className="p-4 border-top d-flex justify-content-between align-items-center bg-white flex-wrap gap-3">
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + (filteredHistory.length > 0 ? 1 : 0)} - {Math.min(currentPage * itemsPerPage, filteredHistory.length)} trong tổng số {filteredHistory.length} mục
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Hiển thị</span>
                <select
                  className="form-select form-select-sm border"
                  style={{ width: '100px', height: '36px', borderRadius: '8px' }}
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="5">5 / trang</option>
                  <option value="10">10 / trang</option>
                  <option value="20">20 / trang</option>
                </select>
              </div>

              <div className="d-flex gap-1">
                <button
                  className="btn btn-light border d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, borderRadius: '8px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  &laquo;
                </button>
                {Array.from({ length: Math.ceil(filteredHistory.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`btn border d-flex align-items-center justify-content-center fw-medium ${currentPage === page ? 'btn-danger text-white' : 'btn-white text-dark'}`}
                    style={{ width: 36, height: 36, borderRadius: '8px' }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="btn btn-light border d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, borderRadius: '8px' }}
                  disabled={currentPage === Math.ceil(filteredHistory.length / itemsPerPage) || filteredHistory.length === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDonation && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white border-0 py-3">
                <h5 className="modal-title fw-bold mb-0">Chi Tiết Phiếu Hiến Máu #{selectedDonation.donationId}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedDonation(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                      <div className="card-body p-4">
                        <h6 className="fw-bold mb-3" style={{ color: '#111827' }}>Thông tin người hiến</h6>
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="text-muted">Họ và tên</span>
                            <span className="fw-semibold text-dark">{selectedDonation.donorName}</span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="text-muted">Email</span>
                            <span className="fw-semibold text-dark">{selectedDonation.donorEmail}</span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="text-muted">Số điện thoại</span>
                            <span className="fw-semibold text-dark">{selectedDonation.donorPhone || 'Không có'}</span>
                          </div>
                          <div className="d-flex justify-content-between pb-2">
                            <span className="text-muted">Nhóm máu</span>
                            <span className="badge bg-danger rounded-pill px-3">{selectedDonation.bloodGroup}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                      <div className="card-body p-4">
                        <h6 className="fw-bold mb-3" style={{ color: '#111827' }}>Thông tin phiếu hiến</h6>
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="text-muted">Mã phiếu</span>
                            <span className="fw-semibold text-dark">PH-{selectedDonation.donationId.toString().padStart(6, '0')}</span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="text-muted">Thể tích máu</span>
                            <span className="fw-semibold text-primary">{selectedDonation.volumeML} ML</span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="text-muted">Ngày hiến</span>
                            <span className="fw-semibold text-dark">{new Date(selectedDonation.donationDate).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className="d-flex justify-content-between pb-2">
                            <span className="text-muted">Nhân viên thực hiện</span>
                            <span className="fw-semibold text-dark">{selectedDonation.staffName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedDonation.note && (
                  <div className="card border-0 shadow-sm rounded-4 mt-4">
                    <div className="card-body p-4">
                      <h6 className="fw-bold mb-3" style={{ color: '#111827' }}>Ghi chú</h6>
                      <p className="text-muted mb-0">{selectedDonation.note}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 p-3 bg-white">
                <button type="button" className="btn btn-light border px-4 py-2 fw-medium rounded-3" onClick={() => setSelectedDonation(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
