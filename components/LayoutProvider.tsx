// components/LayoutProvider.tsx
'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface LayoutProviderProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showNavbar?: boolean;
}

const LayoutProvider: React.FC<LayoutProviderProps> = ({ children, showSidebar = true, showNavbar = true }) => {
  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col">
        {showNavbar && <Navbar />}
        <main className="flex-1 p-4 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutProvider;