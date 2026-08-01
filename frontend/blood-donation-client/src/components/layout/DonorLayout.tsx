import React from 'react';
import { Outlet } from 'react-router-dom';
import { DonorNavbar } from './DonorNavbar';

export const DonorLayout: React.FC = () => {
  return (
    <>
      <DonorNavbar />
      <Outlet />
    </>
  );
};
