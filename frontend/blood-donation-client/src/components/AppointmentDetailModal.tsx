import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface AppointmentDetail {
  appointmentId: number;
  campaignName: string;
  location: string;
  organizer: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  note: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  healthCheck: {
    bloodPressure: string;
    pulse: number;
    temperature: number;
    weight: number;
    hemoglobin: number;
    eligible: boolean;
    doctorName: string;
    checkDate: string;
  } | null;
  bloodDonation: {
    volumeML: number;
    bloodGroup: string;
    staffName: string;
    donationDate: string;
  } | null;
}

const getStatusBadge = (statusStr: string | null) => {
  if (!statusStr) return <span className="badge bg-light text-dark px-2 py-1 rounded-pill">Chờ duyệt</span>;
  switch (statusStr.toLowerCase()) {
    case 'pending': return <span className="badge bg-warning text-dark px-2 py-1 rounded-pill">Chờ duyệt</span>;
    case 'confirmed': return <span className="badge bg-info text-white px-2 py-1 rounded-pill">Đã xác nhận</span>;
    case 'completed': return <span className="badge bg-success text-white px-2 py-1 rounded-pill">Đã hoàn thành</span>;
    case 'cancelled': return <span className="badge bg-secondary text-white px-2 py-1 rounded-pill">Đã hủy</span>;
    case 'absent': return <span className="badge bg-danger text-white px-2 py-1 rounded-pill">Vắng mặt</span>;
    default: return <span className="badge bg-light text-dark px-2 py-1 rounded-pill">{statusStr}</span>;
  }
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
};

const formatDateTime = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
};

interface Props {
  appointmentId: number | null;
  show: boolean;
  onHide: () => void;
}

