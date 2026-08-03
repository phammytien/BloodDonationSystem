import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';

interface BloodTypeDto {
  bloodTypeId: number;
  bloodGroup: string;
  description?: string;
  status: number;
}

interface AdminBloodTypeModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (data: Partial<BloodTypeDto>) => void;
  editingType: BloodTypeDto | null;
}

export const AdminBloodTypeModal: React.FC<AdminBloodTypeModalProps> = ({ show, onClose, onSave, editingType }) => {
  const [formData, setFormData] = useState<Partial<BloodTypeDto>>({
    bloodGroup: '',
    description: '',
    status: 0
  });

  useEffect(() => {
    if (editingType) {
      setFormData(editingType);
    } else {
      setFormData({ bloodGroup: '', description: '', status: 0 });
    }
  }, [editingType, show]);

  if (!show) return null;

  return createPortal(
    <>
      <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold" style={{ color: '#111827', fontFamily: 'Montserrat' }}>
                {editingType ? 'Chỉnh sửa nhóm máu' : 'Thêm nhóm máu mới'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            
            <div className="modal-body py-4">
              <div className="mb-3">
                <label className="form-label text-muted small fw-medium">Tên nhóm máu *</label>
                <input 
                  type="text" 
                  className="form-control form-control-lg bg-light" 
                  placeholder="VD: A+, O-"
                  value={formData.bloodGroup || ''}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  style={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '0.95rem' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-medium">Mô tả</label>
                <textarea 
                  className="form-control form-control-lg bg-light" 
                  placeholder="Nhóm máu..."
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '0.95rem' }}
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-medium">Trạng thái</label>
                <select 
                  className="form-select form-select-lg bg-light"
                  value={formData.status || 0}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  style={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '0.95rem' }}
                >
                  <option value={0}>Hoạt động</option>
                  <option value={1}>Tạm ngưng</option>
                  <option value={2}>Đã xóa</option>
                </select>
              </div>
            </div>

            <div className="modal-footer border-top-0 pt-0 pb-4 px-4 d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-light px-4 py-2" 
                onClick={onClose}
                style={{ borderRadius: '10px', fontWeight: 600, color: '#4B5563' }}
              >
                <X size={18} className="me-2" />
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-danger px-4 py-2 text-white"
                onClick={() => onSave(formData)}
                style={{ borderRadius: '10px', fontWeight: 600 }}
              >
                <Save size={18} className="me-2" />
                Lưu Nhóm Máu
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
