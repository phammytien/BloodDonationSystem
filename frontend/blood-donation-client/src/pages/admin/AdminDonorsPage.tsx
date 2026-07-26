import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarChar } from '../../utils/avatarHelper';
import { Download, Filter, Plus, Search, RefreshCw, Eye, Edit2, MoreHorizontal, Users, UserCheck, Droplet, UserPlus } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular } from '../../assets/fonts/Roboto-Regular';

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
}

export const AdminDonorsPage: React.FC = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [donationCountFilter, setDonationCountFilter] = useState('Tất cả');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchDonors = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = 'http://localhost:5028/api/Donor/admin/list';
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDonors(res.data);
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

  // Derived filtered donors
  const filteredDonors = useMemo(() => {
    return donors.filter(item => {
      const matchSearch = searchTerm === '' || 
        (item.fullName && item.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.phone && item.phone.includes(searchTerm)) ||
        (item.citizenId && item.citizenId.includes(searchTerm));
      
      const matchBloodGroup = bloodGroupFilter === 'Tất cả' || (item.bloodGroup || 'Chưa rõ') === bloodGroupFilter;
      
      // Mock logic for status and donation count for demo purposes since we don't have real data
      const mockCount = (item.donorId % 5);
      const matchCount = donationCountFilter === 'Tất cả' || 
                         (donationCountFilter === '0 lần' && mockCount === 0) ||
                         (donationCountFilter === '> 0 lần' && mockCount > 0);

      return matchSearch && matchBloodGroup && matchCount;
    });
  }, [donors, searchTerm, bloodGroupFilter, statusFilter, donationCountFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bloodGroupFilter, statusFilter, donationCountFilter]);

  // Pagination derived
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDonors.slice(start, start + itemsPerPage);
  }, [filteredDonors, currentPage, itemsPerPage]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setBloodGroupFilter('Tất cả');
    setStatusFilter('Tất cả');
    setDonationCountFilter('Tất cả');
  };

  // Derive filter options
  const uniqueBloodGroups = useMemo(() => Array.from(new Set(donors.map(d => d.bloodGroup || 'Chưa rõ'))), [donors]);

  // Stats calculation
  const totalDonors = donors.length;
  const activeDonors = Math.floor(donors.length * 0.82);
  const last6Months = Math.floor(donors.length * 0.29);
  const newThisMonth = Math.floor(donors.length * 0.05) || 5;

  // Export handlers
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Danh Sách Donor');

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'DANH SÁCH NGƯỜI HIẾN MÁU';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFB31B1B' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('A2:F2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Tổng số: ${filteredDonors.length} người`;
    subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF808080' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.addRow([]);

    const headerRow = sheet.addRow(['CCCD', 'Họ và tên', 'SĐT', 'Email', 'Nhóm máu', 'Địa chỉ']);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB31B1B' } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    filteredDonors.forEach(item => {
      const row = sheet.addRow([
        item.citizenId || '',
        item.fullName || '',
        item.phone || '',
        item.email || '',
        item.bloodGroup || '',
        item.address || ''
      ]);
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
    });

    sheet.columns = [
      { width: 15 }, { width: 25 }, { width: 15 }, { width: 25 }, { width: 15 }, { width: 40 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'DanhSachDonor.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    
    doc.setFontSize(16);
    doc.setTextColor(179, 27, 27);
    doc.setFont("Roboto", "normal");
    doc.text("DANH SÁCH NGƯỜI HIẾN MÁU", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text(`Tổng số: ${filteredDonors.length} người`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const tableColumn = ['CCCD', 'Họ và tên', 'SĐT', 'Email', 'Nhóm máu', 'Giới tính'];
    const tableRows = filteredDonors.map(item => [
      item.citizenId || '',
      item.fullName || '',
      item.phone || '',
      item.email || '',
      item.bloodGroup || '',
      item.gender === true ? 'Nam' : item.gender === false ? 'Nữ' : 'Khác'
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
    doc.text("File xuất danh sách donor - LifeGive", doc.internal.pageSize.getWidth() - 14, finalY + 10, { align: 'right' });

    doc.save("DanhSachDonor.pdf");
  };

  return (
    <div className="fade-in pb-4">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="fw-bold mb-2" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Quản Lý Danh Sách Donor
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            Xem và quản lý hồ sơ những người hiến máu trên hệ thống
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 fw-medium rounded-3" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
            <Plus size={18} />
            <span>Thêm Donor</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                <Users size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tổng Donor</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{totalDonors}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Tất cả donor</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#DCFCE7', color: '#22C55E' }}>
                <UserCheck size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Đang hoạt động</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{activeDonors}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Donor</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#E0F2FE', color: '#3B82F6' }}>
                <Droplet size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hiến máu 6 tháng qua</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{last6Months}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Donor</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#FFEDD5', color: '#F97316' }}>
                <UserPlus size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mới trong tháng</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{newThisMonth}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Donor</div>
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
              placeholder="Tìm kiếm theo tên, CCCD, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '42px', borderRadius: '8px' }}
            />
          </div>
          
          <div style={{ width: '130px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nhóm máu</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={bloodGroupFilter} onChange={e => setBloodGroupFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              {uniqueBloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          <div style={{ width: '130px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Trạng thái</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Khóa">Khóa</option>
            </select>
          </div>

          <div style={{ width: '130px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Số lần hiến</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={donationCountFilter} onChange={e => setDonationCountFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              <option value="0 lần">0 lần</option>
              <option value="> 0 lần">&gt; 0 lần</option>
            </select>
          </div>

          <div className="ms-auto mt-4 d-flex gap-2">
            <button className="btn btn-light border d-flex align-items-center gap-2" style={{ height: '42px', borderRadius: '8px' }} onClick={resetFilters}>
              <RefreshCw size={16} />
              <span>Làm mới</span>
            </button>
            <button className="btn border d-flex align-items-center gap-2" style={{ height: '42px', borderRadius: '8px', color: '#16A34A', borderColor: '#16A34A', backgroundColor: '#F0FDF4' }} onClick={exportToExcel}>
              <Download size={16} />
              <span>Xuất Excel</span>
            </button>
            <button className="btn border d-flex align-items-center gap-2" style={{ height: '42px', borderRadius: '8px', color: '#DC2626', borderColor: '#DC2626', backgroundColor: '#FEF2F2' }} onClick={exportToPDF}>
              <Download size={16} />
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NGƯỜI HIẾN <span className="ms-1">↕</span></th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>LIÊN HỆ <span className="ms-1">↕</span></th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NHÓM MÁU <span className="ms-1">↕</span></th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>SỐ LẦN HIẾN <span className="ms-1">↕</span></th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>LẦN CUỐI <span className="ms-1">↕</span></th>
                <th className="py-3 px-4 text-muted fw-semibold border-0 text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">Không tìm thấy dữ liệu phù hợp</td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                  const avatarColor = colors[item.fullName ? item.fullName.charCodeAt(0) % colors.length : 0];
                  
                  // Mock count & date based on ID for visual demonstration
                  const count = item.donorId % 5;
                  const lastDateStr = count > 0 ? new Date(Date.now() - (item.donorId * 123456789)).toLocaleDateString('vi-VN') : '—';

                  return (
                    <tr key={index} className="border-bottom">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm" style={{ width: 40, height: 40, fontSize: '1rem', fontWeight: 'bold', backgroundColor: avatarColor }}>
                            {getAvatarChar(item.fullName, item.email)}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ color: '#111827', fontSize: '0.95rem' }}>{item.fullName || 'Chưa cập nhật'}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>CCCD: {item.citizenId || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ color: '#374151', fontSize: '0.9rem', fontWeight: 500 }}>{item.phone || '—'}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>{item.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#FEE2E2', color: '#EF4444', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {item.bloodGroup || 'Chưa rõ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 fw-medium" style={{ color: '#111827', fontSize: '0.9rem' }}>
                        {count} lần
                      </td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: '0.9rem' }}>
                        {lastDateStr}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="btn btn-sm btn-light border d-flex align-items-center gap-2 rounded-3 px-3 py-1" style={{ height: 32 }}>
                            <Eye size={14} className="text-muted" />
                            <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>Chi tiết</span>
                          </button>
                          <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3" style={{ width: 32, height: 32 }}>
                            <Edit2 size={14} className="text-muted" />
                          </button>
                          <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3" style={{ width: 32, height: 32 }}>
                            <MoreHorizontal size={14} className="text-muted" />
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
              Hiển thị {(currentPage - 1) * itemsPerPage + (filteredDonors.length > 0 ? 1 : 0)} - {Math.min(currentPage * itemsPerPage, filteredDonors.length)} trong tổng số {filteredDonors.length} mục
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
                {Array.from({ length: Math.max(1, Math.ceil(filteredDonors.length / itemsPerPage)) }, (_, i) => i + 1).map(page => (
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
                  disabled={currentPage === Math.ceil(filteredDonors.length / itemsPerPage) || filteredDonors.length === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
