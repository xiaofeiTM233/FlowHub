// components/PostFilters.tsx
'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface Props {
  page: number;
  totalPages: number;
}

const PostFilters: React.FC<Props> = ({ page, totalPages }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') || 'all';
  const limit = searchParams.get('limit') || '15';

  const onFilterChange = (key: 'type' | 'limit', value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    params.set('page', '1'); // 筛选时重置到第一页
    router.push(`${pathname}?${params.toString()}`);
  };

  const onPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-6 sm:gap-8">
          <details className="group relative min-w-[150px]">
            <summary
              className="flex items-center justify-center gap-2 border-b border-gray-300 pb-1 text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 [&::-webkit-details-marker]:hidden cursor-pointer"
            >
            <span className="text-sm font-medium">{type === 'all' ? '全部' : type === 'pending' ? '待审核' : type === 'approved' ? '已通过' : '已拒绝'}</span>

            <span className="transition-transform group-open:-rotate-180">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </summary>

          <div
            className="z-50 w-full divide-y divide-gray-300 rounded border border-gray-300 bg-white shadow-lg group-open:absolute group-open:start-0 group-open:top-8"
          >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-gray-700">当前: {type === 'all' ? '全部' : type === 'pending' ? '待审核' : type === 'approved' ? '已通过' : '已拒绝'}</span>

                <button
                  type="button"
                  onClick={() => onFilterChange('type', 'all')}
                  className="text-sm text-gray-700 underline transition-colors hover:text-gray-900"
                >
                  重置
                </button>
              </div>

              <fieldset className="p-3">
                <legend className="sr-only">状态选择</legend>

                <div className="flex flex-col items-start gap-3">
                  <label htmlFor="type-all" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="type-all"
                      name="type"
                      checked={type === 'all'}
                      onChange={() => onFilterChange('type', 'all')}
                    />
                    <span className="text-sm font-medium text-gray-700">全部</span>
                  </label>

                  <label htmlFor="type-pending" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="type-pending"
                      name="type"
                      checked={type === 'pending'}
                      onChange={() => onFilterChange('type', 'pending')}
                    />
                    <span className="text-sm font-medium text-gray-700">待审核</span>
                  </label>

                  <label htmlFor="type-approved" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="type-approved"
                      name="type"
                      checked={type === 'approved'}
                      onChange={() => onFilterChange('type', 'approved')}
                    />
                    <span className="text-sm font-medium text-gray-700">已通过</span>
                  </label>

                  <label htmlFor="type-rejected" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="type-rejected"
                      name="type"
                      checked={type === 'rejected'}
                      onChange={() => onFilterChange('type', 'rejected')}
                    />
                    <span className="text-sm font-medium text-gray-700">已拒绝</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </details>

          <details className="group relative min-w-[130px]">
            <summary
              className="flex items-center justify-center gap-2 border-b border-gray-300 pb-1 text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 [&::-webkit-details-marker]:hidden cursor-pointer"
            >
            <span className="text-sm font-medium">{limit} 条/页</span>

            <span className="transition-transform group-open:-rotate-180">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </summary>

          <div
            className="z-50 w-full divide-y divide-gray-300 rounded border border-gray-300 bg-white shadow-lg group-open:absolute group-open:start-0 group-open:top-8"
          >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-gray-700">当前: {limit} 条</span>

                <button
                  type="button"
                  onClick={() => onFilterChange('limit', '15')}
                  className="text-sm text-gray-700 underline transition-colors hover:text-gray-900"
                >
                  重置
                </button>
              </div>

              <fieldset className="p-3">
                <legend className="sr-only">每页数量选择</legend>

                <div className="flex flex-col items-start gap-3">
                  <label htmlFor="limit-5" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="limit-5"
                      name="limit"
                      checked={limit === '5'}
                      onChange={() => onFilterChange('limit', '5')}
                    />
                    <span className="text-sm font-medium text-gray-700">5 条</span>
                  </label>

                  <label htmlFor="limit-15" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="limit-15"
                      name="limit"
                      checked={limit === '15'}
                      onChange={() => onFilterChange('limit', '15')}
                    />
                    <span className="text-sm font-medium text-gray-700">15 条</span>
                  </label>

                  <label htmlFor="limit-50" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="limit-50"
                      name="limit"
                      checked={limit === '50'}
                      onChange={() => onFilterChange('limit', '50')}
                    />
                    <span className="text-sm font-medium text-gray-700">50 条</span>
                  </label>

                  <label htmlFor="limit-100" className="inline-flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      className="size-4 border-gray-300 shadow-sm" 
                      id="limit-100"
                      name="limit"
                      checked={limit === '100'}
                      onChange={() => onFilterChange('limit', '100')}
                    />
                    <span className="text-sm font-medium text-gray-700">100 条</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </details>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button 
              type="button" 
              onClick={() => onPageChange(page - 1)} 
              disabled={page <= 1}
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 font-medium text-stone-700 shadow-sm transition-colors hover:text-stone-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white focus:outline-none border-stone-300 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-stone-700"
            >
              <span aria-hidden="true">←</span>
              <span>上一页</span>
            </button>
            
            <span className="text-sm font-medium text-gray-700 px-3">页 {page} / {totalPages}</span>
            
            <button 
              type="button" 
              onClick={() => onPageChange(page + 1)} 
              disabled={page >= totalPages}
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 font-medium text-stone-700 shadow-sm transition-colors hover:text-stone-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white focus:outline-none border-stone-300 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-100 disabled:hover:text-stone-700"
            >
              <span>下一页</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default PostFilters;