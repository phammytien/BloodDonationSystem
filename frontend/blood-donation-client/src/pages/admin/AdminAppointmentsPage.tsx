import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { Pagination } from '../../components/common/Pagination';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular } from '../../assets/fonts/Roboto-Regular';

export const AdminAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Filters & Search
  const [filterCampaignId, setFilterCampaignId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [adminNote, setAdminNote] = useState('');

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCampaigns();
    fetchAppointments();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('http://localhost:5028/api/campaign');
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // We fetch all to handle search & stats on frontend
      const res = await axios.get('http://localhost:5028/api/appointment/admin/list', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setAppointments(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách đơn đăng ký', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (app: any) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setAdminNote('');
    setShowStatusModal(true);
  };

  const handleOpenViewModal = (app: any) => {
    setSelectedApp(app);
    setShowViewModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    try {
      await axios.put(`http://localhost:5028/api/appointment/admin/status/${selectedApp.appointmentId}`, {
        status: newStatus,
        note: adminNote
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Cập nhật trạng thái thành công', { position: 'top-center' });
      setShowStatusModal(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra', { position: 'top-center' });
    }
  };

  // Filter Logic
  const filteredAppointments = appointments.filter(a => {
    const matchCampaign = filterCampaignId ? a.campaignId === Number(filterCampaignId) : true;
    const matchStatus = filterStatus ? a.status === Number(filterStatus) : true;
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = searchTerm ? (
      (a.donorName && a.donorName.toLowerCase().includes(searchLower)) ||
      (a.donorPhone && a.donorPhone.toLowerCase().includes(searchLower)) ||
      (a.appointmentId && a.appointmentId.toString().includes(searchLower))
    ) : true;
    
    return matchCampaign && matchStatus && matchSearch;
  });

  // Calculate Stats
  const totalApps = appointments.length;
  const pendingApps = appointments.filter(a => a.status === 0).length;
  const completedApps = appointments.filter(a => a.status === 2).length;
  const todayApps = appointments.filter(a => {
    const today = new Date().toDateString();
    const appDate = new Date(a.createdAt).toDateString();
    return today === appDate;
  }).length;

  // Utilities
  const getStatusString = (status: number) => {
    switch(status) {
      case 0: return 'Chờ duyệt';
      case 1: return 'Đã xác nhận';
      case 2: return 'Hoàn thành';
      case 3: return 'Đã hủy';
      default: return 'Không rõ';
    }
  };

  const getStatusBadge = (status: number) => {
    switch(status) {
      case 0: return <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill fw-semibold">Chờ duyệt</span>;
      case 1: return <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold">Đã xác nhận</span>;
      case 2: return <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-semibold">Hoàn thành</span>;
      case 3: return <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill fw-semibold">Đã hủy</span>;
      default: return null;
    }
  };

  const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
  };

  // Export functions
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DanhSach');

    // Mẫu màu giống hình ảnh
    const darkRed = 'FFB31B1B'; // #B31B1B
    const lightPink = 'FFFFF0F0';
    
    // Dòng 1: Tiêu đề lớn
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH NGƯỜI ĐÃ ĐĂNG KÝ HIẾN MÁU';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkRed } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Dòng 2: Tổng số
    worksheet.mergeCells('A2:I2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Tổng số: ${filteredAppointments.length} đơn đăng ký`;
    subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: darkRed } };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightPink } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Dòng 3: Khoảng trắng
    worksheet.mergeCells('A3:I3');
    
    // Dòng 4: Header
    const headers = ['Mã đơn', 'Người hiến máu', 'SĐT', 'Nhóm máu', 'Chiến dịch', 'Ngày hẹn', 'Giờ', 'Trạng thái', 'Ngày đăng ký'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkRed } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
    });

    // Data rows
    filteredAppointments.forEach(a => {
      const statusText = getStatusString(a.status);
      const row = worksheet.addRow([
        a.appointmentId,
        a.donorName,
        a.donorPhone,
        a.bloodGroup,
        a.campaignName,
        new Date(a.appointmentDate).toLocaleDateString('vi-VN'),
        a.timeSlot,
        statusText,
        new Date(a.createdAt).toLocaleString('vi-VN')
      ]);

      // Styling data rows
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEAEAEA' } },
          left: { style: 'thin', color: { argb: 'FFEAEAEA' } },
          bottom: { style: 'thin', color: { argb: 'FFEAEAEA' } },
          right: { style: 'thin', color: { argb: 'FFEAEAEA' } }
        };

        // Align center cho các cột Mã, SĐT, Nhóm máu, Ngày, Giờ, Trạng thái, Ngày ĐK
        if ([1, 3, 4, 6, 7, 8, 9].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        // Tô màu cột trạng thái (Cột H / 8)
        if (colNumber === 8) {
          if (a.status === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }; // Vàng nhạt
            cell.font = { color: { argb: 'FF856404' }, bold: true };
          } else if (a.status === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1ECF1' } }; // Xanh biển nhạt
            cell.font = { color: { argb: 'FF0C5460' }, bold: true };
          } else if (a.status === 2) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }; // Xanh lá nhạt
            cell.font = { color: { argb: 'FF155724' }, bold: true };
          } else if (a.status === 3) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } }; // Đỏ nhạt
            cell.font = { color: { argb: 'FF721C24' }, bold: true };
          }
        }
      });
    });

    // Thêm footer
    const footerRowIndex = worksheet.rowCount + 2;
    worksheet.mergeCells(`A${footerRowIndex}:I${footerRowIndex}`);
    const footerCell = worksheet.getCell(`A${footerRowIndex}`);
    footerCell.value = 'File xuất danh sách người đã đăng ký hiến máu - LifeGive';
    footerCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF808080' } };
    footerCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // Auto-fit cột
    worksheet.columns = [
      { width: 8 },  // Mã
      { width: 22 }, // Tên
      { width: 14 }, // SĐT
      { width: 10 }, // Nhóm máu
      { width: 35 }, // Chiến dịch
      { width: 12 }, // Ngày hẹn
      { width: 22 }, // Giờ
      { width: 15 }, // Trạng thái
      { width: 20 }, // Ngày ĐK
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "DanhSachDonDangKy.xlsx");
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Đăng ký font tiếng Việt
    doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    
    // Tiêu đề
    doc.setFontSize(16);
    doc.setTextColor(179, 27, 27); // Đỏ đậm
    doc.setFont("Roboto", "normal");
    doc.text("DANH SÁCH NGƯỜI ĐÃ ĐĂNG KÝ HIẾN MÁU", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    // Tổng số
    doc.setFontSize(11);
    doc.setFont("Roboto", "normal");
    doc.text(`Tổng số: ${filteredAppointments.length} đơn đăng ký`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const tableColumn = ["Mã đơn", "Người hiến", "SĐT", "Nhóm máu", "Chiến dịch", "Ngày hẹn", "Giờ", "Trạng thái"];
    const tableRows: any[] = [];

    filteredAppointments.forEach(a => {
      const appData = [
        a.appointmentId,
        a.donorName || "",
        a.donorPhone,
        a.bloodGroup,
        a.campaignName || "",
        new Date(a.appointmentDate).toLocaleDateString('vi-VN'),
        a.timeSlot,
        getStatusString(a.status)
      ];
      tableRows.push(appData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { font: "Roboto", fontStyle: "normal", fontSize: 9 },
      headStyles: { fillColor: [179, 27, 27], textColor: [255, 255, 255], fontStyle: 'normal', halign: 'center' },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 7) { // Trạng thái
           const statusStr = data.cell.raw.toString().toLowerCase();
           if (statusStr.includes('hoan thanh')) {
              data.cell.styles.fillColor = [212, 237, 218];
              data.cell.styles.textColor = [21, 87, 36];
           } else if (statusStr.includes('cho duyet')) {
              data.cell.styles.fillColor = [255, 243, 205];
              data.cell.styles.textColor = [133, 100, 4];
           } else if (statusStr.includes('xac nhan')) {
              data.cell.styles.fillColor = [209, 236, 241];
              data.cell.styles.textColor = [12, 84, 96];
           } else if (statusStr.includes('huy')) {
              data.cell.styles.fillColor = [248, 215, 218];
              data.cell.styles.textColor = [114, 28, 36];
           }
           data.cell.styles.fontStyle = 'normal';
           data.cell.styles.halign = 'center';
        }
      }
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.setFont("Roboto", "normal");
    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.text("File xuất danh sách người đã đăng ký hiến máu - LifeGive", doc.internal.pageSize.getWidth() - 14, finalY + 10, { align: 'right' });

    doc.save("DanhSachDonDangKy.pdf");
    setShowExportMenu(false);
  };

  return (
    <>
      <div className="container-fluid fade-in py-2" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
        
        {/* Header & Filters */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827', margin: 0 }}>Duyệt Đơn Đăng Ký</h3>
            <p className="text-muted small mt-1 mb-0">Quản lý và xét duyệt các đơn đăng ký hiến máu.</p>
          </div>
          
          <div className="d-flex gap-3 align-items-center">
            <select 
              className="form-select border-0 shadow-sm rounded-3 px-3 py-2" 
              value={filterCampaignId}
              onChange={(e) => setFilterCampaignId(e.target.value)}
              style={{ minWidth: '220px', fontSize: '0.9rem' }}
            >
              <option value="">Tất cả chiến dịch</option>
              {campaigns.map(c => (
                <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>
              ))}
            </select>

            <select 
              className="form-select border-0 shadow-sm rounded-3 px-3 py-2" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: '180px', fontSize: '0.9rem' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="0">Chờ duyệt</option>
              <option value="1">Đã xác nhận</option>
              <option value="2">Hoàn thành</option>
              <option value="3">Đã hủy</option>
            </select>
            
            <button className="btn btn-outline-secondary bg-white border-0 shadow-sm py-2 px-3 rounded-3" style={{ color: '#D42B2B' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div>
                  <div className="text-muted small fw-semibold">Tổng đơn đăng ký</div>
                  <h3 className="mb-0 fw-bold">{totalApps}</h3>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Tất cả thời gian</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div>
                  <div className="text-muted small fw-semibold">Chờ duyệt</div>
                  <h3 className="mb-0 fw-bold">{pendingApps}</h3>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Cần xem xét</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#D1FAE5', color: '#059669' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div>
                  <div className="text-muted small fw-semibold">Hoàn thành</div>
                  <h3 className="mb-0 fw-bold">{completedApps}</h3>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Đã duyệt</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-5.42 5.42"></path></svg>
                </div>
                <div>
                  <div className="text-muted small fw-semibold">Hôm nay</div>
                  <h3 className="mb-0 fw-bold">{todayApps}</h3>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Đơn mới</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table & Toolbar */}
        <div className="card border-0 bg-white" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', borderRadius: '1rem' }}>
          
          <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
            <div className="position-relative" style={{ width: '350px' }}>
              <span className="position-absolute" style={{ top: '50%', left: '15px', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input 
                type="text" 
                className="form-control bg-light border-0 rounded-3 ps-5 py-2" 
                placeholder="Tìm kiếm theo tên, SĐT, mã đơn..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="d-flex gap-3">
              <button onClick={fetchAppointments} className="btn btn-light bg-white border d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm rounded-3 text-dark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-5.42 5.42"></path></svg>
                Làm mới
              </button>
              
              <div className="position-relative">
                <button 
                  className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm rounded-3"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ backgroundColor: '#D42B2B', border: 'none' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Xuất dữ liệu
                </button>
                {showExportMenu && (
                  <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow border overflow-hidden" style={{ width: '150px', zIndex: 100 }}>
                    <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 border-bottom" onClick={exportToExcel}>
                      <span className="text-success fw-bold">X</span> Excel (.xlsx)
                    </button>
                    <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-2" onClick={exportToPDF}>
                      <span className="text-danger fw-bold">P</span> PDF (.pdf)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '1000px' }}>
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th className="text-uppercase text-muted fw-bold py-3 px-4" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Mã Đơn / Ngày Tạo</th>
                  <th className="text-uppercase text-muted fw-bold py-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Người Hiến Máu</th>
                  <th className="text-uppercase text-muted fw-bold py-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Chiến dịch đăng ký</th>
                  <th className="text-uppercase text-muted fw-bold py-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Trạng thái</th>
                  <th className="text-uppercase text-muted fw-bold py-3 text-end px-4" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="spinner-border text-danger" role="status"></div>
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="text-muted mb-2">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        </svg>
                      </div>
                      <span className="fw-semibold">Không tìm thấy đơn đăng ký nào</span>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(a => (
                    <tr key={a.appointmentId} style={{ transition: 'all 0.2s' }}>
                      <td className="py-3 px-4">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>#{a.appointmentId}</div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                          {new Date(a.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{a.donorName}</div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                          <span className="me-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>{a.donorPhone}</span>
                          <span className="badge bg-danger rounded-pill px-2">{a.bloodGroup}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-dark fw-semibold" style={{ fontSize: '0.85rem' }}>{a.campaignName}</div>
                        <div className="text-muted mt-1 d-flex gap-2" style={{ fontSize: '0.8rem' }}>
                          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>{new Date(a.appointmentDate).toLocaleDateString('vi-VN')}</span>
                          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>{a.timeSlot}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {getStatusBadge(a.status)}
                      </td>
                      <td className="py-3 text-end px-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <button 
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1 bg-white" 
                            onClick={() => handleOpenViewModal(a)}
                            style={{ fontSize: '0.8rem', fontWeight: 500 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            Xem
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1 bg-white" 
                            onClick={() => handleOpenStatusModal(a)}
                            style={{ fontSize: '0.8rem', fontWeight: 500, borderColor: a.status === 0 ? '#3b82f6' : '#ef4444', color: a.status === 0 ? '#3b82f6' : '#ef4444' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Cập nhật
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && filteredAppointments.length > 0 && (
            <div className="p-3 border-top d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} trong tổng số {filteredAppointments.length} mục
              </span>
              <Pagination 
                currentPage={currentPage}
                totalItems={filteredAppointments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedApp && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg p-3" style={{ borderRadius: '1rem' }}>
              <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Montserrat' }}>Cập nhật Đơn Đăng Ký</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)} style={{ zIndex: 10, cursor: 'pointer' }}></button>
              </div>
              <div className="modal-body pt-3 row g-3">
                <div className="col-12">
                  <div className="p-3 rounded mb-3" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <div className="fw-semibold mb-1">Mã đơn: <span className="text-danger">#{selectedApp.appointmentId}</span></div>
                    <div className="small text-muted">Người hiến: <strong>{selectedApp.donorName}</strong> ({selectedApp.bloodGroup})</div>
                    <div className="small text-muted">Chiến dịch: {selectedApp.campaignName}</div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">CHUYỂN TRẠNG THÁI</label>
                  <select 
                    className="form-select" 
                    value={newStatus} 
                    onChange={e => setNewStatus(Number(e.target.value))}
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.6rem 1rem' }}
                  >
                    <option value={0}>Chờ duyệt</option>
                    <option value={1}>Đã xác nhận</option>
                    <option value={2}>Hoàn thành</option>
                    <option value={3}>Đã hủy</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">GHI CHÚ DÀNH CHO DONOR (TUỲ CHỌN)</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={adminNote} 
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder="Nhập ghi chú hoặc lý do (VD: Hủy do máu không đạt chuẩn)..."
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                  />
                </div>
              </div>
              
              <div className="modal-footer border-0 pt-0 mt-3 d-flex gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold" onClick={() => setShowStatusModal(false)}>Đóng</button>
                <button type="button" className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" onClick={handleUpdateStatus}>
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedApp && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
              
              {/* Header */}
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger" style={{ width: '48px', height: '48px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontFamily: 'Montserrat', fontSize: '1.25rem' }}>Chi Tiết Đơn Đăng Ký</h5>
                    <div className="text-muted small fw-medium mt-1">Mã đơn: <span className="text-danger fw-bold">#{selectedApp.appointmentId}</span></div>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowViewModal(false)} style={{ zIndex: 10, cursor: 'pointer' }}></button>
              </div>

              {/* Body */}
              <div className="modal-body p-4 pt-3">
                <div className="row g-4">
                  {/* Cột trái: Thông tin người hiến */}
                  <div className="col-12 col-md-6">
                    <div className="p-4 rounded-4 h-100" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#374151' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        THÔNG TIN NGƯỜI HIẾN
                      </h6>
                      
                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>HỌ VÀ TÊN</div>
                        <div className="fw-bold text-dark fs-6">{selectedApp.donorName}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-6">
                          <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NHÓM MÁU</div>
                          <div className="fw-bold"><span className="badge bg-danger px-3 py-2 rounded-pill shadow-sm">{selectedApp.bloodGroup}</span></div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>SỐ ĐIỆN THOẠI</div>
                          <div className="fw-bold text-dark">{selectedApp.donorPhone}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>CCCD / CMND</div>
                        <div className="fw-bold text-dark">{selectedApp.donorCitizenId || <span className="text-muted fst-italic fw-normal">Chưa cập nhật</span>}</div>
                      </div>
                      
                      <div>
                        <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>GHI CHÚ ĐĂNG KÝ</div>
                        <div className="fw-medium text-dark">{selectedApp.note || <span className="text-muted fst-italic fw-normal">Không có ghi chú</span>}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Thông tin chiến dịch */}
                  <div className="col-12 col-md-6">
                    <div className="p-4 rounded-4 h-100" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0369A1' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        THÔNG TIN CHIẾN DỊCH
                      </h6>
                      
                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TÊN CHIẾN DỊCH</div>
                        <div className="fw-bold fs-6" style={{ color: '#0369A1' }}>{selectedApp.campaignName}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-6">
                          <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NGÀY HẸN</div>
                          <div className="fw-bold text-dark">{new Date(selectedApp.appointmentDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>KHUNG GIỜ</div>
                          <div className="fw-bold text-dark">{selectedApp.timeSlot}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TRẠNG THÁI</div>
                        <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                      </div>

                      {selectedApp.adminNote && (
                        <div className="p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25 mt-3">
                          <div className="text-warning small fw-bold mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            GHI CHÚ TỪ QUẢN TRỊ
                          </div>
                          <div className="text-dark fw-medium small fst-italic">"{selectedApp.adminNote}"</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-top p-3 px-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#F9FAFB' }}>
                <span className="text-muted small">Tạo lúc: {new Date(selectedApp.createdAt).toLocaleString('vi-VN')}</span>
                <button type="button" className="btn btn-secondary rounded-pill px-5 fw-semibold shadow-sm" onClick={() => setShowViewModal(false)}>Đóng lại</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
