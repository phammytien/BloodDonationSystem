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

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    range.push(totalPages);

    return range;
  };

  const pages = getVisiblePages();

  return (
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
        
        {pages.map((page, index) => (
          <li key={index} className={`page-item ${page === '...' ? 'disabled' : ''}`}>
            <button 
              className={`page-link border-0 rounded fw-medium ${currentPage === page ? 'bg-danger text-white' : 'text-dark bg-white'}`}
              onClick={() => {
                if (page !== '...') {
                  onPageChange(page as number);
                }
              }}
              style={{ 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: page === '...' ? 'default' : 'pointer'
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
  );
};
