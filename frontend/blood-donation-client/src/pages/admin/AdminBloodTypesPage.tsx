
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

export const AdminBloodTypesPage: React.FC = () => {
  const { user } = useAuth();
  const [bloodTypes, setBloodTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBloodTypes = async () => {
      if (!user) return;
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
    fetchBloodTypes();
  }, [user]);

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
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          bloodTypes.map((bt) => (
            <div key={bt.bloodTypeId} className="col-12 col-sm-6 col-md-4 col-xl-3">
              <div className="bg-white rounded-4 p-4 shadow-sm h-100 text-center" style={{ border: '1px solid #E5E7EB', position: 'relative', overflow: 'hidden' }}>
                <div 
                  style={{
                    position: 'absolute', top: '-20px', right: '-20px', 
                    width: '80px', height: '80px', borderRadius: '50%', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }} 
                />
                <div 
                  className="mx-auto d-flex align-items-center justify-content-center bg-danger text-white rounded-circle mb-3 shadow-sm"
                  style={{ width: '70px', height: '70px', fontSize: '1.8rem', fontWeight: 800 }}
                >
                  {bt.bloodGroup}
                </div>
                <h5 className="fw-bold text-dark mb-1">Nhóm máu {bt.bloodGroup}</h5>
                <p className="text-muted small mb-3">Mã HT: BT-{bt.bloodTypeId.toString().padStart(3, '0')}</p>
                <div className="d-flex justify-content-center gap-2">
                  <span className="badge bg-light text-dark px-3 py-2 border rounded-pill">Tiêu chuẩn</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
