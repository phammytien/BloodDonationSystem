import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-4">
      <div className="text-muted small">
        Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} mục
      </div>
      <nav>
        <ul className="pagination pagination-sm mb-0 shadow-sm" style={{ gap: '4px' }}>
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link border-0 rounded" 
              onClick={() => onPageChange(currentPage - 1)}
              style={{ color: '#4B5563', backgroundColor: currentPage === 1 ? '#F3F4F6' : '#fff' }}
            >
              &laquo;
            </button>
          </li>
          
          {pages.map(page => (
            <li key={page} className="page-item">
              <button 
                className={`page-link border-0 rounded fw-medium ${currentPage === page ? 'bg-danger text-white' : 'text-dark bg-white'}`}
                onClick={() => onPageChange(page)}
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                {page}
              </button>
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link border-0 rounded" 
              onClick={() => onPageChange(currentPage + 1)}
              style={{ color: '#4B5563', backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#fff' }}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};
