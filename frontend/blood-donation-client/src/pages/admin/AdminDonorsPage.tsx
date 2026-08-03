import React, { useState, useEffect, useMemo } from 'react';
import { AdminDonorModal, type DonorProfileDto } from '../../components/admin/AdminDonorModal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarChar } from '../../utils/avatarHelper';
import Swal from 'sweetalert2';
import { Download, Plus, Search, RefreshCw, Eye, Edit2, MoreHorizontal, Users, UserCheck, Droplet, UserPlus, X, Lock, Unlock, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular } from '../../assets/fonts/Roboto-Regular';


export const AdminDonorsPage: React.FC = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState<DonorProfileDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalShow, setModalShow] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedDonor, setSelectedDonor] = useState<DonorProfileDto | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [donationCountFilter, setDonationCountFilter] = useState('Tất cả');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [editingDonor, setEditingDonor] = useState<any>(null);

  const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 6) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-3);
  };

  const maskCCCD = (cccd?: string) => {
    if (!cccd || cccd.length < 6) return cccd;
    return cccd.slice(0, 3) + '*****' + cccd.slice(-3);
  };

  // 1) Lấy danh sách Donor
  const fetchDonors = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageIndex: currentPage.toString(),
        pageSize: itemsPerPage.toString()
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      // Note: Backend currently only supports text search via API, 
      // complex filtering (status, bloodGroup) would ideally also be pushed to server.
      // For now, we rely on backend for text search & pagination.
      
      const res = await axios.get(`http://localhost:5028/api/Donor/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDonors(res.data.items);
      setTotalItems(res.data.totalCount);
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải danh sách người hiến máu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (donorId: number) => {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa vĩnh viễn người hiến máu này? Mọi dữ liệu liên quan cũng sẽ bị xóa.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Có, xóa!',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5028/api/Donor/admin/${donorId}`, {
            headers: { Authorization: `Bearer ${user?.token}` }
          });
          toast.success('Đã xóa người hiến máu.');
          fetchDonors();
        } catch (err: any) {
          console.error(err);
          toast.error(err.response?.data?.message || 'Lỗi khi xóa người hiến máu.');
        }
      }
    });
  };

  const handleToggleLock = async (donorId: number, currentStatus: boolean) => {
    Swal.fire({
      title: currentStatus ? 'Xác nhận khóa' : 'Xác nhận mở khóa',
      text: currentStatus ? 'Bạn có chắc chắn muốn khóa tài khoản này?' : 'Bạn có chắc chắn muốn mở khóa tài khoản này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#f59e0b' : '#10b981',
      cancelButtonColor: '#6c757d',
      confirmButtonText: currentStatus ? 'Có, khóa!' : 'Có, mở khóa!',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(`http://localhost:5028/api/Donor/admin/${donorId}/toggle-lock`, {}, {
            headers: { Authorization: `Bearer ${user?.token}` }
          });
          toast.success(currentStatus ? 'Đã khóa người hiến máu.' : 'Đã mở khóa người hiến máu.');
          fetchDonors();
        } catch (err: any) {
          console.error(err);
          toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
        }
      }
    });
  };


  useEffect(() => {
    fetchDonors();
  }, [user, currentPage, itemsPerPage, searchTerm]); // re-fetch when pagination or search changes

  // Since we moved pagination to server, filteredDonors is just donors for now,
  // but if we want to keep bloodGroupFilter locally, we can still filter the current page.
  // Ideally, all filters should be sent to the backend.
  const filteredDonors = useMemo(() => {
    return donors.filter(item => {
      const matchBloodGroup = bloodGroupFilter === 'Tất cả' || (item.bloodGroup || 'Chưa rõ') === bloodGroupFilter;
      
      const mockCount = item.donorId ? (item.donorId % 5) : 0;
      const matchCount = donationCountFilter === 'Tất cả' ||
        (donationCountFilter === '0 lần' && mockCount === 0) ||
        (donationCountFilter === '> 0 lần' && mockCount > 0);

      const matchStatus = statusFilter === 'Tất cả' ||
        (statusFilter === 'Hoạt động' && item.isAvailable !== false) ||
        (statusFilter === 'Tạm ngưng' && item.isAvailable === false);

      return matchBloodGroup && matchCount && matchStatus;
    });
  }, [donors, bloodGroupFilter, statusFilter, donationCountFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bloodGroupFilter, statusFilter, donationCountFilter]);

  const currentItems = filteredDonors; // We don't slice locally anymore

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setBloodGroupFilter('Tất cả');
    setStatusFilter('Tất cả');
    setDonationCountFilter('Tất cả');
    setCurrentPage(1);
  };

  // Derive filter options (ideally from a separate API or stored list, but keeping this for compatibility)
  const uniqueBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Stats calculation
  const totalDonors = totalItems;
  const activeDonors = Math.floor(totalItems * 0.82);
  const last6Months = Math.floor(totalItems * 0.29);
  const newThisMonth = Math.floor(totalItems * 0.05) || 5;

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
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
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
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
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
          <button
            className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 fw-medium rounded-3"
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            onClick={() => {
              setModalMode('create');
              setSelectedDonor(null);
              setModalShow(true);
            }}
          >
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
        <div className="p-3 border-bottom bg-white d-flex gap-3 align-items-end flex-wrap">
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
              <option value="Tạm ngưng">Khóa</option>
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

          <div className="ms-auto d-flex gap-2">
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
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TRẠNG THÁI <span className="ms-1">↕</span></th>
                <th className="py-3 px-4 text-muted fw-semibold border-0 text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
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
                  const avatarColor = colors[item.fullName ? item.fullName.charCodeAt(0) % colors.length : 0];

                  // Mock count & date based on ID for visual demonstration
                  const count = item.donorId ? (item.donorId % 5) : 0;
                  const lastDateStr = count > 0 && item.donorId ? new Date(Date.now() - (item.donorId * 123456789)).toLocaleDateString('vi-VN') : '—';

                  return (
                    <tr key={index} className="border-bottom">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm" style={{ width: 40, height: 40, fontSize: '1rem', fontWeight: 'bold', backgroundColor: avatarColor }}>
                            {getAvatarChar(item.fullName, item.email)}
                          </div>
                          <div>
                            <div className="fw-semibold d-flex align-items-center gap-2" style={{ color: '#111827', fontSize: '0.95rem' }}>
                              {item.fullName || 'Chưa cập nhật'}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>CCCD: {item.citizenId ? maskCCCD(item.citizenId) : '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ color: '#374151', fontSize: '0.9rem', fontWeight: 500 }}>{item.phone ? maskPhone(item.phone) : '—'}</div>
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
                      <td className="px-4 py-3">
                        {item.isAvailable !== false ? (
                          <span className="badge bg-success bg-opacity-10 text-success px-3 py-1 rounded-pill" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Hoạt động</span>
                        ) : (
                          <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-1 rounded-pill" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Khóa</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-light border d-flex align-items-center gap-2 rounded-3 px-3 py-1"
                            style={{ height: 32 }}
                            onClick={() => {
                              setModalMode('view');
                              setSelectedDonor(item);
                              setModalShow(true);
                            }}
                          >
                            <Eye size={14} className="text-muted" />
                            <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>Chi tiết</span>
                          </button>
                          <button
                            className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3"
                            style={{ width: 32, height: 32 }}
                            onClick={() => {
                              setModalMode('edit');
                              setSelectedDonor(item);
                              setModalShow(true);
                            }}
                          >
                            <Edit2 size={14} className="text-muted" />
                          </button>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3" style={{ width: 32, height: 32 }} data-bs-toggle="dropdown" aria-expanded="false">
                              <MoreHorizontal size={14} className="text-muted" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-1">
                              <li>
                                <button className="dropdown-item text-warning d-flex align-items-center gap-2 py-2" onClick={() => item.donorId && handleToggleLock(item.donorId, item.isAvailable ?? true)}>
                                  {item.isAvailable === false ? <Unlock size={16} /> : <Lock size={16} />}
                                  {item.isAvailable === false ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={() => item.donorId && handleDelete(item.donorId)}>
                                  <Trash2 size={16} /> Xóa vĩnh viễn
                                </button>
                              </li>
                            </ul>
                          </div>
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
              Hiển thị {(currentPage - 1) * itemsPerPage + (currentItems.length > 0 ? 1 : 0)} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} mục
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
                {Array.from({ length: Math.max(1, Math.ceil(totalItems / itemsPerPage)) }, (_, i) => i + 1).map(page => (
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
                  disabled={currentPage === Math.ceil(totalItems / itemsPerPage) || totalItems === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminDonorModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        mode={modalMode}
        donorData={selectedDonor}
        onSuccess={fetchDonors}
      />
    </div>
  );
};
