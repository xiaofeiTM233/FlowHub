// components/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPageTitle } from '../lib/menuConfig';

const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="bg-white dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {getPageTitle(pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <Link
              className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
              href="/"
            >
              首页
            </Link>
            <Link
              className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
              href="/dashboard"
            >
              控制台
            </Link>
            <Link
              className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
              href="/review"
            >
              审核
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;