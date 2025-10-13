// components/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { menuConfig, MenuItem } from '../lib/menuConfig';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // 检查路径是否匹配当前页面
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // 检查组是否包含当前页面
  const groupContainsActivePage = (children: MenuItem[]) => {
    return children.some(child => child.href && isActive(child.href));
  };

  // 自动展开包含当前页面的组
  useEffect(() => {
    const newOpenGroups = new Set<string>();
    menuConfig.forEach(item => {
      if (item.type === 'group' && item.children && groupContainsActivePage(item.children)) {
        newOpenGroups.add(item.id);
      }
    });
    setOpenGroups(newOpenGroups);
  }, [pathname]);

  // 切换组的展开状态
  const toggleGroup = (groupId: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupId)) {
      newOpenGroups.delete(groupId);
    } else {
      newOpenGroups.add(groupId);
    }
    setOpenGroups(newOpenGroups);
  };

  // 处理按钮点击
  const handleButtonClick = (action: string) => {
    switch (action) {
      case 'logout':
        // 这里可以添加退出登录逻辑
        console.log('退出登录');
        break;
      default:
        break;
    }
  };

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem) => {
    if (item.type === 'link') {
      return (
        <li key={item.id}>
          <Link
            href={item.href}
            className={`block rounded-lg px-4 py-2 text-sm font-medium ${
              isActive(item.href)
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {item.title}
          </Link>
        </li>
      );
    }

    if (item.type === 'group') {
      const isOpen = openGroups.has(item.id);
      return (
        <li key={item.id}>
          <details open={isOpen} className="group [&_summary::-webkit-details-marker]:hidden">
            <summary
              onClick={(e) => {
                e.preventDefault();
                toggleGroup(item.id);
              }}
              className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="text-sm font-medium">{item.title}</span>
              <span className={`shrink-0 transition duration-300 ${isOpen ? '-rotate-180' : ''}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </summary>
            <ul className="mt-2 space-y-1 px-4">
              {item.children?.map((child: any) => (
                <li key={child.id}>
                  {child.type === 'button' ? (
                    <button
                      onClick={() => handleButtonClick(child.action)}
                      className="w-full rounded-lg px-4 py-2 [text-align:_inherit] text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      {child.title}
                    </button>
                  ) : (
                    <Link
                      href={child.href}
                      className={`block rounded-lg px-4 py-2 text-sm font-medium ${
                        isActive(child.href)
                          ? 'bg-gray-100 text-gray-700'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      {child.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </li>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen flex-col justify-between border-e border-gray-100 bg-white w-64">
      <div className="p-3">
        <span className="grid h-10 w-32 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
          FlowHub
        </span>

        <ul className="mt-6 space-y-1">
          {menuConfig.map(renderMenuItem)}
        </ul>
      </div>

      <div className="fixed bottom-0 left-0 w-64 border-t border-gray-100 bg-white">
        <Link href="/profile" className="flex items-center gap-2 p-4 hover:bg-gray-50">
          <img
            alt="用户头像"
            src="http://q.qlogo.cn/headimg_dl?dst_uin=1286865098&amp;spec=640&amp;img_type=jpg"
            className="size-10 rounded-full object-cover"
          />

          <div>
            <p className="text-xs">
              <strong className="block font-medium">用户名</strong>
              <span>user@example.com</span>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;