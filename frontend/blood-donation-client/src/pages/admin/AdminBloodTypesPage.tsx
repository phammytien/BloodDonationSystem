import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Search, RefreshCw, FileDown, Plus, Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { AdminBloodTypeModal } from '../../components/admin/AdminBloodTypeModal';

interface BloodTypeDto {
  bloodTypeId: number;
  bloodGroup: string;
  description?: string;
  status: number;
  createdBy?: string;
  createdAt: string;
}

export const AdminBloodTypesPage: React.FC = () => {
  const { user } = useAuth();
  const [bloodTypes, setBloodTypes] = useState<BloodTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<BloodTypeDto | null>(null);

  const fetchBloodTypes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5028/api/donor/blood-types', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setBloodTypes(res.data);
    } catch (err) {
      toast.error('Không thể tải danh sách nhóm máu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodTypes();
  }, [user]);

  // Handle Save
  const handleSave = async (data: Partial<BloodTypeDto>) => {
    try {
      if (editingType) {
        await axios.put(`http://localhost:5028/api/donor/blood-types/${editingType.bloodTypeId}`, data, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        toast.success('Cập nhật nhóm máu thành công!');
      } else {
        await axios.post('http://localhost:5028/api/donor/blood-types', data, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        toast.success('Thêm nhóm máu thành công!');
      }
      setShowModal(false);
      setEditingType(null);
      fetchBloodTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu nhóm máu.');
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa nhóm máu này?')) return;
    try {
      await axios.delete(`http://localhost:5028/api/donor/blood-types/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Vô hiệu hóa nhóm máu thành công!');
      fetchBloodTypes();
    } catch (err: any) {
      toast.error('Lỗi khi xóa nhóm máu.');
    }
  };

  // Stats
  const activeCount = bloodTypes.filter(bt => bt.status === 0).length;
  const pausedCount = bloodTypes.filter(bt => bt.status === 1).length;
  const deletedCount = bloodTypes.filter(bt => bt.status === 2).length;

  // Filtering
  const filteredTypes = bloodTypes.filter(bt => {
    const matchesSearch = bt.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (bt.description && bt.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter === 'Hoạt động') matchesStatus = bt.status === 0;
    if (statusFilter === 'Tạm ngưng') matchesStatus = bt.status === 1;
    if (statusFilter === 'Đã xóa') matchesStatus = bt.status === 2;

    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
  const paginatedTypes = filteredTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Quản Lý Nhóm Máu
          </h4>
          <p className="text-muted small mb-0">
            Danh mục các nhóm máu hỗ trợ trong hệ thống
          </p>
        </div>
        <button 
          className="btn btn-danger px-4 py-2 text-white shadow-sm d-flex align-items-center gap-2"
          style={{ borderRadius: '10px', fontWeight: 600 }}
          onClick={() => { setEditingType(null); setShowModal(true); }}
        >
          <Plus size={18} />
          Thêm nhóm máu
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {[
          { title: 'Tổng nhóm máu', value: bloodTypes.length, color: '#EF4444', bgColor: '#FEF2F2', icon: '💧' },
          { title: 'Đang hoạt động', value: activeCount, color: '#10B981', bgColor: '#ECFDF5', icon: '✓' },
          { title: 'Tạm ngưng', value: pausedCount, color: '#F59E0B', bgColor: '#FFFBEB', icon: '⏸' },
          { title: 'Đã xóa', value: deletedCount, color: '#6B7280', bgColor: '#F3F4F6', icon: '🗑' }
        ].map((stat, index) => (
          <div key={index} className="col-12 col-sm-6 col-xl-3">
            <div className="bg-white p-3 rounded-4 shadow-sm border d-flex align-items-center gap-3">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: '48px', height: '48px', backgroundColor: stat.bgColor, color: stat.color, fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-muted small mb-0 fw-medium">{stat.title}</p>
                <h4 className="fw-bold mb-0" style={{ color: '#111827' }}>{stat.value}</h4>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Nhóm máu</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white p-3 rounded-4 shadow-sm border mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="d-flex flex-wrap gap-3 flex-grow-1">
          <div className="position-relative" style={{ minWidth: '280px' }}>
            <Search className="position-absolute top-50 translate-middle-y text-muted" size={18} style={{ left: '15px' }} />
            <input 
              type="text" 
              className="form-control bg-light border-0" 
              placeholder="Tìm kiếm mã nhóm máu, tên nhóm máu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '45px', borderRadius: '10px', height: '45px' }}
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Trạng thái</label>
            <select 
              className="form-select bg-light border-0" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ borderRadius: '10px', height: '45px' }}
            >
              <option>Tất cả</option>
              <option>Hoạt động</option>
              <option>Tạm ngưng</option>
              <option>Đã xóa</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button className="btn btn-light px-4 py-2 fw-medium border" onClick={fetchBloodTypes} style={{ borderRadius: '10px', color: '#4B5563' }}>
            <RefreshCw size={18} className="me-2" /> Làm mới
          </button>
          <button className="btn btn-outline-success px-4 py-2 fw-medium" style={{ borderRadius: '10px' }}>
            <FileDown size={18} className="me-2" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-muted" style={{ fontSize: '0.8rem' }}>
              <tr>
                <th className="fw-semibold px-4 py-3 border-bottom-0">NHÓM MÁU ↕</th>
                <th className="fw-semibold px-4 py-3 border-bottom-0">MÃ NHÓM MÁU ↕</th>
                <th className="fw-semibold px-4 py-3 border-bottom-0">MÔ TẢ ↕</th>
                <th className="fw-semibold px-4 py-3 border-bottom-0 text-center">TRẠNG THÁI ↕</th>
                <th className="fw-semibold px-4 py-3 border-bottom-0">NGƯỜI TẠO ↕</th>
                <th className="fw-semibold px-4 py-3 border-bottom-0">NGÀY TẠO ↕</th>
                <th className="fw-semibold px-4 py-3 border-bottom-0 text-center">THAO TÁC ↕</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    Không tìm thấy dữ liệu.
                  </td>
                </tr>
              ) : (
                paginatedTypes.map((bt) => (
                  <tr key={bt.bloodTypeId}>
                    <td className="px-4 py-3">
                      <div 
                        className="d-flex align-items-center justify-content-center bg-danger text-white rounded-circle fw-bold"
                        style={{ width: '40px', height: '40px' }}
                      >
                        {bt.bloodGroup}
                      </div>
                    </td>
                    <td className="px-4 py-3 fw-medium" style={{ color: '#111827' }}>
                      BT-{bt.bloodTypeId.toString().padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {bt.description || `Nhóm máu ${bt.bloodGroup}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bt.status === 0 && <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">Hoạt động</span>}
                      {bt.status === 1 && <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill">Tạm ngưng</span>}
                      {bt.status === 2 && <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill">Đã xóa</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{bt.createdBy || 'admin'}</td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(bt.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="d-flex gap-2 justify-content-center">
                        <button 
                          className="btn btn-light btn-sm text-primary rounded-circle" 
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={() => { setEditingType(bt); setShowModal(true); }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-light btn-sm text-danger rounded-circle" 
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={() => handleDelete(bt.bloodTypeId)}
                          disabled={bt.status === 2}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Details */}
        <div className="d-flex align-items-center justify-content-between p-3 border-top text-muted small">
          <div>
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTypes.length)} trong tổng số {filteredTypes.length} mục
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span>Hiển thị</span>
              <select 
                className="form-select form-select-sm border-0 bg-light" 
                style={{ width: '100px', borderRadius: '8px' }}
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>
            <div className="d-flex gap-1">
              <button 
                className="btn btn-light btn-sm border" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn btn-sm ${currentPage === page ? 'btn-danger text-white' : 'btn-light border'}`}
                  onClick={() => setCurrentPage(page)}
                  style={{ width: '32px' }}
                >
                  {page}
                </button>
              ))}
              <button 
                className="btn btn-light btn-sm border"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdminBloodTypeModal 
        show={showModal}
        onClose={() => { setShowModal(false); setEditingType(null); }}
        onSave={handleSave}
        editingType={editingType}
      />
    </div>
  );
};
