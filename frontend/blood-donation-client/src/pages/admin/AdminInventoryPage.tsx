import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Droplet, Search, Filter, RefreshCw, Plus, Package, CheckCircle2, AlertTriangle, XCircle, Activity, Thermometer, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

export const AdminInventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [bloodTypes, setBloodTypes] = useState<any[]>([]);
  const [newBag, setNewBag] = useState({
    bloodTypeId: '',
    quantityML: '250',
    expiredDate: '',
    storageLocation: 'Kho Tổng'
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchInventories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5028/api/inventory/admin/list', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setInventories(res.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu kho máu');
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodTypes = async () => {
    try {
      const res = await axios.get('http://localhost:5028/api/donor/blood-types', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setBloodTypes(res.data);
      if (res.data.length > 0) {
        setNewBag(prev => ({ ...prev, bloodTypeId: res.data[0].bloodTypeId.toString() }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventories();
    fetchBloodTypes();
  }, [user]);

  const handleStatusChange = async (id: number, newStatus: number) => {
    try {
      await axios.put(`http://localhost:5028/api/inventory/admin/status/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Cập nhật trạng thái thành công');
      fetchInventories();
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5028/api/inventory/admin/add', {
        bloodTypeId: parseInt(newBag.bloodTypeId),
        quantityML: parseInt(newBag.quantityML),
        expiredDate: new Date(newBag.expiredDate).toISOString(),
        storageLocation: newBag.storageLocation
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Thêm túi máu thành công');
      setShowAddModal(false);
      fetchInventories();
    } catch (err) {
      toast.error('Không thể thêm túi máu');
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <span className="badge rounded-pill" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '6px 12px', fontWeight: 600 }}><CheckCircle2 size={12} className="me-1 d-inline" /> Sẵn sàng</span>;
      case 1: return <span className="badge rounded-pill" style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '6px 12px', fontWeight: 600 }}><AlertTriangle size={12} className="me-1 d-inline" /> Đã sử dụng</span>;
      case 2: return <span className="badge rounded-pill" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '6px 12px', fontWeight: 600 }}><XCircle size={12} className="me-1 d-inline" /> Hết hạn</span>;
      default: return null;
    }
  };

  const filteredInventories = useMemo(() => {
    return inventories.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.inventoryId.toString().includes(searchTerm) || 
        (item.storageLocation && item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchBg = bloodGroupFilter === 'Tất cả' || item.bloodGroup === bloodGroupFilter;
      
      let matchStatus = true;
      if (statusFilter === 'Sẵn sàng') matchStatus = item.status === 0;
      if (statusFilter === 'Đã sử dụng') matchStatus = item.status === 1;
      if (statusFilter === 'Hết hạn') matchStatus = item.status === 2;

      return matchSearch && matchBg && matchStatus;
    }).sort((a, b) => b.inventoryId - a.inventoryId);
  }, [inventories, searchTerm, bloodGroupFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bloodGroupFilter, statusFilter]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventories.slice(start, start + itemsPerPage);
  }, [filteredInventories, currentPage, itemsPerPage]);

  const uniqueBloodGroups = useMemo(() => {
    return Array.from(new Set(inventories.map(i => i.bloodGroup))).filter(Boolean).sort();
  }, [inventories]);

  // Stats
  const totalBags = inventories.length;
  const readyBags = inventories.filter(i => i.status === 0).length;
  const usedBags = inventories.filter(i => i.status === 1).length;
  const expiredBags = inventories.filter(i => i.status === 2).length;

  const resetFilters = () => {
    setSearchTerm('');
    setBloodGroupFilter('Tất cả');
    setStatusFilter('Tất cả');
  };

  return (
    <div className="fade-in pb-4">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="fw-bold mb-2" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Kho Máu Dự Trữ
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            Quản lý, theo dõi số lượng và hạn sử dụng túi máu.
          </p>
        </div>
        <button 
          className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 fw-medium rounded-3 shadow-sm"
          style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={18} />
          <span>Nhập túi máu mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#E0F2FE', color: '#3B82F6' }}>
                <Package size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tổng số túi máu</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{totalBags}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sẵn sàng sử dụng</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{readyBags}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <Activity size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Đã sử dụng</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{usedBags}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Đã hết hạn</div>
                <div className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111827' }}>{expiredBags}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4" style={{ border: '1px solid #F3F4F6' }}>
        {/* Filters */}
        <div className="p-3 border-bottom bg-white d-flex flex-wrap gap-3 align-items-center">
          <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
            <Search className="position-absolute text-muted" size={18} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control ps-5 bg-light border-0" 
              placeholder="Tìm kiếm theo mã túi, vị trí lưu trữ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '42px', borderRadius: '8px', fontSize: '0.9rem' }}
            />
          </div>
          
          <div style={{ width: '150px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nhóm máu</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={bloodGroupFilter} onChange={e => setBloodGroupFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              {uniqueBloodGroups.map(bg => <option key={bg} value={bg as string}>{bg}</option>)}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <label className="text-muted small mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Trạng thái</label>
            <select className="form-select border-0 bg-light" style={{ height: '42px', borderRadius: '8px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              <option value="Sẵn sàng">Sẵn sàng</option>
              <option value="Đã sử dụng">Đã sử dụng</option>
              <option value="Hết hạn">Hết hạn</option>
            </select>
          </div>

          <div className="ms-auto mt-4 d-flex gap-2">
            <button className="btn btn-light border d-flex align-items-center justify-content-center" style={{ height: '42px', width: '42px', borderRadius: '8px' }} onClick={resetFilters} title="Làm mới bộ lọc">
              <Filter size={18} />
            </button>
            <button className="btn btn-light border d-flex align-items-center gap-2" style={{ height: '42px', borderRadius: '8px' }} onClick={fetchInventories}>
              <RefreshCw size={16} />
              <span>Tải lại</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table align-middle mb-0 custom-table">
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>MÃ TÚI</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>NHÓM MÁU</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>DUNG TÍCH</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>HẠN SỬ DỤNG</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>VỊ TRÍ LƯU TRỮ</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0 text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TRẠNG THÁI</th>
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
                  <td colSpan={7} className="text-center py-5 text-muted">Không tìm thấy túi máu nào.</td>
                </tr>
              ) : (
                currentItems.map((inv) => (
                  <tr key={inv.inventoryId} className="border-bottom">
                    <td className="px-4 py-3 fw-bold" style={{ color: '#111827' }}>#{inv.inventoryId}</td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 32, height: 32, backgroundColor: '#DC2626', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          <Droplet size={14} style={{ position: 'absolute', opacity: 0.2 }} />
                          {inv.bloodGroup}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 fw-medium text-dark">{inv.quantityML} ML</td>
                    <td className="px-4 py-3 text-muted" style={{ fontSize: '0.9rem' }}>
                      <div className="d-flex align-items-center gap-2">
                        <Calendar size={14} />
                        {new Date(inv.expiredDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.9rem' }}>
                        <Thermometer size={14} />
                        {inv.storageLocation}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-center">
                      {inv.status === 0 ? (
                        <select
                          className="form-select form-select-sm d-inline-block border-0 bg-light text-center"
                          style={{ width: '130px', borderRadius: '8px', fontWeight: 500, color: '#374151' }}
                          onChange={(e) => handleStatusChange(inv.inventoryId, parseInt(e.target.value))}
                          value={inv.status}
                        >
                          <option value="0">Sẵn sàng</option>
                          <option value="1">Đã sử dụng</option>
                          <option value="2">Hết hạn</option>
                        </select>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Pagination */}
        {!loading && (
          <div className="p-4 border-top d-flex justify-content-between align-items-center bg-white flex-wrap gap-3">
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + (filteredInventories.length > 0 ? 1 : 0)} - {Math.min(currentPage * itemsPerPage, filteredInventories.length)} trong tổng số {filteredInventories.length} mục
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
                {Array.from({ length: Math.max(1, Math.ceil(filteredInventories.length / itemsPerPage)) }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    className={`btn border d-flex align-items-center justify-content-center fw-medium ${currentPage === page ? 'btn-danger text-white' : 'btn-white text-dark'}`}
                    style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: currentPage === page ? '#DC2626' : '#FFF', borderColor: currentPage === page ? '#DC2626' : '#DEE2E6' }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="btn btn-light border d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, borderRadius: '8px' }}
                  disabled={currentPage === Math.ceil(filteredInventories.length / itemsPerPage) || filteredInventories.length === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal && ReactDOM.createPortal(
        <>
          <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}></div>
          <div className="modal d-block fade-in" tabIndex={-1} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow-lg">
                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
                    <Plus size={20} className="me-2 text-danger" />
                    Nhập túi máu mới
                  </h5>
                  <button type="button" className="btn-close shadow-none" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <form onSubmit={handleAddSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted small text-uppercase mb-1">Nhóm máu</label>
                      <select
                        className="form-select bg-light border-0"
                        style={{ height: '42px', borderRadius: '8px' }}
                        value={newBag.bloodTypeId}
                        onChange={(e) => setNewBag({ ...newBag, bloodTypeId: e.target.value })}
                        required
                      >
                        {bloodTypes.map(bt => <option key={bt.bloodTypeId} value={bt.bloodTypeId}>{bt.bloodGroup}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted small text-uppercase mb-1">Dung tích</label>
                      <select
                        className="form-select bg-light border-0"
                        style={{ height: '42px', borderRadius: '8px' }}
                        value={newBag.quantityML}
                        onChange={(e) => setNewBag({ ...newBag, quantityML: e.target.value })}
                      >
                        <option value="250">250 ML</option>
                        <option value="350">350 ML</option>
                        <option value="450">450 ML</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted small text-uppercase mb-1">Ngày hết hạn</label>
                      <input
                        type="date"
                        className="form-control bg-light border-0"
                        style={{ height: '42px', borderRadius: '8px' }}
                        value={newBag.expiredDate}
                        onChange={(e) => setNewBag({ ...newBag, expiredDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-muted small text-uppercase mb-1">Vị trí lưu trữ</label>
                      <input
                        type="text"
                        className="form-control bg-light border-0"
                        style={{ height: '42px', borderRadius: '8px' }}
                        value={newBag.storageLocation}
                        onChange={(e) => setNewBag({ ...newBag, storageLocation: e.target.value })}
                        placeholder="VD: Kho lạnh A - Tầng 2"
                        required
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-light flex-grow-1 py-2 fw-medium rounded-3" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                      <button type="submit" className="btn btn-danger flex-grow-1 py-2 fw-medium rounded-3">Lưu Túi Máu</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>, document.body
      )}
    </div>
  );
};
