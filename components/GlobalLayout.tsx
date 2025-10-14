'use client';

import React, { useState, useEffect } from 'react';
import { ConfigProvider, Space, Switch, theme } from 'antd';
import { ProLayout } from '@ant-design/pro-components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { menuData } from '@/app/menu';

const GlobalLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; 
  }
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div
        style={{
          height: '100vh',
        }}
      >
        <ProLayout
          title="FlowHub"
          logo="/logo.svg"
          layout="mix"
          fixedHeader
          fixSiderbar
          menu={{
            type: 'group',
          }}
          route={{
            path: '/',
            routes: menuData,
          }}
          location={{
            pathname,
          }}
          menuItemRender={(item, dom) => {
            return item.path ? <Link href={item.path}>{dom}</Link> : dom;
          }}
          actionsRender={() => [
            <Space key="theme-switch" size="small">
              <span>{dark ? '🌜' : '🌞'}</span>
              <Switch
                checked={dark}
                onChange={(checked) => setDark(checked)}
                checkedChildren="暗"
                unCheckedChildren="亮"
              />
            </Space>,
          ]}
        >
          {children}
        </ProLayout>
      </div>
    </ConfigProvider>
  );
};

export default GlobalLayout;