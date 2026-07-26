import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Database, ShieldCheck, Calendar, FileText, Search, Filter, RefreshCw, Download, RotateCcw, MoreVertical, CheckCircle2, FileArchive, Info, Lightbulb, CloudUpload } from 'lucide-react';

interface BackupFile {
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchBackups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5028/api/system/backups', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setBackups(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách bản sao lưu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [user]);

  const handleManualBackup = async () => {
    if (!user) return;
    setBackingUp(true);
    try {
      const res = await axios.post('http://localhost:5028/api/system/backups/create', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(res.data.message || 'Đã tạo bản sao lưu thành công');
      fetchBackups();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tạo sao lưu thủ công');
    } finally {
      setBackingUp(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5028/api/system/backups/download/${fileName}`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải file sao lưu');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredBackups = useMemo(() => {
    return backups.filter(b => 
      b.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [backups, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBackups.slice(start, start + itemsPerPage);
  }, [filteredBackups, currentPage, itemsPerPage]);

  // Derived stats from real data
  const totalSize = useMemo(() => backups.reduce((acc, curr) => acc + curr.fileSize, 0), [backups]);
  const totalSizeFormatted = formatSize(totalSize);
  const totalCapacity = 50 * 1024 * 1024 * 1024; // 50 GB limit
  const usagePercentage = Math.min((totalSize / totalCapacity) * 100, 100).toFixed(1);

  const lastBackup = useMemo(() => {
    if (backups.length === 0) return null;
    return [...backups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [backups]);

  const lastBackupDateStr = lastBackup ? new Date(lastBackup.createdAt).toLocaleDateString('vi-VN') : '—';
  const lastBackupTimeStr = lastBackup ? new Date(lastBackup.createdAt).toLocaleTimeString('vi-VN', { hour12: true, hour: '2-digit', minute: '2-digit' }).replace(/ AM| PM/i, match => match.toUpperCase()) : '—';

  const nextBackupStr = useMemo(() => {
    const next = new Date();
    if (next.getHours() >= 8) {
      next.setDate(next.getDate() + 1);
    }
    next.setHours(8, 0, 0, 0);
    return next.toLocaleDateString('vi-VN');
  }, []);

  return (
    <div className="fade-in pb-4">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="fw-bold mb-2" style={{ fontFamily: 'Montserrat', color: '#111827' }}>
            Cài đặt hệ thống
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            Quản lý hệ thống và sao lưu dữ liệu an toàn.
          </p>
        </div>
        <button 
          className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 fw-medium rounded-3 shadow-sm"
          style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
          onClick={handleManualBackup}
          disabled={backingUp}
        >
          {backingUp ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            <Download size={18} />
          )}
          <span>{backingUp ? 'Đang sao lưu...' : 'Sao lưu dữ liệu ngay'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                <Database size={28} />
              </div>
              <div className="w-100">
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dung lượng sử dụng</div>
                <div className="fw-bold mb-1" style={{ fontSize: '1.4rem', color: '#111827' }}>{totalSizeFormatted}</div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Trên tổng 50 GB ({usagePercentage}%)</div>
                </div>
                <div className="progress" style={{ height: 4 }}>
                  <div className="progress-bar" role="progressbar" style={{ width: `${usagePercentage}%`, backgroundColor: '#9333EA' }} aria-valuenow={Number(usagePercentage)} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#E0F2FE', color: '#3B82F6' }}>
                <ShieldCheck size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bản sao lưu cuối cùng</div>
                <div className="fw-bold mb-1" style={{ fontSize: '1.4rem', color: '#111827' }}>{lastBackupDateStr}</div>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{lastBackupTimeStr}</span>
                  {lastBackup && <span className="badge rounded-pill" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.7rem', fontWeight: 600 }}>Thành công</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#DCFCE7', color: '#22C55E' }}>
                <Calendar size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lần sao lưu tiếp theo</div>
                <div className="fw-bold mb-1" style={{ fontSize: '1.4rem', color: '#111827' }}>{nextBackupStr}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>08:00 AM (Tự động)</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <FileText size={28} />
              </div>
              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tổng bản sao lưu</div>
                <div className="fw-bold mb-1" style={{ fontSize: '1.4rem', color: '#111827' }}>{backups.length}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Bản sao lưu</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4" style={{ border: '1px solid #F3F4F6' }}>
        {/* Filters */}
        <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <FileArchive size={20} className="text-muted" />
            <h6 className="mb-0 fw-bold" style={{ color: '#111827', fontSize: '1rem' }}>Danh sách bản sao lưu dữ liệu</h6>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative" style={{ width: '300px' }}>
              <Search className="position-absolute text-muted" size={16} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-control ps-5 bg-light border-0 rounded-pill" 
                placeholder="Tìm kiếm theo tên file, thời gian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ height: '38px', fontSize: '0.85rem' }}
              />
            </div>
            
            <button className="btn btn-light border d-flex align-items-center gap-2 rounded-3 px-3" style={{ height: '38px' }}>
              <Filter size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Bộ lọc</span>
            </button>
            <button className="btn btn-light border d-flex align-items-center justify-content-center rounded-3" style={{ height: '38px', width: '38px' }} onClick={fetchBackups}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table align-middle mb-0 custom-table">
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TÊN FILE</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>THỜI GIAN TẠO</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>DUNG LƯỢNG</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>LOẠI SAO LƯU</th>
                <th className="py-3 px-4 text-muted fw-semibold border-0 text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TRẠNG THÁI</th>
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
                  <td colSpan={6} className="text-center py-5 text-muted">Không tìm thấy bản sao lưu nào.</td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const globalIndex = filteredBackups.length - ((currentPage - 1) * itemsPerPage + index);
                  const mockId = `BKP-${String(globalIndex).padStart(5, '0')}`;
                  const isManual = item.fileName.includes('manual') || index % 3 === 2; // Giả lập Loại
                  
                  return (
                    <tr key={index} className="border-bottom">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-2 d-flex align-items-center justify-content-center text-white flex-shrink-0" style={{ width: 36, height: 36, backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                            <div className="fw-bold" style={{ fontSize: '0.65rem', backgroundColor: '#EF4444', padding: '1px 4px', borderRadius: '4px', position: 'absolute', bottom: '6px' }}>ZIP</div>
                            <FileArchive size={20} color="#9333EA" style={{ position: 'relative', top: '-4px' }}/>
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ color: '#374151', fontSize: '0.9rem' }}>{item.fileName}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>ID: {mockId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                        {new Date(item.createdAt).toLocaleString('vi-VN', { hour12: true, dateStyle: 'short', timeStyle: 'short' }).replace(/ AM| PM/i, match => match.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                        {formatSize(item.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                        {isManual ? 'Thủ công' : 'Tự động'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge rounded-pill" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
                           <CheckCircle2 size={12} className="me-1 d-inline" />Thành công
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button 
                            className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3 text-primary" 
                            style={{ width: 32, height: 32 }}
                            onClick={() => handleDownload(item.fileName)}
                          >
                            <Download size={14} />
                          </button>
                          <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3 text-primary" style={{ width: 32, height: 32 }}>
                            <RotateCcw size={14} />
                          </button>
                          <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center rounded-3" style={{ width: 32, height: 32 }}>
                            <MoreVertical size={14} className="text-muted" />
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
              Hiển thị {(currentPage - 1) * itemsPerPage + (filteredBackups.length > 0 ? 1 : 0)} - {Math.min(currentPage * itemsPerPage, filteredBackups.length)} trong tổng số {filteredBackups.length} bản sao lưu
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <select 
                  className="form-select form-select-sm border" 
                  style={{ width: '100px', height: '36px', borderRadius: '8px', fontSize: '0.85rem' }}
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
                {Array.from({ length: Math.max(1, Math.ceil(filteredBackups.length / itemsPerPage)) }, (_, i) => i + 1).map(page => (
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
                  disabled={currentPage === Math.ceil(filteredBackups.length / itemsPerPage) || filteredBackups.length === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1E3A8A' }}>
              <Info size={18} />
              Thông tin sao lưu
            </h6>
            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
              <li className="d-flex gap-2">
                <CheckCircle2 size={16} className="text-success mt-1 flex-shrink-0" />
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Dữ liệu của bạn được sao lưu tự động hàng ngày vào 08:00 AM.</span>
              </li>
              <li className="d-flex gap-2">
                <CheckCircle2 size={16} className="text-success mt-1 flex-shrink-0" />
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Bản sao lưu được lưu trữ trong 7 ngày gần nhất.</span>
              </li>
              <li className="d-flex gap-2">
                <CheckCircle2 size={16} className="text-success mt-1 flex-shrink-0" />
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Vui lòng tải về và lưu trữ bản sao lưu quan trọng ở nơi an toàn.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4 position-relative overflow-hidden">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#B45309' }}>
              <Lightbulb size={18} />
              Gợi ý
            </h6>
            <ul className="mb-0 d-flex flex-column gap-2 ps-3 position-relative z-1" style={{ color: '#4B5563', fontSize: '0.9rem' }}>
              <li>Sao lưu dữ liệu định kỳ giúp bảo vệ thông tin quan trọng.</li>
              <li>Bạn có thể khôi phục dữ liệu từ bất kỳ bản sao lưu nào.</li>
              <li>Liên hệ quản trị viên nếu cần hỗ trợ khôi phục dữ liệu.</li>
            </ul>
            <div className="position-absolute" style={{ right: '-20px', bottom: '-20px', opacity: 0.1, zIndex: 0 }}>
              <CloudUpload size={140} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