export const AppointmentDetailModal: React.FC<Props> = ({ appointmentId, show, onHide }) => {
  const { user } = useAuth();
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && appointmentId && user) {
      setLoading(true);
      axios.get(`http://localhost:5028/api/appointment/history/${appointmentId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
        .then(res => setDetail(res.data))
        .catch(err => {
          console.error(err);
          if (err.response?.status === 404) {
            toast.error('Không tìm thấy hồ sơ đăng ký.');
          } else if (err.response?.status === 401) {
            toast.error('Phiên đăng nhập hết hạn.');
          } else {
            toast.error('Lỗi khi tải chi tiết hồ sơ.');
          }
          onHide();
        })
        .finally(() => setLoading(false));
    }
  }, [show, appointmentId, user, onHide]);

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
      <div className="modal fade show d-block" tabIndex={-1} onClick={onHide}>
        <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
          <div className="modal-content border-0 rounded-4 shadow" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* MODAL HEADER */}
            <div className="modal-header border-bottom-0 pb-0 pt-4 px-4 px-md-5 d-flex align-items-start">
              <div>
                <h4 className="modal-title fw-bold" style={{ color: '#111827' }}>
                  Chi tiết Đăng ký Hiến máu
                </h4>
                {detail && !loading && (
                  <p className="text-muted mt-1 mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    Mã hồ sơ: <strong className="text-dark">REG{detail.appointmentId.toString().padStart(6, '0')}</strong>
                    <span className="text-muted">|</span>
                    Ngày tạo: {formatDateTime(detail.createdAt)}
                  </p>
                )}
              </div>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>

            {/* MODAL BODY */}
            <div className="modal-body p-4 p-md-5 pt-3" style={{ backgroundColor: '#F9FAFB' }}>
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                </div>
              ) : !detail ? (
                <div className="text-center py-5 text-muted">Không có dữ liệu.</div>
              ) : (
                <div className="row g-4">
                  {/* CỘT TRÁI: THÔNG TIN CHIẾN DỊCH & ĐĂNG KÝ */}
                  <div className="col-12 col-lg-7">
                    <div className="bg-white rounded-4 p-4 shadow-sm h-100" style={{ border: '1px solid #E5E7EB' }}>
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4FD8" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <h6 className="fw-bold mb-0 text-dark">Thông tự Chiến dịch</h6>
                          </div>
                        </div>
                        <div>{getStatusBadge(detail.status)}</div>
                      </div>

                      <div className="mb-4">
                        <h5 className="fw-bold" style={{ color: '#1B4FD8' }}>{detail.campaignName}</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}><strong className="text-dark">Đơn vị tổ chức:</strong> {detail.organizer}</p>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}><strong className="text-dark">Địa điểm:</strong> {detail.location}</p>
                      </div>

                      <hr style={{ borderColor: '#E5E7EB' }} />

                      <div className="mt-4">
                        <h6 className="fw-bold text-dark mb-3">
                          <svg className="me-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          Lịch Hẹn Của Bạn
                        </h6>
                        <div className="row g-3">
                          <div className="col-6">
                            <div className="p-3 rounded-3" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                              <span className="d-block text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ngày hẹn</span>
                              <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{formatDate(detail.appointmentDate)}</strong>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-3 rounded-3" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                              <span className="d-block text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Khung giờ</span>
                              <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{detail.timeSlot}</strong>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="p-3 rounded-3" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                              <span className="d-block text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ghi chú sức khỏe</span>
                              <span className="text-dark" style={{ fontSize: '0.9rem' }}>{detail.note || 'Không có ghi chú.'}</span>
                            </div>
                          </div>
                          {detail.fileName && (
                            <div className="col-12">
                              <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#EFF6FF', border: '1px dashed #BFDBFE' }}>
                                <div>
                                  <span className="d-block text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>File đính kèm</span>
                                  <strong className="text-primary" style={{ fontSize: '0.9rem' }}>{detail.fileName}</strong>
                                </div>
                                {detail.fileUrl && (
                                  <a href={detail.fileUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">Xem</a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI: KẾT QUẢ KHÁM SÀNG LỌC & KẾT QUẢ HIẾN MÁU */}
                  <div className="col-12 col-lg-5">
                    <div className="d-flex flex-column gap-4 h-100">
                      
                      {/* KHÁM SÀNG LỌC */}
                      <div className="bg-white rounded-4 p-4 shadow-sm flex-grow-1" style={{ border: '1px solid #E5E7EB' }}>
                        <div className="d-flex align-items-center gap-2 mb-4">
                          <div style={{ width: 36, height: 36, backgroundColor: '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                          </div>
                          <h6 className="fw-bold mb-0 text-dark">Kết Quả Sàng Lọc</h6>
                        </div>

                        {!detail.healthCheck ? (
                          <div className="text-center py-4 rounded-3" style={{ backgroundColor: '#F9FAFB' }}>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Chưa có kết quả.</p>
                          </div>
                        ) : (
                          <>
                            <div className={`p-2 rounded-3 mb-3 text-center ${detail.healthCheck.eligible ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`} style={{ border: detail.healthCheck.eligible ? '1px solid #BBF7D0' : '1px solid #FECACA' }}>
                              <strong className={detail.healthCheck.eligible ? 'text-success' : 'text-danger'} style={{ fontSize: '0.9rem' }}>
                                {detail.healthCheck.eligible ? 'Đủ điều kiện hiến máu' : 'Không đủ điều kiện'}
                              </strong>
                            </div>
                            
                            <div className="row g-3">
                              <div className="col-6">
                                <div className="border-bottom pb-2">
                                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Huyết áp</span>
                                  <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{detail.healthCheck.bloodPressure} mmHg</strong>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="border-bottom pb-2">
                                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Nhịp tim</span>
                                  <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{detail.healthCheck.pulse} bpm</strong>
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="border-bottom pb-2">
                                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Cân nặng</span>
                                  <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{detail.healthCheck.weight} kg</strong>
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="border-bottom pb-2">
                                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Nhiệt độ</span>
                                  <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{detail.healthCheck.temperature} °C</strong>
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="border-bottom pb-2">
                                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Hemoglobin</span>
                                  <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{detail.healthCheck.hemoglobin} g/dL</strong>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-end text-muted" style={{ fontSize: '0.75rem' }}>
                              BS: <strong>{detail.healthCheck.doctorName}</strong>
                            </div>
                          </>
                        )}
                      </div>

                      {/* KẾT QUẢ HIẾN MÁU */}
                      <div className="bg-white rounded-4 p-4 shadow-sm flex-grow-1" style={{ border: '1px solid #E5E7EB' }}>
                        <div className="d-flex align-items-center gap-2 mb-4">
                          <div style={{ width: 36, height: 36, backgroundColor: '#EFF6FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4FD8" strokeWidth="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                          </div>
                          <h6 className="fw-bold mb-0 text-dark">Kết Quả Hiến Máu</h6>
                        </div>

                        {!detail.bloodDonation ? (
                          <div className="text-center py-4 rounded-3" style={{ backgroundColor: '#F9FAFB' }}>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Chưa có thông tin.</p>
                          </div>
                        ) : (
                          <div className="row g-3 align-items-center">
                            <div className="col-5 text-center border-end">
                              <div className="display-6 fw-bold text-danger">{detail.bloodDonation.volumeML}</div>
                              <div className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>ml Máu</div>
                            </div>
                            <div className="col-7 ps-3">
                              <div className="mb-2">
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Nhóm máu</span>
                                <strong className="text-danger fs-6">{detail.bloodDonation.bloodGroup}</strong>
                              </div>
                              <div>
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Người lấy máu</span>
                                <strong className="text-dark" style={{ fontSize: '0.85rem' }}>{detail.bloodDonation.staffName}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-footer border-top-0 pt-0 pb-4 px-4 px-md-5">
              <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onHide}>Đóng</button>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};
