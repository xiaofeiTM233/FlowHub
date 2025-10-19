// app/menu.tsx
import React from 'react';
import {
  CrownOutlined,
  FileTextOutlined,
  SmileOutlined,
  TableOutlined,
} from '@ant-design/icons';

export const menuData = [
  {
    path: '/',
    name: '首页',
    icon: <SmileOutlined />,
  },
  {
    path: '/review',
    name: '审核管理',
    icon: <TableOutlined />,
    routes: [
      {
        path: '/review',
        name: '帖子审核',
        icon: <FileTextOutlined />,
      }
    ],
  },
];