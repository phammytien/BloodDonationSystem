import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Pagination } from '../../components/common/Pagination';

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    switch(status) {
      case 0: return <span className="badge bg-success bg-opacity-10 text-success px-2 py-1">Sẵn sàng</span>;
      case 1: return <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-1">Đã sử dụng</span>;
      case 2: return <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1">Hết hạn</span>;
      default: return null;
    }
  };

  return (
    <div className="fade-in position-relative">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Kho Máu Dự Trữ
          </h4>
          <p className="text-muted small mb-0">
            Quản lý, theo dõi số lượng và hạn sử dụng túi máu
          </p>
        </div>
        <button className="btn btn-danger fw-semibold px-4 rounded-3" onClick={() => setShowAddModal(true)}>
          + Nhập túi máu mới
        </button>
      </div>

      <div className="bg-white rounded-3 shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Mã túi</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Nhóm máu</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Dung tích</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>HSD</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Vị trí lưu trữ</th>
                <th className="py-3 px-4 text-muted fw-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Trạng thái</th>
                <th className="py-3 px-4 text-muted fw-semibold text-end" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Thao tác</th>
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
              ) : inventories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">Kho máu đang trống</td>
                </tr>
              ) : (
                inventories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((inv) => (
                  <tr key={inv.inventoryId}>
                    <td className="px-4 py-3 fw-bold text-dark">#{inv.inventoryId}</td>
                    <td className="px-4 py-3"><span className="badge bg-danger fs-6 px-3">{inv.bloodGroup}</span></td>
                    <td className="px-4 py-3 fw-medium">{inv.quantityML} ML</td>
                    <td className="px-4 py-3 text-muted">{new Date(inv.expiredDate).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 text-dark">{inv.storageLocation}</td>
                    <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-end">
                      {inv.status === 0 && (
                        <select 
                          className="form-select form-select-sm d-inline-block w-auto" 
                          onChange={(e) => handleStatusChange(inv.inventoryId, parseInt(e.target.value))}
                          value={inv.status}
                        >
                          <option value="0">Sẵn sàng</option>
                          <option value="1">Đã sử dụng</option>
                          <option value="2">Hết hạn</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && inventories.length > 0 && (
          <div className="p-3 border-top">
            <Pagination 
              currentPage={currentPage}
              totalItems={inventories.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {showAddModal && ReactDOM.createPortal(
        <>
          <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}></div>
          <div className="modal d-block fade-in" tabIndex={-1} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow-lg">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="fw-bold mb-0" style={{ fontFamily: 'Montserrat' }}>Nhập túi máu mới</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <form onSubmit={handleAddSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted small text-uppercase">Nhóm máu</label>
                      <select 
                        className="form-select"
                        value={newBag.bloodTypeId}
                        onChange={(e) => setNewBag({...newBag, bloodTypeId: e.target.value})}
                        required
                      >
                        {bloodTypes.map(bt => <option key={bt.bloodTypeId} value={bt.bloodTypeId}>{bt.bloodGroup}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted small text-uppercase">Dung tích</label>
                      <select 
                        className="form-select"
                        value={newBag.quantityML}
                        onChange={(e) => setNewBag({...newBag, quantityML: e.target.value})}
                      >
                        <option value="250">250 ML</option>
                        <option value="350">350 ML</option>
                        <option value="450">450 ML</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted small text-uppercase">Ngày hết hạn</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={newBag.expiredDate}
                        onChange={(e) => setNewBag({...newBag, expiredDate: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-muted small text-uppercase">Vị trí lưu trữ</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newBag.storageLocation}
                        onChange={(e) => setNewBag({...newBag, storageLocation: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary py-2 fw-bold rounded-3">Lưu Túi Máu</button>
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
