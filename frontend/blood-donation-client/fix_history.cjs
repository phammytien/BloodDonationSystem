const fs = require('fs');
const path = 'd:/KHACHHANG/nienluan/BloodDonationSystem/BloodDonationSystem/frontend/blood-donation-client/src/pages/donor/HistoryPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add handleCancelRegistration
const oldDownload = 'const handleDownloadCertificate = async (appointment: AppointmentHistory) => {';
const newCancel = `const handleCancelRegistration = async (appointmentId: number) => {
    const confirm = await Swal.fire({
      title: 'Hủy đăng ký?',
      text: "Bạn có chắc chắn muốn hủy đăng ký hiến máu này không? Hành động này không thể hoàn tác.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Không'
    });

    if (confirm.isConfirmed && user) {
      try {
        await axios.put(\`http://localhost:5028/api/appointment/donor/cancel/\${appointmentId}\`, {}, {
          headers: { Authorization: \`Bearer \${user.token}\` }
        });
        toast.success('Hủy đăng ký thành công.');
        fetchHistory();
      } catch (error) {
        console.error('Error canceling appointment:', error);
        toast.error('Không thể hủy đăng ký.');
      }
    }
  };

  const handleDownloadCertificate = async (appointment: AppointmentHistory) => {`;
if (!content.includes('handleCancelRegistration')) {
    content = content.replace(oldDownload, newCancel);
}

// Update buttons
const oldButtons = `<button 
                        onClick={() => { setSelectedAppointment(a.appointmentId); setShowModal(true); }}
                        className={\`btn w-100 \${a.status.toLowerCase() === 'completed' ? 'mb-2' : ''}\`} 
                        style={{ border: '1px solid #DC2626', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}
                      >
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Xem chi tiết
                      </button>
                      {a.status.toLowerCase() === 'completed' && (
                        <button onClick={() => handleDownloadCertificate(a)} className="btn btn-danger w-100 fw-bold" style={{ fontSize: '0.875rem' }}>
                          <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          Tải chứng nhận
                        </button>
                      )}`;
const newButtons = `<div className={\`d-flex gap-2 w-100 \${a.status.toLowerCase() === 'completed' ? 'mb-2' : ''}\`}>
                        <button 
                          onClick={() => { setSelectedAppointment(a.appointmentId); setShowModal(true); }}
                          className="btn flex-grow-1" 
                          style={{ border: '1px solid #DC2626', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}
                        >
                          <svg className="me-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          Chi tiết
                        </button>
                        {a.status.toLowerCase() === 'pending' && (
                          <button 
                            onClick={() => handleCancelRegistration(a.appointmentId)}
                            className="btn btn-outline-secondary flex-grow-1" 
                            style={{ fontWeight: 600, fontSize: '0.875rem' }}
                          >
                            <svg className="me-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Hủy
                          </button>
                        )}
                      </div>
                      {a.status.toLowerCase() === 'completed' && (
                        <button onClick={() => handleDownloadCertificate(a)} className="btn btn-danger w-100 fw-bold" style={{ fontSize: '0.875rem' }}>
                          <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          Tải chứng nhận
                        </button>
                      )}`;
content = content.replace(oldButtons, newButtons);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated file');
