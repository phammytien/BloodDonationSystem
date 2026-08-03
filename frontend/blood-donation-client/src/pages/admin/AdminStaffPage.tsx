import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import type { StaffDto } from '../../types/staff';
import { AdminStaffModal } from '../../components/admin/AdminStaffModal';
import { Search, Plus, UserX, UserCheck, Trash2, Edit2, Eye } from 'lucide-react';

export const AdminStaffPage: React.FC = () => {
  const { user } = useAuth();
  const [staffs, setStaffs] = useState<StaffDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedStaff, setSelectedStaff] = useState<StaffDto | null>(null);

  const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 6) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-3);
  };

  const fetchStaffs = async () => {
    if (!user || user.roleName !== 'Admin') return;
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5028/api/staff', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStaffs(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Không thể tải danh sách nhân viên',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, [user]);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedStaff(null);
    setShowModal(true);
  };

  const handleEdit = (staff: StaffDto) => {
    setModalMode('edit');
    setSelectedStaff(staff);
    setShowModal(true);
  };

  const handleView = (staff: StaffDto) => {
    setModalMode('view');
    setSelectedStaff(staff);
    setShowModal(true);
  };

  const handleSubmit = async (formData: Partial<StaffDto>) => {
    try {
      if (modalMode === 'create') {
        await axios.post('http://localhost:5028/api/staff', formData, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Thêm nhân viên thành công', showConfirmButton: false, timer: 3000 });
      } else {
        await axios.put(`http://localhost:5028/api/staff/${selectedStaff?.userId}`, formData, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cập nhật thành công', showConfirmButton: false, timer: 3000 });
      }
      fetchStaffs();
    } catch (err: any) {
      console.error(err);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err.response?.data || 'Đã có lỗi xảy ra', showConfirmButton: false, timer: 3000 });
      throw err;
    }
  };

  const handleToggleStatus = async (staff: StaffDto) => {
    const actionText = staff.isActive ? 'Khóa' : 'Mở khóa';
    const result = await Swal.fire({
      title: `${actionText} tài khoản?`,
      text: `Bạn có chắc muốn ${actionText.toLowerCase()} tài khoản nhân viên ${staff.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: staff.isActive ? '#d33' : '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Đồng ý ${actionText.toLowerCase()}`,
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:5028/api/staff/${staff.userId}/toggle-status`, {}, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Thay đổi trạng thái thành công', showConfirmButton: false, timer: 3000 });
        fetchStaffs();
      } catch (err) {
        console.error(err);
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Lỗi khi thay đổi trạng thái', showConfirmButton: false, timer: 3000 });
      }
    }
  };

  const handleDelete = async (staff: StaffDto) => {
    const result = await Swal.fire({
      title: 'Xóa tài khoản?',
      text: `Bạn có chắc muốn xóa nhân viên ${staff.username}? Hành động này không thể hoàn tác.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5028/api/staff/${staff.userId}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Xóa nhân viên thành công', showConfirmButton: false, timer: 3000 });
        fetchStaffs();
      } catch (err) {
        console.error(err);
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Không thể xóa nhân viên này', showConfirmButton: false, timer: 3000 });
      }
    }
  };

  // Filter Data
  const filteredStaffs = staffs.filter(s => {
    const matchSearch = s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.fullName && s.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (s.phone && s.phone.includes(searchTerm));
    
    let matchStatus = true;
    if (filterStatus === 'active') matchStatus = s.isActive;
    if (filterStatus === 'inactive') matchStatus = !s.isActive;

    return matchSearch && matchStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStaffs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaffs.slice(indexOfFirstItem, indexOfLastItem);

  const activeStaffs = staffs.filter(s => s.isActive).length;
  const inactiveStaffs = staffs.length - activeStaffs;

  return (
    <>
      <div className="container-fluid fade-in py-2" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#111827', margin: 0 }}>Nhân Viên Y Tế</h3>
            <p className="text-muted small mt-1 mb-0">Quản lý tài khoản nhân viên hệ thống LifeGive.</p>
          </div>
          <button 
            onClick={handleCreate}
            className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm rounded-3"
            style={{ backgroundColor: '#D42B2B', border: 'none' }}
          >
            <Plus size={18} /> Thêm nhân viên mới
          </button>
        </div>

        {/* Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div>
                  <div className="text-muted small fw-semibold">Tổng số nhân viên</div>
                  <h3 className="mb-0 fw-bold">{staffs.length}</h3>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#D1FAE5', color: '#059669' }}>
                  <UserCheck size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold">Đang hoạt động</div>
                  <h3 className="mb-0 fw-bold">{activeStaffs}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                  <UserX size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold">Bị khóa</div>
                  <h3 className="mb-0 fw-bold">{inactiveStaffs}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card border-0 bg-white" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', borderRadius: '1rem' }}>
          <div className="d-flex flex-wrap gap-3 align-items-center p-4 border-bottom">
            <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
              <span className="position-absolute" style={{ top: '50%', left: '15px', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control bg-light border-0 rounded-3 ps-5 py-2"
                placeholder="Tìm kiếm nhân viên theo tên, email, sđt..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-select bg-light border-0 rounded-3 px-3 py-2"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã bị khóa</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '900px' }}>
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th className="text-uppercase text-muted fw-bold py-3 px-4" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Nhân viên</th>
                  <th className="text-uppercase text-muted fw-bold py-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Liên hệ</th>
                  <th className="text-uppercase text-muted fw-bold py-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Ngày tạo</th>
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
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="text-muted mb-2"><UserX size={48} strokeWidth={1} /></div>
                      <span className="fw-semibold">Không tìm thấy nhân viên nào</span>
                    </td>
                  </tr>
                ) : (
                  currentItems.map(s => (
                    <tr key={s.userId} style={{ transition: 'all 0.2s' }}>
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center rounded-circle bg-light text-primary fw-bold" style={{ width: '40px', height: '40px' }}>
                            {s.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{s.fullName || s.username}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>@{s.username} | ID: #{s.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-dark" style={{ fontSize: '0.9rem' }}>{s.email}</div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>{s.phone ? maskPhone(s.phone) : 'Chưa cập nhật'}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-dark" style={{ fontSize: '0.9rem' }}>
                          {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-3">
                        {s.isActive ? (
                          <span className="badge rounded-pill" style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.5em 0.8em', fontWeight: 600 }}>
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="badge rounded-pill" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.5em 0.8em', fontWeight: 600 }}>
                            Bị khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            onClick={() => handleView(s)}
                            className="btn btn-sm btn-light border-0 text-info d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(s)}
                            className="btn btn-sm btn-light border-0 text-primary d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            title="Sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center ${s.isActive ? 'text-warning' : 'text-success'}`}
                            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            title={s.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {s.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="btn btn-sm btn-light border-0 text-danger d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && filteredStaffs.length > 0 && (
            <div className="d-flex justify-content-between align-items-center p-4 border-top">
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted small fw-medium">
                  Đang xem {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStaffs.length)} trong số {filteredStaffs.length}
                </span>
                <select
                  className="form-select form-select-sm border-0 bg-light"
                  style={{ width: '70px', cursor: 'pointer' }}
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-light text-secondary border-0"
                  style={{ width: '36px', height: '36px', borderRadius: '8px', fontWeight: 600 }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm border-0 ${currentPage === i + 1 ? 'btn-danger' : 'btn-light text-secondary'}`}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', fontWeight: 600, backgroundColor: currentPage === i + 1 ? '#D42B2B' : '' }}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-light text-secondary border-0"
                  style={{ width: '36px', height: '36px', borderRadius: '8px', fontWeight: 600 }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminStaffModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmit}
        initialData={selectedStaff}
        mode={modalMode}
      />
    </>
  );
};
